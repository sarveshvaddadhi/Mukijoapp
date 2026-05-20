from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
router = APIRouter(prefix="/api")

def serialize_event(ev):
    rsvps = [{"userId": r.userId, "status": r.status} for r in ev.rsvps]
    return {
        "id": ev.id,
        "title": ev.title,
        "type": ev.type,
        "description": ev.description,
        "location": ev.location,
        "date": ev.date,
        "endTime": ev.endTime,
        "recurring": ev.recurring,
        "recurrence": ev.recurrence,
        "teamId": ev.teamId,
        "createdById": ev.createdById,
        "createdAt": ev.createdAt,
        "team": {"id": ev.team.id, "name": ev.team.name} if ev.team else None,
        "createdBy": {"id": ev.createdBy.id, "name": ev.createdBy.name} if ev.createdBy else None,
        "_count": {
            "rsvps": len(ev.rsvps),
            "attendances": len(ev.attendances)
        },
        "rsvps": rsvps
    }

# GET /api/events
@router.get("/events")
def get_events(teamId: Optional[int] = Query(None), userId: Optional[int] = Query(None), db: Session = Depends(get_db)):
    try:
        query = db.query(models.Event)
        if teamId:
            query = query.filter(models.Event.teamId == teamId)
        if userId:
            # Filter events of teams that the user is a member of
            query = query.join(models.Team).join(models.TeamMember).filter(models.TeamMember.userId == userId)
            
        events = query.order_by(models.Event.date.asc()).all()
        return {"events": [serialize_event(e) for e in events]}
    except Exception as e:
        print("Error fetching events:", e)
        raise HTTPException(status_code=500, detail="Server error")

# POST /api/events
@router.post("/events", status_code=201)
def create_event(payload: schemas.EventCreate, db: Session = Depends(get_db)):
    try:
        new_event = models.Event(
            title=payload.title,
            type=payload.type,
            description=payload.description,
            location=payload.location,
            date=payload.date,
            endTime=payload.endTime,
            recurring=payload.recurring or False,
            recurrence=payload.recurrence,
            teamId=payload.teamId,
            createdById=payload.createdById
        )
        db.add(new_event)
        db.commit()
        db.refresh(new_event)
        return {"event": serialize_event(new_event)}
    except Exception as e:
        db.rollback()
        print("Error creating event:", e)
        raise HTTPException(status_code=500, detail="Server error")

# GET /api/events/{id}
@router.get("/events/{event_id}")
def get_event(event_id: int, db: Session = Depends(get_db)):
    ev = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
        
    rsvps = []
    for r in ev.rsvps:
        rsvps.append({
            "id": r.id,
            "eventId": r.eventId,
            "userId": r.userId,
            "status": r.status,
            "respondedAt": r.respondedAt,
            "user": {"id": r.user.id, "name": r.user.name} if r.user else None
        })

    attendances = []
    for a in ev.attendances:
        attendances.append({
            "id": a.id,
            "eventId": a.eventId,
            "userId": a.userId,
            "status": a.status,
            "markedAt": a.markedAt,
            "user": {"id": a.user.id, "name": a.user.name} if a.user else None
        })

    event_data = {
        "id": ev.id,
        "title": ev.title,
        "type": ev.type,
        "description": ev.description,
        "location": ev.location,
        "date": ev.date,
        "endTime": ev.endTime,
        "recurring": ev.recurring,
        "recurrence": ev.recurrence,
        "teamId": ev.teamId,
        "createdById": ev.createdById,
        "createdAt": ev.createdAt,
        "team": {"id": ev.team.id, "name": ev.team.name} if ev.team else None,
        "createdBy": {"id": ev.createdBy.id, "name": ev.createdBy.name} if ev.createdBy else None,
        "rsvps": rsvps,
        "attendances": attendances
    }
    return {"event": event_data}

# PUT /api/events/{id}
@router.put("/events/{event_id}")
def update_event(event_id: int, payload: dict, db: Session = Depends(get_db)):
    ev = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
        
    if "title" in payload:
        ev.title = payload["title"]
    if "type" in payload:
        ev.type = payload["type"]
    if "description" in payload:
        ev.description = payload["description"]
    if "location" in payload:
        ev.location = payload["location"]
    if "date" in payload and payload["date"]:
        ev.date = datetime.fromisoformat(payload["date"].replace("Z", "+00:00"))
    if "endTime" in payload:
        ev.endTime = datetime.fromisoformat(payload["endTime"].replace("Z", "+00:00")) if payload["endTime"] else None
    if "recurring" in payload:
        ev.recurring = payload["recurring"]
    if "recurrence" in payload:
        ev.recurrence = payload["recurrence"]

    db.commit()
    db.refresh(ev)
    return {"event": serialize_event(ev)}

# DELETE /api/events/{id}
@router.delete("/events/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db)):
    ev = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(ev)
    db.commit()
    return {"message": "Event deleted"}

# POST /api/events/rsvp
@router.post("/events/rsvp")
def post_general_rsvp(payload: schemas.RSVPCreate, db: Session = Depends(get_db)):
    try:
        rsvp = db.query(models.EventRSVP).filter(
            models.EventRSVP.eventId == payload.eventId,
            models.EventRSVP.userId == payload.userId
        ).first()

        if rsvp:
            rsvp.status = payload.status
            rsvp.respondedAt = datetime.now()
        else:
            rsvp = models.EventRSVP(
                eventId=payload.eventId,
                userId=payload.userId,
                status=payload.status
            )
            db.add(rsvp)

        db.commit()
        db.refresh(rsvp)

        serialized_rsvp = {
            "id": rsvp.id,
            "eventId": rsvp.eventId,
            "userId": rsvp.userId,
            "status": rsvp.status,
            "respondedAt": rsvp.respondedAt
        }
        return {"message": "RSVP updated successfully", "rsvp": serialized_rsvp}
    except Exception as e:
        db.rollback()
        print("RSVP Error:", e)
        raise HTTPException(status_code=500, detail="Server error")

# POST /api/events/{id}/rsvp
@router.post("/events/{event_id}/rsvp")
def post_event_rsvp(event_id: int, payload: dict, db: Session = Depends(get_db)):
    try:
        userId = payload.get("userId")
        status = payload.get("status")
        if not userId or not status:
            raise HTTPException(status_code=400, detail="userId and status required")

        rsvp = db.query(models.EventRSVP).filter(
            models.EventRSVP.eventId == event_id,
            models.EventRSVP.userId == userId
        ).first()

        if rsvp:
            rsvp.status = status
            rsvp.respondedAt = datetime.now()
        else:
            rsvp = models.EventRSVP(
                eventId=event_id,
                userId=userId,
                status=status
            )
            db.add(rsvp)

        db.commit()
        db.refresh(rsvp)

        return {
            "rsvp": {
                "id": rsvp.id,
                "eventId": rsvp.eventId,
                "userId": rsvp.userId,
                "status": rsvp.status,
                "respondedAt": rsvp.respondedAt,
                "user": {"id": rsvp.user.id, "name": rsvp.user.name} if rsvp.user else None
            }
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        print("RSVP ID Error:", e)
        raise HTTPException(status_code=500, detail="Server error")
