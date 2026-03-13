from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from .auth import get_db, get_current_user
from .models import Equipment, User, Department, EquipmentStatus
from .permissions import require_support_or_above


router = APIRouter(prefix="/analytics", tags=["analytics"])


# =========================================================
# EQUIPMENT DOWNTIME ANALYTICS
# =========================================================
@router.get("/equipment/downtime")
def get_equipment_downtime_analytics(
    department_id: Optional[str] = None,
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    require_support_or_above(current_user)

    query = db.query(Equipment).filter(
        Equipment.status != EquipmentStatus.retired)

    if department_id:
        query = query.filter(Equipment.department_id == department_id)

    equipment_list = query.order_by(
        Equipment.total_downtime_minutes.desc()).limit(limit).all()

    result = []

    for eq in equipment_list:

        if eq.in_service_date:
            total_minutes = (datetime.utcnow() -
                             eq.in_service_date).total_seconds() / 60
            uptime_percentage = (
                ((total_minutes - eq.total_downtime_minutes) / total_minutes) * 100
                if total_minutes > 0
                else 100
            )
        else:
            uptime_percentage = 100

        result.append({
            "id": eq.id,
            "asset_tag": eq.asset_tag,
            "equipment_name": eq.equipment_name,
            "manufacturer": eq.manufacturer,
            "model": eq.model,
            "department": eq.department.name if eq.department else None,
            "total_downtime_minutes": eq.total_downtime_minutes,
            "total_downtime_hours": round(eq.total_downtime_minutes / 60, 2),
            "uptime_percentage": round(uptime_percentage, 2),
            "repair_count": eq.repair_count,
        })

    return result


# =========================================================
# EQUIPMENT AVAILABILITY SUMMARY
# =========================================================
@router.get("/equipment/availability")
def get_equipment_availability_summary(
    department_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    require_support_or_above(current_user)

    query = db.query(Equipment).filter(
        Equipment.status != EquipmentStatus.retired)

    if department_id:
        query = query.filter(Equipment.department_id == department_id)

    equipment_list = query.all()

    total_equipment = len(equipment_list)

    total_uptime = 0
    count = 0

    for eq in equipment_list:

        if eq.in_service_date:

            total_minutes = (datetime.utcnow() -
                             eq.in_service_date).total_seconds() / 60

            if total_minutes > 0:
                uptime = (
                    (total_minutes - eq.total_downtime_minutes) / total_minutes) * 100
                total_uptime += uptime
                count += 1

    average_uptime = (total_uptime / count) if count > 0 else 100

    return {
        "total_equipment": total_equipment,
        "average_uptime_percentage": round(average_uptime, 2),
    }


# =========================================================
# EQUIPMENT HEALTH SUMMARY
# =========================================================
@router.get("/equipment/health")
def get_equipment_health_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    require_support_or_above(current_user)

    equipment_list = db.query(Equipment).all()

    summary = {
        "healthy": 0,
        "warning": 0,
        "attention": 0,
        "critical": 0,
    }

    for eq in equipment_list:

        status = eq.health_status

        if status in summary:
            summary[status] += 1

    return summary


# =========================================================
# DEPARTMENT REPAIR ANALYTICS
# =========================================================
@router.get("/departments/repairs")
def get_department_repairs_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    require_support_or_above(current_user)

    departments = db.query(Department).all()

    result = []

    for dept in departments:

        equipment_list = db.query(Equipment).filter(
            Equipment.department_id == dept.id
        ).all()

        total_repairs = sum(eq.repair_count for eq in equipment_list)
        equipment_count = len(equipment_list)

        result.append({
            "department_id": dept.id,
            "department_name": dept.name,
            "total_repairs": total_repairs,
            "equipment_count": equipment_count,
            "avg_repairs_per_equipment":
                round(total_repairs / equipment_count,
                      2) if equipment_count > 0 else 0,
        })

    result.sort(key=lambda x: x["total_repairs"], reverse=True)

    return result


# =========================================================
# DASHBOARD SUMMARY
# =========================================================
@router.get("/dashboard/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    require_support_or_above(current_user)

    availability = get_equipment_availability_summary(None, db, current_user)
    health = get_equipment_health_summary(db, current_user)
    downtime = get_equipment_downtime_analytics(None, 5, db, current_user)

    return {
        "equipment_availability": availability,
        "equipment_health": health,
        "top_downtime_equipment": downtime,
    }
