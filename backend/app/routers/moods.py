from datetime import datetime, timezone, timedelta, date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, Date
from pydantic import BaseModel

from app.database import get_db
from app.models.mood import MoodLog
from app.models.user import User
from app.routers.auth import current_user
from app.services.emotion_analyzer import analyze_text_emotions, get_tips

router = APIRouter(prefix="/moods", tags=["moods"])

MOOD_EMOJIS = {
    range(1, 3): ("😢", "Very Sad"),
    range(3, 5): ("😕", "Sad"),
    range(5, 6): ("😐", "Neutral"),
    range(6, 8): ("🙂", "Good"),
    range(8, 10): ("😊", "Happy"),
    range(10, 11): ("😁", "Very Happy"),
}


def score_to_emoji(score: int) -> tuple[str, str]:
    for r, val in MOOD_EMOJIS.items():
        if score in r:
            return val
    return ("😐", "Neutral")


class MoodCreateRequest(BaseModel):
    score: int
    note: str = ""
    tags: list[str] = []


class MoodResponse(BaseModel):
    id: int
    score: int
    emoji: str
    label: str
    note: str | None
    tags: list[str] | None
    emotions: dict | None
    tips: list[str]
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("", response_model=MoodResponse, status_code=201)
async def log_mood(
    body: MoodCreateRequest,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    if not 1 <= body.score <= 10:
        raise HTTPException(status_code=422, detail="Score must be between 1 and 10")

    emoji, label = score_to_emoji(body.score)
    emotions = analyze_text_emotions(body.note) if body.note else {}
    tips = get_tips(emotions)

    log = MoodLog(
        user_id=user.id,
        score=body.score,
        emoji=emoji,
        label=label,
        note=body.note or None,
        tags=body.tags or None,
        emotions=emotions or None,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)

    return MoodResponse(**log.__dict__, tips=tips)


@router.get("", response_model=list[MoodResponse])
async def get_moods(
    limit: int = 30,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MoodLog)
        .where(MoodLog.user_id == user.id)
        .order_by(MoodLog.created_at.desc())
        .limit(limit)
    )
    logs = result.scalars().all()
    return [MoodResponse(**log.__dict__, tips=[]) for log in logs]


@router.get("/stats")
async def mood_stats(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(
            func.avg(MoodLog.score).label("avg_score"),
            func.count(MoodLog.id).label("total"),
        ).where(MoodLog.user_id == user.id)
    )
    row = result.one()

    # Streak: consecutive days with at least one log (today or yesterday counts)
    dates_result = await db.execute(
        select(cast(MoodLog.created_at, Date).label("log_date"))
        .where(MoodLog.user_id == user.id)
        .group_by(cast(MoodLog.created_at, Date))
        .order_by(cast(MoodLog.created_at, Date).desc())
    )
    dates = [r.log_date for r in dates_result.all()]
    streak = 0
    today = date.today()
    if dates:
        first = dates[0]
        if first == today or first == today - timedelta(days=1):
            streak = 1
            prev = first
            for d in dates[1:]:
                if d == prev - timedelta(days=1):
                    streak += 1
                    prev = d
                else:
                    break

    # Weekly averages for trend arrow
    now = datetime.now(timezone.utc)
    week_start = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    last_week_start = week_start - timedelta(days=7)

    this_week_res = await db.execute(
        select(func.avg(MoodLog.score))
        .where(MoodLog.user_id == user.id)
        .where(MoodLog.created_at >= week_start)
    )
    last_week_res = await db.execute(
        select(func.avg(MoodLog.score))
        .where(MoodLog.user_id == user.id)
        .where(MoodLog.created_at >= last_week_start)
        .where(MoodLog.created_at < week_start)
    )
    this_week_avg = this_week_res.scalar()
    last_week_avg = last_week_res.scalar()

    return {
        "avg_score": round(float(row.avg_score or 0), 2),
        "total_logs": row.total,
        "streak": streak,
        "avg_this_week": round(float(this_week_avg), 2) if this_week_avg else None,
        "avg_last_week": round(float(last_week_avg), 2) if last_week_avg else None,
    }
