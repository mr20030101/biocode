"""
Notification service for creating notifications on various events
"""
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session

from .models import Notification, User, Ticket, Equipment, MaintenanceSchedule, UserRole


def create_notification(
    db: Session,
    user_id: str,
    title: str,
    message: str,
    notification_type: str,
    related_entity_type: Optional[str] = None,
    related_entity_id: Optional[str] = None,
):
    """Create a single notification"""
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        related_entity_type=related_entity_type,
        related_entity_id=related_entity_id,
        is_read=False,
        created_at=datetime.utcnow(),
    )
    db.add(notification)
    return notification


def notify_ticket_created(db: Session, ticket: Ticket, creator: User):
    """Notify relevant users when a ticket is created"""
    notifications = []
    
    # Get all managers and support staff
    staff = db.query(User).filter(
        User.role.in_([UserRole.manager, UserRole.support, UserRole.department_head]),
        User.is_active == True,
        User.id != creator.id  # Don't notify the creator
    ).all()
    
    for user in staff:
        notification = create_notification(
            db=db,
            user_id=user.id,
            title="New Ticket Created",
            message=f"New ticket #{ticket.ticket_code}: {ticket.title or ticket.equipment_service}",
            notification_type="ticket_created",
            related_entity_type="ticket",
            related_entity_id=ticket.id,
        )
        notifications.append(notification)
    
    db.commit()
    return notifications


def notify_ticket_assigned(db: Session, ticket: Ticket, assigned_user: User, assigner: User):
    """Notify user when they are assigned to a ticket"""
    if assigned_user.id == assigner.id:
        return None  # Don't notify if self-assigned
    
    notification = create_notification(
        db=db,
        user_id=assigned_user.id,
        title="Ticket Assigned to You",
        message=f"You have been assigned to ticket #{ticket.ticket_code}: {ticket.title or ticket.equipment_service}",
        notification_type="ticket_assigned",
        related_entity_type="ticket",
        related_entity_id=ticket.id,
    )
    
    db.commit()
    return notification


def notify_ticket_status_changed(db: Session, ticket: Ticket, old_status: str, new_status: str, updater: User):
    """Notify relevant users when ticket status changes"""
    notifications = []
    
    # Notify the reporter
    if ticket.reported_by_user_id and ticket.reported_by_user_id != updater.id:
        notification = create_notification(
            db=db,
            user_id=ticket.reported_by_user_id,
            title="Ticket Status Updated",
            message=f"Ticket #{ticket.ticket_code} status changed from {old_status.replace('_', ' ').title()} to {new_status.replace('_', ' ').title()}",
            notification_type="ticket_status_changed",
            related_entity_type="ticket",
            related_entity_id=ticket.id,
        )
        notifications.append(notification)
    
    # Notify the assigned user if different from updater
    if ticket.assigned_to_user_id and ticket.assigned_to_user_id != updater.id:
        notification = create_notification(
            db=db,
            user_id=ticket.assigned_to_user_id,
            title="Ticket Status Updated",
            message=f"Ticket #{ticket.ticket_code} status changed to {new_status.replace('_', ' ').title()}",
            notification_type="ticket_status_changed",
            related_entity_type="ticket",
            related_entity_id=ticket.id,
        )
        notifications.append(notification)
    
    # If ticket is resolved or closed, notify all managers
    if new_status in ["resolved", "closed"]:
        managers = db.query(User).filter(
            User.role == UserRole.manager,
            User.is_active == True,
            User.id != updater.id
        ).all()
        
        for manager in managers:
            # Avoid duplicate if manager is already notified
            if manager.id not in [ticket.reported_by_user_id, ticket.assigned_to_user_id]:
                notification = create_notification(
                    db=db,
                    user_id=manager.id,
                    title=f"Ticket {new_status.title()}",
                    message=f"Ticket #{ticket.ticket_code} has been {new_status}",
                    notification_type="ticket_status_changed",
                    related_entity_type="ticket",
                    related_entity_id=ticket.id,
                )
                notifications.append(notification)
    
    db.commit()
    return notifications


def notify_equipment_status_changed(db: Session, equipment: Equipment, old_status: str, new_status: str, updater: User):
    """Notify relevant users when equipment status changes"""
    notifications = []
    
    # Get all users in the equipment's department
    if equipment.department_id:
        dept_users = db.query(User).filter(
            User.department_id == equipment.department_id,
            User.is_active == True,
            User.id != updater.id
        ).all()
        
        for user in dept_users:
            notification = create_notification(
                db=db,
                user_id=user.id,
                title="Equipment Status Changed",
                message=f"{equipment.device_name} ({equipment.asset_tag}) status changed to {new_status.replace('_', ' ').title()}",
                notification_type="equipment_status_changed",
                related_entity_type="equipment",
                related_entity_id=equipment.id,
            )
            notifications.append(notification)
    
    # Also notify all managers and support staff
    staff = db.query(User).filter(
        User.role.in_([UserRole.manager, UserRole.support, UserRole.department_head]),
        User.is_active == True,
        User.id != updater.id
    ).all()
    
    for user in staff:
        # Avoid duplicate if user is already in department
        if not equipment.department_id or user.department_id != equipment.department_id:
            notification = create_notification(
                db=db,
                user_id=user.id,
                title="Equipment Status Changed",
                message=f"{equipment.device_name} ({equipment.asset_tag}) status changed to {new_status.replace('_', ' ').title()}",
                notification_type="equipment_status_changed",
                related_entity_type="equipment",
                related_entity_id=equipment.id,
            )
            notifications.append(notification)
    
    db.commit()
    return notifications


def notify_maintenance_due(db: Session, schedule: MaintenanceSchedule):
    """Notify assigned user about upcoming maintenance"""
    if not schedule.assigned_to_user_id:
        return None
    
    # Get equipment details
    equipment = db.query(Equipment).filter(Equipment.id == schedule.equipment_id).first()
    if not equipment:
        return None
    
    days_until = (schedule.next_maintenance_date - datetime.utcnow()).days
    
    if days_until < 0:
        title = "Maintenance Overdue"
        message = f"{schedule.maintenance_type} for {equipment.device_name} is overdue by {abs(days_until)} days"
        notification_type = "maintenance_overdue"
    elif days_until <= 7:
        title = "Maintenance Due Soon"
        message = f"{schedule.maintenance_type} for {equipment.device_name} is due in {days_until} days"
        notification_type = "maintenance_due"
    else:
        return None  # Don't notify if more than 7 days away
    
    notification = create_notification(
        db=db,
        user_id=schedule.assigned_to_user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        related_entity_type="maintenance",
        related_entity_id=schedule.id,
    )
    
    db.commit()
    return notification


def notify_maintenance_completed(db: Session, schedule: MaintenanceSchedule, completer: User):
    """Notify managers when maintenance is completed"""
    notifications = []
    
    # Get equipment details
    equipment = db.query(Equipment).filter(Equipment.id == schedule.equipment_id).first()
    if not equipment:
        return notifications
    
    # Notify all managers
    managers = db.query(User).filter(
        User.role == UserRole.manager,
        User.is_active == True,
        User.id != completer.id
    ).all()
    
    for manager in managers:
        notification = create_notification(
            db=db,
            user_id=manager.id,
            title="Maintenance Completed",
            message=f"{schedule.maintenance_type} completed for {equipment.device_name}",
            notification_type="maintenance_completed",
            related_entity_type="maintenance",
            related_entity_id=schedule.id,
        )
        notifications.append(notification)
    
    db.commit()
    return notifications
