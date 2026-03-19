import json
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def log_action(
    db: Session,
    action: str,
    entity: str,
    entity_id: str,
    user_id: str,
    details: dict = None,
):
    log = AuditLog(
        action=action,
        entity=entity,
        entity_id=entity_id,
        performed_by=user_id,
        details=json.dumps(details) if details else None,
    )

    db.add(log)
    db.commit()
