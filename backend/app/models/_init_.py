from __future__ import annotations

# Export models for easy importing

from .user import User, UserRole
from .equipment import Equipment
from .department import Department
from .location import Location
from .machine_hour_reading import MachineHourReading

__all__ = [
    "User",
    "UserRole",
    "Equipment",
    "Department",
    "Location",
    "MachineHourReading",
]
