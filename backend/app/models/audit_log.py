import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Text

from ..database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    action = Column(String(50))  # CREATE / UPDATE / DELETE
    entity = Column(String(50))  # service_history, equipment, etc.
    entity_id = Column(String(100))

    performed_by = Column(String(100))  # user id or name
    timestamp = Column(DateTime, default=datetime.utcnow)

    details = Column(Text)  # JSON string (before/after or notes)
