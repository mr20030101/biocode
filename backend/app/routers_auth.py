from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timedelta

from . import auth
from .auth import get_db, get_current_user, create_access_token, hash_password, authenticate_user
from .models import User, UserRole, Ticket, TicketStatus
from .schemas import Token, UserCreate, UserOut, UserUpdate
from .permissions import require_super_admin


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserCreate, db: Session = Depends(get_db)):
    existing = auth.get_user_by_email(db, email=payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        role=payload.role,
        is_active=True,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = authenticate_user(db, email=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    token = create_access_token({"sub": user.id})
    return Token(access_token=token)


@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/users", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all users - returns all users for super_admin, only active for others"""
    if current_user.role == UserRole.super_admin:
        # Super admin can see all users including inactive
        return db.query(User).all()
    else:
        # Others only see active users (for ticket assignment)
        return db.query(User).filter(User.is_active == True).all()


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: str,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update user - only super_admin can do this"""
    require_super_admin(current_user)
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields if provided
    if payload.email is not None:
        # Check if email is already taken by another user
        existing = db.query(User).filter(
            User.email == payload.email,
            User.id != user_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = payload.email
    
    if payload.full_name is not None:
        user.full_name = payload.full_name
    
    if payload.role is not None:
        user.role = payload.role
    
    if payload.is_active is not None:
        user.is_active = payload.is_active
    
    db.commit()
    db.refresh(user)
    return user


@router.get("/users/{user_id}/stats")
def get_user_stats(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get user statistics - super_admin can access any user, techs can access their own"""
    # Allow super_admin to access any user, or users to access their own stats
    if current_user.role != UserRole.super_admin and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your own statistics"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get current date info
    now = datetime.now()
    current_year = now.year
    current_month = now.month
    
    # Total tickets assigned
    total_assigned = db.query(Ticket).filter(
        Ticket.assigned_to_user_id == user_id
    ).count()
    
    # Tickets resolved (not closed, just resolved)
    total_resolved = db.query(Ticket).filter(
        Ticket.assigned_to_user_id == user_id,
        Ticket.status == TicketStatus.resolved
    ).count()
    
    # Tickets closed
    total_closed = db.query(Ticket).filter(
        Ticket.assigned_to_user_id == user_id,
        Ticket.status == TicketStatus.closed
    ).count()
    
    # Tickets in progress
    in_progress = db.query(Ticket).filter(
        Ticket.assigned_to_user_id == user_id,
        Ticket.status == TicketStatus.in_progress
    ).count()
    
    # Open tickets
    open_tickets = db.query(Ticket).filter(
        Ticket.assigned_to_user_id == user_id,
        Ticket.status == TicketStatus.open
    ).count()
    
    # Monthly statistics for the last 12 months
    monthly_stats = []
    for i in range(11, -1, -1):  # Last 12 months
        target_date = now - timedelta(days=30 * i)
        target_year = target_date.year
        target_month = target_date.month
        
        # Count resolved tickets in this month
        resolved_count = db.query(Ticket).filter(
            Ticket.assigned_to_user_id == user_id,
            Ticket.status.in_([TicketStatus.resolved, TicketStatus.closed]),
            extract('year', Ticket.updated_at) == target_year,
            extract('month', Ticket.updated_at) == target_month
        ).count()
        
        # Count assigned tickets in this month
        assigned_count = db.query(Ticket).filter(
            Ticket.assigned_to_user_id == user_id,
            extract('year', Ticket.created_at) == target_year,
            extract('month', Ticket.created_at) == target_month
        ).count()
        
        monthly_stats.append({
            "month": target_date.strftime("%B"),
            "year": target_year,
            "resolved": resolved_count,
            "assigned": assigned_count
        })
    
    return {
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role.value,
            "is_active": user.is_active
        },
        "summary": {
            "total_assigned": total_assigned,
            "total_resolved": total_resolved,
            "total_closed": total_closed,
            "in_progress": in_progress,
            "open": open_tickets,
            "completion_rate": round((total_resolved + total_closed) / total_assigned * 100, 1) if total_assigned > 0 else 0
        },
        "monthly_stats": monthly_stats
    }


@router.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete user - only super_admin can do this"""
    require_super_admin(current_user)
    
    # Prevent deleting yourself
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete the user
    db.delete(user)
    db.commit()
    
    return {"message": f"User {user.full_name} has been deleted successfully"}
