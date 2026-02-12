# Biocode - Biomedical Equipment Management System

A comprehensive web application for managing biomedical equipment, service tickets, departments, and user roles in healthcare facilities.

## 📑 Table of Contents
- [Installation & Setup](#-installation--setup) ⭐ **START HERE**
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Quick Setup](#quick-setup)
- [Detailed Setup Guide](#detailed-setup-guide)
- [Database Migrations](#database-migrations)
- [User Roles & Permissions](#user-roles--permissions)
- [Default Credentials](#default-credentials)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## 🔧 Installation & Setup

### Prerequisites
- **Python 3.9+** (for backend)
- **Node.js 18+** (for frontend)
- **MySQL 8.0+** (for database)
- **Git** (for version control)

### Step 1: Clone Repository
```bash
git clone <your-repo-url>
cd biocode
```

### Step 2: Create Database
```bash
mysql -u root -p
CREATE DATABASE biocode CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### Step 3: Backend Setup

#### 3.1 Create Virtual Environment
```bash
cd backend
python3 -m venv .venv

# Activate virtual environment
# On macOS/Linux:
source .venv/bin/activate

# On Windows:
.venv\Scripts\activate
```

#### 3.2 Install Dependencies
```bash
pip install -r requirements.txt
```

**⚠️ Important Dependencies Installed:**
- `python-multipart==0.0.22` - Required for FastAPI form data handling
- `argon2-cffi==25.1.0` - For secure password hashing (replaces bcrypt on Windows)
- `python-dotenv==1.2.1` - For environment variable management
- All other dependencies listed in requirements.txt

#### 3.3 Configure Environment
```bash
cp .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/biocode
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DEBUG=False
```

#### 3.4 Initialize Database
```bash
# Run migrations (creates all 12 tables)
alembic upgrade head

# Seed sample data
python seed_database.py
```

**Or use the automated setup script:**
```bash
./setup_database.sh
```

**Or reset everything (development only):**
```bash
python reset_database.py
```

#### 3.5 Start Backend Server
```bash
uvicorn app.main:app --reload --port 8000
```

✅ Backend running at: http://localhost:8000  
📚 API Docs at: http://localhost:8000/docs

### Step 4: Frontend Setup

#### 4.1 Install Dependencies
```bash
cd ../frontend
npm install
```

#### 4.2 Configure Environment
```bash
cp .env.example .env
```

Edit `frontend/.env`:
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

#### 4.3 Start Frontend Server
```bash
npm run dev
```

✅ Frontend running at: http://localhost:5173

### Step 5: Access Application

1. **Open browser**: http://localhost:5173
2. **Login with default credentials**:
   - Email: `superadmin@biocode.com`
   - Password: `admin123`

### Step 6: Verify Installation

**Backend Health Check:**
```bash
curl http://localhost:8000/health
# Should return: {"status":"ok"}
```

**Frontend Check:**
- Should see login page at http://localhost:5173
- Should be able to login successfully

---

### Common Installation Issues & Solutions

#### Issue 1: `RuntimeError: Form data requires "python-multipart"`
**Cause**: Missing python-multipart dependency  
**Solution**:
```bash
cd backend
pip install python-multipart
```

#### Issue 2: `ValueError: password cannot be longer than 72 bytes`
**Cause**: Bcrypt compatibility issue on Windows  
**Solution**: Already fixed in requirements.txt (uses argon2-cffi instead)

#### Issue 3: `Cannot connect to MySQL database`
**Cause**: Wrong credentials or MySQL not running  
**Solution**:
```bash
# Verify MySQL is running
mysql -u root -p

# Check DATABASE_URL in backend/.env
# Format: mysql+pymysql://username:password@localhost:3306/biocode
```

#### Issue 4: `Table doesn't exist` when running seed_database.py
**Cause**: Migrations not run before seeding  
**Solution**:
```bash
cd backend
alembic upgrade head
python seed_database.py
```

#### Issue 5: Port 8000 or 5173 already in use
**Solution**:
```bash
# Backend on different port
uvicorn app.main:app --reload --port 8001

# Frontend on different port
npm run dev -- --port 5174
```

#### Issue 6: npm install fails
**Solution**:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

### Automated Setup (Optional)

**Using start script:**
```bash
# From root directory
./start.sh
```

This will start both backend and frontend servers in the background.

**Stop servers:**
```bash
./stop.sh
```

---

### Next Steps After Installation

1. ✅ **Verify login works** - Try logging in with superadmin@biocode.com / admin123
2. 📖 **Read the documentation** - Check out the [Features](#features) section
3. 🎯 **Explore the dashboard** - Navigate through different pages
4. 👥 **Try different user roles** - Login with other test accounts (see [Default Credentials](#default-credentials))
5. 🔧 **Customize settings** - Update user preferences and settings

---

## ✨ Features

### Equipment Management
- Track biomedical equipment inventory with asset tags and serial numbers
- Monitor equipment status (Active, Out of Service, Retired)
- Record repair history and downtime tracking
- Filter by status, department, and search
- View detailed equipment information with maintenance logs
- Department and location assignment
- Scheduled maintenance tracking with automatic alerts

### Maintenance Schedules
- Create preventive maintenance schedules
- Track calibration and inspection schedules
- View overdue and upcoming maintenance
- Assign maintenance to support staff
- Automatic next maintenance date calculation
- Maintenance statistics dashboard
- Department-based filtering

### Notifications System
- Real-time notification bell with unread count (auto-refresh every 30 seconds)
- Automatic notifications for:
  - Ticket created, assigned, or status changed
  - Equipment status changes
  - Maintenance completed
  - Overdue maintenance alerts
- Role-based notifications
- Mark as read/unread, delete, filter by status
- Pagination support

### Reports Generation
- Excel report downloads (Equipment, Tickets, Maintenance)
- Advanced filtering options
- Date range selection
- Available to Managers and Super Admins only

### Ticket Management
- Create and manage service tickets
- Assign tickets to technicians
- Track ticket status (Open, In Progress, Resolved, Closed)
- Priority levels (Low, Medium, High)
- Link tickets to equipment
- Filter and search tickets
- Ticket responses with diagnosis and action taken

### Department Management
- Create and manage departments
- Assign equipment to departments
- Department codes for organization
- Track department statistics

### User Management
- Role-based access control (5 roles)
- User creation and management
- Activate/Deactivate users
- Performance tracking for support staff
- Department assignments
- Support type classification (Biomed Tech, Maintenance, IT, House Keeping)
- User preferences (view mode, sidebar state)

### Dashboard
- Role-specific dashboards with Chart.js visualizations
- Support users see personal performance metrics
- Managers and Department Heads see system-wide statistics
- Interactive charts (Line, Pie, Bar)
- Department Incharge users see special landing page
- Recent equipment and tickets overview

### UI/UX Features
- Glassmorphic sidebar navigation (collapsible)
- SweetAlert2 for all notifications and confirmations
- Table, Card, and Grid view modes
- User preferences saved to database and localStorage
- Responsive design with Tailwind CSS
- Dark mode support (coming soon)

---

## 🛠 Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.9+)
- **Database**: MySQL 8.0+
- **ORM**: SQLAlchemy
- **Migrations**: Alembic (12 separate migration files, one per table)
- **Authentication**: JWT tokens with OAuth2
- **Password Hashing**: bcrypt
- **Excel Reports**: openpyxl

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **HTTP Client**: Fetch API
- **Charts**: Chart.js
- **Notifications**: SweetAlert2

---

## 🚀 Quick Setup

### Prerequisites
- Python 3.9+
- Node.js 18+
- MySQL 8.0+
- Git

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd biocode
```

### 2. Database Setup
```bash
mysql -u root -p
CREATE DATABASE biocode CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 3. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env: DATABASE_URL=mysql+pymysql://root:@localhost:3306/biocode

python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Option 1: Python setup script (Works on all platforms - Recommended)
python setup_database.py

# Option 2: Bash script (macOS/Linux/Git Bash)
./setup_database.sh

# Option 3: Manual setup
# Run migrations (creates all 12 tables)
python -m alembic upgrade head
# Seed sample data
python seed_database.py

# Option 4: Full reset (drops all tables, runs migrations, seeds data)
python reset_database.py
```

**Note**: Use `python` instead of `python3` on Windows.

### 4. Frontend Setup
```bash
cd ../frontend
cp .env.example .env
npm install
```

### 5. Start Application
```bash
# Terminal 1 - Backend
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 6. Access Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### 7. Login
- Email: `admin@biocode.com`
- Password: `admin123`

---

## 📖 Detailed Setup Guide

### Environment Configuration

#### Backend (.env)
```env
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/biocode
SECRET_KEY=your-secret-key-here-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
```

### Database Reset (Development)
If you need to reset the database:
```bash
cd backend
python reset_database.py
alembic upgrade head
python seed_database.py
```

### Production Build

#### Backend
```bash
cd backend
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

#### Frontend
```bash
cd frontend
npm run build
# Serve the dist/ folder with nginx, apache, or any static file server
```

---

## 🗄 Database Migrations

### Migration Structure
The project uses **12 separate migration files** (one per table) for better organization:

1. **0001_create_departments_table.py** - Departments table
2. **0002_create_suppliers_table.py** - Suppliers table
3. **0003_create_users_table.py** - Users table (depends on departments)
4. **0004_create_locations_table.py** - Locations table
5. **0005_create_equipment_table.py** - Equipment table (depends on locations, departments, suppliers)
6. **0006_create_tickets_table.py** - Tickets table (depends on equipment, departments, users)
7. **0007_create_equipment_logs_table.py** - Equipment logs table (depends on equipment, users)
8. **0008_create_equipment_history_table.py** - Equipment history table (depends on tickets)
9. **0009_create_ticket_responses_table.py** - Ticket responses table (depends on tickets, users)
10. **0010_create_maintenance_schedules_table.py** - Maintenance schedules table (depends on equipment, users)
11. **0011_create_notifications_table.py** - Notifications table (depends on users)
12. **0012_add_user_preferences.py** - Adds preferences column to users table

### Migration Commands
```bash
cd backend

# Check current version
alembic current

# View migration history
alembic history

# Upgrade to latest version
alembic upgrade head

# Upgrade to specific version
alembic upgrade 0005_create_equipment_table

# Downgrade one version
alembic downgrade -1

# Downgrade to specific version
alembic downgrade 0005_create_equipment_table

# Downgrade all
alembic downgrade base
```

### Migration Order & Dependencies
```
departments (0001)
    ↓
suppliers (0002)
    ↓
users (0003) ← depends on departments
    ↓
locations (0004)
    ↓
equipment (0005) ← depends on locations, departments, suppliers
    ↓
tickets (0006) ← depends on equipment, departments, users
    ↓
equipment_logs (0007) ← depends on equipment, users
    ↓
equipment_history (0008) ← depends on tickets
    ↓
ticket_responses (0009) ← depends on tickets, users
    ↓
maintenance_schedules (0010) ← depends on equipment, users
    ↓
notifications (0011) ← depends on users
    ↓
user_preferences (0012) ← modifies users table
```

### Creating New Migrations
```bash
cd backend

# Create new migration
alembic revision -m "description of changes"

# Auto-generate migration from model changes
alembic revision --autogenerate -m "description"

# Apply new migration
alembic upgrade head
```

### Setting Up on New Computer
```bash
# After cloning repository
cd backend
cp .env.example .env
# Edit .env with your database credentials

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Create database
mysql -u root -p -e "CREATE DATABASE biocode CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run all migrations
alembic upgrade head

# Seed data
python seed_database.py
```

---

## 👥 User Roles & Permissions

### Super Admin (Owner)
- **Full system access**
- Create/edit/delete users, equipment, departments
- View all tickets and assign to support staff
- Access user management and reports
- Close tickets
- No department assignment (system owner)

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

---

## 🔑 Default Credentials

After running `seed_database.py`, you can log in with these accounts:

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
- **Email**: support1@biocode.com / **Password**: support123 / **Type**: Biomed Tech
- **Email**: support2@biocode.com / **Password**: support123 / **Type**: Electrician
- **Email**: support3@biocode.com / **Password**: support123 / **Type**: Aircon Tech
- **Email**: support4@biocode.com / **Password**: support123 / **Type**: Plumber
- **Email**: support5@biocode.com / **Password**: support123 / **Type**: IT Staff

### Department Incharge (Department Staff)
- **Email**: incharge1@biocode.com / **Password**: incharge123 / **Dept**: Emergency Department
- **Email**: incharge2@biocode.com / **Password**: incharge123 / **Dept**: Intensive Care Unit
- **Email**: incharge3@biocode.com / **Password**: incharge123 / **Dept**: Radiology
- **Email**: incharge4@biocode.com / **Password**: incharge123 / **Dept**: Cardiology

---

## 📁 Project Structure

```
biocode/
├── backend/
│   ├── alembic/
│   │   └── versions/          # 12 migration files (one per table)
│   │       ├── 0001_create_departments_table.py
│   │       ├── 0002_create_suppliers_table.py
│   │       ├── ...
│   │       ├── 0012_add_user_preferences.py
│   │       ├── README.md
│   │       └── MIGRATION_ORDER.md
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI application
│   │   ├── auth.py                    # Authentication logic
│   │   ├── config.py                  # Configuration
│   │   ├── database.py                # Database connection
│   │   ├── models.py                  # SQLAlchemy models
│   │   ├── schemas.py                 # Pydantic schemas
│   │   ├── permissions.py             # Role-based permissions
│   │   ├── notification_service.py    # Notification logic
│   │   ├── routers_auth.py            # Auth endpoints
│   │   ├── routers_departments.py     # Department endpoints
│   │   ├── routers_equipment.py       # Equipment endpoints
│   │   ├── routers_tickets.py         # Ticket endpoints
│   │   ├── routers_maintenance.py     # Maintenance endpoints
│   │   ├── routers_notifications.py   # Notification endpoints
│   │   ├── routers_analytics.py       # Analytics endpoints
│   │   ├── routers_reports.py         # Report endpoints
│   │   ├── routers_suppliers.py       # Supplier endpoints
│   │   └── routers_user_preferences.py # User preferences endpoints
│   ├── .env                           # Environment variables
│   ├── .env.example                   # Environment template
│   ├── alembic.ini                    # Alembic configuration
│   ├── requirements.txt               # Python dependencies
│   ├── seed_database.py               # Database seeder
│   ├── reset_database.py              # Database reset script
│   ├── DATABASE_SETUP.md              # Database documentation
│   ├── MIGRATION_GUIDE.md             # Migration guide
│   └── TEST_MIGRATIONS.md             # Migration testing guide
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Layout.tsx             # Main layout with sidebar
    │   │   ├── Navigation.tsx         # Glassmorphic sidebar
    │   │   ├── NotificationBell.tsx   # Notification bell component
    │   │   └── Pagination.tsx         # Pagination component
    │   ├── lib/
    │   │   ├── api.ts                 # API client
    │   │   ├── auth.tsx               # Auth context
    │   │   ├── notifications.ts       # SweetAlert2 utilities
    │   │   └── notificationContext.tsx # Notification state management
    │   ├── pages/
    │   │   ├── DashboardPage.tsx      # Role-specific dashboard
    │   │   ├── EquipmentPage.tsx      # Equipment management
    │   │   ├── NewEquipmentPage.tsx   # Create equipment
    │   │   ├── TicketsPage.tsx        # Ticket management
    │   │   ├── TicketDetailPage.tsx   # Ticket details
    │   │   ├── DepartmentsPage.tsx    # Department management
    │   │   ├── MaintenancePage.tsx    # Maintenance schedules
    │   │   ├── NotificationsPage.tsx  # Notifications
    │   │   ├── ReportsPage.tsx        # Reports generation
    │   │   ├── SettingsPage.tsx       # User preferences
    │   │   ├── UsersPage.tsx          # User management
    │   │   ├── UserProfilePage.tsx    # User profile
    │   │   ├── ViewerLandingPage.tsx  # Department Incharge landing
    │   │   ├── LoginPage.tsx          # Login
    │   │   └── RegisterPage.tsx       # Registration
    │   ├── App.tsx                    # Main app component
    │   ├── main.tsx                   # Entry point
    │   └── index.css                  # Global styles + SweetAlert2 custom CSS
    ├── .env                           # Environment variables
    ├── .env.example                   # Environment template
    ├── package.json                   # Node dependencies
    ├── tailwind.config.js             # Tailwind configuration
    ├── vite.config.ts                 # Vite configuration
    └── README.md                      # Frontend documentation
│
├── README.md                          # This file (comprehensive documentation)
├── QUICKSTART.md                      # Quick start guide
├── DEPLOYMENT_GUIDE.md                # Deployment instructions
├── SETUP_NEW_COMPUTER.md              # Setup on new computer
├── MIGRATION_CONSOLIDATION_SUMMARY.md # Migration restructure details
├── SETUP_SUMMARY.md                   # Setup summary
├── MIGRATION_CHECKLIST.md             # Migration checklist
├── start.sh                           # Start both servers
└── stop.sh                            # Stop both servers
```

---

## 🔌 API Documentation

### Authentication Endpoints
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token
- `GET /auth/me` - Get current user info
- `GET /auth/users` - List all users (Admin/Manager only)
- `GET /auth/users/{id}` - Get user details
- `GET /auth/users/{id}/stats` - Get user statistics
- `PATCH /auth/users/{id}` - Update user
- `DELETE /auth/users/{id}` - Delete user

### Equipment Endpoints
- `GET /equipment/` - List equipment (with filters: status, department, search)
- `GET /equipment/{id}` - Get equipment details
- `POST /equipment/` - Create equipment
- `PATCH /equipment/{id}` - Update equipment status
- `DELETE /equipment/{id}` - Delete equipment

### Ticket Endpoints
- `GET /tickets/` - List tickets (with filters: status, priority, assigned_to, department)
- `GET /tickets/{id}` - Get ticket details
- `POST /tickets/` - Create ticket
- `PATCH /tickets/{id}` - Update ticket status
- `DELETE /tickets/{id}` - Delete ticket

### Department Endpoints
- `GET /departments/` - List all departments
- `GET /departments/{id}` - Get department details
- `POST /departments/` - Create department
- `DELETE /departments/{id}` - Delete department

### Supplier Endpoints
- `GET /suppliers/` - List all suppliers
- `GET /suppliers/{id}` - Get supplier details
- `POST /suppliers/` - Create supplier
- `PATCH /suppliers/{id}` - Update supplier
- `DELETE /suppliers/{id}` - Delete supplier

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
- `GET /reports/equipment/excel` - Download equipment report (Excel)
- `GET /reports/tickets/excel` - Download tickets report (Excel)
- `GET /reports/maintenance/excel` - Download maintenance report (Excel)

### User Preferences Endpoints
- `GET /user-preferences/` - Get current user preferences
- `PUT /user-preferences/` - Update user preferences

### Interactive API Documentation
Visit `http://localhost:8000/docs` for Swagger UI with interactive API testing.

---

## 🚢 Deployment

### Production Checklist
- [ ] Change `SECRET_KEY` in backend/.env to a strong random value
- [ ] Use strong database passwords
- [ ] Enable HTTPS (SSL/TLS certificates)
- [ ] Set secure CORS origins in backend/app/main.py
- [ ] Use environment-specific .env files
- [ ] Enable rate limiting
- [ ] Set up proper logging and monitoring
- [ ] Regular database backups
- [ ] Update dependencies regularly
- [ ] Use production WSGI server (gunicorn)
- [ ] Serve frontend with nginx or apache
- [ ] Set up firewall rules
- [ ] Configure database connection pooling

### Backend Deployment
```bash
cd backend

# Install production dependencies
pip install gunicorn

# Run with gunicorn (4 workers)
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Or use systemd service
sudo nano /etc/systemd/system/biocode-backend.service
```

Example systemd service:
```ini
[Unit]
Description=Biocode Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/biocode/backend
Environment="PATH=/var/www/biocode/backend/.venv/bin"
ExecStart=/var/www/biocode/backend/.venv/bin/gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

[Install]
WantedBy=multi-user.target
```

### Frontend Deployment
```bash
cd frontend

# Build for production
npm run build

# The dist/ folder contains the production build
# Serve with nginx
```

Example nginx configuration:
```nginx
server {
    listen 80;
    server_name biocode.example.com;

    # Frontend
    location / {
        root /var/www/biocode/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Database Backup
```bash
# Backup database
mysqldump -u root -p biocode > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
mysql -u root -p biocode < backup_20260212_120000.sql

# Automated daily backups (crontab)
0 2 * * * mysqldump -u root -pYOUR_PASSWORD biocode > /backups/biocode_$(date +\%Y\%m\%d).sql
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
source .venv/bin/activate

# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_auth.py
```

### Frontend Tests
```bash
cd frontend

# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Migration Testing
```bash
cd backend

# Create test database
mysql -u root -p -e "CREATE DATABASE biocode_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Update .env to use test database
# DATABASE_URL=mysql+pymysql://root:@localhost:3306/biocode_test

# Test migrations
alembic upgrade head

# Verify
alembic current
mysql -u root -p biocode_test -e "SHOW TABLES;"

# Test rollback
alembic downgrade -1
alembic upgrade head

# Cleanup
mysql -u root -p -e "DROP DATABASE biocode_test;"
```

### Manual Testing Checklist
- [ ] Login with all user roles
- [ ] Create equipment
- [ ] Create ticket
- [ ] Assign ticket to support
- [ ] Update ticket status
- [ ] Close ticket (Manager/Admin only)
- [ ] Create maintenance schedule
- [ ] Mark maintenance as completed
- [ ] Check notifications
- [ ] Mark notifications as read
- [ ] Generate reports (Excel download)
- [ ] Update user preferences
- [ ] Test sidebar collapse/expand
- [ ] Test view mode switching (Table/Card/Grid)
- [ ] Test pagination
- [ ] Test search and filters
- [ ] Test SweetAlert2 confirmations

---

## 🔧 Troubleshooting

### Database Connection Issues
**Problem**: Cannot connect to MySQL database

**Solutions**:
1. Check MySQL is running:
   ```bash
   mysql -u root -p
   ```

2. Verify database exists:
   ```sql
   SHOW DATABASES;
   ```

3. Check DATABASE_URL in `backend/.env`:
   ```env
   DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/biocode
   ```

4. Test connection:
   ```bash
   cd backend
   python -c "from app.database import engine; print(engine.connect())"
   ```

### Migration Issues
**Problem**: Migration errors or "Can't locate revision"

**Solutions**:
1. Check current version:
   ```bash
   cd backend
   alembic current
   ```

2. View migration history:
   ```bash
   alembic history
   ```

3. Reset database (development only):
   ```bash
   python reset_database.py
   alembic upgrade head
   python seed_database.py
   ```

4. Manually set version (if needed):
   ```bash
   mysql -u root -p biocode
   SELECT * FROM alembic_version;
   UPDATE alembic_version SET version_num = '0012_add_user_preferences';
   ```

### Seeding Error: "Table doesn't exist"
**Problem**: Error like `Table 'biocode.notifications' doesn't exist` when running `seed_database.py`

**Cause**: Seeding script was run before migrations were applied.

**Solutions**:
The seeding script now includes automatic checks and will show a helpful error message if migrations haven't been run. If you see this error:

1. Use the cross-platform Python setup script (Recommended):
   ```bash
   cd backend
   python setup_database.py
   # Choose option 1 for full reset
   ```

2. Or run migrations first:
   ```bash
   cd backend
   python -m alembic upgrade head
   python seed_database.py
   ```

3. Or use the reset script:
   ```bash
   cd backend
   python reset_database.py
   ```

4. On macOS/Linux/Git Bash, use the bash script:
   ```bash
   cd backend
   ./setup_database.sh
   ```

**Note**: The seeder now validates that all required tables exist before attempting to clear data, preventing cryptic database errors. Works on Windows, macOS, and Linux.

### Port Already in Use
**Problem**: Port 8000 or 5173 is already in use

**Solutions**:
```bash
# Backend on different port
uvicorn app.main:app --reload --port 8001

# Frontend on different port
npm run dev -- --port 5174

# Find and kill process using port
# macOS/Linux:
lsof -ti:8000 | xargs kill -9

# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Frontend Build Issues
**Problem**: npm install or build errors

**Solutions**:
1. Clear node_modules and reinstall:
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Clear cache:
   ```bash
   npm cache clean --force
   npm install
   ```

3. Use specific Node version:
   ```bash
   nvm use 18
   npm install
   ```

### CORS Issues
**Problem**: CORS errors in browser console

**Solutions**:
1. Check VITE_API_URL in `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

2. Verify CORS settings in `backend/app/main.py`:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:5173"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

### Authentication Issues
**Problem**: "Not authenticated" or token errors

**Solutions**:
1. Clear browser localStorage:
   ```javascript
   // In browser console
   localStorage.clear()
   ```

2. Check token expiration in `backend/.env`:
   ```env
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```

3. Verify SECRET_KEY is set in `backend/.env`

### Notification Not Updating
**Problem**: Notification count not updating automatically

**Solutions**:
1. Check NotificationProvider is wrapping the app in `frontend/src/main.tsx`
2. Verify polling interval (default: 30 seconds)
3. Check browser console for errors
4. Verify backend notification endpoints are working

### SweetAlert2 Buttons Not Showing
**Problem**: Confirm/Cancel buttons not visible in modals

**Solutions**:
1. Check custom CSS in `frontend/src/index.css`
2. Verify SweetAlert2 is installed:
   ```bash
   cd frontend
   npm install sweetalert2
   ```

### Database Tables Missing
**Problem**: Tables don't exist after migration

**Solutions**:
1. Verify migrations ran successfully:
   ```bash
   cd backend
   alembic current
   # Should show: 0012_add_user_preferences (head)
   ```

2. Check tables in database:
   ```bash
   mysql -u root -p biocode -e "SHOW TABLES;"
   # Should show 12 tables
   ```

3. Re-run migrations:
   ```bash
   alembic upgrade head
   ```

---

## 📊 Database Schema

### Tables Overview
The database consists of 12 tables (11 data tables + alembic_version):

1. **departments** - Hospital departments
2. **suppliers** - Equipment suppliers
3. **users** - System users with roles
4. **locations** - Physical locations for equipment
5. **equipment** - Biomedical equipment inventory
6. **tickets** - Service tickets
7. **equipment_logs** - Service and maintenance logs
8. **equipment_history** - Historical repair records
9. **ticket_responses** - Service reports for completed tickets
10. **maintenance_schedules** - Scheduled maintenance
11. **notifications** - User notifications
12. **alembic_version** - Migration tracking (managed by Alembic)

### Key Tables

#### users
- id, email, full_name, password_hash
- role (super_admin, manager, department_head, support, department_incharge)
- support_type (biomed_tech, aircon_tech, plumber, carpenter, painter, electrician, it_staff, house_keeping, other)
- department_id (FK to departments)
- preferences (JSON: view mode, sidebar state)
- is_active, created_at, updated_at

#### equipment
- id, asset_tag, serial_number, device_name
- manufacturer, model, supplier_id (FK)
- status (active, out_of_service, retired)
- location_id (FK), department_id (FK)
- repair_count, total_downtime_minutes
- is_currently_down, last_downtime_start
- criticality (low, medium, high, critical)
- created_at, updated_at

#### tickets
- id, ticket_code, equipment_id (FK)
- title, description, concern
- status (open, in_progress, resolved, closed)
- priority (low, medium, high)
- reported_by_user_id (FK), assigned_to_user_id (FK)
- department_id (FK)
- completed_on, created_at, updated_at

#### maintenance_schedules
- id, equipment_id (FK)
- maintenance_type, frequency_days
- last_maintenance_date, next_maintenance_date
- assigned_to_user_id (FK)
- notes, is_active
- created_at, updated_at

#### notifications
- id, user_id (FK)
- title, message, notification_type
- related_entity_type, related_entity_id
- is_read, created_at, read_at

### Foreign Key Relationships
```
departments ─┬─→ users ─┬─→ tickets ─┬─→ equipment_history
             │          │            └─→ ticket_responses
             │          ├─→ equipment_logs
             │          ├─→ maintenance_schedules
             │          └─→ notifications
             └─→ equipment ─→ tickets

suppliers ───→ equipment

locations ───→ equipment
```

### Indexes
- users: email, department_id
- equipment: device_name, manufacturer+model, supplier_id, is_currently_down, criticality
- tickets: ticket_code
- equipment_logs: equipment_id, created_by_user_id, log_type, occurred_at
- maintenance_schedules: equipment_id, next_maintenance_date
- notifications: user_id, notification_type, is_read, created_at, user_id+is_read

---

## 🎯 Key Features by Role

### Super Admin Dashboard
- User management with CRUD operations
- Full access to all features
- System-wide statistics with interactive Chart.js visualizations
- Generate all reports (Equipment, Tickets, Maintenance)
- Manage departments and suppliers
- Close tickets

### Manager Dashboard
- Equipment and ticket management
- Assign tickets to support staff
- Update equipment status
- Close tickets
- Generate reports
- System-wide statistics with charts
- View repairs by department
- Cannot manage users

### Department Head Dashboard
- Department-specific equipment management
- View and assign department tickets
- Update equipment status
- Cannot close tickets
- Department statistics
- Limited to assigned department

### Support Dashboard
- Personal performance metrics with trend charts
- Assigned tickets only
- Ticket status updates (Open, In Progress, Resolved)
- Cannot close tickets
- Maintenance schedules assigned to them
- Cannot access equipment or departments pages
- Performance tracking (tickets resolved, avg resolution time)

### Department Incharge Dashboard
- Special landing page with action buttons
- Create new tickets (with equipment dropdown)
- **Can only view their own tickets**
- **Equipment and Departments sections hidden**
- Cannot modify ticket status to Resolved or Closed
- Simplified interface for non-technical staff

---

## 🔐 Security Features

### Authentication
- JWT token-based authentication
- OAuth2 password flow
- Secure password hashing with bcrypt
- Token expiration (configurable)
- Protected routes with role-based access

### Authorization
- Role-based access control (RBAC)
- Permission checks on all endpoints
- Department-based data isolation
- User can only see their assigned data (Support, Department Incharge)

### Data Protection
- SQL injection prevention (SQLAlchemy ORM)
- XSS protection (React escaping)
- CORS configuration
- Environment variable for sensitive data
- Password complexity requirements (coming soon)

### Best Practices
- Never commit .env files
- Use strong SECRET_KEY in production
- Regular security updates
- Database backups
- HTTPS in production
- Rate limiting (coming soon)

---

## 📝 Development Notes

### Code Style
- **Backend**: Follow PEP 8 Python style guide
- **Frontend**: ESLint configuration for TypeScript/React
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Add: description of changes"

# Push to remote
git push origin feature/your-feature-name

# Create pull request on GitHub
```

### Commit Message Convention
- **Add**: New feature or file
- **Update**: Modify existing feature
- **Fix**: Bug fix
- **Refactor**: Code restructuring
- **Docs**: Documentation changes
- **Style**: Formatting changes
- **Test**: Add or update tests

### Adding New Features

#### Backend (New Endpoint)
1. Add model to `backend/app/models.py`
2. Create migration: `alembic revision -m "add new table"`
3. Add schema to `backend/app/schemas.py`
4. Create router in `backend/app/routers_*.py`
5. Register router in `backend/app/main.py`
6. Add permissions in `backend/app/permissions.py`
7. Test endpoint in Swagger UI

#### Frontend (New Page)
1. Create component in `frontend/src/pages/`
2. Add route in `frontend/src/App.tsx`
3. Add navigation link in `frontend/src/components/Navigation.tsx`
4. Use API client from `frontend/src/lib/api.ts`
5. Add SweetAlert2 notifications
6. Test in browser

### Environment Variables
Never commit these files:
- `backend/.env`
- `frontend/.env`

Always update:
- `backend/.env.example`
- `frontend/.env.example`

### Database Changes
1. Update model in `backend/app/models.py`
2. Create migration: `alembic revision --autogenerate -m "description"`
3. Review generated migration file
4. Test migration: `alembic upgrade head`
5. Test rollback: `alembic downgrade -1`
6. Commit migration file

---

## 🚀 Roadmap

### Planned Features
- [ ] Dark mode support
- [ ] Email notifications
- [ ] SMS notifications for critical alerts
- [ ] Equipment QR code generation
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Equipment warranty tracking
- [ ] Spare parts inventory
- [ ] Vendor management
- [ ] Contract management
- [ ] Document attachments (PDFs, images)
- [ ] Equipment calibration tracking
- [ ] Audit logs
- [ ] Two-factor authentication (2FA)
- [ ] Password reset via email
- [ ] User activity tracking
- [ ] Advanced search with filters
- [ ] Export to PDF
- [ ] Scheduled report generation
- [ ] Dashboard widgets customization
- [ ] Real-time chat for support
- [ ] Equipment location tracking (GPS)
- [ ] Barcode scanning
- [ ] Integration with hospital systems (HL7, FHIR)

### Version History
- **v2.0.0** (Feb 2026) - Migration restructure, user preferences, notifications
- **v1.5.0** (Feb 2026) - Reports, maintenance schedules, analytics
- **v1.0.0** (Jan 2026) - Initial release

---

## 📚 Additional Documentation

### Main Documentation
- **README.md** (this file) - Comprehensive documentation
- **QUICKSTART.md** - Quick start guide
- **SETUP_NEW_COMPUTER.md** - Setup on new computer

### Deployment & Setup
- **DEPLOYMENT_GUIDE.md** - Detailed deployment instructions
- **SETUP_SUMMARY.md** - Setup summary
- **MIGRATION_CHECKLIST.md** - Migration checklist

### Database & Migrations
- **backend/DATABASE_SETUP.md** - Database setup details
- **backend/MIGRATION_GUIDE.md** - Migration guide
- **backend/TEST_MIGRATIONS.md** - Migration testing guide
- **backend/alembic/versions/README.md** - Migration files overview
- **backend/alembic/versions/MIGRATION_ORDER.md** - Migration order reference
- **MIGRATION_CONSOLIDATION_SUMMARY.md** - Migration restructure details

### Frontend
- **frontend/README.md** - Frontend-specific documentation

---

## 🤝 Contributing

### How to Contribute
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Update documentation
6. Submit a pull request

### Code Review Process
- All changes require code review
- Tests must pass
- Documentation must be updated
- Follow code style guidelines

### Reporting Issues
- Use GitHub Issues
- Provide detailed description
- Include steps to reproduce
- Add screenshots if applicable
- Specify environment (OS, browser, versions)

---

## 📄 License

This project is proprietary software for biomedical equipment management.

---

## 👨‍💻 Support & Contact

For issues, questions, or support:
- Create an issue on GitHub
- Contact the development team
- Check documentation files

---

## 🙏 Acknowledgments

- FastAPI for the excellent Python web framework
- React team for the powerful frontend library
- Tailwind CSS for the utility-first CSS framework
- Chart.js for beautiful charts
- SweetAlert2 for elegant modals
- SQLAlchemy for the robust ORM
- Alembic for database migrations
- All contributors and testers

---

## 📊 Project Statistics

- **Backend**: Python, FastAPI, SQLAlchemy, MySQL
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Database Tables**: 12 (11 data tables + alembic_version)
- **Migration Files**: 12 (one per table)
- **User Roles**: 5 (Super Admin, Manager, Department Head, Support, Department Incharge)
- **Support Types**: 9 (Biomed Tech, Aircon, Plumber, Carpenter, Painter, Electrician, IT, House Keeping, Other)
- **API Endpoints**: 50+
- **Pages**: 15+
- **Components**: 10+

---

**Version**: 2.0.0  
**Last Updated**: February 12, 2026  
**Status**: Active Development

---

## 🎉 Quick Commands Reference

```bash
# Backend
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
alembic upgrade head
python seed_database.py
python reset_database.py

# Frontend
cd frontend
npm install
npm run dev
npm run build

# Database
mysql -u root -p
CREATE DATABASE biocode CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
mysqldump -u root -p biocode > backup.sql
mysql -u root -p biocode < backup.sql

# Migrations
alembic current
alembic history
alembic upgrade head
alembic downgrade -1
alembic revision -m "description"

# Git
git status
git add .
git commit -m "message"
git push origin main
```

---

**🎯 Ready to get started? Follow the [Quick Setup](#-quick-setup) section above!**
