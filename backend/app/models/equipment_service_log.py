import uuid
from sqlalchemy import Column, String, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class EquipmentServiceLog(Base):
    __tablename__ = "equipment_service_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    equipment_id = Column(String, ForeignKey("equipment.id"), nullable=False)

    date_of_service = Column(Date, nullable=False)
    work_done = Column(String, nullable=False)
    assigned_engineer = Column(String, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
