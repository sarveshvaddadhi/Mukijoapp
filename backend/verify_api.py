import requests
import json
import random

BASE_URL = "http://127.0.0.1:8000/api"

def run_tests():
    print("=== STARTING MUKIJO API VERIFICATION ===")
    
    try:
        res = requests.get("http://127.0.0.1:8000/")
        print("Root response status:", res.status_code)
        print("Root response content:", res.json())
    except Exception as e:
        print("Failed to connect to FastAPI root. Is the server running?", e)
        return

    rand_id = random.randint(1000, 9999)
    email = f"coach_{rand_id}@mukijo.com"
    phone = f"98765{rand_id}"
    aadhaar = f"11112222{rand_id}"
    password = "password123"

    # 2. Aadhaar Send OTP Test
    print("\n1. Testing send-aadhaar-otp...")
    res = requests.post(f"{BASE_URL}/auth/send-aadhaar-otp", json={
        "aadhaarNo": aadhaar,
        "phone": phone
    })
    print("Send OTP status:", res.status_code)
    print("Send OTP body:", res.json())

    # 3. Aadhaar Verify OTP Test
    print("\n2. Testing verify-aadhaar-otp...")
    res = requests.post(f"{BASE_URL}/auth/verify-aadhaar-otp", json={
        "aadhaarNo": aadhaar,
        "otp": "123456",
        "code": "123456"
    })
    print("Verify OTP status:", res.status_code)
    print("Verify OTP body:", res.json())

    # 4. Register Test
    print("\n3. Testing user registration...")
    res = requests.post(f"{BASE_URL}/auth/register", json={
        "name": "Sarvesh Coach",
        "email": email,
        "phone": phone,
        "password": password,
        "role": "COACH",
        "aadhaarNo": aadhaar,
        "aadhaarVerified": True
    })
    print("Register status:", res.status_code)
    print("Register body:", res.json())
    
    if res.status_code != 200:
        print("Registration failed, stopping test.")
        return
        
    user_id = res.json()["user"]["id"]

    # 5. Login Test
    print("\n4. Testing login...")
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email,
        "password": password
    })
    print("Login status:", res.status_code)
    print("Login body:", res.json())
    
    # 6. Create Team Test
    print("\n5. Testing create team...")
    res = requests.post(f"{BASE_URL}/teams", json={
        "name": f"Dynamic Eagles {rand_id}",
        "division": "Under 15",
        "description": "Premium coaching team"
    }, params={"userId": user_id})
    print("Create team status:", res.status_code)
    print("Create team body:", res.json())
    
    if res.status_code not in (200, 201):
        print("Create team failed, stopping.")
        return
        
    team_id = res.json()["team"]["id"]

    # 7. Create Event Test
    print("\n6. Testing create event...")
    from datetime import datetime, timedelta
    event_date = (datetime.now() + timedelta(days=2)).isoformat()
    res = requests.post(f"{BASE_URL}/events", json={
        "title": "Championship Practice",
        "type": "TRAINING",
        "description": "Bring running gear",
        "location": "Main turf ground",
        "date": event_date,
        "teamId": team_id,
        "createdById": user_id
    }, params={"userId": user_id})
    print("Create event status:", res.status_code)
    print("Create event body:", res.json())

    # 8. Venue Booking Test
    print("\n7. Testing venue bookings and CRUD...")
    # 1. Create a custom venue
    print("\nCreating custom venue...")
    res = requests.post(f"{BASE_URL}/venues", json={
        "name": "Verification Arena",
        "address": "Test Street 10, Noida",
        "description": "Custom verified stadium for integration testing",
        "lat": 28.6139,
        "lng": 77.2090
    }, params={"userId": user_id})
    print("Create venue status:", res.status_code)
    print("Create venue response:", res.json())
    if res.status_code != 200:
        print("Venue creation failed.")
        return
    custom_venue = res.json()
    venue_id = custom_venue["id"]

    # 2. Update the custom venue
    print("\nUpdating custom venue...")
    res = requests.put(f"{BASE_URL}/venues/{venue_id}", json={
        "name": "Verification Arena (Updated)",
        "address": "Test Street 10, Noida",
        "description": "Updated custom verified stadium description",
        "lat": 28.6140,
        "lng": 77.2091
    }, params={"userId": user_id})
    print("Update venue status:", res.status_code)
    print("Update venue response:", res.json())
    if res.status_code != 200:
        print("Venue update failed.")
        return

    # Fetch venues list to verify it's there
    res = requests.get(f"{BASE_URL}/venues")
    venues = res.json()
    print("Total venues after creation:", len(venues))

    # Create Booking at this new venue
    random_days = random.randint(10, 1000)
    base_start = datetime.now() + timedelta(days=random_days, hours=2)
    base_end = datetime.now() + timedelta(days=random_days, hours=4)
    start_time = base_start.isoformat()
    end_time = base_end.isoformat()
    booking_payload = {
        "venue_id": venue_id,
        "team_id": team_id,
        "start_time": start_time,
        "end_time": end_time,
        "purpose": "Verification Test Practice"
    }
    
    print("\nCreating valid booking at custom venue...")
    res = requests.post(f"{BASE_URL}/venues/bookings", json=booking_payload, params={"userId": user_id})
    print("Create booking status:", res.status_code)
    print("Create booking response:", res.json())
    if res.status_code != 200:
        print("Booking creation failed.")
        return
    booking_id = res.json()["id"]

    # Test Overlap Conflict
    print("\nTesting overlapping conflict (same venue, same time)...")
    res = requests.post(f"{BASE_URL}/venues/bookings", json={
        "venue_id": venue_id,
        "team_id": team_id,
        "start_time": (base_start + timedelta(hours=1)).isoformat(),
        "end_time": (base_start + timedelta(hours=3)).isoformat(),
        "purpose": "Overlapping Conflict Test"
    }, params={"userId": user_id})
    print("Overlapping booking status (expected 400):", res.status_code)
    print("Overlapping booking response:", res.json())

    # Test Team Conflict (different venue, same time)
    if len(venues) > 1:
        other_venue_id = venues[0]["id"] if venues[0]["id"] != venue_id else venues[1]["id"]
        print(f"\nTesting team coordination conflict (different venue ID {other_venue_id}, same time)...")
        res = requests.post(f"{BASE_URL}/venues/bookings", json={
            "venue_id": other_venue_id,
            "team_id": team_id,
            "start_time": (base_start + timedelta(hours=1)).isoformat(),
            "end_time": (base_start + timedelta(hours=2)).isoformat(),
            "purpose": "Team Overlap Test"
        }, params={"userId": user_id})
        print("Team overlap status (expected 400):", res.status_code)
        print("Team overlap response:", res.json())

    # Get Bookings list
    print("\nFetching all bookings...")
    res = requests.get(f"{BASE_URL}/venues/bookings")
    bookings = res.json()
    print("Total bookings in list:", len(bookings))

    # Delete Booking
    print(f"\nCancelling booking (ID: {booking_id})...")
    res = requests.delete(f"{BASE_URL}/venues/bookings/{booking_id}")
    print("Delete booking status:", res.status_code)
    print("Delete booking body:", res.json())

    # 3. Delete the custom venue
    print(f"\nDeleting custom venue (ID: {venue_id})...")
    res = requests.delete(f"{BASE_URL}/venues/{venue_id}", params={"userId": user_id})
    print("Delete venue status:", res.status_code)
    print("Delete venue body:", res.json())

    # Fetch venues list to make sure it's gone
    res = requests.get(f"{BASE_URL}/venues")
    print("Total venues after cleanup:", len(res.json()))

    print("\n=== MUKIJO API VERIFICATION COMPLETED ===")

if __name__ == "__main__":
    run_tests()

