from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Core Routers
from .routers_auth import router as auth_router
from .routers_equipment import router as equipment_router
from .routers_departments import router as departments_router
from .routers_machine_readings import router as machine_readings_router
from .routers_tickets import router as tickets_router

# Working Feature Routers
from .routers_notifications import router as notifications_router
from .routers_reports import router as reports_router
from .routers_analytics import router as analytics_router
from .routers_user_preferences import router as user_preferences_router

# Disabled routers (models not implemented yet)
# from .routers_maintenance import router as maintenance_router


app = FastAPI(title="Biocode Biomedical Equipment API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core APIs
app.include_router(auth_router)
app.include_router(equipment_router)
app.include_router(departments_router)
app.include_router(machine_readings_router)
app.include_router(tickets_router)

# Feature APIs
app.include_router(analytics_router)
app.include_router(reports_router)
app.include_router(notifications_router)
app.include_router(user_preferences_router)

# app.include_router(maintenance_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
