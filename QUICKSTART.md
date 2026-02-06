# Biocode - Quick Start Guide

Get the Biocode application running in 5 minutes!

## Prerequisites

- Python 3.8+
- Node.js 16+
- MySQL 8.0+

## Quick Setup (5 Steps)

### 1. Install Backend Dependencies
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### 3. Setup Database (One Command)
```bash
cd backend
./setup_complete.sh
cd ..
```

This will:
- Create MySQL database
- Run all migrations
- Seed sample data
- Create default users

### 4. Start Application
```bash
./start.sh
```

### 5. Open Browser
Navigate to: **http://localhost:5173**

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@biocode.com | admin123 |
| Supervisor | supervisor@biocode.com | supervisor123 |
| Tech | tech1@biocode.com | tech123 |
| Viewer | viewer@biocode.com | viewer123 |

## Stop Application
```bash
./stop.sh
```

## Manual Start (Alternative)

### Terminal 1 - Backend
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

## Troubleshooting

### MySQL Connection Error
```bash
# Start MySQL
mysql.server start  # macOS
sudo service mysql start  # Linux

# Test connection
mysql -u root -p
```

### Port Already in Use
```bash
# Kill process on port 8000 (backend)
lsof -ti:8000 | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

### Reset Database
```bash
cd backend
mysql -u root -e "DROP DATABASE biocode;"
./setup_complete.sh
```

## Next Steps

- Read full documentation: [README.md](README.md)
- Explore API: http://127.0.0.1:8000/docs
- Check project structure
- Review user roles and permissions

## Support

For detailed documentation, see [README.md](README.md)
