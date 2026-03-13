from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin, _uuid_str

if TYPE_CHECKING:
    from .equipment import Equipment


class MachineHourReading(Base, TimestampMixin):
    __tablename__ = "machine_hour_reading"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=_uuid_str,
    )

    equipment_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("equipment.id"),
        nullable=False,
    )

    reading_hours: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    reading_date: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    equipment: Mapped["Equipment"] = relationship(
        "Equipment",
        back_populates="readings",
    )
