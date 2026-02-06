from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

from .models import EquipmentStatus, LogType, UserRole, TicketStatus


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.tech


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserOut(UserBase):
    id: str
    is_active: bool

    class Config:
        from_attributes = True


class DepartmentBase(BaseModel):
    name: str
    code: Optional[str] = None


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentOut(DepartmentBase):
    id: str

    class Config:
        from_attributes = True


class EquipmentBase(BaseModel):
    asset_tag: str
    device_name: str
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    status: EquipmentStatus = EquipmentStatus.active
    department_id: Optional[str] = None


class EquipmentCreate(EquipmentBase):
    serial_number: Optional[str] = None
    location_id: Optional[str] = None
    in_service_date: Optional[datetime] = None
    notes: Optional[str] = None


class EquipmentOut(EquipmentBase):
    id: str
    location_id: Optional[str] = None
    in_service_date: Optional[datetime] = None
    notes: Optional[str] = None
    repair_count: int = 0

    class Config:
        from_attributes = True


class EquipmentUpdateStatus(BaseModel):
    status: EquipmentStatus


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

