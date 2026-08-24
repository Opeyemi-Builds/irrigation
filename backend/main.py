from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.ai import router as ai_router
from app.routes.sensors import router as sensors_router
from app.config import get_settings

settings = get_settings()

app = FastAPI(
    title="AgroSense API",
    description="Smart irrigation system — AI advisor + live sensor telemetry",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_router,      prefix="/api/v1")
app.include_router(sensors_router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok", "service": "AgroSense API"}

@app.get("/")
def root():
    return {"name": "AgroSense API", "version": "1.0.0", "docs": "/docs"}
