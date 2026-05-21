from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, teams, events, attendance, payments, communication


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Mukijo Sports API",
    description="Python FastAPI Backend for Mukijo Sports Application",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
