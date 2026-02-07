"""
Role-based permission helpers
"""

from fastapi import HTTPException, status
from .models import User, UserRole


def require_super_admin(current_user: User):
    """Require super_admin role"""
    if current_user.role != UserRole.super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )


def require_supervisor_or_above(current_user: User):
    """Require supervisor or super_admin role"""
    if current_user.role not in [UserRole.super_admin, UserRole.supervisor]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Supervisor access required"
        )


def require_tech_or_above(current_user: User):
    """Require tech, supervisor, or super_admin role"""
    if current_user.role == UserRole.viewer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tech access required"
        )


def can_resolve_or_close_ticket(current_user: User) -> bool:
    """Check if user can resolve or close tickets (not viewer)"""
    return current_user.role != UserRole.viewer


def can_close_ticket(current_user: User) -> bool:
    """Check if user can close tickets (only supervisor and super_admin)"""
    return current_user.role in [UserRole.super_admin, UserRole.supervisor]


def can_update_equipment_status(current_user: User) -> bool:
    """Check if user can update equipment status (supervisor and super_admin)"""
    return current_user.role in [UserRole.super_admin, UserRole.supervisor]


def can_delete_equipment(current_user: User) -> bool:
    """Check if user can delete equipment (only super_admin)"""
    return current_user.role == UserRole.super_admin


def can_manage_users(current_user: User) -> bool:
    """Check if user can manage users (only super_admin)"""
    return current_user.role == UserRole.super_admin


def can_manage_departments(current_user: User) -> bool:
    """Check if user can manage departments (only super_admin)"""
    return current_user.role == UserRole.super_admin


def can_view_departments(current_user: User) -> bool:
    """Check if user can view departments (not viewer)"""
    return current_user.role != UserRole.viewer


def can_assign_tickets(current_user: User) -> bool:
    """Check if user can assign tickets (supervisor and super_admin)"""
    return current_user.role in [UserRole.super_admin, UserRole.supervisor]


def can_view_all_tickets(current_user: User) -> bool:
    """Check if user can view all tickets (not just assigned or created by them)"""
    return current_user.role in [UserRole.super_admin, UserRole.supervisor]


def can_create_equipment(current_user: User) -> bool:
    """Check if user can create equipment"""
    return current_user.role in [UserRole.super_admin, UserRole.supervisor]


def can_view_equipment(current_user: User) -> bool:
    """Check if user can view equipment (not viewer)"""
    return current_user.role != UserRole.viewer
