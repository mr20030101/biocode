from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def _uuid_str() -> str:
    return str(uuid.uuid4())


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )


class UserRole(str, enum.Enum):
    super_admin = "super_admin"
    manager = "manager"  # Handles multiple departments
    department_head = "department_head"  # Single department
    support = "support"  # Biomed Tech, Maintenance/Facility, IT Staff, House Keeping
    department_incharge = "department_incharge"  # Secretary


class SupportType(str, enum.Enum):
    biomed_tech = "biomed_tech"
    maintenance_aircon = "maintenance_aircon"
    maintenance_plumber = "maintenance_plumber"
    maintenance_carpenter = "maintenance_carpenter"
    maintenance_painter = "maintenance_painter"
    maintenance_electrician = "maintenance_electrician"
    it_staff = "it_staff"
    house_keeping = "house_keeping"
    other = "other"


class EquipmentStatus(str, enum.Enum):
    active = "active"
    out_of_service = "out_of_service"
    retired = "retired"


class LogType(str, enum.Enum):
    service = "service"
    preventive_maintenance = "preventive_maintenance"
    incident = "incident"
    calibration = "calibration"
    inspection = "inspection"
    note = "note"


class TicketStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False, default=UserRole.support)
    support_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # For support role
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    department_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True
    )

    department: Mapped[Optional["Department"]] = relationship()
    created_logs: Mapped[list["EquipmentLog"]] = relationship(
        back_populates="created_by_user", cascade="all,delete-orphan"
    )


class Location(Base, TimestampMixin):
    __tablename__ = "locations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, unique=True)
    building: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    floor: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    room: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    equipment: Mapped[list["Equipment"]] = relationship(back_populates="location")

    __table_args__ = (
        UniqueConstraint("name", "building", "floor", "room", name="uq_locations_identity"),
    )


class Department(Base, TimestampMixin):
    __tablename__ = "departments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    code: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, unique=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    equipment: Mapped[list["Equipment"]] = relationship(back_populates="department")


class Supplier(Base, TimestampMixin):
    __tablename__ = "suppliers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    code: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, unique=True)
    contact_person: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    equipment: Mapped[list["Equipment"]] = relationship(back_populates="supplier")


class Ticket(Base, TimestampMixin):
    """
    Support ticket corresponding to the CLI script tickets.
    """

    __tablename__ = "tickets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)

    ticket_code: Mapped[str] = mapped_column(String(32), nullable=False, unique=True, index=True)

    from_department: Mapped[str] = mapped_column(String(255), nullable=False)
    department_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True
    )

    equipment_service: Mapped[str] = mapped_column(String(255), nullable=False)
    serial_number: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    concern: Mapped[str] = mapped_column(Text, nullable=False)
    reported_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    status: Mapped[TicketStatus] = mapped_column(
        Enum(TicketStatus), nullable=False, default=TicketStatus.open
    )
    completed_on: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Optional link to structured equipment row.
    equipment_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("equipment.id", ondelete="SET NULL"), nullable=True
    )
    
    # New fields for simplified API
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    priority: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, default="medium")
    reported_by_user_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    assigned_to_user_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    equipment: Mapped[Optional["Equipment"]] = relationship(back_populates="tickets")
    department: Mapped[Optional["Department"]] = relationship()
    response: Mapped[Optional["TicketResponse"]] = relationship(
        back_populates="ticket", cascade="all,delete-orphan", uselist=False
    )
    reported_by_user: Mapped[Optional["User"]] = relationship(foreign_keys=[reported_by_user_id])
    assigned_to_user: Mapped[Optional["User"]] = relationship(foreign_keys=[assigned_to_user_id])
    reported_by_user: Mapped[Optional["User"]] = relationship(foreign_keys=[reported_by_user_id])
    assigned_to_user: Mapped[Optional["User"]] = relationship(foreign_keys=[assigned_to_user_id])


class Equipment(Base, TimestampMixin):
    __tablename__ = "equipment"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)

    # Human identifiers
    asset_tag: Mapped[str] = mapped_column(String(64), nullable=False)
    serial_number: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)

    # Description
    device_name: Mapped[str] = mapped_column(String(255), nullable=False)
    manufacturer: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    model: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Supplier Information
    supplier_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True, index=True
    )
    
    # Acquisition Information
    acquisition_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    acquired_value: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # Store as string to handle currency

    status: Mapped[EquipmentStatus] = mapped_column(
        Enum(EquipmentStatus), nullable=False, default=EquipmentStatus.active
    )
    location_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("locations.id", ondelete="SET NULL"), nullable=True
    )
    department_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True
    )

    in_service_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    repair_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    
    # Downtime tracking
    total_downtime_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_downtime_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_currently_down: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    criticality: Mapped[str] = mapped_column(String(20), nullable=False, default="medium", index=True)  # low, medium, high, critical

    location: Mapped[Optional[Location]] = relationship(back_populates="equipment")
    department: Mapped[Optional[Department]] = relationship(back_populates="equipment")
    supplier: Mapped[Optional[Supplier]] = relationship(back_populates="equipment")
    logs: Mapped[list["EquipmentLog"]] = relationship(
        back_populates="equipment", cascade="all,delete-orphan"
    )
    tickets: Mapped[list["Ticket"]] = relationship(
        back_populates="equipment", cascade="all,delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("asset_tag", name="uq_equipment_asset_tag"),
        Index("ix_equipment_device_name", "device_name"),
        Index("ix_equipment_manufacturer_model", "manufacturer", "model"),
    )


class EquipmentLog(Base, TimestampMixin):
    __tablename__ = "equipment_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)

    equipment_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("equipment.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_by_user_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    log_type: Mapped[LogType] = mapped_column(Enum(LogType), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Optional operational fields
    occurred_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    downtime_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    resolved: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    equipment: Mapped[Equipment] = relationship(back_populates="logs")
    created_by_user: Mapped[Optional[User]] = relationship(back_populates="created_logs")

    __table_args__ = (
        CheckConstraint("downtime_minutes >= 0", name="ck_equipment_logs_downtime_nonneg"),
        Index("ix_equipment_logs_equipment_type", "equipment_id", "log_type"),
        Index("ix_equipment_logs_occurred_at", "occurred_at"),
    )


class EquipmentHistory(Base, TimestampMixin):
    """
    Per-equipment repair history, matching the CLI script's equipment_history.
    """

    __tablename__ = "equipment_history"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)

    department: Mapped[str] = mapped_column(String(255), nullable=False)
    equipment: Mapped[str] = mapped_column(String(255), nullable=False)
    serial: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)

    ticket_code: Mapped[Optional[str]] = mapped_column(String(32), nullable=True, index=True)
    ticket_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("tickets.id", ondelete="SET NULL"), nullable=True
    )

    concern: Mapped[str] = mapped_column(Text, nullable=False)
    diagnosis: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    action_taken: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    parts_used: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    engineer: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    date_completed: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    ticket: Mapped[Optional["Ticket"]] = relationship()


class TicketResponse(Base, TimestampMixin):
    """
    Normalized "service report" for a ticket (diagnosis/action/parts/engineer).
    This avoids duplicating response fields across multiple history rows.
    """

    __tablename__ = "ticket_responses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)
    ticket_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )

    diagnosis: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    action_taken: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    parts_used: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    engineer_user_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    engineer_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    completed_on: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    ticket: Mapped["Ticket"] = relationship(back_populates="response")
    engineer_user: Mapped[Optional["User"]] = relationship()


class MaintenanceSchedule(Base, TimestampMixin):
    """
    Scheduled maintenance for equipment (preventive maintenance, calibration, etc.)
    """

    __tablename__ = "maintenance_schedules"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)
    equipment_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("equipment.id", ondelete="CASCADE"), nullable=False, index=True
    )
    maintenance_type: Mapped[str] = mapped_column(String(50), nullable=False)
    frequency_days: Mapped[int] = mapped_column(Integer, nullable=False)
    last_maintenance_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    next_maintenance_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    assigned_to_user_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    equipment: Mapped["Equipment"] = relationship()
    assigned_to_user: Mapped[Optional["User"]] = relationship()


class Notification(Base):
    """
    User notifications for tickets, maintenance, equipment status changes, etc.
    """

    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    notification_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    related_entity_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    related_entity_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow, index=True
    )
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship()

    __table_args__ = (
        Index("ix_notifications_user_read", "user_id", "is_read"),
    )

