from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .auth import get_db, get_current_user
from .models import Ticket, Equipment, User, TicketStatus, UserRole
from .schemas import TicketCreate, TicketOut, TicketUpdate
from .permissions import (
    can_view_all_tickets,
    can_close_ticket,
    can_resolve_or_close_ticket
)
from . import notification_service

router = APIRouter(prefix="/tickets", tags=["tickets"])


# =========================================================
# LIST TICKETS
# =========================================================
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

    # Role filtering
    if current_user.role == UserRole.support:
        query = query.filter(
            (Ticket.assigned_to_user_id == current_user.id) |
            (Ticket.assigned_to_user_id.is_(None))
        )

    elif current_user.role == UserRole.department_incharge:
        query = query.filter(Ticket.reported_by_user_id == current_user.id)

    if status:
        query = query.filter(Ticket.status == status)

    if priority:
        query = query.filter(Ticket.priority == priority)

    if assigned_to_user_id:
        query = query.filter(Ticket.assigned_to_user_id == assigned_to_user_id)

    if department_id:
        query = query.filter(Ticket.department_id == department_id)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Ticket.title.ilike(search_term)) |
            (Ticket.ticket_code.ilike(search_term)) |
            (Ticket.description.ilike(search_term))
        )

    total = query.count()

    offset = (page - 1) * page_size

    tickets_list = query.order_by(Ticket.created_at.desc()) \
        .offset(offset) \
        .limit(page_size) \
        .all()

    items = []

    for ticket in tickets_list:
        items.append({
            "id": ticket.id,
            "ticket_code": ticket.ticket_code,
            "equipment_id": ticket.equipment_id,
            "title": ticket.title,
            "description": ticket.description,
            "status": ticket.status.value if ticket.status else None,
            "priority": ticket.priority,
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


# =========================================================
# CREATE TICKET
# =========================================================
@router.post("/", response_model=TicketOut)
def create_ticket(
    payload: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    equipment = db.query(Equipment).filter(
        Equipment.id == payload.equipment_id
    ).first()

    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    import random
    import string

    ticket_code = ''.join(random.choices(
        string.ascii_uppercase + string.digits, k=8))

    ticket = Ticket(
        ticket_code=ticket_code,
        equipment_id=payload.equipment_id,
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        reported_by_user_id=current_user.id,

        # legacy fields
        from_department=equipment.department.name if equipment.department else "Unknown",
        equipment_service=equipment.equipment_name,
        serial_number=equipment.serial_number,
        concern=payload.description or payload.title,
        reported_by=current_user.full_name,

        status=TicketStatus.open,
    )

    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    notification_service.notify_ticket_created(
        db,
        ticket,
        current_user
    )

    return ticket


# =========================================================
# GET TICKET
# =========================================================
@router.get("/{ticket_id}", response_model=TicketOut)
def get_ticket(
    ticket_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    ticket = db.query(Ticket).filter(
        Ticket.id == ticket_id
    ).first()

    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role == UserRole.support and \
            ticket.assigned_to_user_id not in [None, current_user.id]:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view this ticket"
        )

    return ticket


# =========================================================
# UPDATE TICKET
# =========================================================
@router.patch("/{ticket_id}", response_model=TicketOut)
def update_ticket(
    ticket_id: str,
    payload: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    ticket = db.query(Ticket).filter(
        Ticket.id == ticket_id
    ).first()

    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    old_status = ticket.status
    old_assigned_to = ticket.assigned_to_user_id

    update_data = payload.model_dump(exclude_unset=True)

    if "status" in update_data:
        new_status = update_data["status"]

        if new_status in [TicketStatus.resolved, TicketStatus.closed]:
            if not can_resolve_or_close_ticket(current_user):
                raise HTTPException(
                    status_code=403,
                    detail="Viewers cannot resolve or close tickets"
                )

        if new_status == TicketStatus.closed:
            if not can_close_ticket(current_user):
                raise HTTPException(
                    status_code=403,
                    detail="Only supervisors can close tickets"
                )

    for field, value in update_data.items():
        setattr(ticket, field, value)

    new_status = ticket.status

    if old_status != new_status and new_status in [
        TicketStatus.resolved,
        TicketStatus.closed
    ]:

        if ticket.equipment_id:
            equipment = db.query(Equipment).filter(
                Equipment.id == ticket.equipment_id
            ).first()

            if equipment:
                equipment.repair_count += 1

    db.commit()
    db.refresh(ticket)

    if old_status != ticket.status:
        notification_service.notify_ticket_status_changed(
            db,
            ticket,
            old_status.value,
            ticket.status.value,
            current_user
        )

    if "assigned_to_user_id" in update_data and ticket.assigned_to_user_id:
        if old_assigned_to != ticket.assigned_to_user_id:
            assigned_user = db.query(User).filter(
                User.id == ticket.assigned_to_user_id
            ).first()

            if assigned_user:
                notification_service.notify_ticket_assigned(
                    db,
                    ticket,
                    assigned_user,
                    current_user
                )

    return ticket
