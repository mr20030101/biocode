from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .auth import get_db, get_current_user
from .models import Equipment, User, EquipmentStatus
from .schemas import EquipmentCreate, EquipmentOut, EquipmentUpdateStatus, EquipmentUpdate
from .permissions import (
    can_update_equipment_status,
    can_create_equipment,
    can_view_equipment
)
from . import notification_service


router = APIRouter(prefix="/equipment", tags=["equipment"])


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
    # All authenticated users can list equipment (needed for ticket creation)
    # But viewers cannot access the equipment page in the UI
    query = db.query(Equipment)
    
    # Filter by status
    if status:
        query = query.filter(Equipment.status == status)
    
    # Filter by department
    if department_id:
        query = query.filter(Equipment.department_id == department_id)
    
    # Search by device name, asset tag, or serial number
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Equipment.device_name.ilike(search_term)) |
            (Equipment.asset_tag.ilike(search_term)) |
            (Equipment.serial_number.ilike(search_term))
        )
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * page_size
    equipment_list = query.order_by(Equipment.device_name).offset(offset).limit(page_size).all()
    
    # Convert to dict manually to avoid serialization issues
    items = []
    for eq in equipment_list:
        items.append({
            "id": eq.id,
            "asset_tag": eq.asset_tag,
            "device_name": eq.device_name,
            "manufacturer": eq.manufacturer,
            "model": eq.model,
            "serial_number": eq.serial_number,
            "status": eq.status.value,
            "department_id": eq.department_id,
            "repair_count": eq.repair_count,
        })
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.get("/{equipment_id}", response_model=EquipmentOut)
def get_equipment(
    equipment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # All authenticated users can get equipment details (needed for ticket details)
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return equipment


@router.post("/", response_model=EquipmentOut)
def create_equipment(
    payload: EquipmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Only supervisor and super_admin can create equipment
    if not can_create_equipment(current_user):
        raise HTTPException(status_code=403, detail="Supervisor access required")
    
    equipment = Equipment(**payload.dict())
    db.add(equipment)
    db.commit()
    db.refresh(equipment)
    return equipment



@router.patch("/{equipment_id}", response_model=EquipmentOut)
def update_equipment_status(
    equipment_id: str,
    payload: EquipmentUpdateStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Only supervisor and super_admin can update equipment status
    if not can_update_equipment_status(current_user):
        raise HTTPException(status_code=403, detail="Supervisor access required")
    
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    # Track old status for notifications
    old_status = equipment.status
    
    equipment.status = payload.status
    db.commit()
    db.refresh(equipment)
    
    # Send notifications if status changed
    if old_status != equipment.status:
        notification_service.notify_equipment_status_changed(
            db, equipment, old_status.value, equipment.status.value, current_user
        )
    
    return equipment


@router.put("/{equipment_id}", response_model=EquipmentOut)
def update_equipment(
    equipment_id: str,
    payload: EquipmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Full equipment update - only manager and super_admin can do this"""
    # Only manager and super_admin can fully update equipment
    if not can_create_equipment(current_user):
        raise HTTPException(status_code=403, detail="Manager access required")
    
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    # Track old status for notifications
    old_status = equipment.status
    
    # Update only provided fields
    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(equipment, field, value)
    
    db.commit()
    db.refresh(equipment)
    
    # Send notifications if status changed
    if 'status' in update_data and old_status != equipment.status:
        notification_service.notify_equipment_status_changed(
            db, equipment, old_status.value, equipment.status.value, current_user
        )
    
    return equipment


@router.delete("/{equipment_id}")
def delete_equipment(
    equipment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete equipment - only super_admin can do this"""
    from .permissions import require_super_admin
    require_super_admin(current_user)
    
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    # Delete the equipment
    db.delete(equipment)
    db.commit()
    
    return {"message": f"Equipment {equipment.device_name} has been deleted successfully"}
