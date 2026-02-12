"""
Suppliers API endpoints
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_db, get_current_user
from app.models import Supplier, User
from app.schemas import SupplierCreate, SupplierOut
from app.permissions import can_create_equipment

router = APIRouter(prefix="/suppliers", tags=["suppliers"])


@router.get("/", response_model=List[SupplierOut])
def get_suppliers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all suppliers - accessible to all authenticated users"""
    suppliers = db.query(Supplier).order_by(Supplier.name).all()
    return suppliers


@router.get("/{supplier_id}", response_model=SupplierOut)
def get_supplier(
    supplier_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific supplier by ID"""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


@router.post("/", response_model=SupplierOut)
def create_supplier(
    supplier: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new supplier - requires manager or above"""
    # Check permissions
    if not can_create_equipment(current_user):
        raise HTTPException(status_code=403, detail="Manager access required")
    
    # Check if supplier with same name already exists
    existing = db.query(Supplier).filter(Supplier.name == supplier.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Supplier with this name already exists")
    
    # Check if code is provided and unique
    if supplier.code:
        existing_code = db.query(Supplier).filter(Supplier.code == supplier.code).first()
        if existing_code:
            raise HTTPException(status_code=400, detail="Supplier with this code already exists")
    
    db_supplier = Supplier(**supplier.model_dump())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


@router.patch("/{supplier_id}", response_model=SupplierOut)
def update_supplier(
    supplier_id: str,
    supplier: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a supplier - requires manager or above"""
    # Check permissions
    if not can_create_equipment(current_user):
        raise HTTPException(status_code=403, detail="Manager access required")
    
    db_supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    # Check if new name conflicts with existing supplier
    if supplier.name != db_supplier.name:
        existing = db.query(Supplier).filter(
            Supplier.name == supplier.name,
            Supplier.id != supplier_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Supplier with this name already exists")
    
    # Check if new code conflicts with existing supplier
    if supplier.code and supplier.code != db_supplier.code:
        existing_code = db.query(Supplier).filter(
            Supplier.code == supplier.code,
            Supplier.id != supplier_id
        ).first()
        if existing_code:
            raise HTTPException(status_code=400, detail="Supplier with this code already exists")
    
    # Update fields
    for key, value in supplier.model_dump().items():
        setattr(db_supplier, key, value)
    
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


@router.delete("/{supplier_id}")
def delete_supplier(
    supplier_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a supplier - requires manager or above"""
    # Check permissions
    if not can_create_equipment(current_user):
        raise HTTPException(status_code=403, detail="Manager access required")
    
    db_supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    # Check if supplier is used by any equipment
    from app.models import Equipment
    equipment_count = db.query(Equipment).filter(Equipment.supplier_id == supplier_id).count()
    if equipment_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete supplier. {equipment_count} equipment item(s) are associated with this supplier."
        )
    
    db.delete(db_supplier)
    db.commit()
    return {"message": "Supplier deleted successfully"}
