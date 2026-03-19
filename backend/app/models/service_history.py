import uuid
from sqlalchemy import Column, String, ForeignKey, Date
from sqlalchemy.orm import relationship

from ..database import Base


class ServiceHistory(Base):
    __tablename__ = "service_history"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    equipment_id = Column(String, ForeignKey("equipment.id"))
    date = Column(Date)
    work_done = Column(String(255))
    engineer = Column(String(100))

    equipment = relationship("Equipment")
