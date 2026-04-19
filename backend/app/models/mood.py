from datetime import datetime
from sqlalchemy import Integer, String, Float, Text, DateTime, ForeignKey, func, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class MoodLog(Base):
    __tablename__ = "mood_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    score: Mapped[int] = mapped_column(Integer)          # 1-10 scale
    emoji: Mapped[str] = mapped_column(String(10))       # emoji representation
    label: Mapped[str] = mapped_column(String(50))       # happy, sad, anxious, etc.
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    tags: Mapped[list | None] = mapped_column(JSON, nullable=True)       # ["Робота", "Спорт", ...]
    emotions: Mapped[dict | None] = mapped_column(JSON, nullable=True)   # {happy: 0.8, sad: 0.1, ...}
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="mood_logs")


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(Text)
    sentiment_score: Mapped[float | None] = mapped_column(Float, nullable=True)   # -1 to 1
    emotions: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ai_reflection: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user = relationship("User", back_populates="journal_entries")
