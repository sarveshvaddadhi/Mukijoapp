import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
from urllib.parse import quote_plus

# Load database environment configuration
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", "frontend", ".env"))
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "postgresql://postgres:Sarvesh@123@localhost:5432/mukijo_db"

# Normalize postgres:// to postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Safely URL encode password if it contains special characters like @
if DATABASE_URL.startswith("postgresql://"):
    prefix = "postgresql://"
    remaining = DATABASE_URL[len(prefix):]
    if "@" in remaining:
        parts = remaining.split("@")
        credentials = "@".join(parts[:-1]) # everything before last '@'
        host_port_db = parts[-1]           # host:port/db
        if ":" in credentials:
            user_part, password_part = credentials.split(":", 1)
            encoded_password = quote_plus(password_part)
            DATABASE_URL = f"{prefix}{user_part}:{encoded_password}@{host_port_db}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
