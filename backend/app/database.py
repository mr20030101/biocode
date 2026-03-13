from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.base import Base

# Import models so SQLAlchemy registers them
# from app.models import user
# from app.models import department
# from app.models import equipment
# from app.models import location


DATABASE_URL = "mysql+pymysql://root:@localhost/biocode"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
