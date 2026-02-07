from typing import List, Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .auth import get_db, get_current_user
from .models import MaintenanceSchedule, Equipment, User, UserRole
from .schemas import MaintenanceScheduleCreate, MaintenanceScheduleOut, MaintenanceScheduleUpdate
from .permissions import require_supervisor_or_above


router = APIRouter(prefix="/maintenance", tags=["maintenance"])


@router.get("/", response_model=List[MaintenanceScheduleOut])
def list_maintenance_schedules(
    equipment_id: Optional[str] = None,
    department_id: Optional[str] = None,
    is_active: Optional[bool] = None,
    overdue: Optional[bool] = None,
    upcoming_days: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List maintenance schedules with optional filters.
    - equipment_id: Filter by specific equipment
    - department_id: Filter by department
    - is_active: Filter by active/inactive schedules
    - overdue: Show only overdue maintenance
    - upcoming_days: Show maintenance due in next X days
    """
    query = db.query(MaintenanceSchedule).join(Equipment)
    
    # Filter by equipment
    if equipment_id:
        query = query.filter(MaintenanceSchedule.equipment_id == equipment_id)
    
    # Filter by department
    if department_id:
        query = query.filter(Equipment.department_id == department_id)
    
    # Filter by active status
    if is_active is not None:
        query = query.filter(MaintenanceSchedule.is_active == is_active)
    
    # Filter overdue maintenance
    if overdue:
        query = query.filter(MaintenanceSchedule.next_maintenance_date < datetime.utcnow())
    
    # Filter upcoming maintenance
    if upcoming_days:
        future_date = datetime.utcnow() + timedelta(days=upcoming_days)
        query = query.filter(
            MaintenanceSchedule.next_maintenance_date >= datetime.utcnow(),
            MaintenanceSchedule.next_maintenance_date <= future_date
        )
    
    return query.order_by(MaintenanceSchedule.next_maintenance_date).all()


@router.get("/{schedule_id}", response_model=MaintenanceScheduleOut)
def get_maintenance_schedule(
    schedule_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific maintenance schedule by ID"""
    schedule = db.query(MaintenanceSchedule).filter(MaintenanceSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Maintenance schedule not found")
    return schedule


@router.post("/", response_model=MaintenanceScheduleOut, status_code=201)
def create_maintenance_schedule(
    payload: MaintenanceScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new maintenance schedule (supervisor and super_admin only)"""
    require_supervisor_or_above(current_user)
    
    # Verify equipment exists
    equipment = db.query(Equipment).filter(Equipment.id == payload.equipment_id).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    # Verify equipment has a department assigned
    if not equipment.department_id:
        raise HTTPException(
            status_code=400, 
            detail="Equipment must have a department assigned before creating maintenance schedule"
        )
    
    # Verify assigned user exists if provided
    if payload.assigned_to_user_id:
        assigned_user = db.query(User).filter(User.id == payload.assigned_to_user_id).first()
        if not assigned_user:
            raise HTTPException(status_code=404, detail="Assigned user not found")
    
    schedule = MaintenanceSchedule(**payload.dict())
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.patch("/{schedule_id}", response_model=MaintenanceScheduleOut)
def update_maintenance_schedule(
    schedule_id: str,
    payload: MaintenanceScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a maintenance schedule (supervisor and super_admin only)"""
    require_supervisor_or_above(current_user)
    
    schedule = db.query(MaintenanceSchedule).filter(MaintenanceSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Maintenance schedule not found")
    
    update_data = payload.dict(exclude_unset=True)
    
    # Verify assigned user exists if being updated
    if "assigned_to_user_id" in update_data and update_data["assigned_to_user_id"]:
        assigned_user = db.query(User).filter(User.id == update_data["assigned_to_user_id"]).first()
        if not assigned_user:
            raise HTTPException(status_code=404, detail="Assigned user not found")
    
    for field, value in update_data.items():
        setattr(schedule, field, value)
    
    db.commit()
    db.refresh(schedule)
    return schedule


@router.post("/{schedule_id}/complete", response_model=MaintenanceScheduleOut)
def complete_maintenance(
    schedule_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mark maintenance as completed and calculate next maintenance date.
    Updates last_maintenance_date to now and calculates next_maintenance_date based on frequency.
    """
    require_supervisor_or_above(current_user)
    
    schedule = db.query(MaintenanceSchedule).filter(MaintenanceSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Maintenance schedule not found")
    
    now = datetime.utcnow()
    schedule.last_maintenance_date = now
    schedule.next_maintenance_date = now + timedelta(days=schedule.frequency_days)
    
    db.commit()
    db.refresh(schedule)
    return schedule


@router.delete("/{schedule_id}")
def delete_maintenance_schedule(
    schedule_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a maintenance schedule (supervisor and super_admin only)"""
    require_supervisor_or_above(current_user)
    
    schedule = db.query(MaintenanceSchedule).filter(MaintenanceSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Maintenance schedule not found")
    
    db.delete(schedule)
    db.commit()
    
    return {"message": "Maintenance schedule deleted successfully"}


@router.get("/stats/summary")
def get_maintenance_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get maintenance statistics summary"""
    total_schedules = db.query(MaintenanceSchedule).filter(MaintenanceSchedule.is_active == True).count()
    
    overdue = db.query(MaintenanceSchedule).filter(
        MaintenanceSchedule.is_active == True,
        MaintenanceSchedule.next_maintenance_date < datetime.utcnow()
    ).count()
    
    upcoming_7_days = db.query(MaintenanceSchedule).filter(
        MaintenanceSchedule.is_active == True,
        MaintenanceSchedule.next_maintenance_date >= datetime.utcnow(),
        MaintenanceSchedule.next_maintenance_date <= datetime.utcnow() + timedelta(days=7)
    ).count()
    
    upcoming_30_days = db.query(MaintenanceSchedule).filter(
        MaintenanceSchedule.is_active == True,
        MaintenanceSchedule.next_maintenance_date >= datetime.utcnow(),
        MaintenanceSchedule.next_maintenance_date <= datetime.utcnow() + timedelta(days=30)
    ).count()
    
    return {
        "total_active_schedules": total_schedules,
        "overdue": overdue,
        "upcoming_7_days": upcoming_7_days,
        "upcoming_30_days": upcoming_30_days
    }
