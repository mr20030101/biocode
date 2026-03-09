from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .auth import get_db, get_current_user
from .models import Equipment, User
from .schemas import EquipmentCreate, EquipmentOut, EquipmentUpdateStatus, EquipmentUpdate
from .permissions import (
    can_update_equipment_status,
    can_create_equipment,
    can_view_equipment
)
from . import notification_service

router = APIRouter(prefix="/equipment", tags=["equipment"])


# =========================================================
# LIST EQUIPMENT
# =========================================================
@router.get("/", response_model=dict)
def list_equipment(
    status: Optional[str] = None,
    department_id: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    if not can_view_equipment(current_user):
        raise HTTPException(
            status_code=403, detail="Not authorized to view equipment")

    query = db.query(Equipment)

    if status:
        query = query.filter(Equipment.status == status)

    if department_id:
        query = query.filter(Equipment.department_id == department_id)

    if search:
        term = f"%{search}%"
        query = query.filter(
            (Equipment.equipment_name.ilike(term)) |
            (Equipment.asset_tag.ilike(term)) |
            (Equipment.serial_number.ilike(term))
        )

    total = query.count()

    offset = (page - 1) * page_size
    equipment_list = query.offset(offset).limit(page_size).all()

    # Sort by risk priority then repair count
    equipment_list.sort(
        key=lambda e: (
            e.risk_priority if e.risk_priority is not None else 999,
            -(e.repair_count or 0)
        )
    )

    items = [EquipmentOut.model_validate(eq) for eq in equipment_list]

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


# =========================================================
# SINGLE EQUIPMENT
# =========================================================
@router.get("/{equipment_id}", response_model=EquipmentOut)
def get_equipment(
    equipment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    equipment = db.query(Equipment).filter(
        Equipment.id == equipment_id).first()

    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    return equipment


# =========================================================
# CREATE EQUIPMENT
# =========================================================
@router.post("/", response_model=EquipmentOut)
def create_equipment(
    payload: EquipmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    if not can_create_equipment(current_user):
        raise HTTPException(
            status_code=403, detail="Supervisor access required")

    equipment = Equipment(**payload.model_dump())

    db.add(equipment)
    db.commit()
    db.refresh(equipment)

    return equipment


# =========================================================
# UPDATE STATUS
# =========================================================
@router.patch("/{equipment_id}", response_model=EquipmentOut)
def update_equipment_status(
    equipment_id: str,
    payload: EquipmentUpdateStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    if not can_update_equipment_status(current_user):
        raise HTTPException(
            status_code=403, detail="Supervisor access required")

    equipment = db.query(Equipment).filter(
        Equipment.id == equipment_id).first()

    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    old_status = equipment.status

    equipment.status = payload.status

    db.commit()
    db.refresh(equipment)

    if old_status != equipment.status:
        notification_service.notify_equipment_status_changed(
            db,
            equipment,
            old_status.value,
            equipment.status.value,
            current_user
        )

    return equipment


# =========================================================
# FULL UPDATE
# =========================================================
@router.put("/{equipment_id}", response_model=EquipmentOut)
def update_equipment(
    equipment_id: str,
    payload: EquipmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    if not can_create_equipment(current_user):
        raise HTTPException(status_code=403, detail="Manager access required")

    equipment = db.query(Equipment).filter(
        Equipment.id == equipment_id).first()

    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    old_status = equipment.status

    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(equipment, field, value)

    db.commit()
    db.refresh(equipment)

    if "status" in update_data and old_status != equipment.status:
        notification_service.notify_equipment_status_changed(
            db,
            equipment,
            old_status.value,
            equipment.status.value,
            current_user
        )

    return equipment
