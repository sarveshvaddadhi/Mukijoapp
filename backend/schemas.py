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
    sport_id: Optional[str] = None
    team_type: Optional[str] = None
    age_group: Optional[str] = None
    visibility: Optional[str] = "PRIVATE"
    venue_id: Optional[int] = None
    members: Optional[List[dict]] = None

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

class SportResponse(BaseModel):
    id: str
    name: str
    slug: str
    icon_url: Optional[str] = None
    accent_color: Optional[str] = None
    is_active: bool

    class Config:
        orm_mode = True

class VenueResponse(BaseModel):
    id: int
    name: str
    address: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    rating: Optional[float] = None
    description: Optional[str] = None
    contact_phone: Optional[str] = None
    website_url: Optional[str] = None
    is_available: bool
    distance_km: Optional[float] = None

    class Config:
        orm_mode = True

class VenueCreate(BaseModel):
    name: str
    address: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    description: Optional[str] = None
    sports: Optional[List[str]] = None


class VenueBookingCreate(BaseModel):
    venue_id: int
    team_id: int
    start_time: datetime
    end_time: datetime
    purpose: Optional[str] = None


class VenueBookingResponse(BaseModel):
    id: int
    venue_id: int
    team_id: int
    booker_id: int
    start_time: datetime
    end_time: datetime
    purpose: Optional[str] = None
    status: str
    createdAt: datetime
    
    venue_name: Optional[str] = None
    team_name: Optional[str] = None
    booker_name: Optional[str] = None

    class Config:
        orm_mode = True


