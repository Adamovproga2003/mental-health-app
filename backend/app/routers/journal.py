from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models.mood import JournalEntry
from app.models.user import User
from app.routers.auth import current_user
from app.services.emotion_analyzer import analyze_text_emotions, dominant_emotion

router = APIRouter(prefix="/journal", tags=["journal"])


class JournalCreateRequest(BaseModel):
    title: str
    content: str


class JournalResponse(BaseModel):
    id: int
    title: str
    content: str
    sentiment_score: float | None
    emotions: dict | None
    ai_reflection: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


def compute_sentiment(emotions: dict[str, float]) -> float:
    positive = emotions.get("Happy", 0) + emotions.get("Surprise", 0) * 0.5
    negative = emotions.get("Sad", 0) + emotions.get("Angry", 0) + emotions.get("Fear", 0)
    return round(max(-1.0, min(1.0, positive - negative)), 3)


@router.post("", response_model=JournalResponse, status_code=201)
async def create_entry(
    body: JournalCreateRequest,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    emotions = analyze_text_emotions(body.content)
    sentiment = compute_sentiment(emotions) if emotions else None
    dom = dominant_emotion(emotions)
    EMOTION_GENITIVE = {"Happy": "радості", "Sad": "смутку", "Angry": "злості", "Fear": "тривоги", "Surprise": "здивування"}
    EMOTION_ADJECTIVE = {"Happy": "радісний", "Sad": "сумний", "Angry": "злісний", "Fear": "тривожний", "Surprise": "здивований"}
    significant = [e for e, v in sorted((emotions or {}).items(), key=lambda x: -x[1]) if v >= 0.3]
    if len(significant) >= 2:
        labels = [EMOTION_GENITIVE.get(e, e.lower()) for e in significant]
        joined = ", ".join(labels[:-1]) + " і " + labels[-1]
        reflection = f"У вашому записі поєднуються почуття {joined} — це цілком природно."
    elif dom:
        reflection = f"Ваш запис має переважно {EMOTION_ADJECTIVE.get(dom, dom.lower())} настрій."
    else:
        reflection = None

    entry = JournalEntry(
        user_id=user.id,
        title=body.title,
        content=body.content,
        sentiment_score=sentiment,
        emotions=emotions or None,
        ai_reflection=reflection,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.get("", response_model=list[JournalResponse])
async def list_entries(
    limit: int = 20,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(JournalEntry)
        .where(JournalEntry.user_id == user.id)
        .order_by(JournalEntry.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/{entry_id}", response_model=JournalResponse)
async def get_entry(
    entry_id: int,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(JournalEntry).where(JournalEntry.id == entry_id, JournalEntry.user_id == user.id)
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry


@router.delete("/{entry_id}", status_code=204)
async def delete_entry(
    entry_id: int,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(JournalEntry).where(JournalEntry.id == entry_id, JournalEntry.user_id == user.id)
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    await db.delete(entry)
    await db.commit()
