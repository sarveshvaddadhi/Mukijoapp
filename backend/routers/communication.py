from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
router = APIRouter(prefix="/api")


@router.get("/channels")
def get_channels(teamId: Optional[int] = Query(None), db: Session = Depends(get_db)):
    try:
        query = db.query(models.Channel)
        if teamId:
            query = query.filter(models.Channel.teamId == teamId)
        channels = query.order_by(models.Channel.createdAt.asc()).all()

        serialized = []
        for ch in channels:
            serialized.append({
                "id": ch.id,
                "name": ch.name,
                "type": ch.type,
                "teamId": ch.teamId,
                "createdAt": ch.createdAt,
                "_count": {
                    "messages": len(ch.messages)
                }
            })
        return {"channels": serialized}
    except Exception as e:
        print("Error fetching channels:", e)
        raise HTTPException(status_code=500, detail="Server error")


@router.post("/channels", status_code=201)
def create_channel(payload: dict, db: Session = Depends(get_db)):
    try:
        name = payload.get("name")
        type_val = payload.get("type", "GROUP")
        teamId = payload.get("teamId")

        if not name:
            raise HTTPException(status_code=400, detail="name required")

        channel = models.Channel(
            name=name,
            type=type_val,
            teamId=int(teamId) if teamId else None
        )
        db.add(channel)
        db.commit()
        db.refresh(channel)

        return {
            "channel": {
                "id": channel.id,
                "name": channel.name,
                "type": channel.type,
                "teamId": channel.teamId,
                "createdAt": channel.createdAt
            }
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        print("Error creating channel:", e)
        raise HTTPException(status_code=500, detail="Server error")


@router.get("/messages")
def get_messages(teamId: int = Query(...), db: Session = Depends(get_db)):
    try:
        channel = db.query(models.Channel).filter(
            models.Channel.teamId == teamId,
            models.Channel.type == "GROUP"
        ).first()

        if not channel:

            channel = models.Channel(
                name="General",
                teamId=teamId,
                type="GROUP"
            )
            db.add(channel)
            db.commit()
            db.refresh(channel)

        messages = db.query(models.Message).filter(models.Message.channelId == channel.id).order_by(models.Message.createdAt.asc()).all()

        serialized = []
        for m in messages:
            serialized.append({
                "id": m.id,
                "channelId": m.channelId,
                "userId": m.userId,
                "content": m.content,
                "type": m.type,
                "fileUrl": m.fileUrl,
                "createdAt": m.createdAt,
                "user": {"name": m.user.name, "role": m.user.role} if m.user else None
            })

        return {"messages": serialized, "channelId": channel.id}
    except Exception as e:
        print("Messages GET Error:", e)
        raise HTTPException(status_code=500, detail="Server error")


@router.post("/messages", status_code=201)
def post_message(payload: schemas.MessageCreate, db: Session = Depends(get_db)):
    try:
        msg = models.Message(
            channelId=payload.channelId,
            userId=payload.userId,
            content=payload.content,
            type=payload.type,
            fileUrl=payload.fileUrl
        )
        db.add(msg)
        db.commit()
        db.refresh(msg)

        serialized = {
            "id": msg.id,
            "channelId": msg.channelId,
            "userId": msg.userId,
            "content": msg.content,
            "type": msg.type,
            "fileUrl": msg.fileUrl,
            "createdAt": msg.createdAt,
            "user": {"name": msg.user.name, "role": msg.user.role} if msg.user else None
        }
        return {"message": serialized}
    except Exception as e:
        db.rollback()
        print("Messages POST Error:", e)
        raise HTTPException(status_code=500, detail="Server error")


@router.get("/announcements")
def get_announcements(teamId: Optional[int] = Query(None), db: Session = Depends(get_db)):
    try:
        query = db.query(models.Announcement)
        if teamId:
            query = query.filter(models.Announcement.teamId == teamId)
        announcements = query.order_by(models.Announcement.createdAt.desc()).all()

        serialized = []
        for a in announcements:
            serialized.append({
                "id": a.id,
                "teamId": a.teamId,
                "userId": a.userId,
                "title": a.title,
                "content": a.content,
                "priority": a.priority,
                "createdAt": a.createdAt,
                "user": {"id": a.user.id, "name": a.user.name, "role": a.user.role} if a.user else None,
                "team": {"id": a.team.id, "name": a.team.name} if a.team else None
            })
        return {"announcements": serialized}
    except Exception as e:
        print("Error fetching announcements:", e)
        raise HTTPException(status_code=500, detail="Server error")


@router.post("/announcements", status_code=201)
def create_announcement(payload: schemas.AnnouncementCreate, db: Session = Depends(get_db)):
    try:
        new_a = models.Announcement(
            teamId=payload.teamId,
            userId=payload.userId,
            title=payload.title,
            content=payload.content,
            priority=payload.priority
        )
        db.add(new_a)
        db.commit()
        db.refresh(new_a)

        return {
            "announcement": {
                "id": new_a.id,
                "teamId": new_a.teamId,
                "userId": new_a.userId,
                "title": new_a.title,
                "content": new_a.content,
                "priority": new_a.priority,
                "createdAt": new_a.createdAt,
                "user": {"id": new_a.user.id, "name": new_a.user.name} if new_a.user else None,
                "team": {"id": new_a.team.id, "name": new_a.team.name} if new_a.team else None
            }
        }
    except Exception as e:
        db.rollback()
        print("Error creating announcement:", e)
        raise HTTPException(status_code=500, detail="Server error")


@router.get("/campaigns")
def get_campaigns(teamId: Optional[int] = Query(None), db: Session = Depends(get_db)):
    try:
        query = db.query(models.Campaign)
        if teamId:
            query = query.filter(models.Campaign.teamId == teamId)
        campaigns = query.order_by(models.Campaign.createdAt.desc()).all()

        serialized = []
        for c in campaigns:
            donations = []
            for d in c.donations:
                donations.append({
                    "id": d.id,
                    "campaignId": d.campaignId,
                    "userId": d.userId,
                    "amount": d.amount,
                    "message": d.message,
                    "createdAt": d.createdAt,
                    "user": {"id": d.user.id, "name": d.user.name} if d.user else None
                })

            serialized.append({
                "id": c.id,
                "title": c.title,
                "description": c.description,
                "goalAmount": c.goalAmount,
                "raised": c.raised,
                "status": c.status,
                "teamId": c.teamId,
                "createdById": c.createdById,
                "endDate": c.endDate,
                "createdAt": c.createdAt,
                "team": {"id": c.team.id, "name": c.team.name} if c.team else None,
                "createdBy": {"id": c.createdBy.id, "name": c.createdBy.name} if c.createdBy else None,
                "donations": donations,
                "_count": {
                    "donations": len(c.donations)
                }
            })
        return {"campaigns": serialized}
    except Exception as e:
        print("Error fetching campaigns:", e)
        raise HTTPException(status_code=500, detail="Server error")


@router.post("/campaigns", status_code=201)
def create_campaign(payload: schemas.CampaignCreate, db: Session = Depends(get_db)):
    try:
        new_c = models.Campaign(
            title=payload.title,
            description=payload.description,
            goalAmount=payload.goalAmount,
            teamId=payload.teamId,
            createdById=payload.createdById,
            endDate=payload.endDate
        )
        db.add(new_c)
        db.commit()
        db.refresh(new_c)

        return {
            "campaign": {
                "id": new_c.id,
                "title": new_c.title,
                "description": new_c.description,
                "goalAmount": new_c.goalAmount,
                "raised": new_c.raised,
                "status": new_c.status,
                "teamId": new_c.teamId,
                "createdById": new_c.createdById,
                "endDate": new_c.endDate,
                "createdAt": new_c.createdAt,
                "team": {"id": new_c.team.id, "name": new_c.team.name} if new_c.team else None
            }
        }
    except Exception as e:
        db.rollback()
        print("Error creating campaign:", e)
        raise HTTPException(status_code=500, detail="Server error")


@router.post("/campaigns/{campaign_id}/donate", status_code=201)
def donate_to_campaign(campaign_id: int, payload: schemas.DonationCreate, db: Session = Depends(get_db)):
    try:
        campaign = db.query(models.Campaign).filter(models.Campaign.id == campaign_id).first()
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")

        donation = models.Donation(
            campaignId=campaign_id,
            userId=payload.userId,
            amount=payload.amount,
            message=payload.message
        )
        db.add(donation)
        

        campaign.raised += payload.amount

        db.commit()
        db.refresh(donation)

        return {
            "donation": {
                "id": donation.id,
                "campaignId": donation.campaignId,
                "userId": donation.userId,
                "amount": donation.amount,
                "message": donation.message,
                "createdAt": donation.createdAt,
                "user": {"id": donation.user.id, "name": donation.user.name} if donation.user else None
            }
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        print("Error donating:", e)
        raise HTTPException(status_code=500, detail="Server error")


@router.get("/polls")
def get_polls(teamId: Optional[int] = Query(None), db: Session = Depends(get_db)):
    try:
        query = db.query(models.Poll)
        if teamId:
            query = query.filter(models.Poll.teamId == teamId)
        polls = query.order_by(models.Poll.createdAt.desc()).all()

        serialized = []
        for p in polls:
            options = []
            for o in p.options:
                options.append({
                    "id": o.id,
                    "pollId": o.pollId,
                    "text": o.text,
                    "_count": {
                        "votes": len(o.votes)
                    }
                })
            serialized.append({
                "id": p.id,
                "question": p.question,
                "teamId": p.teamId,
                "status": p.status,
                "createdAt": p.createdAt,
                "options": options,
                "_count": {
                    "votes": len(p.votes)
                }
            })
        return {"polls": serialized}
    except Exception as e:
        print("Error fetching polls:", e)
        raise HTTPException(status_code=500, detail="Server error")


@router.post("/polls", status_code=201)
def create_poll(payload: schemas.PollCreate, db: Session = Depends(get_db)):
    try:
        poll = models.Poll(
            question=payload.question,
            teamId=payload.teamId
        )
        db.add(poll)
        db.flush()

        for opt_text in payload.options:
            opt = models.PollOption(
                pollId=poll.id,
                text=opt_text
            )
            db.add(opt)

        db.commit()
        db.refresh(poll)

        options = [{"id": o.id, "pollId": o.pollId, "text": o.text} for o in poll.options]
        return {
            "poll": {
                "id": poll.id,
                "question": poll.question,
                "teamId": poll.teamId,
                "status": poll.status,
                "createdAt": poll.createdAt,
                "options": options
            }
        }
    except Exception as e:
        db.rollback()
        print("Error creating poll:", e)
        raise HTTPException(status_code=500, detail="Server error")


@router.post("/polls/{poll_id}/vote")
def vote_poll(poll_id: int, payload: schemas.PollVoteRequest, db: Session = Depends(get_db)):
    try:
        vote = db.query(models.PollVote).filter(
            models.PollVote.pollId == poll_id,
            models.PollVote.userId == payload.userId
        ).first()

        if vote:
            vote.optionId = payload.optionId
            vote.votedAt = datetime.now()
        else:
            vote = models.PollVote(
                pollId=poll_id,
                userId=payload.userId,
                optionId=payload.optionId
            )
            db.add(vote)

        db.commit()
        db.refresh(vote)

        return {
            "vote": {
                "id": vote.id,
                "pollId": vote.pollId,
                "optionId": vote.optionId,
                "userId": vote.userId,
                "votedAt": vote.votedAt
            }
        }
    except Exception as e:
        db.rollback()
        print("Error voting:", e)
        raise HTTPException(status_code=500, detail="Server error")


@router.post("/send-reminder")
def send_reminder(payload: dict):
    phone = payload.get("phone")
    message = payload.get("message")
    if not phone or not message:
        raise HTTPException(status_code=400, detail="Phone and message required")

    print(f"[MOCK TWILIO] Sending SMS to {phone}: \"{message}\"")
    return {"message": "Mock Reminder Sent"}
