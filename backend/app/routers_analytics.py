from typing import List, Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case

from .auth import get_db, get_current_user
from .models import Equipment, Ticket, EquipmentLog, MaintenanceSchedule, User, Department, EquipmentStatus
from .permissions import require_support_or_above


router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/equipment/downtime")
def get_equipment_downtime_analytics(
    department_id: Optional[str] = None,
    criticality: Optional[str] = None,
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get equipment downtime analytics
    Returns equipment sorted by total downtime
    """
    require_support_or_above(current_user)
    
    query = db.query(Equipment).filter(Equipment.status != EquipmentStatus.retired)
    
    if department_id:
        query = query.filter(Equipment.department_id == department_id)
    
    if criticality:
        query = query.filter(Equipment.criticality == criticality)
    
    # Get equipment with highest downtime
    equipment_list = query.order_by(Equipment.total_downtime_minutes.desc()).limit(limit).all()
    
    result = []
    for eq in equipment_list:
        # Calculate uptime percentage (assuming 24/7 operation since in_service_date)
        if eq.in_service_date:
            total_minutes = (datetime.utcnow() - eq.in_service_date).total_seconds() / 60
            uptime_percentage = ((total_minutes - eq.total_downtime_minutes) / total_minutes * 100) if total_minutes > 0 else 100
        else:
            uptime_percentage = 100
        
        result.append({
            "id": eq.id,
            "asset_tag": eq.asset_tag,
            "device_name": eq.device_name,
            "manufacturer": eq.manufacturer,
            "model": eq.model,
            "department": eq.department.name if eq.department else None,
            "criticality": eq.criticality,
            "total_downtime_minutes": eq.total_downtime_minutes,
            "total_downtime_hours": round(eq.total_downtime_minutes / 60, 2),
            "is_currently_down": eq.is_currently_down,
            "uptime_percentage": round(uptime_percentage, 2),
            "repair_count": eq.repair_count,
        })
    
    return result


@router.get("/equipment/availability")
def get_equipment_availability_summary(
    department_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get overall equipment availability summary
    """
    require_support_or_above(current_user)
    
    query = db.query(Equipment).filter(Equipment.status != EquipmentStatus.retired)
    
    if department_id:
        query = query.filter(Equipment.department_id == department_id)
    
    equipment_list = query.all()
    
    total_equipment = len(equipment_list)
    currently_down = sum(1 for eq in equipment_list if eq.is_currently_down)
    
    # Calculate average uptime
    total_uptime = 0
    count_with_service_date = 0
    
    for eq in equipment_list:
        if eq.in_service_date:
            total_minutes = (datetime.utcnow() - eq.in_service_date).total_seconds() / 60
            if total_minutes > 0:
                uptime = ((total_minutes - eq.total_downtime_minutes) / total_minutes * 100)
                total_uptime += uptime
                count_with_service_date += 1
    
    average_uptime = (total_uptime / count_with_service_date) if count_with_service_date > 0 else 100
    
    # Group by criticality
    by_criticality = {}
    for eq in equipment_list:
        crit = eq.criticality
        if crit not in by_criticality:
            by_criticality[crit] = {"total": 0, "down": 0}
        by_criticality[crit]["total"] += 1
        if eq.is_currently_down:
            by_criticality[crit]["down"] += 1
    
    return {
        "total_equipment": total_equipment,
        "currently_operational": total_equipment - currently_down,
        "currently_down": currently_down,
        "average_uptime_percentage": round(average_uptime, 2),
        "by_criticality": by_criticality,
    }


@router.get("/maintenance/compliance")
def get_maintenance_compliance(
    department_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get maintenance compliance statistics
    """
    require_support_or_above(current_user)
    
    query = db.query(MaintenanceSchedule).join(Equipment).filter(MaintenanceSchedule.is_active == True)
    
    if department_id:
        query = query.filter(Equipment.department_id == department_id)
    
    schedules = query.all()
    
    now = datetime.utcnow()
    total = len(schedules)
    overdue = sum(1 for s in schedules if s.next_maintenance_date < now)
    due_7_days = sum(1 for s in schedules if now <= s.next_maintenance_date <= now + timedelta(days=7))
    due_30_days = sum(1 for s in schedules if now <= s.next_maintenance_date <= now + timedelta(days=30))
    on_schedule = total - overdue
    
    compliance_rate = ((on_schedule / total) * 100) if total > 0 else 100
    
    return {
        "total_schedules": total,
        "overdue": overdue,
        "due_within_7_days": due_7_days,
        "due_within_30_days": due_30_days,
        "on_schedule": on_schedule,
        "compliance_rate": round(compliance_rate, 2),
    }


@router.get("/tickets/resolution-time")
def get_ticket_resolution_analytics(
    department_id: Optional[str] = None,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get ticket resolution time analytics
    """
    require_support_or_above(current_user)
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    query = db.query(Ticket).filter(
        Ticket.created_at >= start_date,
        Ticket.status.in_(["resolved", "closed"])
    )
    
    if department_id:
        query = query.filter(Ticket.department_id == department_id)
    
    tickets = query.all()
    
    if not tickets:
        return {
            "total_resolved": 0,
            "average_resolution_hours": 0,
            "median_resolution_hours": 0,
            "fastest_resolution_hours": 0,
            "slowest_resolution_hours": 0,
        }
    
    resolution_times = []
    for ticket in tickets:
        if ticket.completed_on:
            hours = (ticket.completed_on - ticket.created_at).total_seconds() / 3600
            resolution_times.append(hours)
    
    if not resolution_times:
        return {
            "total_resolved": len(tickets),
            "average_resolution_hours": 0,
            "median_resolution_hours": 0,
            "fastest_resolution_hours": 0,
            "slowest_resolution_hours": 0,
        }
    
    resolution_times.sort()
    median_index = len(resolution_times) // 2
    
    return {
        "total_resolved": len(tickets),
        "average_resolution_hours": round(sum(resolution_times) / len(resolution_times), 2),
        "median_resolution_hours": round(resolution_times[median_index], 2),
        "fastest_resolution_hours": round(min(resolution_times), 2),
        "slowest_resolution_hours": round(max(resolution_times), 2),
    }


@router.get("/dashboard/summary")
def get_dashboard_summary(
    department_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get comprehensive dashboard summary with all key metrics
    """
    require_support_or_above(current_user)
    
    # Get all analytics in one call
    availability = get_equipment_availability_summary(department_id, db, current_user)
    maintenance = get_maintenance_compliance(department_id, db, current_user)
    downtime = get_equipment_downtime_analytics(department_id, None, 5, db, current_user)
    
    return {
        "equipment_availability": availability,
        "maintenance_compliance": maintenance,
        "top_downtime_equipment": downtime,
    }



@router.get("/departments/repairs")
def get_department_repairs_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get repair statistics by department
    Returns total repairs (repair_count) for equipment in each department
    """
    require_support_or_above(current_user)
    
    # Get all departments
    departments = db.query(Department).all()
    
    result = []
    for dept in departments:
        # Get all equipment in this department
        equipment_in_dept = db.query(Equipment).filter(
            Equipment.department_id == dept.id
        ).all()
        
        # Sum up all repair counts
        total_repairs = sum(eq.repair_count for eq in equipment_in_dept)
        equipment_count = len(equipment_in_dept)
        
        # Get resolved/closed tickets for this department
        tickets_count = db.query(Ticket).filter(
            Ticket.department_id == dept.id,
            Ticket.status.in_(["resolved", "closed"])
        ).count()
        
        result.append({
            "department_id": dept.id,
            "department_name": dept.name,
            "department_code": dept.code,
            "total_repairs": total_repairs,
            "equipment_count": equipment_count,
            "tickets_resolved": tickets_count,
            "avg_repairs_per_equipment": round(total_repairs / equipment_count, 2) if equipment_count > 0 else 0,
        })
    
    # Sort by total repairs descending
    result.sort(key=lambda x: x["total_repairs"], reverse=True)
    
    return result
