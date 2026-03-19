from sqlalchemy import Column, String
from sqlalchemy.orm import relationship

from ..database import Base


class Location(Base):
    __tablename__ = "locations"

    id = Column(String, primary_key=True, index=True)

    name = Column(String, nullable=False)

    equipment = relationship(
        "Equipment",
        back_populates="location",
        cascade="all, delete"
    )
