from datetime import datetime, date
from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator

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
# EQUIPMENT BASE (🔥 FINAL FIXED)
# =========================================================

class EquipmentBase(BaseModel):
    asset_tag: str

    # 🔥 REQUIRED NOW (NO MORE NULL)
    equipment_name: str

    # DB compatibility
    name: Optional[str] = None

    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None

    acquisition_type: Optional[str] = "Owned"
    status: EquipmentStatus = EquipmentStatus.active

    department_id: Optional[str] = None

    # ✅ CLEAN STRINGS
    @field_validator("department_id", "manufacturer", "model", "serial_number", mode="before")
    @classmethod
    def clean_strings(cls, v):
        return empty_to_none(v)


# =========================================================
# EQUIPMENT CREATE (🔥 HARD SYNC)
# =========================================================

class EquipmentCreate(EquipmentBase):
    location_id: Optional[str] = None
    installation_date: Optional[date] = None

    lifecycle_type: Optional[str] = "years"
    lifecycle_years: Optional[int] = None
    max_operating_hours: Optional[int] = None

    # 🔥 HARD SYNC (NO FAILURES)
    @field_validator("name", mode="before")
    @classmethod
    def force_name(cls, v, values):
        eq_name = values.data.get("equipment_name")
        if eq_name:
            return eq_name
        return v

    @field_validator("location_id", "installation_date", "lifecycle_type", mode="before")
    @classmethod
    def clean_general(cls, v):
        return empty_to_none(v)

    @field_validator("installation_date", mode="before")
    @classmethod
    def parse_date(cls, v):
        if v in ["", None]:
            return None
        if isinstance(v, date):
            return v
        try:
            return datetime.fromisoformat(v).date()
        except Exception:
            return None

    @field_validator("lifecycle_years", mode="before")
    @classmethod
    def convert_years(cls, v):
        v = empty_to_none(v)
        if v is None:
            return None
        try:
            return int(v)
        except:
            return None

    @field_validator("max_operating_hours", mode="before")
    @classmethod
    def convert_hours(cls, v):
        v = empty_to_none(v)
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

    location_id: Optional[str] = None
    installation_date: Optional[date] = None

    lifecycle_type: Optional[str] = None
    lifecycle_years: Optional[int] = None

    remaining_life_years: Optional[float] = None
    remaining_life_months: Optional[int] = None

    max_operating_hours: Optional[int] = None
    current_operating_hours: Optional[int] = None

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
# EQUIPMENT STATUS UPDATE
# =========================================================

class EquipmentUpdateStatus(BaseModel):
    status: EquipmentStatus


# =========================================================
# EQUIPMENT UPDATE (SAFE SYNC)
# =========================================================

class EquipmentUpdate(BaseModel):
    asset_tag: Optional[str] = None

    equipment_name: Optional[str] = None
    name: Optional[str] = None

    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None

    acquisition_type: Optional[str] = None
    status: Optional[EquipmentStatus] = None

    department_id: Optional[str] = None
    location_id: Optional[str] = None

    installation_date: Optional[date] = None

    lifecycle_type: Optional[str] = None
    lifecycle_years: Optional[int] = None
    max_operating_hours: Optional[int] = None

    risk_priority: Optional[int] = None

    # ✅ SAFE SYNC (UPDATE ONLY)
    @field_validator("name", mode="before")
    @classmethod
    def sync_name(cls, v, values):
        if not v and values.data.get("equipment_name"):
            return values.data.get("equipment_name")
        return v

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
