from .models import User
from .database import SessionLocal
from . import config

from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt

from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi import Depends, HTTPException, status

from typing import Optional
from datetime import datetime


# =========================================================
# PASSWORD SAFETY
# =========================================================

def _bcrypt_safe(password: str) -> str:
    if password is None:
        raise ValueError("Password is None")

    password = str(password).strip()

    # Enforce bcrypt max length safely (72 bytes)
    if len(password.encode("utf-8")) > 72:
        password = password.encode(
            "utf-8")[:72].decode("utf-8", errors="ignore")

    return password


pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# Swagger + FastAPI OAuth config
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# =========================================================
# DATABASE
# =========================================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =========================================================
# PASSWORD FUNCTIONS
# =========================================================

def hash_password(password: str) -> str:
    return pwd_context.hash(_bcrypt_safe(password))


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(_bcrypt_safe(plain_password), hashed_password)


# =========================================================
# TOKEN CREATION
# =========================================================

def create_access_token(data: dict) -> str:
    to_encode = data.copy()

    expire = datetime.utcnow() + config.get_access_token_expires()

    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        config.SECRET_KEY,
        algorithm=config.ALGORITHM
    )


# =========================================================
# USER FUNCTIONS
# =========================================================

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:

    user = get_user_by_email(db, email=email)

    if not user:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user


# =========================================================
# LOGIN ENDPOINT FOR SWAGGER (OAUTH2)
# =========================================================

def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    # OAuth uses "username" field — we treat it as email
    user = authenticate_user(db, form_data.username, form_data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token({"sub": user.id})

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# =========================================================
# CURRENT USER (JWT VALIDATION)
# =========================================================

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:

        payload = jwt.decode(
            token,
            config.SECRET_KEY,
            algorithms=[config.ALGORITHM]
        )

        sub: Optional[str] = payload.get("sub")

        if sub is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == sub).first()

    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    return user
