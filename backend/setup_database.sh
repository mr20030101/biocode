#!/bin/bash

# Database Setup Script for Biocode
# This script guides you through the database setup process
# Compatible with macOS, Linux, and Git Bash on Windows

set -e  # Exit on error

echo "🏥 Biocode Database Setup"
echo "========================="
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found"
    echo ""
    echo "Please create a .env file with the following content:"
    echo "DATABASE_URL=mysql+pymysql://root:@localhost/biocode"
    echo "SECRET_KEY=your-secret-key-here"
    echo ""
    read -p "Press Enter after creating .env file, or Ctrl+C to exit..."
fi

# Detect Python command (python3 on macOS/Linux, python on Windows)
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ Error: Python not found. Please install Python 3.9+"
    exit 1
fi

echo "Using Python: $PYTHON_CMD"

# Check if virtual environment is activated
if [ -z "$VIRTUAL_ENV" ]; then
    echo "📦 Activating virtual environment..."
    
    # Try different activation paths
    if [ -f ".venv/bin/activate" ]; then
        source .venv/bin/activate
    elif [ -f ".venv/Scripts/activate" ]; then
        source .venv/Scripts/activate
    elif [ -f "venv/bin/activate" ]; then
        source venv/bin/activate
    elif [ -f "venv/Scripts/activate" ]; then
        source venv/Scripts/activate
    else
        echo "⚠️  Virtual environment not found. Creating one..."
        $PYTHON_CMD -m venv .venv
        
        if [ -f ".venv/bin/activate" ]; then
            source .venv/bin/activate
        elif [ -f ".venv/Scripts/activate" ]; then
            source .venv/Scripts/activate
        fi
        
        echo "📦 Installing dependencies..."
        pip install -r requirements.txt
    fi
fi

echo ""
echo "Choose setup option:"
echo "1) Full Reset (Drop all tables, run migrations, seed data) - Recommended"
echo "2) Run Migrations Only (Create/update tables)"
echo "3) Seed Data Only (Populate existing tables)"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo ""
        echo "🔄 Running full database reset..."
        $PYTHON_CMD reset_database.py
        ;;
    2)
        echo ""
        echo "📦 Running migrations..."
        $PYTHON_CMD -m alembic upgrade head
        echo "✅ Migrations completed"
        ;;
    3)
        echo ""
        echo "🌱 Seeding database..."
        $PYTHON_CMD seed_database.py
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✨ Setup complete!"
