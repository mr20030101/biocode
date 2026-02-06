#!/bin/bash

# Biocode Application Stop Script
# Stops both backend and frontend servers

echo "========================================="
echo "Stopping Biocode Application"
echo "========================================="
echo ""

# Stop backend
if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "Stopping backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        echo "✓ Backend stopped"
    else
        echo "Backend not running"
    fi
    rm .backend.pid
else
    echo "Backend PID file not found"
fi

# Stop frontend
if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "Stopping frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        echo "✓ Frontend stopped"
    else
        echo "Frontend not running"
    fi
    rm .frontend.pid
else
    echo "Frontend PID file not found"
fi

echo ""
echo "Application stopped"
echo ""
