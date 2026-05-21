import bcrypt
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from database import get_db
import models, schemas

router = APIRouter(prefix="/api")

def serialize_team(team):
    members = []
    for tm in team.members:
        parent_links = []
        for pl in tm.user.parentLinks:
            parent_links.append({
                "id": pl.id,
                "parentId": pl.parentId,
                "childId": pl.childId,
                "child": {"id": pl.child.id, "name": pl.child.name}
            })
        child_links = []
        for cl in tm.user.childLinks:
            child_links.append({
                "id": cl.id,
                "parentId": cl.parentId,
                "childId": cl.childId,
                "parent": {"id": cl.parent.id, "name": cl.parent.name}
            })
        members.append({
            "id": tm.id,
            "userId": tm.userId,
            "teamId": tm.teamId,
            "role": tm.role,
            "jersey": tm.jersey,
            "joinedAt": tm.joinedAt,
            "user": {
                "id": tm.user.id,
                "name": tm.user.name,
                "email": tm.user.email,
                "role": tm.user.role,
                "phone": tm.user.phone,
                "parentLinks": parent_links,
                "childLinks": child_links
            }
        })
    return {
        "id": team.id,
        "name": team.name,
        "division": team.division,
        "status": team.status,
        "description": team.description,
        "createdAt": team.createdAt,
        "members": members,
        "_count": {
            "members": len(team.members),
            "events": len(team.events)
        }
    }


@router.get("/teams")
def get_teams(userId: Optional[int] = Query(None), db: Session = Depends(get_db)):
    try:
        if userId:
            teams = db.query(models.Team).join(models.TeamMember).filter(models.TeamMember.userId == userId).order_by(models.Team.createdAt.desc()).all()
        else:
            teams = db.query(models.Team).order_by(models.Team.createdAt.desc()).all()
        
        return {"teams": [serialize_team(t) for t in teams]}
    except Exception as e:
        print("Error fetching teams:", e)
        raise HTTPException(status_code=500, detail="Server error")


@router.post("/teams", status_code=201)
def create_team(payload: schemas.TeamCreate, db: Session = Depends(get_db)):
    try:
        if not payload.name:
            raise HTTPException(status_code=400, detail="Team name is required")

        new_team = models.Team(
            name=payload.name,
            division=payload.division,
            description=payload.description
        )
        db.add(new_team)
        db.flush()

        if payload.userId:
            member = models.TeamMember(
                userId=payload.userId,
                teamId=new_team.id,
                role="COACH"
            )
            db.add(member)

        db.commit()
        db.refresh(new_team)
        return {"team": serialize_team(new_team)}
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        print("Error creating team:", e)
        raise HTTPException(status_code=500, detail="Server error")


@router.get("/teams/default")
def get_default_team(db: Session = Depends(get_db)):
    try:
        team = db.query(models.Team).filter(models.Team.name == "Default Team").first()
        if not team:
            team = db.query(models.Team).order_by(models.Team.id.asc()).first()
        if not team:
            team = models.Team(
                name="Default Team",
                division="General",
                description="Welcome to Mukijo! This is the default general sports team."
            )
            db.add(team)
            db.commit()
            db.refresh(team)
        return {"team": serialize_team(team)}
    except Exception as e:
        print("Error fetching default team:", e)
        raise HTTPException(status_code=500, detail="Server error")


@router.get("/teams/{team_id}")
def get_team(team_id: int, db: Session = Depends(get_db)):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    

    events = sorted(team.events, key=lambda e: e.date)[:10]
    serialized_events = []
    for ev in events:
        serialized_events.append({
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
            "createdAt": ev.createdAt
        })
        
    res_team = serialize_team(team)
    res_team["events"] = serialized_events
    return {"team": res_team}


@router.put("/teams/{team_id}")
def update_team(team_id: int, payload: schemas.TeamCreate, db: Session = Depends(get_db)):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    team.name = payload.name
    team.division = payload.division
    team.description = payload.description
    db.commit()
    db.refresh(team)
    return {"team": serialize_team(team)}


@router.delete("/teams/{team_id}")
def delete_team(team_id: int, db: Session = Depends(get_db)):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    db.delete(team)
    db.commit()
    return {"message": "Team deleted"}


@router.get("/teams/{team_id}/members")
def get_team_members(team_id: int, db: Session = Depends(get_db)):
    members = db.query(models.TeamMember).filter(models.TeamMember.teamId == team_id).order_by(models.TeamMember.joinedAt.desc()).all()
    serialized = []
    for tm in members:
        parent_links = []
        for pl in tm.user.parentLinks:
            parent_links.append({
                "id": pl.id,
                "parentId": pl.parentId,
                "childId": pl.childId,
                "child": {"id": pl.child.id, "name": pl.child.name}
            })
        child_links = []
        for cl in tm.user.childLinks:
            child_links.append({
                "id": cl.id,
                "parentId": cl.parentId,
                "childId": cl.childId,
                "parent": {"id": cl.parent.id, "name": cl.parent.name}
            })
        serialized.append({
            "id": tm.id,
            "userId": tm.userId,
            "teamId": tm.teamId,
            "role": tm.role,
            "jersey": tm.jersey,
            "joinedAt": tm.joinedAt,
            "user": {
                "id": tm.user.id,
                "name": tm.user.name,
                "email": tm.user.email,
                "role": tm.user.role,
                "phone": tm.user.phone,
                "parentLinks": parent_links,
                "childLinks": child_links
            }
        })
    return {"members": serialized}


@router.post("/teams/{team_id}/members", status_code=201)
def add_team_member(team_id: int, payload: schemas.MemberAdd, db: Session = Depends(get_db)):
    try:
        user = db.query(models.User).filter(models.User.email == payload.email).first()
        target_role = payload.role

        if user:
            target_user_id = user.id
            if not target_role:
                target_role = user.role or "PLAYER"
        else:

            salt = bcrypt.gensalt(10)
            temp_password = bcrypt.hashpw("member123".encode('utf-8'), salt).decode('utf-8')
            new_user = models.User(
                name=payload.email.split("@")[0],
                email=payload.email,
                password=temp_password,
                role=payload.role or "PLAYER",
                aadhaarVerified=False
            )
            db.add(new_user)
            db.flush()
            target_user_id = new_user.id
            target_role = payload.role or "PLAYER"

        existing = db.query(models.TeamMember).filter(
            models.TeamMember.userId == target_user_id,
            models.TeamMember.teamId == team_id
        ).first()

        if existing:
            raise HTTPException(status_code=400, detail="Already a member")

        member = models.TeamMember(
            userId=target_user_id,
            teamId=team_id,
            role=target_role,
            jersey=payload.jersey
        )
        db.add(member)
        db.commit()
        db.refresh(member)

        return {
            "member": {
                "id": member.id,
                "userId": member.userId,
                "teamId": member.teamId,
                "role": member.role,
                "jersey": member.jersey,
                "user": {
                    "id": member.user.id,
                    "name": member.user.name,
                    "email": member.user.email
                }
            }
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        print("Error adding member:", e)
        raise HTTPException(status_code=500, detail="Server error")


@router.delete("/teams/{team_id}/members")
def remove_team_member(team_id: int, userId: int = Query(...), db: Session = Depends(get_db)):
    member = db.query(models.TeamMember).filter(
        models.TeamMember.userId == userId,
        models.TeamMember.teamId == team_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    db.delete(member)
    db.commit()
    return {"message": "Member removed"}


@router.post("/parent-links", status_code=201)
def link_parent_child(payload: schemas.ParentLinkRequest, db: Session = Depends(get_db)):
    try:

        existing = db.query(models.ParentLink).filter(
            models.ParentLink.parentId == payload.parentId,
            models.ParentLink.childId == payload.childId
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Link already exists")

        link = models.ParentLink(
            parentId=payload.parentId,
            childId=payload.childId
        )
        db.add(link)
        db.commit()
        db.refresh(link)

        return {
            "link": {
                "id": link.id,
                "parentId": link.parentId,
                "childId": link.childId,
                "parent": {"id": link.parent.id, "name": link.parent.name, "email": link.parent.email},
                "child": {"id": link.child.id, "name": link.child.name, "email": link.child.email}
            }
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        print("Error linking parent/child:", e)
        raise HTTPException(status_code=500, detail="Server error")


@router.get("/parent-links")
def get_parent_links(userId: int = Query(...), db: Session = Depends(get_db)):
    as_parent = db.query(models.ParentLink).filter(models.ParentLink.parentId == userId).all()
    as_child = db.query(models.ParentLink).filter(models.ParentLink.childId == userId).all()

    children = []
    for l in as_parent:
        children.append({
            "id": l.id,
            "parentId": l.parentId,
            "childId": l.childId,
            "child": {"id": l.child.id, "name": l.child.name, "email": l.child.email}
        })

    parents = []
    for l in as_child:
        parents.append({
            "id": l.id,
            "parentId": l.parentId,
            "childId": l.childId,
            "parent": {"id": l.parent.id, "name": l.parent.name, "email": l.parent.email}
        })

    return {"children": children, "parents": parents}


@router.delete("/parent-links")
def unlink_parent_child(parentId: int = Query(...), childId: int = Query(...), db: Session = Depends(get_db)):
    link = db.query(models.ParentLink).filter(
        models.ParentLink.parentId == parentId,
        models.ParentLink.childId == childId
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    
    db.delete(link)
    db.commit()
    return {"message": "Link removed successfully"}
