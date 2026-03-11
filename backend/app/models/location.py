from __future__ import annotations

from typing import Optional

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin, _uuid_str


class Location(Base, TimestampMixin):
    __tablename__ = "locations"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=_uuid_str)

    name: Mapped[str] = mapped_column(String(255), nullable=False)

    building: Mapped[Optional[str]] = mapped_column(String(255))

    floor: Mapped[Optional[str]] = mapped_column(String(64))

    room: Mapped[Optional[str]] = mapped_column(String(64))

    equipment: Mapped[list["Equipment"]] = relationship(
        "Equipment", back_populates="location"
    )
