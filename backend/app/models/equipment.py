from __future__ import annotations

from typing import Optional, List, TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin, _uuid_str
from .enums import EquipmentStatus

if TYPE_CHECKING:
    from .department import Department
    from .location import Location
    from .machine_hour_reading import MachineHourReading


class Equipment(Base, TimestampMixin):
    __tablename__ = "equipment"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=_uuid_str,
    )

    asset_tag: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
    )

    equipment_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    manufacturer: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )

    model: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )

    status: Mapped[EquipmentStatus] = mapped_column(
        default=EquipmentStatus.active,
    )

    department_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("departments.id"),
        nullable=True,
    )

    location_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("locations.id"),
        nullable=True,
    )

    department: Mapped[Optional["Department"]] = relationship(
        "Department",
        back_populates="equipment",
    )

    location: Mapped[Optional["Location"]] = relationship(
        "Location",
        back_populates="equipment",
    )

    readings: Mapped[List["MachineHourReading"]] = relationship(
        "MachineHourReading",
        back_populates="equipment",
        cascade="all, delete-orphan",
    )
