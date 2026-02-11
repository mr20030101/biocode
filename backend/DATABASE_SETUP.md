# Database Setup Guide

## Overview

The Biocode application uses MySQL as its database with Alembic for schema migrations. All database schema is consolidated into a single migration file for simplicity.

## Database Structure

### Tables
- **users** - System users with roles and department assignments
- **departments** - Hospital departments
- **locations** - Physical locations for equipment
- **equipment** - Biomedical equipment inventory
- **tickets** - Service tickets for equipment issues
- **equipment_logs** - Maintenance and service logs
- **equipment_history** - Historical repair records
- **ticket_responses** - Service reports for completed tickets
- **maintenance_schedules** - Scheduled maintenance for equipment
- **notifications** - User notifications for system events

## Setup Instructions

### 1. Create MySQL Database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE biocode CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 2. Configure Environment

Create or update `backend/.env`:

```env
DATABASE_URL=mysql+pymysql://root:@localhost/biocode
SECRET_KEY=your-secret-key-here
```

### 3. Run Database Reset (Recommended)

This will drop all tables, run migrations, and seed data:

```bash
cd backend
python reset_database.py
```

### 4. Manual Setup (Alternative)

If you prefer manual setup:

```bash
cd backend

# Run migrations
python -m alembic upgrade head

# Seed database
python seed_database.py
```

## Migration Management

### Single Migration File

All database schema is consolidated in:
- `backend/alembic/versions/0001_initial_complete_schema.py`

This includes:
- All table definitions
- Indexes and constraints
- Foreign key relationships
- Enum types

### Creating New Migrations

If you need to modify the schema:

```bash
# Auto-generate migration from model changes
python -m alembic revision --autogenerate -m "description of changes"

# Or create empty migration
python -m alembic revision -m "description of changes"
```

### Migration Commands

```bash
# Show current revision
python -m alembic current

# Show migration history
python -m alembic history

# Upgrade to latest
python -m alembic upgrade head

# Downgrade one revision
python -m alembic downgrade -1

# Downgrade to specific revision
python -m alembic downgrade <revision_id>
```

## Seeded Data

The `seed_database.py` script creates:

### Users (11 total)
- 1 Super Admin (Owner)
- 1 Manager (IT Department)
- 5 Support Staff (IT Department) with different specializations:
  - Biomed Tech
  - Electrician (Maintenance)
  - Aircon Tech (Maintenance)
  - Plumber (Maintenance)
  - IT Staff
- 4 Department Incharge (ED, ICU, Radiology, Cardiology)

### Other Data
- 9 Departments
- 10 Locations
- 22 Equipment items
- 15 Tickets (various statuses)
- 29 Equipment logs
- 22 Maintenance schedules
- 47 Notifications

## Test Credentials

```
Super Admin (Owner):        superadmin@biocode.com / admin123
Manager (IT):               manager@biocode.com / manager123
Support - Biomed (IT):      support1@biocode.com / support123
Support - Electrician (IT): support2@biocode.com / support123
Support - Aircon (IT):      support3@biocode.com / support123
Dept Incharge (ED):         incharge1@biocode.com / incharge123
Dept Incharge (ICU):        incharge2@biocode.com / incharge123
```

## Troubleshooting

### Migration Conflicts

If you encounter migration conflicts:

```bash
# Drop alembic_version table
mysql -u root -p biocode -e "DROP TABLE IF EXISTS alembic_version"

# Run reset script
python reset_database.py
```

### Database Connection Issues

1. Verify MySQL is running:
   ```bash
   mysql -u root -p
   ```

2. Check DATABASE_URL in `.env` file

3. Ensure database exists:
   ```sql
   SHOW DATABASES;
   ```

### Seeding Errors

If seeding fails:

1. Check that migrations have been run
2. Verify database is empty or clear it first
3. Check for foreign key constraint errors

## Database Maintenance

### Backup Database

```bash
mysqldump -u root -p biocode > backup_$(date +%Y%m%d).sql
```

### Restore Database

```bash
mysql -u root -p biocode < backup_20260211.sql
```

### Clear All Data (Keep Schema)

```bash
cd backend
python seed_database.py
# This will clear and reseed all data
```

## Schema Changes

When modifying `app/models.py`:

1. Update the model classes
2. Generate new migration:
   ```bash
   python -m alembic revision --autogenerate -m "description"
   ```
3. Review the generated migration file
4. Test the migration:
   ```bash
   python -m alembic upgrade head
   ```
5. Update seeder if needed

## Notes

- All timestamps use UTC timezone
- String IDs are UUIDs (36 characters)
- Enum values are stored as strings in MySQL
- Foreign keys use `ondelete='SET NULL'` or `ondelete='CASCADE'` appropriately
- Indexes are created for frequently queried columns
