"""
Notification service for creating notifications on various events
"""

from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session

from .models import Notification, User, Equipment, UserRole


# =========================================================
# CREATE NOTIFICATION
# =========================================================

def create_notification(
    db: Session,
    user_id: str,
    message: str,
):
    """Create a simple notification"""

    notification = Notification(
        user_id=user_id,
        message=message,
        is_read=False,
        created_at=datetime.utcnow(),
    )

    db.add(notification)
    return notification


# =========================================================
# EQUIPMENT STATUS NOTIFICATION
# =========================================================

def notify_equipment_status_changed(
    db: Session,
    equipment: Equipment,
    old_status: str,
    new_status: str,
    updater: User
):
    """
    Notify relevant users when equipment status changes
    """

    notifications = []

    message = (
        f"{equipment.equipment_name} "
        f"({equipment.asset_tag}) status changed "
        f"from {old_status.replace('_', ' ').title()} "
        f"to {new_status.replace('_', ' ').title()}"
    )

    # Notify department users
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
                message=message,
            )

            notifications.append(notification)

    # Notify managers and support staff
    staff = db.query(User).filter(
        User.role.in_([
            UserRole.manager,
            UserRole.support,
            UserRole.department_head
        ]),
        User.is_active == True,
        User.id != updater.id
    ).all()

    for user in staff:

        notification = create_notification(
            db=db,
            user_id=user.id,
            message=message,
        )

        notifications.append(notification)

    db.commit()

    return notifications
