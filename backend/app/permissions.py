"""
Role-based permission helpers

Role Hierarchy:
- super_admin: Full system access
- manager: Handles multiple departments, can manage most resources
- department_head: Manages single department
- support: Technical staff (Biomed Tech, Maintenance, IT, House Keeping)
- department_incharge: Department secretary, limited access
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


def require_manager_or_above(current_user: User):
    """Require manager or super_admin role"""
    if current_user.role not in [UserRole.super_admin, UserRole.manager]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager access required"
        )


def require_department_head_or_above(current_user: User):
    """Require department_head, manager, or super_admin role"""
    if current_user.role not in [UserRole.super_admin, UserRole.manager, UserRole.department_head]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Department head access required"
        )


def require_support_or_above(current_user: User):
    """Require support, department_head, manager, or super_admin role"""
    if current_user.role == UserRole.department_incharge:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Support access required"
        )


def is_manager_or_above(current_user: User) -> bool:
    """Check if user is manager or above"""
    return current_user.role in [UserRole.super_admin, UserRole.manager]


def is_department_head_or_above(current_user: User) -> bool:
    """Check if user is department head or above"""
    return current_user.role in [UserRole.super_admin, UserRole.manager, UserRole.department_head]


def is_support_or_above(current_user: User) -> bool:
    """Check if user is support or above (not department_incharge)"""
    return current_user.role != UserRole.department_incharge


def can_resolve_or_close_ticket(current_user: User) -> bool:
    """Check if user can resolve or close tickets (not department_incharge)"""
    return current_user.role != UserRole.department_incharge


def can_close_ticket(current_user: User) -> bool:
    """Check if user can close tickets (manager and super_admin)"""
    return current_user.role in [UserRole.super_admin, UserRole.manager]


def can_update_equipment_status(current_user: User) -> bool:
    """Check if user can update equipment status (department_head, manager, super_admin)"""
    return current_user.role in [UserRole.super_admin, UserRole.manager, UserRole.department_head]


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
    """Check if user can view departments (not department_incharge)"""
    return current_user.role != UserRole.department_incharge


def can_assign_tickets(current_user: User) -> bool:
    """Check if user can assign tickets (manager and super_admin)"""
    return current_user.role in [UserRole.super_admin, UserRole.manager]


def can_view_all_tickets(current_user: User) -> bool:
    """Check if user can view all tickets (manager and super_admin)"""
    return current_user.role in [UserRole.super_admin, UserRole.manager]


def can_create_equipment(current_user: User) -> bool:
    """Check if user can create equipment (department_head, manager, super_admin)"""
    return current_user.role in [UserRole.super_admin, UserRole.manager, UserRole.department_head]


def can_view_equipment(current_user: User) -> bool:
    """Check if user can view equipment (not department_incharge)"""
    return current_user.role != UserRole.department_incharge


def is_supervisor_or_above(current_user: User) -> bool:
    """Legacy compatibility - maps to manager_or_above"""
    return is_manager_or_above(current_user)
