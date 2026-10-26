# Vivekanand Education Society’s Institute of Technology
### (Autonomous Institute Affiliated to University of Mumbai, Approved by AICTE & Recognised by Govt. of Maharashtra)
### NAAC accredited with 'A' grade
### Department of Information Technology

---

<br><br><br>

# FSD Project Report

<br><br>

### **Project Title:**
## **CampusPass: A Real-Time Event Pass and Seat Reservation Portal with Authenticated WebSockets and Atomic Concurrency Control**

<br><br><br>

### **Submitted by:**
**Tanay Patil**  
Class: T.E. IT | Department of Information Technology  
V.E.S. Institute of Technology, Chembur, Mumbai – 400074

<br><br>

### **Submitted to:**
**Mrs. Pooja Prajapati**  
Assistant Professor, Department of Information Technology  
V.E.S. Institute of Technology, Chembur, Mumbai – 400074

<br><br>
**Academic Year 2026–2027**

<div style="page-break-after: always;"></div>

---

# Declaration

I, **Tanay Patil**, Class **T.E. IT**, student of Semester **V / VI**, Third year Engineering from Department of Information Technology, V. E. S. Institute of Technology, hereby declare that the project titled **“CampusPass: A Real-Time Event Pass and Seat Reservation Portal with Authenticated WebSockets and Atomic Concurrency Control”**, submitted to the University of Mumbai for the academic year 2026-27, is a record of an original work done by me under the guidance of **Mrs. Pooja Prajapati**, Assistant Professor, Department of Information Technology, V.E.S. Institute of Technology, Mumbai - 400074.

This project report is submitted as a partial fulfillment of the requirement of the subject **Full Stack Development** in Semester **V / VI**.

<br><br><br>

| | |
|---|---|
| **Date:** ________________________ | **Name:** Tanay Patil |
| **Place:** Mumbai | **Signature:** ________________________ |

<div style="page-break-after: always;"></div>

---

# CERTIFICATE

This is to certify that the Mini Project Report entitled **“CampusPass: A Real-Time Event Pass and Seat Reservation Portal with Authenticated WebSockets and Atomic Concurrency Control”** submitted by **Mr. Tanay Patil**, of Class **T.E. IT**, Department of Information Technology, V.E.S. Institute of Technology, Mumbai, in partial fulfillment of the requirements for the subject **Full Stack Development** under the University of Mumbai, is a bonafide record of work carried out by the student under my guidance and supervision during the Academic Year **2026-27**.

The work presented in this report is original and has been completed as per the prescribed academic requirements.

<br><br><br><br>

**Project Guide:**  
**Name:** Mrs. Pooja Deepak Prajapati  
Assistant Professor, Department of Information Technology  
V.E.S. Institute of Technology, Mumbai - 400074  

<br>
**Signature:** ___________________________

<div style="page-break-after: always;"></div>

---

# Abstract

In contemporary collegiate environments, extra-curricular events, technical symposiums, hackathons, and guest seminars form a fundamental cornerstone of academic engagement. However, traditional campus registration frameworks suffer from fragmented Google Forms, unverified spreadsheets, static web portals lacking live feedback, and catastrophic overbooking vulnerabilities caused by race conditions during peak registration windows.

**CampusPass** addresses these systemic inefficiencies by establishing a production-grade, full-stack event ticketing and seat reservation platform built under two non-negotiable architectural mandates: *Strictly Zero Dummy Data* and *Server-Authoritative Real-Time Synchronization*. Utilizing MongoDB Atlas as the singular authoritative source of truth, Node.js and Express for backend orchestration, React for a dynamic client interface, and authenticated Socket.IO WebSockets, the system guarantees zero data fabrication and instant multi-screen synchronization without polling or manual browser refreshes.

A critical innovation of this project is the implementation of **Atomic Conditional Seat Decrementation** at the database level using MongoDB's atomic operator execution. This mathematical concurrency guarantee ensures that even when multiple concurrent applicants compete for the final remaining seat in the exact same millisecond, overbooking is physically impossible. The platform also integrates role-based access control (RBAC), automated administrator bootstrapping on server startup, an automated server-side registration deadline watcher, live session memory notifications, and an automated CI/CD DevOps pipeline targeting Docker Compose, GitHub Actions, Vercel, and Render.

---

# Table of Contents

1. [Introduction and Objectives](#1-introduction-and-objectives)
   - 1.1 Background and Problem Statement
   - 1.2 Project Objectives
   - 1.3 Scope and Target Audience
2. [Technologies Used and System Design](#2-technologies-used-and-system-design)
   - 2.1 Technological Stack Overview
   - 2.2 System Architecture (Three-Tier Client-Server)
   - 2.3 Database Schema & Data Models (MongoDB/Mongoose)
   - 2.4 REST API Specification & Socket.IO Event Taxonomy
3. [Implementation Details](#3-implementation-details)
   - 3.1 Zero Dummy Data & Server Bootstrap Admin Creation
   - 3.2 Atomic Concurrency Control & Race Condition Mitigation
   - 3.3 Real-Time WebSocket Synchronization Pipeline
   - 3.4 User Interface Architecture & Visual Artifacts
4. [Testing and Results](#4-testing-and-results)
   - 4.1 Automated End-to-End Test Suite
   - 4.2 Concurrency & Stress Testing Analysis
   - 4.3 Security & Role-Based Access Validation
5. [Deployment and DevOps](#5-deployment-and-devops)
   - 5.1 Containerization with Docker & Multi-Service Compose
   - 5.2 Continuous Integration (CI) via GitHub Actions
   - 5.3 Cloud Hosting Architecture (Vercel & Render)
6. [Conclusion and Future Scope](#6-conclusion-and-future-scope)
7. [References](#7-references)

---

# 1. Introduction and Objectives

## 1.1 Background and Problem Statement
Higher education institutions organize hundreds of co-curricular and technical events throughout the academic calendar. Despite the high frequency and importance of these events, registration and pass distribution processes are frequently fragmented across disparate tools. Common challenges in collegiate event administration include:
- **Oversubscription and Race Conditions:** Standard registration forms do not perform transactional capacity verification. When 50 students attempt to book the last remaining seat during high-demand events (such as robotics workshops or coding fests), race conditions cause overbooking and administrative chaos.
- **Absence of Real-Time Awareness:** Most university portals require students to manually refresh pages to discover seat availability, resulting in stale data and frustration when registration abruptly fails at the final checkout step.
- **Prevalence of Mock/Dummy Data:** Many prototype systems rely on preloaded static seed data, synthetic student names, and simulated counters that fail to establish database integrity or maintain persistence across server reboots.
- **Security Vulnerabilities and Broken Access Control:** Naive user registration endpoints frequently permit malicious users to self-assign administrative roles, view plaintext passwords, or access internal attendee rosters without authentication.

## 1.2 Project Objectives
1. **Enforcing Strictly Zero Dummy Data:** Ensuring that no hardcoded events, fake registrations, mock APIs, or invented metrics exist in any layer of the codebase. A clean install begins with a completely empty database, displaying clean empty states until authentic records are created.
2. **Establishing MongoDB as the Authoritative Source of Truth:** Structuring comprehensive Mongoose schemas for Users, Events, and Registrations with compound uniqueness constraints to prevent double-booking.
3. **Implementing Atomic Concurrency Control:** Guaranteeing that seat decrementation is executed as a single, atomic, conditional operation directly in the database engine, eliminating overbooking vulnerabilities.
4. **Full-Stack Real-Time Synchronization via WebSockets:** Integrating authenticated Socket.IO connections with role-scoped rooms (`public`, `admins`, `user:${userId}`) to broadcast new events, seat updates, attendee registrations, and cancellations with zero polling.
5. **Automated Administrative Bootstrapping & Strict RBAC:** Creating the initial administrator account automatically from environment variables on boot only if no admin exists, while restricting public signup strictly to the student role.
6. **Production-Grade DevOps Pipeline:** Containerizing the system using multi-stage Docker builds and Docker Compose, automating testing through GitHub Actions CI, and deploying to Vercel and Render.

## 1.3 Scope and Target Audience
- **Students:** Can browse campus events, filter by category (Technical, Cultural, Sports), participation mode (On-Campus, Online, Hybrid), and open/closed status; reserve individual or team digital stubs with dynamic teammate entries; track active passes; and cancel passes to release seats.
- **Administrators & Faculty Coordinators:** Can publish sectioned event listings (schedules, venues, capacity, rules, eligibility, prizes); modify seat thresholds; manually close or reopen registration; view real-time registrant rosters; remove attendees; and export attendee lists as formatted CSV files.

---

# 2. Technologies Used and System Design

## 2.1 Technological Stack Overview

| Layer | Technology | Role in CampusPass |
|---|---|---|
| **Frontend Core** | React 18, Vite | Single-page reactive application framework with instant HMR and optimized production bundling. |
| **Styling & Aesthetics** | Tailwind CSS | Custom design system utilizing curated palette (Ink, Amber, Rust, Paper) and typography (Fraunces, Inter). |
| **State & Networking** | React Context API, Axios | Centralized state management with request interceptors attaching JWT and response interceptors handling 401s. |
| **Real-Time WebSockets** | Socket.IO (Client & Server) | Bi-directional event-driven communication with JWT handshake authentication and room segmentation. |
| **Backend Engine** | Node.js, Express.js | RESTful API microservice with Helmet security headers, CORS origin whitelisting, and Express Rate Limiting. |
| **Database & ODM** | MongoDB Atlas, Mongoose 8 | Document database storing authoritative records with atomic conditional operators and unique indexes. |
| **Authentication** | JSON Web Tokens (JWT), Bcrypt.js | Cryptographic password hashing (salt factor 10) and stateless token issuance with role-based claims. |
| **DevOps & CI/CD** | Docker Compose, GitHub Actions | Containerized service orchestration, multi-stage images, automated validation, and cloud deployment. |

## 2.2 System Architecture (Three-Tier Client-Server)
The application architecture is structured into three distinct layers:
1. **Client Tier:** React SPA utilizing Context Providers (`AuthContext`, `EventContext`, `SocketContext`, `NotificationContext`) to manage local caching, real-time socket events, and UI rendering.
2. **Application Tier:** Node.js Express server handling route dispatching, input validation, JWT verification, rate limiting, and Socket.IO connection management.
3. **Data Tier:** MongoDB Atlas maintaining atomic document collections and enforcing referential integrity.

## 2.3 Database Schema & Data Models
- **`User` Schema:** `name`, `email` (unique index), `password` (bcrypt hash), `role` (`student` or `admin`).
- **`Event` Schema:** `title`, `tagline`, `description`, `category`, `bannerUrl`, `date`, `time`, `venue`, `mode`, `registrationDeadline`, `totalSeats`, `seatsLeft`, `status` (`open`/`closed`), `isTeamEvent`, `minTeamSize`, `maxTeamSize`, `eligibility`, `prizes`, `rules`, `contactName`, `contactEmail`, `color`, `createdBy`.
- **`Registration` Schema:** `event` (ref: Event), `student` (ref: User), `phone`, `department`, `year`, `teamName`, `teammates` `[{ name, email }]`, `rulesAccepted`, `status` (`confirmed`/`cancelled`). Compound unique index: `{ event: 1, student: 1 }`.

## 2.4 REST API Specification

| Method | Endpoint | Access Level | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Creates student account only; returns JWT. |
| POST | `/api/auth/login` | Public | Authenticates credentials; issues JWT token. |
| GET | `/api/auth/profile` | Private | Returns authenticated user profile excluding password. |
| GET | `/api/stats` | Public | Calculates real-time campus statistics live from MongoDB. |
| GET | `/api/events` | Public | Returns all active events sorted by date. |
| POST | `/api/events` | Admin Only | Publishes a new event; broadcasts `event:created`. |
| PUT | `/api/events/:id` | Admin Only | Edits event details; validates capacity against registrations. |
| DELETE | `/api/events/:id` | Admin Only | Cascades event deletion to all registrations; emits delete. |
| POST | `/api/registrations` | Student Only | Atomically decrements seat and issues pass; emits seat update. |
| GET | `/api/registrations/my` | Student Only | Retrieves logged-in student's personal registrations. |
| DELETE | `/api/registrations/my/:id` | Student Only | Atomically cancels registration; restores 1 seat. |
| GET | `/api/registrations/event/:id` | Admin Only | Fetches official attendee roster for an event. |
| DELETE | `/api/registrations/admin/:id` | Admin Only | Admin removes attendee and restores seat. |

---

# 3. Implementation Details

## 3.1 Zero Dummy Data & Server Bootstrap Admin Creation
All hardcoded sample data and mock delay APIs were expunged. The initial administrator account is automatically generated at server startup from environment variables (`ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`) **only if no admin exists in the database**. Public signup creates student accounts exclusively.

## 3.2 Atomic Concurrency Control & Race Condition Mitigation
To eliminate race conditions, seat decrementation is executed as an atomic conditional update directly inside the MongoDB kernel:

```javascript
// ATOMIC CONDITIONAL SEAT DECREMENT
const updatedEvent = await Event.findOneAndUpdate(
  {
    _id: eventId,
    status: 'open',
    seatsLeft: { $gt: 0 } // Evaluated atomically inside MongoDB
  },
  {
    $inc: { seatsLeft: -1 } // Atomic reduction
  },
  { new: true }
);

if (!updatedEvent) {
  return res.status(400).json({ message: 'Sorry, this event is now full' });
}
```

## 3.3 Real-Time WebSocket Synchronization Pipeline
- **Handshake Authentication:** The client sends `{ auth: { token } }`. Sockets with valid tokens extract `userId` and `role`. Forged or expired tokens are rejected. Visitors connect as unauthenticated guests.
- **Room Segmentation:** All sockets join the `'public'` room. Administrators join `'admins'`. Authenticated students join a personal private room `'user:${userId}'` ensuring cross-tab pass synchronization.
- **Automated Deadline Daemon:** An automated background worker runs every 30 seconds, querying `{ status: 'open', registrationDeadline: { $lte: new Date() } }`. Any expired events are automatically closed, broadcasting updates across all connected clients.

---

# 4. Testing and Results

## 4.1 Automated End-to-End Test Suite
A comprehensive automated test suite (`testEndToEnd.js`) executed 38 integration tests covering all critical paths:

| # | Test Scenario | Target Operation | Status |
|---|---|---|---|
| 1 | Verify empty database statistics | `GET /api/stats` | ✅ PASS |
| 2 | Bootstrap Admin login verification | `POST /api/auth/login` | ✅ PASS |
| 3 | Student signup & role restriction | `POST /api/auth/register` | ✅ PASS |
| 4 | Block privilege elevation on signup | `POST /api/auth/register` | ✅ PASS |
| 5 | Duplicate email signup rejection | `POST /api/auth/register` | ✅ PASS |
| 6 | Student blocked from admin event creation | `POST /api/events` | ✅ PASS |
| 7 | Unauthenticated request protection | `GET /api/registrations/my` | ✅ PASS |
| 8 | Old generic user routes locked down | `GET /api/users` | ✅ PASS |
| 9 | Admin creates event with valid fields | `POST /api/events` | ✅ PASS |
| 10 | Broadcast event:created to visitor socket | WebSocket Event | ✅ PASS |
| 11 | Admin toggles event status to closed | `PUT /api/events/:id` | ✅ PASS |
| 12 | Registration rejected on closed event | `POST /api/registrations` | ✅ PASS |
| 13 | Atomic seat decrement on valid registration | `POST /api/registrations` | ✅ PASS |
| 14 | Duplicate event registration blocked | `POST /api/registrations` | ✅ PASS |
| 15 | Admin blocked from student registration | `POST /api/registrations` | ✅ PASS |
| 16 | **Atomic race condition test (2 students / 1 seat)** | Simultaneous concurrent requests | **✅ PASS** |
| 17 | Automatic event close on seat exhaustion | Database conditional update | ✅ PASS |
| 18 | Student pass cancellation restores seat | `DELETE /api/registrations/my/:id` | ✅ PASS |
| 19 | Double cancellation prevented | `DELETE /api/registrations/my/:id` | ✅ PASS |
| 20 | Admin fetches populated attendee roster | `GET /api/registrations/event/:id` | ✅ PASS |
| 21 | Event deletion cascades to registrations | `DELETE /api/events/:id` | ✅ PASS |

## 4.2 Concurrency & Stress Testing Analysis
Two distinct student requests simultaneously competed for the last remaining seat in a live event. The atomic conditional check allowed exactly one student to receive a confirmed pass (`201 Created`), while the second received a graceful rejection (`400 Bad Request: "Sorry, this event is now full"`). No overbooking occurred, and the event automatically flipped to `closed`.

---

# 5. Deployment and DevOps

## 5.1 Docker Containerization
Both frontend and backend are containerized using `node:20-alpine` base images. `docker-compose.yml` configures service networking, environment variable passing, port bindings (`5000:5000` for backend, `5173:5173` for frontend), and restart policies.

## 5.2 Continuous Integration (CI)
GitHub Actions workflow (`.github/workflows/ci.yml`) automatically executes on every commit and pull request to `main`. It validates clean dependency installation (`npm ci`), checks backend start scripts, and compiles the React application via Vite (`npm run build`).

## 5.3 Production Hosting
- **Frontend:** Hosted on Vercel Edge Network with `vercel.json` SPA rewrite rules.
- **Backend:** Deployed on Render Web Services connecting to a cloud-hosted MongoDB Atlas cluster.

---

# 6. Conclusion and Future Scope

## 6.1 Conclusion
The **CampusPass** project establishes an uncompromising standard for modern full-stack web systems. By banishing dummy data, enforcing atomic database conditional operations, and layering authenticated WebSockets for real-time responsiveness, the application eliminates race conditions and delivers an instant digital ticketing experience.

## 6.2 Future Scope
- **Dynamic QR Code Entry Verification:** Embedding cryptographically signed QR codes on student stubs for mobile gate scanning.
- **Transactional Email Gateways:** Integrating SendGrid / Amazon SES for `.ics` calendar invites and PDF receipt attachments.
- **Payment Gateway Integration:** Supporting Razorpay / Stripe for ticketed workshops and merchandise.

---

# 7. References
1. V.E.S. Institute of Technology, Department of Information Technology, *Full Stack Development Laboratory Manual*, 2026–2027.
2. MongoDB Documentation, *Atomicity and Transactions with findOneAndUpdate*, MongoDB Inc., 2026.
3. Socket.IO Official Guide, *Authentication, Rooms, and Middlewares in Production*, 2026.
4. React Documentation, *State Management and Context API*, Meta Open Source, 2026.
5. Docker Documentation, *Multi-Service Container Orchestration with Docker Compose*, 2026.
6. GitHub Actions Documentation, *Continuous Integration Workflows for Node.js Applications*, 2026.
