from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime


class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "COACH"
    phone: Optional[str] = None
    aadhaarNo: Optional[str] = None

class UserLogin(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str

class ForgotPassword(BaseModel):
    email: str

class SendAadhaarOTP(BaseModel):
    aadhaarNo: str

class VerifyAadhaarOTP(BaseModel):
    aadhaarNo: str
    otp: Optional[str] = None
    code: Optional[str] = None

class SendLoginOTP(BaseModel):
    phone: str

class VerifyLoginOTP(BaseModel):
    phone: str
    code: str


class TeamCreate(BaseModel):
    name: str
    division: Optional[str] = None
    description: Optional[str] = None
    userId: Optional[int] = None

class MemberAdd(BaseModel):
    email: str
    role: str = "PLAYER"
    jersey: Optional[str] = None

class ParentLinkRequest(BaseModel):
    parentId: int
    childId: int


class EventCreate(BaseModel):
    title: str
    type: str = "TRAINING"
    description: Optional[str] = None
    location: Optional[str] = None
    date: datetime
    endTime: Optional[datetime] = None
    recurring: Optional[bool] = False
    recurrence: Optional[str] = None
    teamId: int
    createdById: int

class RSVPCreate(BaseModel):
    eventId: int
    userId: int
    status: str


class AttendanceRecord(BaseModel):
    userId: int
    status: str

class AttendanceCreate(BaseModel):
    eventId: int
    userId: Optional[int] = None
    status: Optional[str] = None
    records: Optional[List[AttendanceRecord]] = None


class PaymentCreate(BaseModel):
    userId: int
    amount: float
    type: str = "MEMBERSHIP"
    status: str = "PENDING"
    description: Optional[str] = None
    dueDate: Optional[datetime] = None

class PaymentUpdate(BaseModel):
    status: str
    method: Optional[str] = None
    reference: Optional[str] = None

class CreateOrderRequest(BaseModel):
    amount: float

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class MessageCreate(BaseModel):
    channelId: int
    userId: int
    content: str
    type: str = "TEXT"
    fileUrl: Optional[str] = None

class AnnouncementCreate(BaseModel):
    teamId: int
    userId: int
    title: str
    content: str
    priority: str = "NORMAL"

class CampaignCreate(BaseModel):
    title: str
    description: Optional[str] = None
    goalAmount: float
    teamId: int
    createdById: int
    endDate: Optional[datetime] = None

class DonationCreate(BaseModel):
    campaignId: int
    userId: int
    amount: float
    message: Optional[str] = None

class PollCreate(BaseModel):
    question: str
    teamId: int
    options: List[str]

class PollVoteRequest(BaseModel):
    optionId: int
    userId: int
