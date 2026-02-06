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
- Role-based access control (Super Admin, Supervisor, Tech, Viewer)
- User creation and management
- Activate/Deactivate users
- Performance tracking for technicians
- Monthly performance reports

### Dashboard
- Role-specific dashboards
- Tech users see personal performance metrics
- Other users see system-wide statistics
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

### 1. Create MySQL Database
```bash
mysql -u root -p
```

```sql
CREATE DATABASE biocode CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 2. Run Migrations
```bash
cd backend
alembic upgrade head
```

This will create all necessary tables:
- users
- departments
- locations
- equipment
- tickets
- equipment_logs
- equipment_history

### 3. Seed Database (Optional)
```bash
cd backend
python seed_database.py
```

This creates:
- 6 users (1 super_admin, 2 supervisors, 2 techs, 1 viewer)
- 8 departments
- 10 locations
- 22 equipment items
- 15 tickets
- Equipment logs and history

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
- View all tickets and assign to technicians
- Access user management and performance reports
- Close tickets

### Supervisor
- Create/edit equipment and departments
- View all tickets and assign to technicians
- Update equipment status
- Close tickets
- Cannot manage users

### Tech
- View only assigned tickets
- Update ticket status (Open, In Progress, Resolved)
- Cannot close tickets
- Cannot access equipment or departments
- Personal performance dashboard

### Viewer
- Read-only access
- Can create tickets
- Cannot update ticket status to Resolved or Closed
- Cannot create departments or equipment
- View all tickets and equipment

## Default Credentials

After running the seeder, you can log in with these accounts:

### Super Admin
- **Email**: admin@biocode.com
- **Password**: admin123

### Supervisor
- **Email**: supervisor@biocode.com
- **Password**: supervisor123

### Tech
- **Email**: tech1@biocode.com
- **Password**: tech123

### Viewer
- **Email**: viewer@biocode.com
- **Password**: viewer123

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

## Key Features by Role

### Super Admin Dashboard
- User management with CRUD operations
- View all user performance reports
- System-wide statistics
- Full access to all features

### Supervisor Dashboard
- Equipment and ticket management
- Assign tickets to technicians
- Update equipment status
- Close tickets
- System-wide statistics

### Tech Dashboard
- Personal performance metrics
- Monthly performance report (last 12 months)
- Assigned tickets only
- Ticket status updates (except Close)

### Viewer Dashboard
- Read-only access
- Can create tickets
- System-wide statistics
- Cannot modify data

## Database Schema

### Users Table
- id, email, full_name, password_hash
- role (super_admin, supervisor, tech, viewer)
- is_active

### Equipment Table
- id, asset_tag, device_name, manufacturer, model
- serial_number, status, department_id
- repair_count (auto-incremented on ticket resolution)

### Tickets Table
- id, ticket_code, equipment_id, title, description
- status (open, in_progress, resolved, closed)
- priority (low, medium, high)
- reported_by_user_id, assigned_to_user_id
- created_at, updated_at

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

**Version**: 1.0.0  
**Last Updated**: February 2026
