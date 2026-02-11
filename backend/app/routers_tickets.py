from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .auth import get_db, get_current_user
from .models import Ticket, Equipment, User, TicketStatus, UserRole
from .schemas import TicketCreate, TicketOut, TicketUpdate
from .permissions import (
    can_view_all_tickets,
    can_close_ticket,
    can_resolve_or_close_ticket,
    require_support_or_above
)
from . import notification_service


router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.get("/", response_model=dict)
def list_tickets(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to_user_id: Optional[str] = None,
    department_id: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Ticket)
    
    # Role-based filtering:
    # - Support only see assigned tickets
    # - Department Incharge only see tickets they created
    if current_user.role == UserRole.support:
        query = query.filter(Ticket.assigned_to_user_id == current_user.id)
    elif current_user.role == UserRole.department_incharge:
        query = query.filter(Ticket.reported_by_user_id == current_user.id)
    
    # Filter by status
    if status:
        query = query.filter(Ticket.status == status)
    
    # Filter by priority
    if priority:
        query = query.filter(Ticket.priority == priority)
    
    # Filter by assigned user
    if assigned_to_user_id:
        query = query.filter(Ticket.assigned_to_user_id == assigned_to_user_id)
    
    # Filter by department
    if department_id:
        query = query.filter(Ticket.department_id == department_id)
    
    # Search by title, ticket code, or description
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Ticket.title.ilike(search_term)) |
            (Ticket.ticket_code.ilike(search_term)) |
            (Ticket.description.ilike(search_term))
        )
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * page_size
    tickets_list = query.order_by(Ticket.created_at.desc()).offset(offset).limit(page_size).all()
    
    # Convert to dict manually to avoid serialization issues
    items = []
    for ticket in tickets_list:
        items.append({
            "id": ticket.id,
            "ticket_code": ticket.ticket_code,
            "equipment_id": ticket.equipment_id,
            "title": ticket.title,
            "description": ticket.description,
            "status": ticket.status.value,
            "priority": ticket.priority,  # priority is already a string
            "reported_by_user_id": ticket.reported_by_user_id,
            "assigned_to_user_id": ticket.assigned_to_user_id,
            "department_id": ticket.department_id,
            "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
            "updated_at": ticket.updated_at.isoformat() if ticket.updated_at else None,
        })
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.post("/", response_model=TicketOut)
def create_ticket(
    payload: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # All authenticated users can create tickets (including viewers)
    
    # Verify equipment exists
    equipment = db.query(Equipment).filter(Equipment.id == payload.equipment_id).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    # Generate ticket code
    import random
    import string
    ticket_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    
    # Create ticket with both old and new fields for compatibility
    ticket = Ticket(
        ticket_code=ticket_code,
        equipment_id=payload.equipment_id,
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        reported_by_user_id=current_user.id,
        # Legacy fields for CLI compatibility
        from_department=equipment.department.name if equipment.department else "Unknown",
        equipment_service=equipment.device_name,
        serial_number=equipment.serial_number,
        concern=payload.description or payload.title,
        reported_by=current_user.full_name,
        status=TicketStatus.open,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    
    # Send notifications to IT staff
    notification_service.notify_ticket_created(db, ticket, current_user)
    
    return ticket


@router.get("/{ticket_id}", response_model=TicketOut)
def get_ticket(
    ticket_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.patch("/{ticket_id}", response_model=TicketOut)
def update_ticket(
    ticket_id: str,
    payload: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Track old values for notifications
    old_status = ticket.status
    old_assigned_to = ticket.assigned_to_user_id
    
    update_data = payload.dict(exclude_unset=True)
    
    # Check if trying to resolve or close ticket
    if "status" in update_data:
        new_status = update_data["status"]
        
        # Viewers cannot resolve or close tickets
        if new_status in [TicketStatus.resolved, TicketStatus.closed]:
            if not can_resolve_or_close_ticket(current_user):
                raise HTTPException(
                    status_code=403,
                    detail="Viewers cannot resolve or close tickets"
                )
        
        # Only supervisors can close tickets
        if new_status == TicketStatus.closed:
            if not can_close_ticket(current_user):
                raise HTTPException(
                    status_code=403,
                    detail="Only supervisors can close tickets"
                )
    
    # Apply updates
    for field, value in update_data.items():
        setattr(ticket, field, value)
    
    # Increment repair_count when ticket is marked as resolved or closed
    new_status = ticket.status
    if old_status != new_status and new_status in [TicketStatus.resolved, TicketStatus.closed]:
        if ticket.equipment_id:
            equipment = db.query(Equipment).filter(Equipment.id == ticket.equipment_id).first()
            if equipment:
                equipment.repair_count += 1
    
    db.commit()
    db.refresh(ticket)
    
    # Send notifications
    # Notify if status changed
    if old_status != ticket.status:
        notification_service.notify_ticket_status_changed(
            db, ticket, old_status.value, ticket.status.value, current_user
        )
    
    # Notify if assigned to someone
    if "assigned_to_user_id" in update_data and ticket.assigned_to_user_id:
        if old_assigned_to != ticket.assigned_to_user_id:
            assigned_user = db.query(User).filter(User.id == ticket.assigned_to_user_id).first()
            if assigned_user:
                notification_service.notify_ticket_assigned(db, ticket, assigned_user, current_user)
    
    return ticket
