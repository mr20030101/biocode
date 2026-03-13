from __future__ import annotations

from typing import Optional, List, TYPE_CHECKING
from datetime import date
import enum

from sqlalchemy import ForeignKey, String, Enum, Integer, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin, _uuid_str
from .enums import EquipmentStatus

if TYPE_CHECKING:
    from .department import Department
    from .location import Location
    from .machine_hour_reading import MachineHourReading


class LifecycleType(str, enum.Enum):
    hours = "hours"
    years = "years"


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
        unique=True,
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
        Enum(EquipmentStatus),
        default=EquipmentStatus.active,
        nullable=False,
    )

    # -----------------------------
    # Lifecycle Configuration
    # -----------------------------

    lifecycle_type: Mapped[LifecycleType] = mapped_column(
        Enum(LifecycleType),
        default=LifecycleType.years,
        nullable=False,
    )

    installation_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )

    lifecycle_years: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )

    # These fields already exist in your database
    current_operating_hours: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )

    remaining_operating_months: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )

    # -----------------------------
    # Risk Engine Fields
    # -----------------------------

    risk_priority: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )

    repair_count: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        default=0,
    )

    # -----------------------------
    # Location / Department
    # -----------------------------

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

    # -----------------------------
    # Relationships
    # -----------------------------

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

    # -----------------------------
    # Lifecycle Calculations
    # -----------------------------

    @property
    def remaining_life_years(self) -> Optional[int]:
        """
        Used for normal equipment:
        suction machine, ventilator, infusion pump, etc.
        """
        if self.lifecycle_type != LifecycleType.years:
            return None

        if not self.installation_date or not self.lifecycle_years:
            return None

        used_years = date.today().year - self.installation_date.year
        remaining = self.lifecycle_years - used_years

        return max(remaining, 0)

    @property
    def remaining_life_months(self) -> Optional[int]:
        """
        Used for dialysis machines
        Uses stored value from database.
        """
        if self.lifecycle_type != LifecycleType.hours:
            return None

        return self.remaining_operating_months
