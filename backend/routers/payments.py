import os
import hmac
import hashlib
from typing import Optional, List
from datetime import datetime
# pyrefly: ignore [missing-import]
import razorpay
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, Query
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
# pyrefly: ignore [missing-import]
from sqlalchemy import func
from database import get_db
import models, schemas

router = APIRouter(prefix="/api")

def get_razorpay_client():
    key_id = os.getenv("NEXT_PUBLIC_RAZORPAY_KEY_ID", "rzp_test_placeholder")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "placeholder_secret")
    return razorpay.Client(auth=(key_id, key_secret))

def serialize_payment(p):
    return {
        "id": p.id,
        "userId": p.userId,
        "amount": p.amount,
        "type": p.type,
        "status": p.status,
        "method": p.method,
        "reference": p.reference,
        "description": p.description,
        "eventId": p.eventId,
        "dueDate": p.dueDate,
        "paidAt": p.paidAt,
        "createdAt": p.createdAt,
        "user": {"id": p.user.id, "name": p.user.name, "email": p.user.email} if p.user else None
    }


@router.get("/payments")
def get_payments(
    userId: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    try:
        query = db.query(models.Payment)
        user_ids = []
        
        if userId:

            children = db.query(models.ParentLink).filter(models.ParentLink.parentId == userId).all()
            if children:
                user_ids = [userId] + [c.childId for c in children]
            else:
                user_ids = [userId]
            query = query.filter(models.Payment.userId.in_(user_ids))

        if status:
            query = query.filter(models.Payment.status == status)

        payments = query.order_by(models.Payment.createdAt.desc()).all()



        total_collected = db.query(func.sum(models.Payment.amount)).filter(models.Payment.status == "PAID")
        if userId:
            total_collected = total_collected.filter(models.Payment.userId.in_(user_ids))
        total_val = total_collected.scalar() or 0.0


        pending_amount = db.query(func.sum(models.Payment.amount)).filter(models.Payment.status == "PENDING")
        if userId:
            pending_amount = pending_amount.filter(models.Payment.userId.in_(user_ids))
        pending_val = pending_amount.scalar() or 0.0


        overdue_amount = db.query(func.sum(models.Payment.amount)).filter(models.Payment.status == "OVERDUE")
        if userId:
            overdue_amount = overdue_amount.filter(models.Payment.userId.in_(user_ids))
        overdue_val = overdue_amount.scalar() or 0.0

        return {
            "payments": [serialize_payment(p) for p in payments],
            "summary": {
                "totalCollected": total_val,
                "pendingAmount": pending_val,
                "overdueAmount": overdue_val
            }
        }
    except Exception as e:
        print("Error fetching payments:", e)
        raise HTTPException(status_code=500, detail="Server error")


@router.post("/payments", status_code=201)
def create_payment(payload: schemas.PaymentCreate, db: Session = Depends(get_db)):
    try:
        new_payment = models.Payment(
            userId=payload.userId,
            amount=payload.amount,
            type=payload.type,
            status=payload.status,
            description=payload.description,
            dueDate=payload.dueDate,
            paidAt=datetime.now() if payload.status == "PAID" else None
        )
        db.add(new_payment)
        db.commit()
        db.refresh(new_payment)
        return {"payment": serialize_payment(new_payment)}
    except Exception as e:
        db.rollback()
        print("Error creating payment:", e)
        raise HTTPException(status_code=500, detail="Server error")


@router.get("/payments/{payment_id}")
def get_payment(payment_id: int, db: Session = Depends(get_db)):
    p = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Payment not found")
    return {"payment": serialize_payment(p)}


@router.put("/payments/{payment_id}")
def update_payment(payment_id: int, payload: schemas.PaymentUpdate, db: Session = Depends(get_db)):
    try:
        p = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
        if not p:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        p.status = payload.status
        p.method = payload.method
        p.reference = payload.reference
        if payload.status == "PAID":
            p.paidAt = datetime.now()

        db.commit()
        db.refresh(p)
        return {"payment": serialize_payment(p)}
    except Exception as e:
        db.rollback()
        print("Error updating payment:", e)
        raise HTTPException(status_code=500, detail="Server error")


@router.post("/create-order")
def create_order(payload: dict):
    try:
        amount = payload.get("amount")
        payment_ids = payload.get("paymentIds")
        user_id = payload.get("userId")

        if not amount or not user_id or not payment_ids:
            raise HTTPException(status_code=400, detail="Missing required fields")

        secret = os.getenv("RAZORPAY_KEY_SECRET", "placeholder_secret")
        if secret in ["placeholder_secret_key", "placeholder_secret"]:
            return {
                "order": {
                    "id": f"mock_order_{int(datetime.now().timestamp() * 1000)}",
                    "amount": amount * 100,
                    "currency": "INR"
                }
            }

        client = get_razorpay_client()
        options = {
            "amount": int(amount * 100),
            "currency": "INR",
            "receipt": f"receipt_user_{user_id}_{int(datetime.now().timestamp() * 1000)}",
            "notes": {
                "paymentIds": ",".join(map(str, payment_ids))
            }
        }
        order = client.order.create(data=options)
        if not order:
            raise HTTPException(status_code=500, detail="Failed to create order")
        return {"order": order}
    except Exception as e:
        print("Razorpay Create Order Error:", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/verify-payment")
def verify_payment(payload: dict, db: Session = Depends(get_db)):
    try:
        razorpay_order_id = payload.get("razorpay_order_id")
        razorpay_payment_id = payload.get("razorpay_payment_id")
        razorpay_signature = payload.get("razorpay_signature")
        payment_ids = payload.get("paymentIds")

        if not razorpay_order_id or not razorpay_payment_id or not razorpay_signature or not payment_ids:
            raise HTTPException(status_code=400, detail="Missing required fields")

        secret = os.getenv("RAZORPAY_KEY_SECRET", "placeholder_secret")
        if secret not in ["placeholder_secret_key", "placeholder_secret"]:

            msg = f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8")
            generated = hmac.new(secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()
            if generated != razorpay_signature:
                raise HTTPException(status_code=400, detail="Invalid Payment Signature")

        ids = [int(x) for x in payment_ids]
        db.query(models.Payment).filter(models.Payment.id.in_(ids)).update(
            {
                "status": "PAID",
                "method": "RAZORPAY",
                "reference": razorpay_payment_id,
                "paidAt": datetime.now()
            },
            synchronize_session=False
        )
        db.commit()
        return {"message": "Payment verified successfully", "verified": True}
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        print("Verify Payment Error:", e)
        raise HTTPException(status_code=500, detail=str(e))
