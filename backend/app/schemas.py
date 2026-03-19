from datetime import datetime, date
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from .models import EquipmentStatus, LogType, UserRole, TicketStatus


# =========================================================
# 🔧 GLOBAL SANITIZER
# =========================================================

def empty_to_none(v):
    if v in ["", "null", None]:
        return None
    return v


# =========================================================
# TOKEN
# =========================================================

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# =========================================================
# USERS
# =========================================================

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.support
    department_id: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    department_id: Optional[str] = None


class UserOut(UserBase):
    id: str
    is_active: bool

    class Config:
        from_attributes = True


# =========================================================
# DEPARTMENTS
# =========================================================

class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentOut(DepartmentBase):
    id: str

    class Config:
        from_attributes = True


# =========================================================
# EQUIPMENT BASE (🔥 CLEAN)
# =========================================================

class EquipmentBase(BaseModel):
    asset_tag: Optional[str] = None
    equipment_name: Optional[str] = None
    serial_number: Optional[str] = None

    # 🔥 SINGLE SOURCE OF TRUTH
    acquisition_type: Optional[str] = Field(default="Owned")

    manufacturer: Optional[str] = None
    model: Optional[str] = None
    department_id: Optional[str] = None

    installation_date: Optional[date] = None
    lifecycle_years: Optional[int] = None
    lifecycle_type: Optional[str] = None

    max_operating_hours: Optional[int] = None
    current_reading: Optional[int] = None

    status: Optional[EquipmentStatus] = EquipmentStatus.active

    @field_validator("*", mode="before")
    @classmethod
    def clean_all(cls, v):
        return empty_to_none(v)


# =========================================================
# EQUIPMENT CREATE
# =========================================================

class EquipmentCreate(EquipmentBase):
    equipment_name: str

    @field_validator("lifecycle_years", "max_operating_hours", mode="before")
    @classmethod
    def convert_numbers(cls, v):
        if v is None:
            return None
        try:
            return int(v)
        except:
            return None


# =========================================================
# EQUIPMENT UPDATE (🔥 FIXED)
# =========================================================

class EquipmentUpdate(BaseModel):
    asset_tag: Optional[str] = None
    equipment_name: Optional[str] = None
    serial_number: Optional[str] = None

    # 🔥 CRITICAL FIELD
    acquisition_type: Optional[str] = None

    manufacturer: Optional[str] = None
    model: Optional[str] = None
    department_id: Optional[str] = None

    installation_date: Optional[date] = None
    lifecycle_years: Optional[int] = None
    lifecycle_type: Optional[str] = None

    max_operating_hours: Optional[int] = None
    current_reading: Optional[int] = None

    status: Optional[EquipmentStatus] = None
    risk_priority: Optional[int] = None

    @field_validator("*", mode="before")
    @classmethod
    def clean_all(cls, v):
        return empty_to_none(v)

    @field_validator("lifecycle_years", "max_operating_hours", mode="before")
    @classmethod
    def convert_numbers(cls, v):
        if v is None:
            return None
        try:
            return int(v)
        except:
            return None


# =========================================================
# EQUIPMENT OUTPUT
# =========================================================

class EquipmentOut(EquipmentBase):
    id: str

    remaining_life_years: Optional[float] = None
    remaining_life_months: Optional[int] = None

    remaining_operating_months: Optional[int] = None

    health_status: Optional[str] = None
    risk_priority: Optional[int] = None
    pm_alert: Optional[str] = None

    repair_count: int = 0

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @field_validator("created_at", "updated_at", mode="before")
    @classmethod
    def fix_invalid_datetime(cls, v):
        if v in ["0000-00-00 00:00:00", "", None]:
            return None
        return v

    class Config:
        from_attributes = True
        extra = "ignore"


# =========================================================
# EQUIPMENT UPDATE STATUS
# =========================================================

class EquipmentUpdateStatus(BaseModel):
    status: EquipmentStatus


# =========================================================
# SERVICE HISTORY
# =========================================================

class ServiceHistoryCreate(BaseModel):
    equipment_id: str
    date: date
    work_done: str
    engineer: str


class ServiceHistoryUpdate(BaseModel):
    date: Optional[date] = None
    work_done: Optional[str] = None
    engineer: Optional[str] = None


class ServiceHistoryOut(BaseModel):
    id: str
    equipment_id: str
    date: date
    work_done: str
    engineer: str

    class Config:
        from_attributes = True


# =========================================================
# TICKETS
# =========================================================

class TicketBase(BaseModel):
    equipment_id: str
    title: str
    description: Optional[str] = None
    priority: Optional[str] = "medium"


class TicketCreate(TicketBase):
    pass


class TicketUpdate(BaseModel):
    status: Optional[TicketStatus] = None
    assigned_to_user_id: Optional[str] = None
    priority: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None


class TicketOut(TicketBase):
    id: str
    status: TicketStatus

    reported_by_user_id: Optional[str] = None
    assigned_to_user_id: Optional[str] = None

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @field_validator("created_at", "updated_at", mode="before")
    @classmethod
    def fix_invalid_datetime(cls, v):
        if v in ["0000-00-00 00:00:00", "", None]:
            return None
        return v

    class Config:
        from_attributes = True


# =========================================================
# EQUIPMENT LOGS
# =========================================================

class EquipmentLogBase(BaseModel):
    equipment_id: str
    log_type: LogType

    title: str
    description: Optional[str] = None

    occurred_at: Optional[datetime] = None

    downtime_minutes: int = 0
    resolved: bool = True


class EquipmentLogCreate(EquipmentLogBase):
    pass


class EquipmentLogOut(EquipmentLogBase):
    id: str
    created_by_user_id: Optional[str] = None

    class Config:
        from_attributes = True


# =========================================================
# MACHINE HOUR READINGS
# =========================================================

class MachineHourReadingBase(BaseModel):
    equipment_id: str
    reading_hours: int
    reading_date: datetime


class MachineHourReadingCreate(MachineHourReadingBase):
    pass


class MachineHourReadingOut(MachineHourReadingBase):
    id: str
    created_at: Optional[datetime] = None

    @field_validator("created_at", mode="before")
    @classmethod
    def fix_invalid_datetime(cls, v):
        if v in ["0000-00-00 00:00:00", "", None]:
            return None
        return v

    class Config:
        from_attributes = True


# =========================================================
# NOTIFICATIONS
# =========================================================

class NotificationCreate(BaseModel):
    user_id: Optional[str] = None
    message: str


class NotificationOut(BaseModel):
    id: str
    user_id: Optional[str]
    message: str
    is_read: bool
    created_at: Optional[datetime] = None

    @field_validator("created_at", mode="before")
    @classmethod
    def fix_invalid_datetime(cls, v):
        if v in ["0000-00-00 00:00:00", "", None]:
            return None
        return v

    class Config:
        from_attributes = True
