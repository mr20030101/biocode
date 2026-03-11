from __future__ import annotations

from typing import Optional, TYPE_CHECKING, List

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin, _uuid_str

if TYPE_CHECKING:
    from .equipment import Equipment
    from .user import User


class Department(Base, TimestampMixin):
    __tablename__ = "departments"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=_uuid_str
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True
    )

    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )

    equipment: Mapped[List["Equipment"]] = relationship(
        "Equipment",
        back_populates="department"
    )

    users: Mapped[List["User"]] = relationship(
        "User",
        back_populates="department"
    )
