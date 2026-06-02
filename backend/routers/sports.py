import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas

router = APIRouter(prefix="/api")

# Predefined sports for seeding
SEED_SPORTS = [
    {"id": "football", "name": "Football", "slug": "football", "icon_url": "⚽", "accent_color": "#00E676"},
    {"id": "basketball", "name": "Basketball", "slug": "basketball", "icon_url": "🏀", "accent_color": "#FF6D00"},
    {"id": "cricket", "name": "Cricket", "slug": "cricket", "icon_url": "🏏", "accent_color": "#1DE9B6"},
    {"id": "tennis", "name": "Tennis", "slug": "tennis", "icon_url": "🎾", "accent_color": "#C6FF00"},
    {"id": "volleyball", "name": "Volleyball", "slug": "volleyball", "icon_url": "🏐", "accent_color": "#FFD600"},
    {"id": "badminton", "name": "Badminton", "slug": "badminton", "icon_url": "🏸", "accent_color": "#FF4081"},
    {"id": "swimming", "name": "Swimming", "slug": "swimming", "icon_url": "🏊", "accent_color": "#00B0FF"},
    {"id": "athletics", "name": "Athletics", "slug": "athletics", "icon_url": "🏃", "accent_color": "#FF1744"},
    {"id": "rugby", "name": "Rugby", "slug": "rugby", "icon_url": "🏉", "accent_color": "#3D5AFE"},
    {"id": "hockey", "name": "Hockey", "slug": "hockey", "icon_url": "🏑", "accent_color": "#18FFFF"},
    {"id": "baseball", "name": "Baseball", "slug": "baseball", "icon_url": "⚾", "accent_color": "#F44336"},
    {"id": "cycling", "name": "Cycling", "slug": "cycling", "icon_url": "🚴", "accent_color": "#76FF03"}
]

@router.get("/sports", response_model=list[schemas.SportResponse])
def get_sports(db: Session = Depends(get_db)):
    try:
        sports = db.query(models.Sport).filter(models.Sport.is_active == True).all()
        if not sports:
            # Seed the database if empty
            for s in SEED_SPORTS:
                sport = models.Sport(**s)
                db.add(sport)
            db.commit()
            sports = db.query(models.Sport).filter(models.Sport.is_active == True).all()
        return sports
    except Exception as e:
        print("Get sports error:", e)
        raise HTTPException(status_code=500, detail="Server error")
