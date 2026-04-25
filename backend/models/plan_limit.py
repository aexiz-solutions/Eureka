import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import Uuid

from db.base_class import Base


class PlanLimit(Base):
    __tablename__ = "plan_limits"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    tier: Mapped[str] = mapped_column(String(32), nullable=False, unique=True, index=True)
    annual_planogram_limit: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_unlimited: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )