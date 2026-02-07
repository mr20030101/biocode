from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers_auth import router as auth_router
from .routers_equipment import router as equipment_router
from .routers_departments import router as departments_router
from .routers_tickets import router as tickets_router
from .routers_maintenance import router as maintenance_router


app = FastAPI(title="Biocode Biomedical Equipment API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(equipment_router)
app.include_router(departments_router)
app.include_router(tickets_router)
app.include_router(maintenance_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}

