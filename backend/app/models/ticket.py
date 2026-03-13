from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.enums import TicketStatus


def _uuid_str() -> str:
    return str(uuid.uuid4())


class Ticket(Base):
    __tablename__ = "tickets"

    # =====================================================
    # PRIMARY ID
    # =====================================================
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=_uuid_str
    )

    ticket_code: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True
    )

    # =====================================================
    # BASIC INFO
    # =====================================================
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    priority: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True
    )

    status: Mapped[TicketStatus] = mapped_column(
        default=TicketStatus.open
    )

    # =====================================================
    # RELATIONS
    # =====================================================
    equipment_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("equipment.id"),
        nullable=True
    )

    reported_by_user_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("users.id"),
        nullable=True
    )

    assigned_to_user_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("users.id"),
        nullable=True
    )

    department_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("departments.id"),
        nullable=True
    )

    # =====================================================
    # LEGACY SERVICE REPORT FIELDS (Biocode Extract ready)
    # =====================================================
    from_department: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    equipment_service: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    serial_number: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    concern: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    reported_by: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    # =====================================================
    # TIMESTAMPS
    # =====================================================
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # =====================================================
    # RELATIONSHIPS
    # =====================================================
    equipment = relationship("Equipment")
