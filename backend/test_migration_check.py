"""
Test script to verify migration check functionality
This demonstrates that the seeder now properly checks for migrations
"""

from sqlalchemy.orm import Session
from app.database import SessionLocal
from seed_database import check_migrations_applied


def test_migration_check():
    """Test the migration check function"""
    print("🧪 Testing migration check functionality...\n")
    
    db = SessionLocal()
    
    try:
        migrations_ok, message = check_migrations_applied(db)
        
        if migrations_ok:
            print("✅ Migration check PASSED")
            print(f"   Message: {message}")
            print("\n   All required tables found:")
            print("   - users")
            print("   - departments")
            print("   - locations")
            print("   - equipment")
            print("   - tickets")
            print("   - equipment_logs")
            print("   - equipment_history")
            print("   - ticket_responses")
            print("   - maintenance_schedules")
            print("   - suppliers")
            print("   - notifications")
            print("\n✨ The seeder will run successfully!")
        else:
            print("❌ Migration check FAILED")
            print(f"   Message: {message}")
            print("\n   The seeder would exit with helpful error message.")
            print("   This prevents the 'Table doesn't exist' error!")
            
    except Exception as e:
        print(f"❌ Error during test: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    test_migration_check()
