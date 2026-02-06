from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .auth import get_db, get_current_user
from .models import Department, User
from .schemas import DepartmentCreate, DepartmentOut


router = APIRouter(prefix="/departments", tags=["departments"])


@router.get("/", response_model=List[DepartmentOut])
def list_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Department).all()


@router.post("/", response_model=DepartmentOut)
def create_department(
    payload: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Only super_admin can create departments
    from .permissions import require_super_admin
    require_super_admin(current_user)
    
    # Check if department with same name already exists
    existing = db.query(Department).filter(Department.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department with this name already exists")
    
    department = Department(**payload.dict())
    db.add(department)
    db.commit()
    db.refresh(department)
    return department


@router.get("/{department_id}", response_model=DepartmentOut)
def get_department(
    department_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    return department


@router.delete("/{department_id}")
def delete_department(
    department_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete department - only super_admin can do this"""
    from .permissions import require_super_admin
    require_super_admin(current_user)
    
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Delete the department
    db.delete(department)
    db.commit()
    
    return {"message": f"Department {department.name} has been deleted successfully"}
