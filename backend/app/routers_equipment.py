from typing import Optional, Dict, Any, List
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth import get_db, get_current_user
from app.models import Equipment, User
from app.models.service_history import ServiceHistory

from app.schemas import (
    EquipmentCreate,
    EquipmentOut,
    EquipmentUpdateStatus,
    EquipmentUpdate,
    ServiceHistoryCreate,
    ServiceHistoryOut,
)

from app.permissions import (
    can_update_equipment_status,
    can_create_equipment,
    can_view_equipment,
)

from app import notification_service
from app.utils.audit import log_action

router = APIRouter(prefix="/equipment", tags=["equipment"])


# =========================================================
# LIST EQUIPMENT
# =========================================================
@router.get("/", response_model=Dict[str, Any])
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
        raise HTTPException(status_code=403, detail="Not authorized")

    query = db.query(Equipment)

    if status:
        query = query.filter(Equipment.status == status)

    if department_id:
        query = query.filter(Equipment.department_id == department_id)

    if search:
        term = f"%{search}%"
        query = query.filter(
            (Equipment.equipment_name.ilike(term))
            | (Equipment.asset_tag.ilike(term))
            | (Equipment.serial_number.ilike(term))
        )

    total = query.count()

    offset = (page - 1) * page_size
    equipment_list = query.offset(offset).limit(page_size).all()

    equipment_list.sort(
        key=lambda e: (
            e.risk_priority if e.risk_priority is not None else 999,
            -(e.repair_count or 0),
        )
    )

    items = [EquipmentOut.model_validate(eq) for eq in equipment_list]

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
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
        Equipment.id == equipment_id
    ).first()

    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    return equipment


# =========================================================
# SERVICE HISTORY
# =========================================================
@router.get("/{equipment_id}/history", response_model=List[ServiceHistoryOut])
def get_service_history(
    equipment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    equipment = db.query(Equipment).filter(
        Equipment.id == equipment_id
    ).first()

    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    return (
        db.query(ServiceHistory)
        .filter(ServiceHistory.equipment_id == equipment_id)
        .order_by(ServiceHistory.date.desc())
        .all()
    )


# =========================================================
# ADD SERVICE HISTORY
# =========================================================
@router.post("/{equipment_id}/history", response_model=ServiceHistoryOut)
def add_service_history(
    equipment_id: str,
    payload: ServiceHistoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    equipment = db.query(Equipment).filter(
        Equipment.id == equipment_id
    ).first()

    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    new_record = ServiceHistory(
        equipment_id=equipment_id,
        date=payload.date,
        work_done=payload.work_done,
        engineer=payload.engineer,
    )

    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    try:
        log_action(
            db,
            action="CREATE",
            entity="service_history",
            entity_id=new_record.id,
            user_id=current_user.id,
            details={
                "work_done": new_record.work_done,
                "engineer": new_record.engineer,
                "date": str(new_record.date),
                "equipment_id": new_record.equipment_id,
            },
        )
    except Exception:
        pass

    return new_record


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
        raise HTTPException(status_code=403, detail="Supervisor required")

    data = payload.model_dump()

    if not data.get("equipment_name"):
        raise HTTPException(
            status_code=400, detail="Equipment name is required"
        )

    acquisition = (data.get("acquisition_type") or "Owned").strip()
    data["acquisition_type"] = acquisition

    allowed_fields = {
        "asset_tag",
        "equipment_name",
        "model",
        "brand",
        "serial_number",
        "location_id",
        "department_id",
        "status",
        "acquisition_type",
        "installation_date",
        "lifecycle_type",
        "lifecycle_years",
        "max_operating_hours",
    }

    filtered_data = {k: v for k, v in data.items() if k in allowed_fields}

    equipment = Equipment(
        id=str(uuid.uuid4()),
        **filtered_data
    )

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
        raise HTTPException(status_code=403, detail="Supervisor required")

    equipment = db.query(Equipment).filter(
        Equipment.id == equipment_id
    ).first()

    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    old_status = equipment.status
    equipment.status = payload.status

    db.commit()
    db.refresh(equipment)

    if old_status != equipment.status:
        try:
            notification_service.notify_equipment_status_changed(
                db, equipment, str(old_status), str(
                    equipment.status), current_user
            )
        except Exception:
            pass

    return equipment


# =========================================================
# FULL UPDATE 🔥 STRICT (WITH DEBUG)
# =========================================================
@router.put("/{equipment_id}", response_model=EquipmentOut)
def update_equipment(
    equipment_id: str,
    payload: EquipmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not can_create_equipment(current_user):
        raise HTTPException(status_code=403, detail="Manager required")

    equipment = db.query(Equipment).filter(
        Equipment.id == equipment_id
    ).first()

    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    # 🧪 DEBUG — VERIFY FRONTEND PAYLOAD
    print("🔥 PAYLOAD RECEIVED:", payload.model_dump())

    update_data = payload.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(equipment, key, value)

    db.commit()
    db.refresh(equipment)

    return equipment


# =========================================================
# DELETE EQUIPMENT
# =========================================================
@router.delete("/{equipment_id}")
def delete_equipment(
    equipment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not can_create_equipment(current_user):
        raise HTTPException(status_code=403, detail="Manager required")

    equipment = db.query(Equipment).filter(
        Equipment.id == equipment_id
    ).first()

    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    db.delete(equipment)
    db.commit()

    return {"message": "Equipment deleted successfully"}


# =========================================================
# DASHBOARD
# =========================================================
@router.get("/dashboard", response_model=Dict[str, Any])
def equipment_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not can_view_equipment(current_user):
        raise HTTPException(status_code=403, detail="Not authorized")

    equipment_list = db.query(Equipment).all()

    stats = {
        "total_equipment": 0,
        "healthy": 0,
        "warning": 0,
        "attention": 0,
        "critical": 0,
        "pm_overdue": 0,
        "near_end_of_life": 0,
    }

    for eq in equipment_list:
        stats["total_equipment"] += 1

        if eq.health_status == "healthy":
            stats["healthy"] += 1
        elif eq.health_status == "warning":
            stats["warning"] += 1
        elif eq.health_status == "attention":
            stats["attention"] += 1
        elif eq.health_status == "critical":
            stats["critical"] += 1

        if eq.pm_alert in ["pm_required", "no_pm_record"]:
            stats["pm_overdue"] += 1

        if (
            eq.remaining_operating_months is not None
            and eq.remaining_operating_months <= 6
        ):
            stats["near_end_of_life"] += 1

    return {"stats": stats}
