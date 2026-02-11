# Biocode - Biomedical Equipment Management System

A comprehensive web application for managing biomedical equipment, service tickets, departments, and user roles in healthcare facilities.

## Table of Contents
- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Requirements](#system-requirements)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [User Roles](#user-roles)
- [Default Credentials](#default-credentials)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)

## Features

### Equipment Management
- Track biomedical equipment inventory
- Monitor equipment status (Active, Out of Service, Retired)
- Record repair history and count
- Filter by status, department, and search
- View detailed equipment information
- Department assignment
- **Scheduled maintenance tracking**

### Maintenance Schedules
- **Create preventive maintenance schedules**
- **Track calibration and inspection schedules**
- **View overdue and upcoming maintenance**
- **Assign maintenance to support staff**
- **Automatic next maintenance date calculation**
- **Maintenance statistics dashboard**
- **Department-based filtering**

### Notifications System
- **Real-time notification bell with unread count**
- **Automatic notifications for**:
  - Ticket created, assigned, or status changed
  - Equipment status changes
  - Maintenance completed
  - Overdue maintenance alerts
- **Role-based notifications**:
  - Managers notified of all major events
  - Support staff notified of assignments
  - Department staff notified of their tickets
- **Notification management**:
  - Mark as read/unread
  - Delete notifications
  - Filter by read status
  - Pagination support

### Reports Generation
- **Excel report downloads**
- **Equipment inventory reports** (with filters)
- **Tickets reports** (with date ranges and filters)
- **Maintenance schedules reports**
- **Available to Managers and Super Admins only**

### Ticket Management
- Create and manage service tickets
- Assign tickets to technicians
- Track ticket status (Open, In Progress, Resolved, Closed)
- Priority levels (Low, Medium, High)
- Link tickets to equipment
- Filter and search tickets

### Department Management
- Create and manage departments
- Assign equipment to departments
- Department codes for organization

### User Management
- Role-based access control (Super Admin, Manager, Department Head, Support, Department Incharge)
- User creation and management
- Activate/Deactivate users
- Performance tracking for support staff
- Department assignments
- Support type classification (Biomed Tech, Maintenance, IT, House Keeping)

### Dashboard
- **Role-specific dashboards with Chart.js visualizations**
- **Support users see personal performance metrics**
- **Managers and Department Heads see system-wide statistics**
- **Interactive charts**:
  - Line charts for performance trends
  - Pie charts for status distribution
  - Bar charts for equipment repairs by department
- **Department Incharge users see special landing page**
- Recent equipment and tickets overview

## Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MySQL
- **ORM**: SQLAlchemy
- **Migrations**: Alembic
- **Authentication**: JWT tokens with OAuth2
- **Password Hashing**: bcrypt

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **HTTP Client**: Fetch API

## System Requirements

- **Python**: 3.8 or higher
- **Node.js**: 16 or higher
- **MySQL**: 8.0 or higher
- **npm**: 8 or higher

## Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd biocode
```

### 2. Backend Setup

#### Install Python Dependencies
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

#### Configure Environment Variables
Create a `.env` file in the `backend` directory:
```env
DATABASE_URL=mysql+pymysql://root:@localhost/biocode
SECRET_KEY=your-secret-key-here-change-in-production
```

### 3. Frontend Setup

#### Install Node Dependencies
```bash
cd frontend
npm install
```

#### Configure Environment Variables
Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://127.0.0.1:8000
```

## Database Setup

> **📖 For detailed database documentation, see [DATABASE_SETUP.md](backend/DATABASE_SETUP.md)**

### Quick Setup (Recommended)

The fastest way to set up the database is using the reset script:

```bash
cd backend
python reset_database.py
```

This will:
1. Drop all existing tables
2. Run migrations to create schema
3. Seed the database with sample data

### Manual Setup

#### 1. Create MySQL Database
```bash
mysql -u root -p
```

```sql
CREATE DATABASE biocode CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

#### 2. Run Migrations
```bash
cd backend
python -m alembic upgrade head
```

This creates all tables from the consolidated migration file:
- users, departments, locations
- equipment, tickets, equipment_logs
- equipment_history, ticket_responses
- maintenance_schedules, notifications

#### 3. Seed Database
```bash
cd backend
python seed_database.py
```

This creates:
- 11 users:
  - 1 Super Admin (Owner - no department)
  - 1 Manager (IT Department)
  - 5 Support Staff (IT Department with different specializations)
  - 4 Department Incharge (assigned to ED, ICU, Radiology, Cardiology)
- 9 departments (including IT Department)
- 10 locations
- 22 equipment items
- 15 tickets
- 29 equipment logs
- 22 maintenance schedules
- 47 notifications

## Running the Application

### Start Backend Server
```bash
cd backend
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uvicorn app.main:app --reload
```

Backend will run on: `http://127.0.0.1:8000`
API Documentation: `http://127.0.0.1:8000/docs`

### Start Frontend Development Server
```bash
cd frontend
npm run dev
```

Frontend will run on: `http://localhost:5173`

### Access the Application
Open your browser and navigate to: `http://localhost:5173`

## User Roles

### Super Admin
- **Full system access**
- Create/edit/delete users, equipment, departments
- View all tickets and assign to support staff
- Access user management and reports
- Close tickets

### Manager
- **Handles multiple departments**
- Create/edit equipment and departments
- View all tickets and assign to support staff
- Update equipment status
- Close tickets
- Generate reports
- Cannot manage users

### Department Head
- **Manages single department**
- Create/edit equipment in their department
- View department tickets
- Update equipment status
- Assign tickets within department
- Cannot close tickets or manage users

### Support
- **Technical staff with specializations**
- View only assigned tickets
- Update ticket status (Open, In Progress, Resolved)
- Cannot close tickets
- Cannot access equipment or departments pages
- Personal performance dashboard
- **Support Types**:
  - **Biomed Tech** - Biomedical equipment specialists
  - **Maintenance/Facility**:
    - Aircon Tech - Air conditioning and HVAC
    - Plumber - Plumbing systems
    - Carpenter - Carpentry work
    - Painter - Painting and finishing
    - Electrician - Electrical systems
  - **IT Staff** - Information technology support
  - **House Keeping** - Facility cleaning and maintenance
  - **Other** - General support staff

### Department Incharge (Secretary)
- **Department administrative staff**
- Can create tickets (can select equipment from dropdown)
- **Can only view tickets they created**
- **Cannot access Equipment or Departments pages**
- Cannot update ticket status to Resolved or Closed
- Cannot create departments or equipment
- Special landing page with action buttons

## Default Credentials

After running the seeder, you can log in with these accounts:

### Super Admin (Owner)
- **Email**: superadmin@biocode.com
- **Password**: admin123
- **Department**: None (Owner of the system)
- **Role**: super_admin

### Manager (IT Department)
- **Email**: manager@biocode.com
- **Password**: manager123
- **Department**: Information Technology
- **Role**: manager

### Support Staff (IT Department)
- **Email**: support1@biocode.com / **Password**: support123 / **Department**: IT / **Type**: Biomed Tech
- **Email**: support2@biocode.com / **Password**: support123 / **Department**: IT / **Type**: Electrician (Maintenance)
- **Email**: support3@biocode.com / **Password**: support123 / **Department**: IT / **Type**: Aircon Tech (Maintenance)
- **Email**: support4@biocode.com / **Password**: support123 / **Department**: IT / **Type**: Plumber (Maintenance)
- **Email**: support5@biocode.com / **Password**: support123 / **Department**: IT / **Type**: IT Staff

### Department Incharge (Department Staff)
- **Email**: incharge1@biocode.com / **Password**: incharge123 / **Department**: Emergency Department
- **Email**: incharge2@biocode.com / **Password**: incharge123 / **Department**: Intensive Care Unit
- **Email**: incharge3@biocode.com / **Password**: incharge123 / **Department**: Radiology
- **Email**: incharge4@biocode.com / **Password**: incharge123 / **Department**: Cardiology

## Project Structure

```
biocode/
├── backend/
│   ├── alembic/
│   │   └── versions/          # Database migrations
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py           # FastAPI application
│   │   ├── auth.py           # Authentication logic
│   │   ├── config.py         # Configuration
│   │   ├── database.py       # Database connection
│   │   ├── models.py         # SQLAlchemy models
│   │   ├── schemas.py        # Pydantic schemas
│   │   ├── permissions.py    # Role-based permissions
│   │   ├── routers_auth.py   # Auth endpoints
│   │   ├── routers_departments.py
│   │   ├── routers_equipment.py
│   │   └── routers_tickets.py
│   ├── .env                  # Environment variables
│   ├── alembic.ini          # Alembic configuration
│   ├── requirements.txt     # Python dependencies
│   └── seed_database.py     # Database seeder
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── Navigation.tsx
    │   ├── lib/
    │   │   ├── api.ts        # API client
    │   │   └── auth.tsx      # Auth context
    │   ├── pages/
    │   │   ├── DashboardPage.tsx
    │   │   ├── EquipmentPage.tsx
    │   │   ├── NewEquipmentPage.tsx
    │   │   ├── TicketsPage.tsx
    │   │   ├── TicketDetailPage.tsx
    │   │   ├── DepartmentsPage.tsx
    │   │   ├── UsersPage.tsx
    │   │   ├── UserProfilePage.tsx
    │   │   ├── LoginPage.tsx
    │   │   └── RegisterPage.tsx
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── index.css
    ├── .env                  # Environment variables
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.ts
```

## API Documentation

### Authentication Endpoints
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get token
- `GET /auth/me` - Get current user
- `GET /auth/users` - List users
- `GET /auth/users/{id}/stats` - Get user statistics
- `PATCH /auth/users/{id}` - Update user
- `DELETE /auth/users/{id}` - Delete user

### Equipment Endpoints
- `GET /equipment/` - List equipment (with filters)
- `GET /equipment/{id}` - Get equipment details
- `POST /equipment/` - Create equipment
- `PATCH /equipment/{id}` - Update equipment status
- `DELETE /equipment/{id}` - Delete equipment

### Ticket Endpoints
- `GET /tickets/` - List tickets (with filters)
- `GET /tickets/{id}` - Get ticket details
- `POST /tickets/` - Create ticket
- `PATCH /tickets/{id}` - Update ticket
- `DELETE /tickets/{id}` - Delete ticket

### Department Endpoints
- `GET /departments/` - List departments
- `GET /departments/{id}` - Get department details
- `POST /departments/` - Create department
- `DELETE /departments/{id}` - Delete department

### Maintenance Endpoints
- `GET /maintenance/` - List maintenance schedules (with filters)
- `GET /maintenance/{id}` - Get maintenance schedule details
- `POST /maintenance/` - Create maintenance schedule
- `PATCH /maintenance/{id}` - Update maintenance schedule
- `POST /maintenance/{id}/complete` - Mark maintenance as completed
- `DELETE /maintenance/{id}` - Delete maintenance schedule
- `GET /maintenance/stats/summary` - Get maintenance statistics

### Notification Endpoints
- `GET /notifications/` - List notifications (with pagination and filters)
- `GET /notifications/unread-count` - Get unread notification count
- `POST /notifications/{id}/mark-read` - Mark notification as read
- `POST /notifications/mark-all-read` - Mark all notifications as read
- `DELETE /notifications/{id}` - Delete notification
- `POST /notifications/` - Create notification (Manager/Admin only)

### Analytics Endpoints
- `GET /analytics/equipment/downtime` - Equipment downtime analytics
- `GET /analytics/equipment/availability` - Equipment availability summary
- `GET /analytics/maintenance/compliance` - Maintenance compliance statistics
- `GET /analytics/tickets/resolution-time` - Ticket resolution time analytics
- `GET /analytics/dashboard/summary` - Comprehensive dashboard summary
- `GET /analytics/departments/repairs` - Repairs by department

### Reports Endpoints
- `GET /reports/equipment/excel` - Download equipment report
- `GET /reports/tickets/excel` - Download tickets report
- `GET /reports/maintenance/excel` - Download maintenance report

## Key Features by Role

### Super Admin Dashboard
- User management with CRUD operations
- Full access to all features
- System-wide statistics with interactive charts
- Generate all reports

### Manager Dashboard
- Equipment and ticket management
- Assign tickets to support staff
- Update equipment status
- Close tickets
- Generate reports
- System-wide statistics with charts
- View repairs by department

### Department Head Dashboard
- Department-specific equipment management
- View and assign department tickets
- Update equipment status
- Cannot close tickets
- Department statistics

### Support Dashboard
- Personal performance metrics with trend charts
- Assigned tickets only
- Ticket status updates (except Close)
- Maintenance schedules assigned to them
- Cannot access equipment or departments pages

### Department Incharge Dashboard
- Special landing page with action buttons
- Create new tickets
- **Can only view their own tickets**
- **Equipment and Departments sections hidden**
- Cannot modify ticket status to Resolved or Closed

## Database Schema

### Users Table
- id, email, full_name, password_hash
- role (super_admin, manager, department_head, support, department_incharge)
- support_type (for support role: biomed_tech, aircon_tech, plumber, carpenter, painter, electrician, it_staff, house_keeping)
- department_id (foreign key to departments)
- is_active

### Equipment Table
- id, asset_tag, device_name, manufacturer, model
- serial_number, status, department_id
- repair_count (auto-incremented on ticket resolution)
- total_downtime_minutes, last_downtime_start, is_currently_down
- criticality (low, medium, high, critical)

### Tickets Table
- id, ticket_code, equipment_id, title, description
- status (open, in_progress, resolved, closed)
- priority (low, medium, high)
- reported_by_user_id, assigned_to_user_id, department_id
- created_at, updated_at

### Maintenance Schedules Table
- id, equipment_id, maintenance_type, frequency_days
- last_maintenance_date, next_maintenance_date
- assigned_to_user_id, notes, is_active
- created_at, updated_at

### Notifications Table
- id, user_id, title, message
- notification_type, related_entity_type, related_entity_id
- is_read, created_at, read_at

### Departments Table
- id, name, code

### Locations Table
- id, name, building, floor, room

## Development

### Running Tests
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Building for Production

#### Backend
```bash
cd backend
# Update .env with production settings
# Use a production WSGI server like gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

#### Frontend
```bash
cd frontend
npm run build
# Serve the dist/ folder with a web server
```

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running: `mysql -u root -p`
- Check DATABASE_URL in backend/.env
- Ensure database exists: `SHOW DATABASES;`

### Migration Issues
- Reset migrations: `alembic downgrade base`
- Re-run migrations: `alembic upgrade head`
- Check alembic/versions/ for migration files

### Frontend Build Issues
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear cache: `npm run dev -- --force`

### CORS Issues
- Verify VITE_API_URL in frontend/.env
- Check CORS settings in backend/app/main.py

## Security Notes

### Production Checklist
- [ ] Change SECRET_KEY in backend/.env
- [ ] Use strong database passwords
- [ ] Enable HTTPS
- [ ] Set secure CORS origins
- [ ] Use environment-specific .env files
- [ ] Enable rate limiting
- [ ] Set up proper logging
- [ ] Regular database backups
- [ ] Update dependencies regularly

## License

This project is proprietary software for biomedical equipment management.

## Support

For issues and questions, please contact the development team.

---

**Version**: 2.0.0  
**Last Updated**: February 2026

## Recent Updates (v2.0.0)

### Role System Overhaul
- Renamed and restructured user roles for better clarity
- Added support_type field for technical staff specialization
- Updated all permissions and access controls

### Notifications System
- Real-time notification bell with unread count
- Automatic notifications for all major events
- Role-based notification routing
- Notification management (mark read, delete, filter)

### Reports Generation
- Excel report downloads for equipment, tickets, and maintenance
- Advanced filtering options
- Manager and Super Admin access only

### Enhanced Dashboard
- Chart.js integration for data visualization
- Line charts, pie charts, and bar charts
- Department repairs analytics
- Role-specific dashboards

### Maintenance Tracking
- Scheduled maintenance with automatic date calculation
- Overdue maintenance alerts
- Department-based filtering
- Maintenance completion notifications
