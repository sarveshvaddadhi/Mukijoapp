from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
import models, schemas

router = APIRouter(prefix="/api")

# GET /api/attendance
@router.get("/attendance")
def get_attendance(
    eventId: Optional[int] = Query(None),
    userId: Optional[int] = Query(None),
    teamId: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    try:
        query = db.query(models.Attendance)
        if eventId:
            query = query.filter(models.Attendance.eventId == eventId)
        if userId:
            query = query.filter(models.Attendance.userId == userId)
        if teamId:
            query = query.join(models.Event).filter(models.Event.teamId == teamId)

        records = query.order_by(models.Attendance.markedAt.desc()).all()
        
        serialized = []
        for r in records:
            serialized.append({
                "id": r.id,
                "eventId": r.eventId,
                "userId": r.userId,
                "status": r.status,
                "markedAt": r.markedAt,
                "user": {"id": r.user.id, "name": r.user.name} if r.user else None,
                "event": {"id": r.event.id, "title": r.event.title, "date": r.event.date, "type": r.event.type} if r.event else None
            })
        return {"records": serialized}
    except Exception as e:
        print("Error fetching attendance:", e)
        raise HTTPException(status_code=500, detail="Server error")

# POST /api/attendance
@router.post("/attendance", status_code=201)
def mark_attendance(payload: schemas.AttendanceCreate, db: Session = Depends(get_db)):
    try:
        # Bulk:
        if payload.records is not None:
            results = []
            for rec in payload.records:
                att = db.query(models.Attendance).filter(
                    models.Attendance.eventId == payload.eventId,
                    models.Attendance.userId == rec.userId
                ).first()

                if att:
                    att.status = rec.status
                    att.markedAt = datetime.now()
                else:
                    att = models.Attendance(
                        eventId=payload.eventId,
                        userId=rec.userId,
                        status=rec.status
                    )
                    db.add(att)
                db.flush()
                results.append(att)
            
            db.commit()
            serialized_records = []
            for r in results:
                serialized_records.append({
                    "id": r.id,
                    "eventId": r.eventId,
                    "userId": r.userId,
                    "status": r.status,
                    "markedAt": r.markedAt
                })
            return {"records": serialized_records}

        # Single:
        if not payload.eventId or not payload.userId:
            raise HTTPException(status_code=400, detail="eventId and userId required")

        status_val = payload.status or "PRESENT"
        att = db.query(models.Attendance).filter(
            models.Attendance.eventId == payload.eventId,
            models.Attendance.userId == payload.userId
        ).first()

        if att:
            att.status = status_val
            att.markedAt = datetime.now()
        else:
            att = models.Attendance(
                eventId=payload.eventId,
                userId=payload.userId,
                status=status_val
            )
            db.add(att)

        db.commit()
        db.refresh(att)
        
        return {
            "attendance": {
                "id": att.id,
                "eventId": att.eventId,
                "userId": att.userId,
                "status": att.status,
                "markedAt": att.markedAt
            }
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        print("Error marking attendance:", e)
        raise HTTPException(status_code=500, detail="Server error")

# GET /api/attendance/report
@router.get("/attendance/report")
def get_attendance_report(
    teamId: Optional[int] = Query(None),
    userId: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    try:
        if userId:
            total = db.query(models.Attendance).filter(models.Attendance.userId == userId).count()
            present = db.query(models.Attendance).filter(models.Attendance.userId == userId, models.Attendance.status == "PRESENT").count()
            late = db.query(models.Attendance).filter(models.Attendance.userId == userId, models.Attendance.status == "LATE").count()
            absent = db.query(models.Attendance).filter(models.Attendance.userId == userId, models.Attendance.status == "ABSENT").count()
            percentage = round(((present + late) / total) * 100) if total > 0 else 0
            return {
                "userId": userId,
                "total": total,
                "present": present,
                "late": late,
                "absent": absent,
                "percentage": percentage
            }

        if teamId:
            members = db.query(models.TeamMember).filter(models.TeamMember.teamId == teamId).all()
            report = []
            for m in members:
                total = db.query(models.Attendance).join(models.Event).filter(
                    models.Attendance.userId == m.userId,
                    models.Event.teamId == teamId
                ).count()
                present = db.query(models.Attendance).join(models.Event).filter(
                    models.Attendance.userId == m.userId,
                    models.Event.teamId == teamId,
                    models.Attendance.status == "PRESENT"
                ).count()
                percentage = round((present / total) * 100) if total > 0 else 0
                report.append({
                    "userId": m.userId,
                    "name": m.user.name,
                    "role": m.role,
                    "total": total,
                    "present": present,
                    "percentage": percentage
                })
            return {"report": report}

        raise HTTPException(status_code=400, detail="teamId or userId required")
    except HTTPException as he:
        raise he
    except Exception as e:
        print("Error compiling report:", e)
        raise HTTPException(status_code=500, detail="Server error")
