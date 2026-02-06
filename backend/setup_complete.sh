#!/bin/bash

# Biocode Complete Setup Script
# This script sets up the database, runs migrations, and seeds data

set -e  # Exit on error

echo "========================================="
echo "Biocode Database Setup"
echo "========================================="
echo ""

# Check if MySQL is running
echo "Checking MySQL connection..."
if ! mysql -u root -e "SELECT 1" > /dev/null 2>&1; then
    echo "Error: Cannot connect to MySQL. Please ensure MySQL is running."
    echo "Try: mysql -u root -p"
    exit 1
fi
echo "✓ MySQL connection successful"
echo ""

# Create database
echo "Creating database 'biocode'..."
mysql -u root -e "CREATE DATABASE IF NOT EXISTS biocode CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true
echo "✓ Database created"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOF
DATABASE_URL=mysql+pymysql://root:@localhost/biocode
SECRET_KEY=$(python -c 'import secrets; print(secrets.token_urlsafe(32))')
EOF
    echo "✓ .env file created"
else
    echo "✓ .env file already exists"
fi
echo ""

# Run migrations
echo "Running database migrations..."
alembic upgrade head
echo "✓ Migrations completed"
echo ""

# Seed database
echo "Seeding database with sample data..."
python seed_database.py
echo "✓ Database seeded"
echo ""

echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "Database: biocode"
echo "Tables created: users, departments, locations, equipment, tickets, equipment_logs, equipment_history"
echo ""
echo "Default Users Created:"
echo "  Super Admin: admin@biocode.com / admin123"
echo "  Supervisor:  supervisor@biocode.com / supervisor123"
echo "  Tech:        tech1@biocode.com / tech123"
echo "  Viewer:      viewer@biocode.com / viewer123"
echo ""
echo "Sample Data:"
echo "  - 6 users"
echo "  - 8 departments"
echo "  - 10 locations"
echo "  - 22 equipment items"
echo "  - 15 tickets"
echo ""
echo "To start the backend server:"
echo "  uvicorn app.main:app --reload"
echo ""
echo "API Documentation will be available at:"
echo "  http://127.0.0.1:8000/docs"
echo ""
