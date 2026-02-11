# Biocode - Quick Start Guide

Get the Biocode application up and running in minutes!

## Prerequisites

- Python 3.8+
- Node.js 16+
- MySQL 8.0+
- Git

## 1. Clone Repository

```bash
git clone <repository-url>
cd biocode
```

## 2. Backend Setup

### Install Dependencies

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Configure Environment

Create `backend/.env`:

```env
DATABASE_URL=mysql+pymysql://root:@localhost/biocode
SECRET_KEY=your-secret-key-change-this-in-production
```

### Setup Database

```bash
# Create MySQL database
mysql -u root -p -e "CREATE DATABASE biocode CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Reset database (creates schema and seeds data)
python reset_database.py
```

This creates:
- 11 users (1 super admin, 1 manager, 5 support staff, 4 dept incharge)
- 9 departments
- 22 equipment items
- 15 tickets
- 22 maintenance schedules
- 47 notifications

### Start Backend Server

```bash
uvicorn app.main:app --reload
```

Backend runs on: http://localhost:8000
API Docs: http://localhost:8000/docs

## 3. Frontend Setup

### Install Dependencies

```bash
cd frontend
npm install
```

### Configure Environment

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### Start Frontend Server

```bash
npm run dev
```

Frontend runs on: http://localhost:5173

## 4. Login

Open http://localhost:5173 and login with:

### Super Admin (Full Access)
- Email: `superadmin@biocode.com`
- Password: `admin123`

### Manager (IT Department)
- Email: `manager@biocode.com`
- Password: `manager123`

### Support Staff (Biomed Tech)
- Email: `support1@biocode.com`
- Password: `support123`

### Department Incharge (Emergency Dept)
- Email: `incharge1@biocode.com`
- Password: `incharge123`

## 5. Explore Features

### As Super Admin
- ✅ User Management - Create/edit users
- ✅ Equipment Management - Add/edit equipment
- ✅ Department Management - Manage departments
- ✅ Ticket Management - View all tickets
- ✅ Reports - Generate Excel reports
- ✅ Maintenance Schedules - View all schedules
- ✅ Notifications - System-wide notifications

### As Manager
- ✅ Equipment Management
- ✅ Department Management
- ✅ Ticket Assignment
- ✅ Reports Generation
- ✅ Maintenance Schedules
- ❌ User Management (Super Admin only)

### As Support Staff
- ✅ View Assigned Tickets
- ✅ Update Ticket Status
- ✅ Personal Dashboard
- ✅ Maintenance Tasks
- ❌ Cannot close tickets
- ❌ Cannot access equipment/departments pages

### As Department Incharge
- ✅ Create Tickets
- ✅ View Own Tickets
- ✅ Special Landing Page
- ❌ Cannot view other users' tickets
- ❌ Cannot access equipment/departments pages

## Troubleshooting

### Backend won't start
```bash
# Check if MySQL is running
mysql -u root -p

# Verify database exists
mysql -u root -p -e "SHOW DATABASES;"

# Check .env file exists and has correct DATABASE_URL
cat backend/.env
```

### Frontend won't start
```bash
# Clear node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Database errors
```bash
# Reset database completely
cd backend
python reset_database.py
```

### Migration conflicts
```bash
# Check current migration
cd backend
python -m alembic current

# Should show: 0001_initial_complete_schema (head)
```

## Development Scripts

### Backend
```bash
cd backend

# Start server
uvicorn app.main:app --reload

# Reset database
python reset_database.py

# Seed database only
python seed_database.py

# Check migration status
python -m alembic current
```

### Frontend
```bash
cd frontend

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Project Structure

```
biocode/
├── backend/
│   ├── alembic/              # Database migrations
│   ├── app/
│   │   ├── models.py         # Database models
│   │   ├── schemas.py        # Pydantic schemas
│   │   ├── main.py           # FastAPI app
│   │   ├── auth.py           # Authentication
│   │   ├── routers_*.py      # API endpoints
│   │   └── ...
│   ├── seed_database.py      # Database seeder
│   ├── reset_database.py     # Database reset script
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── pages/            # React pages
│   │   ├── components/       # React components
│   │   ├── lib/              # Utilities
│   │   └── ...
│   ├── package.json          # Node dependencies
│   └── vite.config.ts        # Vite config
└── README.md                 # Full documentation
```

## Next Steps

1. ✅ Application running
2. 📖 Read [README.md](README.md) for full documentation
3. 📖 Read [DATABASE_SETUP.md](backend/DATABASE_SETUP.md) for database details
4. 🔧 Customize for your needs
5. 🚀 Deploy to production

## Support

For detailed documentation:
- Main README: [README.md](README.md)
- Database Setup: [backend/DATABASE_SETUP.md](backend/DATABASE_SETUP.md)
- Migration Guide: [backend/alembic/versions/README.md](backend/alembic/versions/README.md)

## Quick Commands Reference

```bash
# Backend
cd backend && uvicorn app.main:app --reload

# Frontend
cd frontend && npm run dev

# Reset Database
cd backend && python reset_database.py

# Check Migration
cd backend && python -m alembic current
```

Happy coding! 🎉
