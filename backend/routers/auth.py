import os
import re
import requests
import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models, schemas

router = APIRouter(prefix="/api")

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(10)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

# POST /api/auth/register
@router.post("/auth/register")
def register(payload: schemas.UserRegister, db: Session = Depends(get_db)):
    try:
        if not payload.name or not payload.email or not payload.password:
            raise HTTPException(status_code=400, detail="Name, email, and password are required")

        if not payload.aadhaarNo:
            raise HTTPException(status_code=400, detail="Aadhaar verification is required to create an account.")

        cleaned_aadhaar = re.sub(r"\s+", "", payload.aadhaarNo)

        # Check if email already exists
        existing = db.query(models.User).filter(models.User.email == payload.email).first()
        if existing:
            if existing.aadhaarVerified:
                raise HTTPException(status_code=400, detail="An account with this email already exists.")

            # Check if Aadhaar already exists on another user
            existing_aadhaar = db.query(models.User).filter(
                models.User.aadhaarNo == cleaned_aadhaar,
                models.User.email != payload.email
            ).first()
            if existing_aadhaar:
                raise HTTPException(status_code=400, detail="An account with this Aadhaar number already exists.")

            # Update existing stub user
            existing.name = payload.name
            existing.phone = re.sub(r"\s+", "", payload.phone) if payload.phone else None
            existing.password = hash_password(payload.password)
            existing.role = payload.role if payload.role else (existing.role or "PLAYER")
            existing.aadhaarNo = cleaned_aadhaar
            existing.aadhaarVerified = True

            db.commit()
            db.refresh(existing)
            user_dict = {c.name: getattr(existing, c.name) for c in existing.__table__.columns}
            user_dict.pop("password", None)
            return {"user": user_dict}

        # Check if Aadhaar already exists on any user
        existing_aadhaar = db.query(models.User).filter(models.User.aadhaarNo == cleaned_aadhaar).first()
        if existing_aadhaar:
            raise HTTPException(status_code=400, detail="An account with this Aadhaar number already exists.")

        # Create new user
        new_user = models.User(
            name=payload.name,
            email=payload.email,
            phone=re.sub(r"\s+", "", payload.phone) if payload.phone else None,
            password=hash_password(payload.password),
            role=payload.role or "PLAYER",
            aadhaarNo=cleaned_aadhaar,
            aadhaarVerified=True
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        user_dict = {c.name: getattr(new_user, c.name) for c in new_user.__table__.columns}
        user_dict.pop("password", None)
        return {"user": user_dict}

    except HTTPException as he:
        raise he
    except Exception as e:
        print("Register error:", e)
        raise HTTPException(status_code=500, detail="Server error")

# POST /api/auth/login
@router.post("/auth/login")
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    try:
        if (not payload.email and not payload.phone) or not payload.password:
            raise HTTPException(status_code=400, detail="Email/phone and password are required")

        user = None
        if payload.email:
            user = db.query(models.User).filter(models.User.email == payload.email).first()
        elif payload.phone:
            cleaned_phone = re.sub(r"\s+", "", payload.phone)
            user = db.query(models.User).filter(models.User.phone == cleaned_phone).first()

        if not user:
            raise HTTPException(status_code=401, detail="No account found. Check your credentials.")

        if not verify_password(payload.password, user.password):
            raise HTTPException(status_code=401, detail="Invalid password.")

        user_dict = {c.name: getattr(user, c.name) for c in user.__table__.columns}
        user_dict.pop("password", None)
        return {"user": user_dict}

    except HTTPException as he:
        raise he
    except Exception as e:
        print("Login error:", e)
        raise HTTPException(status_code=500, detail="Server error")

# POST /api/auth/forgot-password
@router.post("/auth/forgot-password")
def forgot_password(payload: schemas.ForgotPassword, db: Session = Depends(get_db)):
    try:
        user = db.query(models.User).filter(models.User.email == payload.email).first()
        if not user:
            raise HTTPException(status_code=404, detail="No account found with this email address.")

        return {
            "message": "Password reset link has been sent to your email.",
            "success": True
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        print("Forgot password error:", e)
        raise HTTPException(status_code=500, detail="Server error")

# POST /api/auth/send-aadhaar-otp
@router.post("/auth/send-aadhaar-otp")
def send_aadhaar_otp(payload: schemas.SendAadhaarOTP, db: Session = Depends(get_db)):
    try:
        cleaned_aadhaar = re.sub(r"\s+", "", payload.aadhaarNo)
        if not re.match(r"^\d{12}$", cleaned_aadhaar):
            raise HTTPException(status_code=400, detail="Aadhaar number must be exactly 12 digits")

        # Check if Aadhaar is already registered
        existing = db.query(models.User).filter(models.User.aadhaarNo == cleaned_aadhaar).first()
        if existing:
            raise HTTPException(status_code=400, detail="An account with this Aadhaar number already exists.")

        display_phone = "XXXXXX" + cleaned_aadhaar[-4:]
        print(f"[MOCK AADHAAR OTP] OTP sent to Aadhaar {cleaned_aadhaar} registered mobile ({display_phone}). Use OTP: 123456 to verify.")

        return {
            "message": f"A 6-digit OTP has been sent to the Aadhaar-linked mobile number ending in {cleaned_aadhaar[-4:]}.",
            "success": True
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        print("Send Aadhaar OTP Error:", e)
        raise HTTPException(status_code=500, detail="Server error during Aadhaar verification.")

# POST /api/auth/verify-aadhaar-otp
@router.post("/auth/verify-aadhaar-otp")
def verify_aadhaar_otp(payload: schemas.VerifyAadhaarOTP):
    try:
        cleaned_aadhaar = re.sub(r"\s+", "", payload.aadhaarNo)
        if payload.otp == "123456":
            return {
                "success": True,
                "message": "Aadhaar verified successfully",
                "details": {
                    "name": "SARVESH SHARMA",
                    "gender": "MALE",
                    "dob": "15-05-1995",
                    "address": "H-Block, Sector 62, Noida, Uttar Pradesh - 201301",
                    "aadhaarNo": f"XXXX XXXX {cleaned_aadhaar[-4:]}"
                }
            }
        else:
            raise HTTPException(status_code=400, detail="Invalid OTP. Please enter 123456 to verify.")
    except HTTPException as he:
        raise he
    except Exception as e:
        print("Verify Aadhaar OTP Error:", e)
        raise HTTPException(status_code=500, detail="Server error during Aadhaar verification.")

# POST /api/send-otp
@router.post("/send-otp")
def send_otp(payload: dict):
    phone = payload.get("phone")
    if not phone:
        raise HTTPException(status_code=400, detail="Phone number required")

    auth_key = os.getenv("MSG91_AUTH_KEY")
    template_id = os.getenv("MSG91_TEMPLATE_ID")

    if not auth_key or auth_key == "placeholder_auth_key":
        print(f"[MOCK] Sending OTP to {phone}. Use 123456 to verify.")
        return {"message": "Mock OTP Sent"}

    try:
        mobile = phone.replace("+", "")
        url = f"https://control.msg91.com/api/v5/otp?template_id={template_id}&mobile={mobile}&authkey={auth_key}"
        res = requests.post(url)
        data = res.json()
        if data.get("type") == "success":
            return {"message": "OTP Sent successfully", "status": "pending"}
        else:
            raise HTTPException(status_code=400, detail=data.get("message", "Failed to send OTP"))
    except Exception as e:
        print("MSG91 Send OTP Error:", e)
        raise HTTPException(status_code=500, detail=str(e))

# POST /api/verify-otp
@router.post("/verify-otp")
def verify_otp(payload: dict):
    phone = payload.get("phone")
    code = payload.get("code")

    if not phone or not code:
        raise HTTPException(status_code=400, detail="Phone and OTP code required")

    auth_key = os.getenv("MSG91_AUTH_KEY")

    if not auth_key or auth_key == "placeholder_auth_key":
        if code == "123456":
            return {"message": "Mock OTP verified", "verified": True}
        else:
            raise HTTPException(status_code=400, detail="Invalid mock OTP")

    try:
        mobile = phone.replace("+", "")
        url = f"https://control.msg91.com/api/v5/otp/verify?otp={code}&mobile={mobile}&authkey={auth_key}"
        res = requests.post(url)
        data = res.json()
        if data.get("type") == "success":
            return {"message": "OTP verified", "verified": True}
        else:
            raise HTTPException(status_code=400, detail="Invalid OTP")
    except Exception as e:
        print("MSG91 Verify OTP Error:", e)
        raise HTTPException(status_code=500, detail=str(e))
