#!/bin/bash

# Biocode Application Startup Script
# Starts both backend and frontend servers

set -e

echo "========================================="
echo "Starting Biocode Application"
echo "========================================="
echo ""

# Check if setup has been run
if [ ! -f backend/.env ]; then
    echo "Error: Backend not configured. Please run setup first:"
    echo "  cd backend && ./setup_complete.sh"
    exit 1
fi

if [ ! -d frontend/node_modules ]; then
    echo "Error: Frontend dependencies not installed. Please run:"
    echo "  cd frontend && npm install"
    exit 1
fi

# Start backend in background
echo "Starting backend server..."
cd backend
source .venv/bin/activate 2>/dev/null || true
uvicorn app.main:app --reload > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..
echo "✓ Backend started (PID: $BACKEND_PID)"
echo "  Logs: backend.log"
echo "  URL: http://127.0.0.1:8000"
echo "  API Docs: http://127.0.0.1:8000/docs"
echo ""

# Wait for backend to start
echo "Waiting for backend to be ready..."
sleep 3

# Start frontend in background
echo "Starting frontend server..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo "✓ Frontend started (PID: $FRONTEND_PID)"
echo "  Logs: frontend.log"
echo "  URL: http://localhost:5173"
echo ""

# Save PIDs
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

echo "========================================="
echo "Application Started Successfully!"
echo "========================================="
echo ""
echo "Frontend: http://localhost:5173"
echo "Backend:  http://127.0.0.1:8000"
echo "API Docs: http://127.0.0.1:8000/docs"
echo ""
echo "To stop the application, run:"
echo "  ./stop.sh"
echo ""
echo "Or manually kill processes:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo ""
