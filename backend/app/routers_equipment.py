from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .auth import get_db, get_current_user
from .models import Equipment, User, EquipmentStatus
from .schemas import EquipmentCreate, EquipmentOut, EquipmentUpdateStatus
from .permissions import (
    can_update_equipment_status,
    can_create_equipment,
    can_view_equipment
)


router = APIRouter(prefix="/equipment", tags=["equipment"])


@router.get("/", response_model=List[EquipmentOut])
def list_equipment(
    status: Optional[str] = None,
    department_id: Optional[str] = None,
    search: Optional[str] = None,
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
    
    return query.order_by(Equipment.device_name).all()


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
    
    equipment.status = payload.status
    db.commit()
    db.refresh(equipment)
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
