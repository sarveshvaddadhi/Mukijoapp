from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, teams, events, attendance, payments, communication

# Create tables in the database if they do not exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Mukijo Sports API",
    description="Python FastAPI Backend for Mukijo Sports Application",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Since rewrites will proxy request from the Next.js origin, CORS is relaxed.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(teams.router)
app.include_router(events.router)
app.include_router(attendance.router)
app.include_router(payments.router)
app.include_router(communication.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Mukijo Sports API",
        "framework": "FastAPI (Python)"
    }
