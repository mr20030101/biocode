# Database Migrations

## Consolidated Migration Approach

This project uses a **single consolidated migration file** instead of multiple incremental migrations. This approach simplifies database management and makes it easier to set up new environments.

## Migration File

- **File**: `0001_initial_complete_schema.py`
- **Purpose**: Creates the complete database schema in one migration
- **Includes**:
  - All table definitions
  - All indexes and constraints
  - All foreign key relationships
  - All enum types

## Benefits

1. **Simplicity**: One file to understand the entire schema
2. **Clean Setup**: New environments start with a clean, complete schema
3. **No Migration Conflicts**: Eliminates issues with migration order
4. **Easy Maintenance**: Schema changes are clear and straightforward

## Schema Overview

### Core Tables
- **users** - System users with roles and permissions
- **departments** - Hospital departments
- **locations** - Physical locations for equipment

### Equipment Management
- **equipment** - Biomedical equipment inventory
- **equipment_logs** - Service and maintenance logs
- **equipment_history** - Historical repair records

### Ticket System
- **tickets** - Service tickets for equipment issues
- **ticket_responses** - Service reports for completed tickets

### Maintenance
- **maintenance_schedules** - Scheduled maintenance for equipment

### Notifications
- **notifications** - User notifications for system events

## User Roles

The system supports 5 user roles (defined in UserRole enum):

1. **super_admin** - Full system access, owner
2. **manager** - Manages multiple departments
3. **department_head** - Manages single department
4. **support** - Technical staff with specializations
5. **department_incharge** - Department administrative staff

## Support Types

Support users can have specialized types (stored in support_type field):

- **biomed_tech** - Biomedical equipment specialists
- **maintenance_aircon** - Air conditioning technicians
- **maintenance_plumber** - Plumbing specialists
- **maintenance_carpenter** - Carpentry work
- **maintenance_painter** - Painting and finishing
- **maintenance_electrician** - Electrical systems
- **it_staff** - IT support
- **house_keeping** - Facility cleaning
- **other** - General support

## Making Schema Changes

If you need to modify the database schema:

### Option 1: Update the Consolidated Migration (Recommended for Development)

1. Update `app/models.py` with your changes
2. Delete the existing migration file
3. Generate a new consolidated migration:
   ```bash
   python -m alembic revision --autogenerate -m "initial complete schema"
   ```
4. Review and adjust the generated file
5. Reset the database:
   ```bash
   python reset_database.py
   ```

### Option 2: Create an Incremental Migration (Recommended for Production)

1. Update `app/models.py` with your changes
2. Generate a new migration:
   ```bash
   python -m alembic revision --autogenerate -m "description of changes"
   ```
3. Review the generated migration file
4. Apply the migration:
   ```bash
   python -m alembic upgrade head
   ```

## Common Commands

```bash
# Show current database version
python -m alembic current

# Show migration history
python -m alembic history

# Upgrade to latest version
python -m alembic upgrade head

# Downgrade one version
python -m alembic downgrade -1

# Reset database (drop, migrate, seed)
python reset_database.py
```

## Notes

- The consolidated migration creates all tables with proper relationships
- All foreign keys are properly configured with CASCADE or SET NULL
- Indexes are created for frequently queried columns
- Enum types are used for role, status, and type fields
- Timestamps use UTC timezone
- String IDs are UUIDs (36 characters)
