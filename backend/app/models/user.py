from __future__ import annotations

from typing import Optional, TYPE_CHECKING
if TYPE_CHECKING:
    from .department import Department
    from .notification import Notification

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin, _uuid_str
from .enums import UserRole

if TYPE_CHECKING:
    from .department import Department
    from .notification import Notification


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=_uuid_str)

    email: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True)

    full_name: Mapped[str] = mapped_column(String(255), nullable=False)

    role: Mapped[UserRole] = mapped_column(
        nullable=False, default=UserRole.support)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    department_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("departments.id"), nullable=True
    )

    department: Mapped[Optional["Department"]] = relationship(
        "Department", back_populates="users"
    )

    notifications: Mapped[list["Notification"]] = relationship(
        "Notification", back_populates="user"
    )
