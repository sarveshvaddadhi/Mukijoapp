# Mukijo Sports Management Platform
## System Architecture, Database Models, and Module Connections Documentation

This document provides a comprehensive and exhaustive engineering guide to the **Mukijo Sports Management Platform**. It details how every component, database entity, and API route operates under the hood, and maps how they connect to orchestrate complete end-to-end user flows.

---

## 1. System Architecture Overview

Mukijo is a modern, high-performance sports team management application designed with a robust, modular architecture. It enables coaches, athletes, and parents to stay coordinated through scheduling, communication, payment tracking, and attendance management.

```
       +---------------------------------------------------------+
       |                  CLIENT LAYER (Next.js)                  |
       |  - React Components (AppShell, Sidebar, Topbar)         |
       |  - Local Session Storage (mukijo_user)                  |
       |  - Client-side Routing & Inter-module Redirections       |
       +----------------------------+----------------------------+
                                    |
                                    | HTTP Requests (JSON)
                                    v
       +---------------------------------------------------------+
       |                  SERVER LAYER (Next.js API)             |
       |  - App Router REST Endpoints (Prisma Client Calls)      |
       |  - Role-based Access Controls & Validations             |
       |  - External Gateway Integrations                        |
       +----------------------------+----------------------------+
                                    |
            +-----------------------+-----------------------+
            | ORM Queries (Prisma)  | API Requests          | API Requests
            v                       v                       v
+-----------------------+ +-------------------+ +-----------------------+
|   DATABASE LAYER      | |  MSG91 GATEWAY    | |   RAZORPAY GATEWAY    |
| - PostgreSQL          | | - SMS Dispatch    | | - Cryptographic Sign |
| - Relational Schema   | | - OTP Verification| | - Transaction Orders  |
+-----------------------+ +-------------------+ +-----------------------+
```

## 1.1 How It Works
Mukijo works by connecting three main layers: the user-facing frontend, the backend API layer, and the database/payment gateways.

- Authentication begins with Aadhaar SMS OTP verification and password login.
- The frontend stores user session data locally and redirects based on role:
  - `PLAYER` → `/calendar`
  - `PARENT` → `/settlement`
  - `COACH` / `ADMIN` → `/dashboard`
- Coaches and admins create teams, events, announcements, and payment invoices.
- Players and parents view schedules, submit RSVPs, and pay invoices through Razorpay.
- After an event, coaches record attendance and the backend updates event status in the database.
- External services (MSG91 and Razorpay) are used for OTP delivery and payment verification, while Prisma manages PostgreSQL operations.

This section summarizes the full app flow and serves as the main “how it works” reference.

### Core Technologies
1. **Frontend / Core Logic:** Next.js (React 18) utilizing the modern **App Router** framework (`app/` directory).
2. **Styling:** Premium Vanilla CSS-in-JS style objects and absolute custom CSS (`globals.css`) designed in an **Indigo-accented Professional Theme** with polished transitions, glassmorphic inputs, and hover micro-animations.
3. **Database Layer:** PostgreSQL managed via **Prisma ORM** for type-safe queries, relational integrity, and automated schema migrations.
4. **Authentication Gateways:** 
   - **MSG91:** Utilized for SMS OTP delivery and verification.
   - **Aadhaar (UIDAI System):** Integrated via secure API routes (using a highly accurate Mock Database verification in development) to authenticate player/parent identities during onboarding.
   - **Razorpay:** Integrated for secure, cryptographic payment orchestration (invoices, orders, and signature settlement verification).

---

## 2. Database Models & Schema Relationships

At the data layer, Mukijo enforces absolute relational integrity. Below is the Entity-Relationship Diagram (ERD) defining how the models connect.

### Entity-Relationship Diagram (Mermaid)

```mermaid
erDiagram
    User ||--o{ TeamMember : "belongs to"
    User ||--o{ ParentLink : "as Parent"
    User ||--o{ ParentLink : "as Child"
    User ||--o{ Event : "creates"
    User ||--o{ EventRSVP : "submits"
    User ||--o{ Attendance : "receives"
    User ||--o{ Payment : "makes"
    User ||--o{ Message : "sends"
    User ||--o{ Announcement : "publishes"
    User ||--o{ Donation : "contributes"
    User ||--o{ PollVote : "casts"
    User ||--o{ Campaign : "creates"

    Team ||--o{ TeamMember : "has"
    Team ||--o{ Event : "schedules"
    Team ||--o{ Channel : "contains"
    Team ||--o{ Announcement : "hosts"
    Team ||--o{ Campaign : "runs"
    Team ||--o{ Poll : "hosts"

    Channel ||--o{ Message : "contains"
    Event ||--o{ EventRSVP : "tracks"
    Event ||--o{ Attendance : "logs"

    Campaign ||--o{ Donation : "receives"
    Poll ||--o{ PollOption : "presents"
    Poll ||--o{ PollVote : "aggregates"
    PollOption ||--o{ PollVote : "voted in"
```

### Model Fields & Connections
* **`User`**: Contains core identity attributes. Linked to `TeamMember` (squad association), `ParentLink` (handles the hierarchical connection between Parents and Child Players), `Payment` (financial dues), `EventRSVP` (attendance responses), and communication logs.
* **`Team`**: Represents a sport squad (e.g. "Under 15s Elite"). Hosts events, announcements, communication channels, and active crowdfunding campaigns.
* **`TeamMember`**: A many-to-many join model connecting `User` and `Team` with dedicated team roles (`COACH`, `PLAYER`, `PARENT`, `ADMIN`) and dynamic assets (e.g., `jersey` numbers).
* **`ParentLink`**: Maps Parent-to-Child associations, enabling parents to settle invoices, review RSVPs, and keep updated on schedules for child players.
* **`Event` & `EventRSVP`**: Tracks matches/practices and player RSVPs (`GOING`, `NOT_GOING`, `MAYBE`, `PENDING`).
* **`Attendance`**: Connects `Event` and `User` to track post-event execution states (`PRESENT`, `ABSENT`, `LATE`, `EXCUSED`).
* **`Payment`**: Tracks financial history. Linked to a `User` (and optionally an `Event` for match fees). Holds statuses (`PAID`, `PENDING`, `OVERDUE`, `REFUNDED`).
* **`Campaign` & `Donation`**: Facilitates organizational fundraising campaigns.
* **`Poll` & `PollOption` & `PollVote`**: Provides democratic survey logic for team coordination.

---

## 3. Module-by-Module Technical Deep Dive

### Module 1: Aadhaar Registration & Verification
* **Purpose:** Ensures identity security by validating users via UIDAI Aadhaar biometric registration data before creating accounts.
* **How it works:**
  1. During registration (`/register`), a user selects their role (`COACH`, `PLAYER`, or `PARENT`) and inputs their 12-digit Aadhaar Number.
  2. Clicking **"Send OTP"** invokes [POST `/api/auth/send-aadhaar-otp`](file:///c:/Users/Admin/Desktop/Mukijoapp/frontend/app/api/auth/send-aadhaar-otp/route.js). If the Aadhaar number is clean (12 digits) and not already linked to an existing account in the database, the API triggers a verification SMS to the Aadhaar-registered mobile number.
  3. Once received, the user inputs the 6-digit OTP and clicks **"Verify"**, which triggers [POST `/api/auth/verify-aadhaar-otp`](file:///c:/Users/Admin/Desktop/Mukijoapp/frontend/app/api/auth/verify-aadhaar-otp/route.js).
  4. The system validates the OTP. Upon success, it fetches and displays verified demographic details (Legal Name, Gender, Date of Birth, Address) from the secure UIDAI database, automatically locking the User's Full Name inside the registration form to match their legal identity.
* **Development Fallback (Mock Mode):**
  - If MSG91 or live biometric keys are absent, the system logs the MOCK OTP message to the terminal console and accepts `123456` as the standard bypass OTP code, returning dummy Aadhaar profile details (e.g., `"SARVESH SHARMA"`, gender `"MALE"`, date of birth `"15-05-1995"`) to permit seamless local testing.
* **Database Connection:** Upon clicking **"Create Account"**, [POST `/api/auth/register`](file:///c:/Users/Admin/Desktop/Mukijoapp/frontend/app/api/auth/register/route.js) encrypts the password with `bcryptjs` and stores a new `User` row containing `aadhaarNo` and `aadhaarVerified: true`.

---

### Module 2: Authentication & Session Management
* **Purpose:** Handles secure user login, maintains user session state across browser refreshes, and enforces role-based redirection.
* **How it works:**
  1. The landing page [LoginPage (`/`)](file:///c:/Users/Admin/Desktop/Mukijoapp/frontend/app/page.js) offers toggleable **Email** and **Phone** input modes.
  2. Submitting the form posts to [POST `/api/auth/login`](file:///c:/Users/Admin/Desktop/Mukijoapp/frontend/app/api/auth/login/route.js). The server queries the `User` model by email or normalized phone number, compares the hashed password, and returns a verified JSON payload of the user profile (excluding the sensitive password field).
  3. Upon successful API response, the client saves the profile into browser session memory (`localStorage.setItem("mukijo_user", ...)`).
  4. A `useEffect` hook monitors the initial routing on landing:
     - If the role is **`PLAYER`**, they are immediately redirected to the **Calendar Module** (`/calendar`).
     - If the role is **`PARENT`**, they are redirected to the **Fee Settlement Module** (`/settlement`).
     - If the role is **`COACH`** or **`ADMIN`**, they land on the primary operational **Dashboard** (`/dashboard`).
* **Inter-Module Connectivity:** Reusable components like [Sidebar](file:///c:/Users/Admin/Desktop/Mukijoapp/frontend/components/Sidebar.js) and [Topbar](file:///c:/Users/Admin/Desktop/Mukijoapp/frontend/components/Topbar.js) query `mukijo_user` from `localStorage` to dynamically toggle navigation items, display initials, and enforce administrative buttons.

---

### Module 3: Interactive Dashboard
* **Purpose:** Acts as the primary organizational nerve center for Coaches and Admins, aggregating high-level system metrics.
* **How it works:**
  1. On mount, [Dashboard (`/dashboard`)](file:///c:/Users/Admin/Desktop/Mukijoapp/frontend/app/dashboard/page.js) issues asynchronous queries using `Promise.all` to fetch statistics from five endpoints:
     - `/api/events?userId=${userId}` (Event records)
     - `/api/teams?userId=${userId}` (Group stats)
     - `/api/payments` (Aggregated collection stats)
     - `/api/announcements` (Recent announcements)
     - `/api/campaigns` (Fundraising campaigns)
  2. The page computes and displays real-time key performance indicators (KPIs): **Upcoming Events**, **Active Teams**, **Pending/Overdue Payments**, and **Active Announcements count**.
  3. **Next Event Focus Panel:** Automatically filters the closest chronological upcoming event and breaks down player RSVP states (total accepted, declined, and pending RSVPs) using visual count panels.
  4. **Financial Tally Card:** Highlights financial statuses: total fees collected versus overdue balances, with conditional red warning outlines if overdue items exceed zero.
  5. **Quick Action Panel:** Provides immediate, high-priority buttons to open forms like creating events, recording match payments, or marking check-in attendance.

---

### Module 4: Groups & Team Management
* **Purpose:** Allows Coaches to map the organizational structure by creating groups (teams/squads) and adding members with custom roles.
* **How it works:**
  1. The Groups interface [Groups (`/groups`)](file:///c:/Users/Admin/Desktop/Mukijoapp/frontend/app/groups/page.js) calls [GET `/api/teams`](file:///c:/Users/Admin/Desktop/Mukijoapp/frontend/app/api/teams/route.js) to retrieve all squads.
  2. A Coach can submit a team creation form, triggering [POST `/api/teams`](file:///c:/Users/Admin/Desktop/Mukijoapp/frontend/app/api/teams/route.js) which registers the team in the database and automatically binds the creator as the head `COACH` via a joint `TeamMember` row.
  3. Selecting a team opens an immersive view querying [GET `/api/teams/[id]`](file:///c:/Users/Admin/Desktop/Mukijoapp/frontend/app/api/teams/[id]/route.js). This lists all squad athletes, parents, and administrative staff, displaying assigned jersey numbers.
  4. Adding a member to a team triggers [POST `/api/teams/[id]/members`](file:///c:/Users/Admin/Desktop/Mukijoapp/frontend/app/api/teams/[id]/members/route.js), binding a `User`'s ID to the target `Team`'s ID while assigning an intra-team role (`PLAYER`, `PARENT`, etc.) and their optional `jersey` identifier.

---

### Module 5: Events & Scheduling
* **Purpose:** Coordinates team schedules (matches, practices, group training, team meetings) and tracks RSVPs.
* **How it works:**
  1. Organizers create an event through [Events page (`/events`)](file:///c:/Users/Admin/Desktop/Mukijoapp/frontend/app/events/page.js), specifying a team, description, location, time, and recurrence (e.g. weekly).
  2. The request posts to [POST `/api/events`](file:///c:/Users/Admin/Desktop/Mukijoapp/frontend/app/api/events/route.js), which records the event and links it to the `Team` model.
  3. **RSVP Coordination:** Users viewing the event panel can submit their availability status (**Going**, **Not Going**, or **Maybe**).
  4. Availability changes trigger [POST `/api/events/rsvp`](file:///c:/Users/Admin/Desktop/Mukijoapp/frontend/app/api/events/rsvp/route.js). This performs a database **upsert** operation (via `prisma.eventRSVP.upsert`) ensuring that any subsequent modification by the user updates their existing row rather than appending a duplicate record.
* **Visual Styling:** Matches are Indigo, training sessions are Green, and team meetings are Orange/Blue.

---

### Module 6: Calendar Module
* **Purpose:** Provides players and coaches with a structured month-by-month chronological schedule of all squad actions.
* **How it works:**
  1. The Calendar module [Calendar (`/calendar`)](file:///c:/Users/Admin/Desktop/Mukijoapp/frontend/app/calendar/page.js) computes day coordinates to align the current month's calendar into a standard Monday-Sunday grid.
  2. On load, it queries all events the user is linked to via their team memberships.
  3. Events are plotted as colored dots or bars on the respective calendar grid cells.
  4. Clicking on a specific day coordinates a state update, instantly rendering detailed schedules and event cards (times, RSVPs, locations) in an adjacent side panel.
  5. Users can update their RSVP states directly from this calendar panel.

---

### Module 7: Payments & Razorpay Fee Settlement
* **Purpose:** Manages the generation, tracking, and secure settlement of player membership fees, match expenses, and club invoices using Razorpay.
* **How it works (Razorpay Transaction Flow):**
  1. An admin generates fee invoices. The user logs in, navigates to [Payments (`/payments`)](file:///c:/Users/Admin/Desktop/Mukijoapp/frontend/app/payments/page.js) or the Parent [Settlement Module (`/settlement`)](file:///c:/Users/Admin/Desktop/Mukijoapp/frontend/app/settlement/page.js), and selects their pending invoices.
  2. Clicking **"Pay Now"** triggers a client request containing invoice parameters to [POST `/api/create-order`](file:///c:/Users/Admin/Desktop/Mukijoapp/frontend/app/api/create-order/route.js).
  3. The server backend instantiates a `Razorpay` class wrapper using environment credentials (`NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`), converts the rupee transaction amount into paise (required by Razorpay), and requests an official `Order ID` from the Razorpay API.
  4. Upon getting the `Order ID`, the backend responds to the client, which dynamically opens the native secure **Razorpay Checkout modal** widget inside the browser interface.
  5. The user executes the transaction (card, UPI, net banking). Razorpay processes the funds and generates three values: `razorpay_order_id`, `razorpay_payment_id`, and a cryptographically generated secure string: `razorpay_signature`.
  6. The client sends these three values along with the invoice database IDs to [POST `/api/verify-payment`](file:///c:/Users/Admin/Desktop/Mukijoapp/frontend/app/api/verify-payment/route.js).
  7. **Cryptographic Validation:** The server reads its private `RAZORPAY_KEY_SECRET` and creates an **HMAC SHA-256 hash** combining the `order_id` and the `payment_id`.
     ```javascript
     const generated_signature = crypto
       .createHmac("sha256", secret)
       .update(razorpay_order_id + "|" + razorpay_payment_id)
       .digest("hex");
     ```
  8. If `generated_signature` matches `razorpay_signature`, the server updates the respective `Payment` rows in the PostgreSQL database, marking them as `PAID`, saving the payment method as `RAZORPAY`, logging the `reference` transaction ID, and recording the execution timestamp (`paidAt`).
* **Development Fallback (Mock Mode):**
  - If the secret key matches `"placeholder_secret"`, the system bypasses external server calls, generates a mock order ID (`"mock_order_1715..."`), automatically verifies the signature on submit, and safely flags the invoice as `PAID` in the database.

---

### Module 8: Fundraising & Campaigns
* **Purpose:** Empowers teams to run targeted crowdsourced fundraising events for equipment, tournaments, or travel costs.
* **How it works:**
  1. Coaches create campaigns via [Fundraising (`/fundraising`)](file:///c:/Users/Admin/Desktop/Mukijoapp/frontend/app/fundraising/page.js), entering a title, description, target goal amount, and end date.
  2. The request is processed by [POST `/api/campaigns`](file:///c:/Users/Admin/Desktop/Mukijoapp/frontend/app/api/campaigns/route.js) to store the campaign.
  3. Players or parents can click **"Donate"** on active campaign cards.
  4. Payments are processed through the secure Razorpay pipeline. Upon validation, the server increments the campaign's `raised` value in the database.
  5. **Dynamic Progress Bars:** The user interface computes progress percentages (`(raised / goalAmount) * 100`) in real-time, showing sleek, animated Indigo-to-Green transitions as goals are met.

---

### Module 9: Announcements & Communications
* **Purpose:** Enables top-down broadcasting of notifications, training schedule revisions, or critical news from coaches to players and parents.
* **How it works:**
  1. Admins write announcements on the Communication panel, selecting priority states (**NORMAL**, **INFO**, or **URGENT**).
  2. The details are sent to [POST `/api/announcements`](file:///c:/Users/Admin/Desktop/Mukijoapp/frontend/app/api/announcements/route.js) and written to the database.
  3. **Real-Time Cross-Module Alerts:**
     - The Dashboard queries `/api/announcements` on load.
     - Urgent announcements are displayed prominently on the dashboard with a red alert badge (e.g. `⚠️ VENUE CHANGED - Match moves to main arena`).

---

## 4. End-to-End Core Integration Flows

### A. The User Onboarding Flow
This sequence details how a player registers, verifies their identity via Aadhaar, creates their credentials, and is directed to their specific landing module.

```
+------------+          +------------------+          +---------------+          +--------------------+
|   Player   |          |  Aadhaar API    |          |  Register API |          | localStorage/Client|
| (Frontend) |          | (send-aadhaar-otp)|          |  (register)   |          |    Redirect        |
+-----+------+          +--------+---------+          +-------+-------+          +---------+----------+
      |                          |                            |                            |
      | 1. Input Aadhaar         |                            |                            |
      |    (Click "Send OTP")    |                            |                            |
      |------------------------->|                            |                            |
      |                          |---\                        |                            |
      |                          |   | 2. Generate OTP        |                            |
      |                          |<--/    (e.g., 123456)      |                            |
      |                          |                            |                            |
      | 3. Return OTP Sent       |                            |                            |
      |<-------------------------|                            |                            |
      |                          |                            |                            |
      | 4. Input 6-Digit OTP     |                            |                            |
      |    (Click "Verify")      |                            |                            |
      |------------------------->|                            |                            |
      |                          |---\                        |                            |
      |                          |   | 5. Validate OTP        |                            |
      |                          |<--/    (Retrieve Profile)  |                            |
      |                          |                            |                            |
      | 6. Return Verified Info  |                            |                            |
      |    (Name auto-populated) |                            |                            |
      |<-------------------------|                            |                            |
      |                          |                            |                            |
      | 7. Input Password/Captcha                             |                            |
      |    (Click "Create Account")                           |                            |
      |------------------------------------------------------>|                            |
      |                          |                            |---\                        |
      |                          |                            |   | 8. Hash Password &     |
      |                          |                            |   |    Insert User to DB   |
      |                          |                            |<--/                        |
      |                          |                            |                            |
      | 9. Return Registered User Payload                     |                            |
      |<------------------------------------------------------|                            |
      |                                                                                    |
      | 10. Parse User & Role (Role: "PLAYER")                                             |
      |----------------------------------------------------------------------------------->|
      |                                                                                    |---\
      |                                                                                    |   | 11. Write Session
      |                                                                                    |   |     Redirect to:
      |                                                                                    |   |     /calendar
      |                                                                                    |<--/
```

---

### B. The Event RSVP & Attendance Flow
This flow details how events are created, players submit RSVPs, and coaches record attendance during operations.

```
+------------+          +-------------+          +-------------+          +------------------+
|   Coach    |          |  Event API  |          |   Player    |          |  Attendance API  |
| (Frontend) |          |  (/events)  |          | (Calendar)  |          |  (/attendance)   |
+-----+------+          +------+------+          +-----+-------+          +--------+---------+
      |                        |                       |                           |
      | 1. Create practice     |                       |                           |
      |    (Team: U15, 6 PM)   |                       |                           |
      |----------------------->|                       |                           |
      |                        |---\                   |                           |
      |                        |   | 2. Insert Event   |                           |
      |                        |   |    into DB        |                           |
      |                        |<--/                   |                           |
      |                        |                       |                           |
      |                        | 3. Fetch Event        |                           |
      |                        |    (on mount)         |                           |
      |                        |<----------------------|                           |
      |                        |                       |                           |
      |                        | 4. Return Event dot   |                           |
      |                        |---------------------->|                           |
      |                        |                       |                           |
      |                        | 5. Player RSVPs       |                           |
      |                        |    ("GOING")          |                           |
      |                        |<----------------------|                           |
      |                        |---\                   |                           |
      |                        |   | 6. Upsert RSVP    |                           |
      |                        |   |    in DB          |                           |
      |                        |<--/                   |                           |
      |                        |                       |                           |
      | 7. Match Completed     |                       |                           |
      |    Coach opens sheet   |                       |                           |
      |--------------------------------------------------------------------------->|
      |                        |                       |                           |---\
      |                        |                       |                           |   | 8. Fetch RSVP status
      |                        |                       |                           |   |    for default layout
      |                        |                       |                           |<--/
      |                        |                       |                           |
      | 9. Mark Attendance Checkboxes (Player: Present, Late)                      |
      |    (Click "Save Bulk Attendance")                                          |
      |--------------------------------------------------------------------------->|
      |                        |                       |                           |---\
      |                        |                       |                           |   | 9. Bulk Upsert in
      |                        |                       |                           |   |    Attendance DB
      |                        |                       |                           |<--/
      |                        |                       |                           |
      | 10. Return Save Success                                                    |
      |<---------------------------------------------------------------------------|
```

---

### C. The Razorpay Billing & Settlement Flow
This flow details how outstanding player invoices are settled securely.

```
+------------+          +-------------------+          +---------------+          +--------------------+
|   Player   |          | Order API         |          |   Razorpay    |          | Verification API   |
| (Frontend) |          | (/api/create-order|          |   Checkout    |          | (/api/verify-pay)  |
+-----+------+          +--------+----------+          +-------+-------+          +---------+----------+
      |                          |                             |                            |
      | 1. Select Invoices       |                             |                            |
      |    (Click "Pay Now")     |                             |                            |
      |------------------------->|                             |                            |
      |                          |---\                         |                            |
      |                          |   | 2. Create Order in Paise|                            |
      |                          |   |    (e.g. ₹500 = 50000)  |                            |
      |                          |<--/                         |                            |
      |                          |                             |                            |
      | 3. Return Order ID       |                             |                            |
      |<-------------------------|                             |                            |
      |                                                        |                            |
      | 4. Initialize Razorpay Modal                           |                            |
      |------------------------------------------------------->|                            |
      |                                                        |---\                        |
      |                                                        |   | 5. Process Payment     |
      |                                                        |   |    (Authorize funds)   |
      |                                                        |<--/                        |
      |                                                        |                            |
      | 6. Return Cryptographic Signature, Order ID, Payment ID|                            |
      |<-------------------------------------------------------|                            |
      |                                                                                     |
      | 7. Send Signature Details to Verify                                                 |
      |------------------------------------------------------------------------------------>|
      |                                                                                     |---\
      |                                                                                     |   | 8. Verify HMAC-SHA256
      |                                                                                     |   |    Update DB Invoices
      |                                                                                     |   |    status: "PAID"
      |                                                                                     |<--/
      |                                                                                     |
      | 9. Return Settlement Success (Display Verified Badge)                                |
      |<------------------------------------------------------------------------------------|
```

---

## 5. Development Environmental Configurations

To ensure the local server boots correctly, create a secure environment configuration file:
* **File Location:** [`.env`](file:///c:/Users/Admin/Desktop/Mukijoapp/frontend/.env)

### Key Variables

| Variable | Recommended Dev Value | Purpose |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://username:pass@localhost:5432/mukijo` | Connection string for the PostgreSQL Database. |
| `MSG91_AUTH_KEY` | `placeholder_auth_key` | Security key for the MSG91 SMS gateway service. Bypasses real calls if set to placeholder. |
| `MSG91_TEMPLATE_ID` | `placeholder_template` | Template identifier for registered transaction messages on MSG91. |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `rzp_test_placeholder` | Public identification key for launching Razorpay client checkout widget. |
| `RAZORPAY_KEY_SECRET` | `placeholder_secret` | Cryptographic secret key for computing HMAC verification. Bypasses live verification if set to placeholder. |

---

## 6. How Modules Connect & Orchestrate
To understand how these independent pieces interact to form a cohesive ecosystem, review these functional links:
* **The Onboarding Link:** When a user registers, they undergo Aadhaar verification. The identity name returned from Aadhaar is passed into the [User Database Model](file:///c:/Users/Admin/Desktop/Mukijoapp/frontend/prisma/schema.prisma#L11). This ensures that coaches and teammates can identify the athlete using official biometric identities.
* **The Team-to-User Link:** The [TeamMember](file:///c:/Users/Admin/Desktop/Mukijoapp/frontend/prisma/schema.prisma#L53) model maps users to teams. This is a critical junction. The dashboard queries events and announcements *only* for the teams of which the logged-in user is a member.
* **The Event-to-Attendance Link:** An event has a series of RSVP records. When a coach takes attendance, the [Attendance API](file:///c:/Users/Admin/Desktop/Mukijoapp/frontend/app/api/attendance/route.js) populates a list of players on that event's team. If a player RSVP'd `GOING`, they are shown at the top of the checklist as expected.
* **The Payment-to-Campaign Link:** Campaigns allow club crowdsourced donations. When a donation is recorded in the [Campaign Database](file:///c:/Users/Admin/Desktop/Mukijoapp/frontend/prisma/schema.prisma#L201), the transaction is verified through the Razorpay system. Once verified, the donation amount is added directly to the campaign's `raised` balance, updating progress charts dashboard-wide.
