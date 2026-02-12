#!/bin/bash

# Database Setup Script for Biocode
# This script guides you through the database setup process

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

# Check if virtual environment is activated
if [ -z "$VIRTUAL_ENV" ]; then
    echo "📦 Activating virtual environment..."
    source .venv/bin/activate
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
        python reset_database.py
        ;;
    2)
        echo ""
        echo "📦 Running migrations..."
        python -m alembic upgrade head
        echo "✅ Migrations completed"
        ;;
    3)
        echo ""
        echo "🌱 Seeding database..."
        python seed_database.py
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✨ Setup complete!"
