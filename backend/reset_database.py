"""
Reset database script - drops all tables, recreates schema, and seeds data
"""

import sys
import subprocess
from sqlalchemy import text

from app.database import engine
from app.models import Base


def reset_database():
    """Drop all tables and recreate from scratch"""
    print("🔄 Resetting database...")
    
    try:
        # Drop all tables including alembic_version
        print("🗑️  Dropping all tables...")
        with engine.connect() as conn:
            # Drop alembic_version table first
            conn.execute(text("DROP TABLE IF EXISTS alembic_version"))
            conn.commit()
        
        Base.metadata.drop_all(bind=engine)
        print("✅ All tables dropped")
        
        # Run Alembic migrations to create tables
        print("\n📦 Running Alembic migrations...")
        result = subprocess.run(
            ["python", "-m", "alembic", "upgrade", "head"],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            print(f"❌ Migration failed: {result.stderr}")
            sys.exit(1)
        
        print("✅ Migrations completed successfully")
        
        # Run seeder
        print("\n🌱 Running database seeder...")
        result = subprocess.run(
            ["python", "seed_database.py"],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            print(f"❌ Seeding failed: {result.stderr}")
            sys.exit(1)
        
        # Print seeder output
        print(result.stdout)
        
        print("\n✨ Database reset completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error during database reset: {e}")
        sys.exit(1)


if __name__ == "__main__":
    reset_database()
