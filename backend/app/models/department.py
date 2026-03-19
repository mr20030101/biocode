from sqlalchemy import Column, String
from sqlalchemy.orm import relationship

from ..database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(String, primary_key=True, index=True)

    name = Column(String, unique=True, nullable=False)

    # Department has many equipment
    equipment = relationship(
        "Equipment",
        back_populates="department",
        cascade="all, delete"
    )

    # Department has many users
    users = relationship(
        "User",
        back_populates="department",
        cascade="all, delete"
    )
