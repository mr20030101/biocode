"""
Cross-platform database setup script for Biocode
Works on Windows, macOS, and Linux
"""

import sys
import os
import subprocess
from pathlib import Path


def check_env_file():
    """Check if .env file exists"""
    env_file = Path(".env")
    if not env_file.exists():
        print("⚠️  Warning: .env file not found")
        print("")
        print("Please create a .env file with the following content:")
        print("DATABASE_URL=mysql+pymysql://root:@localhost/biocode")
        print("SECRET_KEY=your-secret-key-here")
        print("")
        input("Press Enter after creating .env file, or Ctrl+C to exit...")


def get_python_command():
    """Get the appropriate Python command for the system"""
    # Check if we're already in a virtual environment
    if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        return sys.executable
    
    # Try python3 first (macOS/Linux), then python (Windows)
    for cmd in ['python3', 'python']:
        try:
            result = subprocess.run([cmd, '--version'], 
                                  capture_output=True, 
                                  text=True, 
                                  timeout=5)
            if result.returncode == 0:
                return cmd
        except (subprocess.TimeoutExpired, FileNotFoundError):
            continue
    
    return sys.executable


def run_command(command, description):
    """Run a command and handle errors"""
    print(f"\n{description}...")
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        
        if result.returncode != 0:
            print(f"❌ Error: {result.stderr}")
            return False
        
        if result.stdout:
            print(result.stdout)
        
        return True
    except subprocess.TimeoutExpired:
        print("❌ Command timed out")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def full_reset():
    """Full database reset"""
    python_cmd = get_python_command()
    print("\n🔄 Running full database reset...")
    
    if not run_command(f"{python_cmd} reset_database.py", "Resetting database"):
        sys.exit(1)
    
    print("✅ Full reset completed")


def run_migrations():
    """Run migrations only"""
    python_cmd = get_python_command()
    print("\n📦 Running migrations...")
    
    if not run_command(f"{python_cmd} -m alembic upgrade head", "Applying migrations"):
        sys.exit(1)
    
    print("✅ Migrations completed")


def seed_database():
    """Seed database only"""
    python_cmd = get_python_command()
    print("\n🌱 Seeding database...")
    
    if not run_command(f"{python_cmd} seed_database.py", "Seeding data"):
        sys.exit(1)
    
    print("✅ Seeding completed")


def main():
    """Main setup function"""
    print("🏥 Biocode Database Setup")
    print("=" * 50)
    print("")
    
    # Check for .env file
    check_env_file()
    
    # Show menu
    print("\nChoose setup option:")
    print("1) Full Reset (Drop all tables, run migrations, seed data) - Recommended")
    print("2) Run Migrations Only (Create/update tables)")
    print("3) Seed Data Only (Populate existing tables)")
    print("")
    
    try:
        choice = input("Enter choice [1-3]: ").strip()
    except KeyboardInterrupt:
        print("\n\n❌ Setup cancelled")
        sys.exit(0)
    
    if choice == "1":
        full_reset()
    elif choice == "2":
        run_migrations()
    elif choice == "3":
        seed_database()
    else:
        print("❌ Invalid choice")
        sys.exit(1)
    
    print("\n✨ Setup complete!")


if __name__ == "__main__":
    main()
