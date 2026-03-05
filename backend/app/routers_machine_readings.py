from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .auth import get_db
from .models import MachineHourReading, Equipment
from .schemas import MachineHourReadingCreate, MachineHourReadingOut

router = APIRouter(prefix="/machine-readings", tags=["Machine Hours"])


@router.post("/", response_model=MachineHourReadingOut)
def create_machine_reading(
    data: MachineHourReadingCreate,
    db: Session = Depends(get_db)
):

    equipment = db.get(Equipment, data.equipment_id)

    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    reading = MachineHourReading(
        equipment_id=data.equipment_id,
        reading_hours=data.reading_hours,
        reading_date=data.reading_date
    )

    db.add(reading)
    db.commit()
    db.refresh(reading)

    return reading


@router.get("/equipment/{equipment_id}", response_model=list[MachineHourReadingOut])
def get_machine_readings(
    equipment_id: str,
    db: Session = Depends(get_db)
):

    readings = db.query(MachineHourReading).filter(
        MachineHourReading.equipment_id == equipment_id
    ).order_by(MachineHourReading.reading_date.desc()).all()

    return readings
