from datetime import date

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from ..database import Base


class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(String(36), primary_key=True, index=True)

    equipment_name = Column(String(255), nullable=False)
    asset_tag = Column(String(100), unique=True, index=True)
    serial_number = Column(String(100))

    manufacturer = Column(String(255), nullable=True)
    model = Column(String(255), nullable=True)

    # ✅ NEW FIELD — Acquisition Type
    acquisition_type = Column(String(20), default="Owned")

    # =====================================================
    # RELATION KEYS
    # =====================================================

    department_id = Column(String(36), ForeignKey(
        "departments.id"), nullable=True)
    location_id = Column(String(36), ForeignKey("locations.id"), nullable=True)

    status = Column(String(50), default="active")

    # =====================================================
    # LIFECYCLE CONFIGURATION
    # =====================================================

    installation_date = Column(Date, nullable=True)

    lifecycle_type = Column(String(20), default="years")  # "years" or "hours"
    lifecycle_years = Column(Integer, nullable=True)

    # Dialysis lifecycle
    max_operating_hours = Column(Integer, nullable=True)

    # =====================================================
    # HEALTH / RISK
    # =====================================================

    risk_priority = Column(Integer, default=5)
    repair_count = Column(Integer, default=0)

    health_status = Column(String(50), default="healthy")
    pm_alert = Column(String(50), nullable=True)

    # Stored value (optional optimization)
    remaining_operating_months = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # =====================================================
    # RELATIONSHIPS
    # =====================================================

    department = relationship("Department", back_populates="equipment")
    location = relationship("Location", back_populates="equipment")

    readings = relationship(
        "MachineHourReading",
        back_populates="equipment",
        cascade="all, delete-orphan"
    )

    # =====================================================
    # LIFECYCLE COMPUTATION ENGINE
    # =====================================================

    @property
    def current_operating_hours(self):
        """
        Returns latest machine hour reading.
        Used for dialysis lifecycle tracking.
        """
        if not self.readings:
            return None

        valid_readings = [
            r.reading_hours for r in self.readings
            if r.reading_hours is not None
        ]

        if not valid_readings:
            return None

        return max(valid_readings)

    @property
    def remaining_life_years(self):
        """
        Remaining life for standard equipment.
        """
        if self.lifecycle_type != "years":
            return None

        if not self.installation_date or not self.lifecycle_years:
            return None

        today = date.today()

        age_days = (today - self.installation_date).days
        age_years = age_days / 365

        remaining = self.lifecycle_years - age_years

        return round(max(remaining, 0), 2)

    @property
    def remaining_life_months(self):
        """
        Converts remaining years into months.
        """
        years = self.remaining_life_years

        if years is None:
            return None

        return int(years * 12)

    @property
    def remaining_operating_months_calc(self):
        """
        Dialysis lifecycle calculation.
        Remaining months based on operating hours.
        """
        if self.lifecycle_type != "hours":
            return None

        if not self.max_operating_hours:
            return None

        current = self.current_operating_hours

        if current is None:
            return None

        remaining_hours = self.max_operating_hours - current

        if remaining_hours <= 0:
            return 0

        # Dialysis assumption: 360 hours/month
        return int(remaining_hours / 360)
