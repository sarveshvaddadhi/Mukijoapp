import sys
sys.path.append("c:/Users/Admin/Desktop/Mukijoapp/backend")
from database import SessionLocal
import models

db = SessionLocal()
try:
    print("Clearing existing bookings, venue-sports relationships and venues...")
    
    # 1. Clear venue_id in Team to avoid FK violations
    db.query(models.Team).update({models.Team.venue_id: None})
    db.commit()

    # 2. Delete venue bookings
    db.query(models.VenueBooking).delete()
    db.commit()

    # 3. Delete venue sports
    db.query(models.VenueSport).delete()
    db.commit()

    # 4. Delete venues
    db.query(models.Venue).delete()
    db.commit()

    print("Seeding new venues for Delhi, Mumbai, and Bangalore...")

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

    sports = db.query(models.Sport).all()
    print(f"Loaded {len(sports)} sports from DB.")

    for v_data in SEED_VENUES:
        v = models.Venue(**v_data)
        db.add(v)
        db.flush()
        
        # Link venues to sports
        for s in sports:
            vs = models.VenueSport(venue_id=v.id, sport_id=s.id)
            db.add(vs)
            
    db.commit()
    print("Database seeding completed successfully!")
    
    # Verify count
    print("New Venue Count in DB:", db.query(models.Venue).count())
    
finally:
    db.close()
