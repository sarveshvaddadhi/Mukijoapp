from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "User"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="COACH", nullable=False)
    phone = Column(String, nullable=True)
    aadhaarNo = Column(String, unique=True, nullable=True)
    aadhaarVerified = Column(Boolean, default=False, nullable=False)
    google_id = Column(String, unique=True, nullable=True)
    avatar_url = Column(String, nullable=True)
    createdAt = Column(DateTime(timezone=True), default=func.now(), nullable=False)

    teamMembers = relationship("TeamMember", back_populates="user", cascade="all, delete-orphan")
    parentLinks = relationship("ParentLink", foreign_keys="[ParentLink.parentId]", back_populates="parent", cascade="all, delete-orphan")
    childLinks = relationship("ParentLink", foreign_keys="[ParentLink.childId]", back_populates="child", cascade="all, delete-orphan")
    eventsCreated = relationship("Event", back_populates="createdBy")
    rsvps = relationship("EventRSVP", back_populates="user", cascade="all, delete-orphan")
    attendances = relationship("Attendance", back_populates="user", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="user", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="user", cascade="all, delete-orphan")
    announcements = relationship("Announcement", back_populates="user", cascade="all, delete-orphan")
    donations = relationship("Donation", back_populates="user", cascade="all, delete-orphan")
    pollVotes = relationship("PollVote", back_populates="user", cascade="all, delete-orphan")
    campaigns = relationship("Campaign", back_populates="createdBy")


class Team(Base):
    __tablename__ = "Team"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    division = Column(String, nullable=True)
    status = Column(String, default="ACTIVE", nullable=False)
    description = Column(String, nullable=True)
    sport_id = Column(String, ForeignKey("Sport.id"), nullable=True)
    team_type = Column(String, nullable=True)
    age_group = Column(String, nullable=True)
    visibility = Column(String, default="PRIVATE", nullable=False)
    venue_id = Column(Integer, ForeignKey("Venue.id"), nullable=True)
    createdAt = Column(DateTime(timezone=True), default=func.now(), nullable=False)

    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="team", cascade="all, delete-orphan")
    channels = relationship("Channel", back_populates="team", cascade="all, delete-orphan")
    announcements = relationship("Announcement", back_populates="team", cascade="all, delete-orphan")
    campaigns = relationship("Campaign", back_populates="team", cascade="all, delete-orphan")
    polls = relationship("Poll", back_populates="team", cascade="all, delete-orphan")
    sport = relationship("Sport", back_populates="teams")
    venue = relationship("Venue", back_populates="teams")


class TeamMember(Base):
    __tablename__ = "TeamMember"

    id = Column(Integer, primary_key=True, autoincrement=True)
    userId = Column(Integer, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    teamId = Column(Integer, ForeignKey("Team.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, default="PLAYER", nullable=False)
    jersey = Column(String, nullable=True)
    joinedAt = Column(DateTime(timezone=True), default=func.now(), nullable=False)

    user = relationship("User", back_populates="teamMembers")
    team = relationship("Team", back_populates="members")

    __table_args__ = (
        UniqueConstraint("userId", "teamId", name="TeamMember_userId_teamId_key"),
    )


class ParentLink(Base):
    __tablename__ = "ParentLink"

    id = Column(Integer, primary_key=True, autoincrement=True)
    parentId = Column(Integer, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    childId = Column(Integer, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    createdAt = Column(DateTime(timezone=True), default=func.now(), nullable=False)

    parent = relationship("User", foreign_keys=[parentId], back_populates="parentLinks")
    child = relationship("User", foreign_keys=[childId], back_populates="childLinks")

    __table_args__ = (
        UniqueConstraint("parentId", "childId", name="ParentLink_parentId_childId_key"),
    )


class Event(Base):
    __tablename__ = "Event"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False)
    type = Column(String, default="TRAINING", nullable=False)
    description = Column(String, nullable=True)
    location = Column(String, nullable=True)
    date = Column(DateTime(timezone=True), nullable=False)
    endTime = Column(DateTime(timezone=True), nullable=True)
    recurring = Column(Boolean, default=False, nullable=False)
    recurrence = Column(String, nullable=True)
    teamId = Column(Integer, ForeignKey("Team.id", ondelete="CASCADE"), nullable=False)
    createdById = Column(Integer, ForeignKey("User.id"), nullable=False)
    createdAt = Column(DateTime(timezone=True), default=func.now(), nullable=False)

    team = relationship("Team", back_populates="events")
    createdBy = relationship("User", back_populates="eventsCreated")
    rsvps = relationship("EventRSVP", back_populates="event", cascade="all, delete-orphan")
    attendances = relationship("Attendance", back_populates="event", cascade="all, delete-orphan")


class EventRSVP(Base):
    __tablename__ = "EventRSVP"

    id = Column(Integer, primary_key=True, autoincrement=True)
    eventId = Column(Integer, ForeignKey("Event.id", ondelete="CASCADE"), nullable=False)
    userId = Column(Integer, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, default="PENDING", nullable=False)
    respondedAt = Column(DateTime(timezone=True), default=func.now(), nullable=False)

    event = relationship("Event", back_populates="rsvps")
    user = relationship("User", back_populates="rsvps")

    __table_args__ = (
        UniqueConstraint("eventId", "userId", name="EventRSVP_eventId_userId_key"),
    )


class Attendance(Base):
    __tablename__ = "Attendance"

    id = Column(Integer, primary_key=True, autoincrement=True)
    eventId = Column(Integer, ForeignKey("Event.id", ondelete="CASCADE"), nullable=False)
    userId = Column(Integer, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, default="PRESENT", nullable=False)
    markedAt = Column(DateTime(timezone=True), default=func.now(), nullable=False)

    event = relationship("Event", back_populates="attendances")
    user = relationship("User", back_populates="attendances")

    __table_args__ = (
        UniqueConstraint("eventId", "userId", name="Attendance_eventId_userId_key"),
    )


class Payment(Base):
    __tablename__ = "Payment"

    id = Column(Integer, primary_key=True, autoincrement=True)
    userId = Column(Integer, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    type = Column(String, default="MEMBERSHIP", nullable=False)
    status = Column(String, default="PENDING", nullable=False)
    method = Column(String, nullable=True)
    reference = Column(String, nullable=True)
    description = Column(String, nullable=True)
    eventId = Column(Integer, nullable=True)
    dueDate = Column(DateTime(timezone=True), nullable=True)
    paidAt = Column(DateTime(timezone=True), nullable=True)
    createdAt = Column(DateTime(timezone=True), default=func.now(), nullable=False)

    user = relationship("User", back_populates="payments")


class Channel(Base):
    __tablename__ = "Channel"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    type = Column(String, default="GROUP", nullable=False)
    teamId = Column(Integer, ForeignKey("Team.id", ondelete="CASCADE"), nullable=True)
    createdAt = Column(DateTime(timezone=True), default=func.now(), nullable=False)

    team = relationship("Team", back_populates="channels")
    messages = relationship("Message", back_populates="channel", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "Message"

    id = Column(Integer, primary_key=True, autoincrement=True)
    channelId = Column(Integer, ForeignKey("Channel.id", ondelete="CASCADE"), nullable=False)
    userId = Column(Integer, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    content = Column(String, nullable=False)
    type = Column(String, default="TEXT", nullable=False)
    fileUrl = Column(String, nullable=True)
    createdAt = Column(DateTime(timezone=True), default=func.now(), nullable=False)

    channel = relationship("Channel", back_populates="messages")
    user = relationship("User", back_populates="messages")


class Announcement(Base):
    __tablename__ = "Announcement"

    id = Column(Integer, primary_key=True, autoincrement=True)
    teamId = Column(Integer, ForeignKey("Team.id", ondelete="CASCADE"), nullable=False)
    userId = Column(Integer, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    priority = Column(String, default="NORMAL", nullable=False)
    createdAt = Column(DateTime(timezone=True), default=func.now(), nullable=False)

    team = relationship("Team", back_populates="announcements")
    user = relationship("User", back_populates="announcements")


class Campaign(Base):
    __tablename__ = "Campaign"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    goalAmount = Column(Float, nullable=False)
    raised = Column(Float, default=0.0, nullable=False)
    status = Column(String, default="ACTIVE", nullable=False)
    teamId = Column(Integer, ForeignKey("Team.id", ondelete="CASCADE"), nullable=False)
    createdById = Column(Integer, ForeignKey("User.id"), nullable=False)
    endDate = Column(DateTime(timezone=True), nullable=True)
    createdAt = Column(DateTime(timezone=True), default=func.now(), nullable=False)

    team = relationship("Team", back_populates="campaigns")
    createdBy = relationship("User", back_populates="campaigns")
    donations = relationship("Donation", back_populates="campaign", cascade="all, delete-orphan")


class Donation(Base):
    __tablename__ = "Donation"

    id = Column(Integer, primary_key=True, autoincrement=True)
    campaignId = Column(Integer, ForeignKey("Campaign.id", ondelete="CASCADE"), nullable=False)
    userId = Column(Integer, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    message = Column(String, nullable=True)
    createdAt = Column(DateTime(timezone=True), default=func.now(), nullable=False)

    campaign = relationship("Campaign", back_populates="donations")
    user = relationship("User", back_populates="donations")


class Poll(Base):
    __tablename__ = "Poll"

    id = Column(Integer, primary_key=True, autoincrement=True)
    question = Column(String, nullable=False)
    teamId = Column(Integer, ForeignKey("Team.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, default="ACTIVE", nullable=False)
    createdAt = Column(DateTime(timezone=True), default=func.now(), nullable=False)

    team = relationship("Team", back_populates="polls")
    options = relationship("PollOption", back_populates="poll", cascade="all, delete-orphan")
    votes = relationship("PollVote", back_populates="poll", cascade="all, delete-orphan")


class PollOption(Base):
    __tablename__ = "PollOption"

    id = Column(Integer, primary_key=True, autoincrement=True)
    pollId = Column(Integer, ForeignKey("Poll.id", ondelete="CASCADE"), nullable=False)
    text = Column(String, nullable=False)

    poll = relationship("Poll", back_populates="options")
    votes = relationship("PollVote", back_populates="option", cascade="all, delete-orphan")


class PollVote(Base):
    __tablename__ = "PollVote"

    id = Column(Integer, primary_key=True, autoincrement=True)
    pollId = Column(Integer, ForeignKey("Poll.id", ondelete="CASCADE"), nullable=False)
    optionId = Column(Integer, ForeignKey("PollOption.id", ondelete="CASCADE"), nullable=False)
    userId = Column(Integer, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    votedAt = Column(DateTime(timezone=True), default=func.now(), nullable=False)

    poll = relationship("Poll", back_populates="votes")
    option = relationship("PollOption", back_populates="votes")
    user = relationship("User", back_populates="pollVotes")

    __table_args__ = (
        UniqueConstraint("pollId", "userId", name="PollVote_pollId_userId_key"),
    )


class Sport(Base):
    __tablename__ = "Sport"

    id = Column(String, primary_key=True)  # e.g., 'football'
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    icon_url = Column(String, nullable=True)
    accent_color = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

    venues = relationship("VenueSport", back_populates="sport", cascade="all, delete-orphan")
    teams = relationship("Team", back_populates="sport")


class Venue(Base):
    __tablename__ = "Venue"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    rating = Column(Float, default=0.0)
    description = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)
    website_url = Column(String, nullable=True)
    is_available = Column(Boolean, default=True)
    createdAt = Column(DateTime(timezone=True), default=func.now(), nullable=False)

    sports = relationship("VenueSport", back_populates="venue", cascade="all, delete-orphan")
    teams = relationship("Team", back_populates="venue")
    bookings = relationship("VenueBooking", back_populates="venue", cascade="all, delete-orphan")


class VenueSport(Base):
    __tablename__ = "VenueSport"

    venue_id = Column(Integer, ForeignKey("Venue.id", ondelete="CASCADE"), primary_key=True)
    sport_id = Column(String, ForeignKey("Sport.id", ondelete="CASCADE"), primary_key=True)

    venue = relationship("Venue", back_populates="sports")
    sport = relationship("Sport", back_populates="venues")


class VenueBooking(Base):
    __tablename__ = "VenueBooking"

    id = Column(Integer, primary_key=True, autoincrement=True)
    venue_id = Column(Integer, ForeignKey("Venue.id", ondelete="CASCADE"), nullable=False)
    team_id = Column(Integer, ForeignKey("Team.id", ondelete="CASCADE"), nullable=False)
    booker_id = Column(Integer, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    purpose = Column(String, nullable=True)
    status = Column(String, default="CONFIRMED", nullable=False)
    createdAt = Column(DateTime(timezone=True), default=func.now(), nullable=False)

    venue = relationship("Venue", back_populates="bookings")
    team = relationship("Team")
    booker = relationship("User")


