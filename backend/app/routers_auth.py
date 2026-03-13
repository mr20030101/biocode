from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from . import auth
from .auth import get_db, get_current_user, create_access_token, hash_password, authenticate_user
from .models import User, UserRole
from .schemas import Token, UserCreate, UserOut, UserUpdate
from .permissions import require_super_admin


router = APIRouter(prefix="/auth", tags=["auth"])


# =========================================================
# REGISTER USER
# =========================================================
@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserCreate, db: Session = Depends(get_db)):

    existing = auth.get_user_by_email(db, email=payload.email)

    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        role=payload.role,
        is_active=True,
        password_hash=hash_password(payload.password),
        department_id=payload.department_id
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


# =========================================================
# LOGIN
# =========================================================
@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):

    user = authenticate_user(
        db, email=form_data.username, password=form_data.password)

    if not user:
        raise HTTPException(
            status_code=400,
            detail="Incorrect email or password"
        )

    token = create_access_token({"sub": user.id})

    return Token(access_token=token)


# =========================================================
# CURRENT USER
# =========================================================
@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user


# =========================================================
# LIST USERS
# =========================================================
@router.get("/users")
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    if current_user.role == UserRole.super_admin:
        query = db.query(User)
    else:
        query = db.query(User).filter(User.is_active == True)

    total = query.count()

    offset = (page - 1) * page_size

    users = query.order_by(User.full_name).offset(
        offset).limit(page_size).all()

    items = []

    for user in users:
        items.append({
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value,
            "is_active": user.is_active,
            "department_id": user.department_id
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


# =========================================================
# UPDATE USER
# =========================================================
@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: str,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    require_super_admin(current_user)

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.email is not None:

        existing = db.query(User).filter(
            User.email == payload.email,
            User.id != user_id
        ).first()

        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")

        user.email = payload.email

    if payload.full_name is not None:
        user.full_name = payload.full_name

    if payload.role is not None:
        user.role = payload.role

    if payload.is_active is not None:
        user.is_active = payload.is_active

    if payload.department_id is not None:
        user.department_id = payload.department_id

    db.commit()
    db.refresh(user)

    return user


# =========================================================
# DELETE USER
# =========================================================
@router.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    require_super_admin(current_user)

    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account"
        )

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()

    return {
        "message": f"User {user.full_name} deleted successfully"
    }
