import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
import models, schemas

router = APIRouter(prefix="/api")

def haversine(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance in kilometers between two points 
    on the earth (specified in decimal degrees)
    """
    if None in (lat1, lon1, lat2, lon2):
        return float('inf')
    # convert decimal degrees to radians 
    lon1, lat1, lon2, lat2 = map(math.radians, [lon1, lat1, lon2, lat2])

    # haversine formula 
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a)) 
    r = 6371 # Radius of earth in kilometers.
    return c * r

SEED_VENUES = [
    # New Delhi
    {"name": "Delhi Sports Complex", "address": "Siri Fort Road, New Delhi", "lat": 28.5522, "lng": 77.2198, "rating": 4.5, "is_available": True},
    {"name": "National Stadium", "address": "India Gate Circle, New Delhi", "lat": 28.6128, "lng": 77.2374, "rating": 4.8, "is_available": True},
    {"name": "Yamuna Sports Complex", "address": "Surajmal Vihar, New Delhi", "lat": 28.6586, "lng": 77.3082, "rating": 4.2, "is_available": False},
    {"name": "Talkatora Indoor Stadium", "address": "Talkatora Garden, New Delhi", "lat": 28.6253, "lng": 77.1950, "rating": 4.6, "is_available": True},
    {"name": "Jawaharlal Nehru Stadium", "address": "Pragati Vihar, New Delhi", "lat": 28.5826, "lng": 77.2343, "rating": 4.9, "is_available": True},
    
    # Mumbai
    {"name": "BKC Sports Complex", "address": "Bandra Kurla Complex, Mumbai", "lat": 19.0596, "lng": 72.8727, "rating": 4.7, "is_available": True},
    {"name": "Wankhede Club Arena", "address": "Churchgate, Mumbai", "lat": 18.9389, "lng": 72.8258, "rating": 4.8, "is_available": True},
    {"name": "D.Y. Patil Stadium Courts", "address": "Nerul, Navi Mumbai", "lat": 19.0413, "lng": 73.0182, "rating": 4.4, "is_available": True},
    {"name": "Mumbai Football Arena", "address": "Andheri West, Mumbai", "lat": 19.1290, "lng": 72.8335, "rating": 4.6, "is_available": True},

    # Bangalore
    {"name": "Kanteerava Outdoor Arena", "address": "Kasturba Road, Bangalore", "lat": 12.9698, "lng": 77.5978, "rating": 4.6, "is_available": True},
    {"name": "M. Chinnaswamy Arena", "address": "MG Road, Bangalore", "lat": 12.9788, "lng": 77.5960, "rating": 4.8, "is_available": True},
    {"name": "Padukone-Dravid CSE", "address": "Yelahanka, Bangalore", "lat": 13.1423, "lng": 77.6101, "rating": 4.9, "is_available": True},
    {"name": "Decathlon Sports Arena", "address": "Sarjapur Road, Bangalore", "lat": 12.9069, "lng": 77.6974, "rating": 4.5, "is_available": True}
]

@router.get("/venues", response_model=list[schemas.VenueResponse])
def get_venues(
    sport_id: Optional[str] = None,
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    radius_km: Optional[float] = Query(20.0),
    db: Session = Depends(get_db)
):
    try:
        # Check if we need to seed venues
        count = db.query(models.Venue).count()
        if count == 0:
            for v_data in SEED_VENUES:
                v = models.Venue(**v_data)
                db.add(v)
                db.flush()
                # Optional: link to all sports for easy testing
                sports = db.query(models.Sport).all()
                for s in sports:
                    vs = models.VenueSport(venue_id=v.id, sport_id=s.id)
                    db.add(vs)
            db.commit()

        query = db.query(models.Venue)
        
        if sport_id:
            query = query.join(models.VenueSport).filter(models.VenueSport.sport_id == sport_id)
            
        venues = query.all()
        
        # Calculate distance and filter if coords are provided
        if lat is not None and lng is not None:
            filtered_venues = []
            for v in venues:
                if v.lat is not None and v.lng is not None:
                    distance = haversine(lat, lng, v.lat, v.lng)
                    if distance <= radius_km:
                        v.distance_km = round(distance, 1)
                        filtered_venues.append(v)
            # Sort by distance
            filtered_venues.sort(key=lambda x: x.distance_km)
            return filtered_venues
            
        # If no coords, just return the list
        return venues
    except Exception as e:
        print("Get venues error:", e)
        raise HTTPException(status_code=500, detail="Server error")

@router.post("/venues/bookings", response_model=schemas.VenueBookingResponse)
def create_venue_booking(
    payload: schemas.VenueBookingCreate,
    userId: int = Query(...),
    db: Session = Depends(get_db)
):
    # Verify booker user exists
    user = db.query(models.User).filter(models.User.id == userId).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Verify venue exists and is available
    venue = db.query(models.Venue).filter(models.Venue.id == payload.venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    if not venue.is_available:
        raise HTTPException(status_code=400, detail="This venue is currently not available for bookings")

    # Verify team exists
    team = db.query(models.Team).filter(models.Team.id == payload.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Start and End Time validation
    if payload.start_time >= payload.end_time:
        raise HTTPException(status_code=400, detail="End time must be after start time")

    # Conflict check for venue
    conflict = db.query(models.VenueBooking).filter(
        models.VenueBooking.venue_id == payload.venue_id,
        models.VenueBooking.status == "CONFIRMED",
        models.VenueBooking.start_time < payload.end_time,
        models.VenueBooking.end_time > payload.start_time
    ).first()
    if conflict:
        raise HTTPException(
            status_code=400,
            detail=f"Venue conflict: Already booked from {conflict.start_time.strftime('%I:%M %p')} to {conflict.end_time.strftime('%I:%M %p')}."
        )

    # Conflict check for team (team coordination)
    team_conflict = db.query(models.VenueBooking).filter(
        models.VenueBooking.team_id == payload.team_id,
        models.VenueBooking.status == "CONFIRMED",
        models.VenueBooking.start_time < payload.end_time,
        models.VenueBooking.end_time > payload.start_time
    ).first()
    if team_conflict:
        raise HTTPException(
            status_code=400,
            detail=f"Team conflict: Your team is already booking {team_conflict.venue.name} from {team_conflict.start_time.strftime('%I:%M %p')} to {team_conflict.end_time.strftime('%I:%M %p')}."
        )

    # Create the booking
    booking = models.VenueBooking(
        venue_id=payload.venue_id,
        team_id=payload.team_id,
        booker_id=userId,
        start_time=payload.start_time,
        end_time=payload.end_time,
        purpose=payload.purpose,
        status="CONFIRMED"
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    # Prepare response
    return schemas.VenueBookingResponse(
        id=booking.id,
        venue_id=booking.venue_id,
        team_id=booking.team_id,
        booker_id=booking.booker_id,
        start_time=booking.start_time,
        end_time=booking.end_time,
        purpose=booking.purpose,
        status=booking.status,
        createdAt=booking.createdAt,
        venue_name=venue.name,
        team_name=team.name,
        booker_name=user.name
    )


@router.get("/venues/bookings", response_model=list[schemas.VenueBookingResponse])
def get_venue_bookings(
    venue_id: Optional[int] = None,
    team_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.VenueBooking)
    if venue_id:
        query = query.filter(models.VenueBooking.venue_id == venue_id)
    if team_id:
        query = query.filter(models.VenueBooking.team_id == team_id)

    bookings = query.order_by(models.VenueBooking.start_time.asc()).all()

    response_list = []
    for b in bookings:
        res = schemas.VenueBookingResponse(
            id=b.id,
            venue_id=b.venue_id,
            team_id=b.team_id,
            booker_id=b.booker_id,
            start_time=b.start_time,
            end_time=b.end_time,
            purpose=b.purpose,
            status=b.status,
            createdAt=b.createdAt,
            venue_name=b.venue.name if b.venue else "Unknown Venue",
            team_name=b.team.name if b.team else "Unknown Team",
            booker_name=b.booker.name if b.booker else "Unknown Booker"
        )
        response_list.append(res)

    return response_list


@router.delete("/venues/bookings/{booking_id}")
def delete_venue_booking(
    booking_id: int,
    db: Session = Depends(get_db)
):
    booking = db.query(models.VenueBooking).filter(models.VenueBooking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    db.delete(booking)
    db.commit()
    return {"message": "Booking deleted successfully"}


@router.post("/venues", response_model=schemas.VenueResponse)
def create_venue(
    payload: schemas.VenueCreate,
    userId: int = Query(...),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == userId).first()
    if not user or user.role not in ("COACH", "ADMIN"):
        raise HTTPException(status_code=403, detail="Not authorized to create venues")

    venue = models.Venue(
        name=payload.name,
        address=payload.address,
        lat=payload.lat if payload.lat is not None else 28.6139,
        lng=payload.lng if payload.lng is not None else 77.2090,
        description=payload.description,
        rating=4.5,
        is_available=True
    )
    db.add(venue)
    db.flush()

    if payload.sports:
        for sport_id in payload.sports:
            sport = db.query(models.Sport).filter(models.Sport.id == sport_id).first()
            if sport:
                vs = models.VenueSport(venue_id=venue.id, sport_id=sport.id)
                db.add(vs)
    else:
        sports = db.query(models.Sport).all()
        for s in sports:
            vs = models.VenueSport(venue_id=venue.id, sport_id=s.id)
            db.add(vs)

    db.commit()
    db.refresh(venue)
    return venue


@router.put("/venues/{venue_id}", response_model=schemas.VenueResponse)
def update_venue(
    venue_id: int,
    payload: schemas.VenueCreate,
    userId: int = Query(...),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == userId).first()
    if not user or user.role not in ("COACH", "ADMIN"):
        raise HTTPException(status_code=403, detail="Not authorized to update venues")

    venue = db.query(models.Venue).filter(models.Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")

    venue.name = payload.name
    venue.address = payload.address
    if payload.lat is not None:
        venue.lat = payload.lat
    if payload.lng is not None:
        venue.lng = payload.lng
    if payload.description is not None:
        venue.description = payload.description

    if payload.sports is not None:
        db.query(models.VenueSport).filter(models.VenueSport.venue_id == venue_id).delete()
        for sport_id in payload.sports:
            sport = db.query(models.Sport).filter(models.Sport.id == sport_id).first()
            if sport:
                vs = models.VenueSport(venue_id=venue.id, sport_id=sport.id)
                db.add(vs)

    db.commit()
    db.refresh(venue)
    return venue


@router.delete("/venues/{venue_id}")
def delete_venue(
    venue_id: int,
    userId: int = Query(...),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == userId).first()
    if not user or user.role not in ("COACH", "ADMIN"):
        raise HTTPException(status_code=403, detail="Not authorized to delete venues")

    venue = db.query(models.Venue).filter(models.Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")

    db.delete(venue)
    db.commit()
    return {"message": "Venue deleted successfully"}


@router.get("/venues/{venue_id}", response_model=schemas.VenueResponse)
def get_venue(venue_id: int, db: Session = Depends(get_db)):
    venue = db.query(models.Venue).filter(models.Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    return venue



