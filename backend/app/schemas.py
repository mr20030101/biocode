from datetime import datetime, date
from typing import Optional

from pydantic import BaseModel, EmailStr

from .models import EquipmentStatus, LogType, UserRole, TicketStatus


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
# EQUIPMENT BASE
# =========================================================

class EquipmentBase(BaseModel):

    asset_tag: str
    equipment_name: str

    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None

    status: EquipmentStatus = EquipmentStatus.active

    department_id: Optional[str] = None


# =========================================================
# EQUIPMENT CREATE
# =========================================================

class EquipmentCreate(EquipmentBase):

    location_id: Optional[str] = None

    # Lifecycle anchor
    installation_date: Optional[date] = None


# =========================================================
# EQUIPMENT OUTPUT
# =========================================================

class EquipmentOut(EquipmentBase):

    id: str

    location_id: Optional[str] = None
    installation_date: Optional[date] = None

    repair_count: int = 0

    # Lifecycle
    max_operating_hours: Optional[int] = None
    current_operating_hours: Optional[int] = None
    remaining_operating_months: Optional[float] = None

    # Health Engine
    health_status: Optional[str] = None
    health_score: Optional[int] = None
    alert_level: Optional[str] = None

    # Risk
    risk_level: Optional[str] = None
    risk_priority: Optional[int] = None

    # Preventive Maintenance
    pm_alert: Optional[str] = None

    class Config:
        from_attributes = True


# =========================================================
# EQUIPMENT STATUS UPDATE
# =========================================================

class EquipmentUpdateStatus(BaseModel):
    status: EquipmentStatus


# =========================================================
# EQUIPMENT FULL UPDATE
# =========================================================

class EquipmentUpdate(BaseModel):

    asset_tag: Optional[str] = None
    equipment_name: Optional[str] = None

    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None

    status: Optional[EquipmentStatus] = None

    department_id: Optional[str] = None
    location_id: Optional[str] = None

    installation_date: Optional[date] = None


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

    created_at: datetime
    updated_at: datetime

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
    created_at: datetime

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
    created_at: datetime

    class Config:
        from_attributes = True
