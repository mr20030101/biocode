from typing import Optional
from datetime import datetime
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from .auth import get_db, get_current_user
from .models import Equipment, Ticket, MaintenanceSchedule, User, Department
from .permissions import require_manager_or_above

try:
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment
    EXCEL_AVAILABLE = True
except ImportError:
    EXCEL_AVAILABLE = False


router = APIRouter(prefix="/reports", tags=["reports"])


def generate_equipment_excel(db: Session, department_id: Optional[str] = None, status: Optional[str] = None):
    """Generate Excel report for equipment"""
    if not EXCEL_AVAILABLE:
        raise HTTPException(status_code=500, detail="Excel generation not available. Install openpyxl.")
    
    wb = Workbook()
    ws = wb.active
    ws.title = "Equipment Report"
    
    # Header styling
    header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
    header_font = Font(bold=True, color="FFFFFF")
    
    # Headers
    headers = ["Asset Tag", "Device Name", "Manufacturer", "Model", "Serial Number", "Status", "Department", "Repair Count"]
    for col, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center")
    
    # Query equipment
    query = db.query(Equipment)
    if department_id:
        query = query.filter(Equipment.department_id == department_id)
    if status:
        query = query.filter(Equipment.status == status)
    
    equipment_list = query.order_by(Equipment.device_name).all()
    
    # Data rows
    for row, eq in enumerate(equipment_list, 2):
        dept_name = eq.department.name if eq.department else "No Department"
        ws.cell(row=row, column=1, value=eq.asset_tag)
        ws.cell(row=row, column=2, value=eq.device_name)
        ws.cell(row=row, column=3, value=eq.manufacturer or "N/A")
        ws.cell(row=row, column=4, value=eq.model or "N/A")
        ws.cell(row=row, column=5, value=eq.serial_number or "N/A")
        ws.cell(row=row, column=6, value=eq.status.value)
        ws.cell(row=row, column=7, value=dept_name)
        ws.cell(row=row, column=8, value=eq.repair_count)
    
    # Auto-adjust column widths
    for col in range(1, len(headers) + 1):
        ws.column_dimensions[chr(64 + col)].width = 20
    
    # Save to BytesIO
    output = BytesIO()
    wb.save(output)
    output.seek(0)
    
    return output


def generate_tickets_excel(
    db: Session,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    department_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
):
    """Generate Excel report for tickets"""
    if not EXCEL_AVAILABLE:
        raise HTTPException(status_code=500, detail="Excel generation not available. Install openpyxl.")
    
    wb = Workbook()
    ws = wb.active
    ws.title = "Tickets Report"
    
    # Header styling
    header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
    header_font = Font(bold=True, color="FFFFFF")
    
    # Headers
    headers = ["Ticket Code", "Title", "Equipment", "Status", "Priority", "Department", "Reported By", "Assigned To", "Created Date"]
    for col, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center")
    
    # Query tickets
    query = db.query(Ticket)
    if status:
        query = query.filter(Ticket.status == status)
    if priority:
        query = query.filter(Ticket.priority == priority)
    if department_id:
        query = query.filter(Ticket.department_id == department_id)
    if start_date:
        query = query.filter(Ticket.created_at >= start_date)
    if end_date:
        query = query.filter(Ticket.created_at <= end_date)
    
    tickets_list = query.order_by(Ticket.created_at.desc()).all()
    
    # Data rows
    for row, ticket in enumerate(tickets_list, 2):
        equipment_name = ticket.equipment.device_name if ticket.equipment else "N/A"
        dept_name = ticket.department.name if ticket.department else "N/A"
        reported_by = ticket.reported_by_user.full_name if ticket.reported_by_user else "N/A"
        assigned_to = ticket.assigned_to_user.full_name if ticket.assigned_to_user else "Unassigned"
        
        ws.cell(row=row, column=1, value=ticket.ticket_code)
        ws.cell(row=row, column=2, value=ticket.title)
        ws.cell(row=row, column=3, value=equipment_name)
        ws.cell(row=row, column=4, value=ticket.status.value)
        ws.cell(row=row, column=5, value=ticket.priority or "N/A")
        ws.cell(row=row, column=6, value=dept_name)
        ws.cell(row=row, column=7, value=reported_by)
        ws.cell(row=row, column=8, value=assigned_to)
        ws.cell(row=row, column=9, value=ticket.created_at.strftime("%Y-%m-%d %H:%M") if ticket.created_at else "N/A")
    
    # Auto-adjust column widths
    for col in range(1, len(headers) + 1):
        ws.column_dimensions[chr(64 + col)].width = 18
    
    # Save to BytesIO
    output = BytesIO()
    wb.save(output)
    output.seek(0)
    
    return output


def generate_maintenance_excel(
    db: Session,
    department_id: Optional[str] = None,
    overdue: Optional[bool] = None
):
    """Generate Excel report for maintenance schedules"""
    if not EXCEL_AVAILABLE:
        raise HTTPException(status_code=500, detail="Excel generation not available. Install openpyxl.")
    
    wb = Workbook()
    ws = wb.active
    ws.title = "Maintenance Report"
    
    # Header styling
    header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
    header_font = Font(bold=True, color="FFFFFF")
    
    # Headers
    headers = ["Equipment", "Department", "Maintenance Type", "Frequency (days)", "Last Maintenance", "Next Maintenance", "Assigned To", "Status"]
    for col, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center")
    
    # Query maintenance schedules
    query = db.query(MaintenanceSchedule).join(Equipment)
    if department_id:
        query = query.filter(Equipment.department_id == department_id)
    if overdue:
        query = query.filter(MaintenanceSchedule.next_maintenance_date < datetime.utcnow())
    
    schedules_list = query.order_by(MaintenanceSchedule.next_maintenance_date).all()
    
    # Data rows
    for row, schedule in enumerate(schedules_list, 2):
        equipment_name = schedule.equipment.device_name if schedule.equipment else "N/A"
        dept_name = schedule.equipment.department.name if schedule.equipment and schedule.equipment.department else "N/A"
        assigned_to = schedule.assigned_to_user.full_name if schedule.assigned_to_user else "Unassigned"
        
        # Determine status
        if schedule.next_maintenance_date < datetime.utcnow():
            status = "Overdue"
        elif schedule.is_active:
            status = "Active"
        else:
            status = "Inactive"
        
        ws.cell(row=row, column=1, value=equipment_name)
        ws.cell(row=row, column=2, value=dept_name)
        ws.cell(row=row, column=3, value=schedule.maintenance_type)
        ws.cell(row=row, column=4, value=schedule.frequency_days)
        ws.cell(row=row, column=5, value=schedule.last_maintenance_date.strftime("%Y-%m-%d") if schedule.last_maintenance_date else "N/A")
        ws.cell(row=row, column=6, value=schedule.next_maintenance_date.strftime("%Y-%m-%d") if schedule.next_maintenance_date else "N/A")
        ws.cell(row=row, column=7, value=assigned_to)
        ws.cell(row=row, column=8, value=status)
    
    # Auto-adjust column widths
    for col in range(1, len(headers) + 1):
        ws.column_dimensions[chr(64 + col)].width = 20
    
    # Save to BytesIO
    output = BytesIO()
    wb.save(output)
    output.seek(0)
    
    return output


@router.get("/equipment/excel")
def download_equipment_report(
    department_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download equipment report as Excel file"""
    require_supervisor_or_above(current_user)
    
    output = generate_equipment_excel(db, department_id, status)
    
    filename = f"equipment_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/tickets/excel")
def download_tickets_report(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    department_id: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download tickets report as Excel file"""
    require_supervisor_or_above(current_user)
    
    # Parse dates if provided
    start_dt = datetime.fromisoformat(start_date) if start_date else None
    end_dt = datetime.fromisoformat(end_date) if end_date else None
    
    output = generate_tickets_excel(db, status, priority, department_id, start_dt, end_dt)
    
    filename = f"tickets_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/maintenance/excel")
def download_maintenance_report(
    department_id: Optional[str] = Query(None),
    overdue: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download maintenance report as Excel file"""
    require_supervisor_or_above(current_user)
    
    output = generate_maintenance_excel(db, department_id, overdue)
    
    filename = f"maintenance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
