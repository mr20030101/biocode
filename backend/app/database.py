import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


def get_database_url() -> str:
    # Prefer env var so Alembic + app stay consistent.
    return os.getenv("DATABASE_URL", "sqlite:///./biocode.db")


def create_db_engine():
    url = get_database_url()
    connect_args = {}
    if url.startswith("sqlite:"):
        # Needed for SQLite when used in multi-threaded servers.
        connect_args = {"check_same_thread": False}
    return create_engine(url, future=True, connect_args=connect_args)


engine = create_db_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

