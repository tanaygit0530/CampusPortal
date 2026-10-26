# CampusPass — Production-Ready Real-Time Campus Event Portal

CampusPass is a production-grade event pass and seat reservation platform built with React, Node.js/Express, MongoDB Atlas, and authenticated Socket.IO WebSockets.

---

## 🌟 Core Architecture Principles

### 1. Strictly Zero Dummy Data
- **No hardcoded records anywhere**: There are no seed files, mock APIs, fake names ("Ananya Sharma"), or invented counts ("04 live events").
- **MongoDB as Single Source of Truth**: A fresh installation starts with an empty database. All events, registrations, and statistics originate from MongoDB.
- **Graceful Empty States**: Every view and statistic gracefully renders purposeful empty states when no records exist.
- **Automated Admin Bootstrap**: The initial administrator account is automatically generated at server startup from environment variables (`ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`) **only if no admin exists in the database**. Public signup creates student accounts exclusively.

### 2. Server-Authoritative Real-Time Everywhere (Socket.IO)
- **Authenticated Handshake**: Socket connections validate JWT tokens at the handshake level.
- **Scoped Rooms**:
  - `public`: Global broadcasts (new events, seat count changes, system stats).
  - `admins`: Administrator-only activity notifications and live attendee roster updates.
  - `user:${userId}`: Personal student updates synced across multiple devices/tabs.
- **Zero Polling**: Any database change emits immediate WebSocket updates from within the Express route controllers after writes succeed.

### 3. Concurrency & Integrity: Atomic Seat Reservations
- **Race Condition Prevention**: Seat decrements utilize MongoDB atomic conditional updates (`findOneAndUpdate({ _id, status: 'open', seatsLeft: { $gt: 0 } }, { $inc: { seatsLeft: -1 } })`). Two students competing for the last seat at the exact same millisecond will never overbook.
- **Atomic Restorations**: Cancellations verify student ownership, restore exactly 1 seat, and reopen events if previously closed.
- **Unique Compound Index**: `{ event: 1, student: 1 }` prevents double-registration at the database layer.

---

## 🛠️ Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | Backend listening port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/CampusPassDB` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `campuspass_super_secret_jwt_key_2026_exp5_secure!` |
| `JWT_EXPIRES_IN` | JWT token validity | `7d` |
| `ADMIN_NAME` | Bootstrap Admin display name | `Campus Administrator` |
| `ADMIN_EMAIL` | Bootstrap Admin login email | `admin@campuspass.edu` |
| `ADMIN_PASSWORD` | Bootstrap Admin login password | `AdminPassword123!` |
| `FRONTEND_URL` | Allowed CORS origins (comma-separated) | `http://localhost:5173,http://localhost:3000` |

### Frontend (`frontend/.env`)
| Variable | Description | Example / Default |
|---|---|---|
| `VITE_API_URL` | Express API and Socket.IO server base URL | `http://localhost:5000` |

---

## 🚀 Running the Application

### Option A: Running with Docker Compose (Recommended)
```bash
# Build and start all services in isolated containers
docker compose up -d --build

# View container status
docker compose ps

# View backend logs and verify admin bootstrap
docker compose logs backend -f
```
Frontend: `http://localhost:5173`  
Backend API: `http://localhost:5000/api`

### Option B: Running Locally (Native Node)
```bash
# 1. Start MongoDB locally (port 27017)

# 2. Start Backend
cd backend
npm install
npm run dev

# 3. Start Frontend (in a separate terminal)
cd frontend
npm install
npm run dev
```

---

## 📡 Real-Time WebSocket Events

| Event | Direction | Scope | Purpose |
|---|---|---|---|
| `event:created` | Server ➔ Client | `public` | Broadcasts new event metadata and adds card to open dashboards |
| `event:updated` | Server ➔ Client | `public` | Propagates event edits, date changes, and status shifts |
| `event:deleted` | Server ➔ Client | `public` | Removes card from dashboards and redirects viewers on detail page |
| `event:seatsUpdated` | Server ➔ Client | `public` | Instant seat count & progress bar updates with pulse highlight |
| `stats:updated` | Server ➔ Client | `public` | Recomputed homepage & admin metrics |
| `admin:notification`| Server ➔ Client | `admins` | Live notification bell alerts for registrations and cancellations |
| `registration:created`| Server ➔ Client | `admins` | Dynamically inserts student row into the admin attendee table |
| `registration:cancelled`| Server ➔ Client| `admins` | Removes student row from the admin attendee table |
| `myRegistration:added`| Server ➔ Client | `user:${id}` | Multi-tab sync for student's "My Passes" profile |
| `myRegistration:cancelled`| Server ➔ Client| `user:${id}`| Updates cancellation across student's open tabs |

---

## 🧪 Automated End-to-End Verification

A comprehensive automated test suite validates all 11 critical paths:
```bash
NODE_PATH=frontend/node_modules node testEndToEnd.js
```
Verified features:
1. Public stats endpoint computing real DB metrics
2. Bootstrap administrator login
3. Student-only public signup and privilege escalation prevention
4. Role-based access control (blocking unauthorized access)
5. Event creation and real-time WebSocket broadcast
6. Event close/reopen toggling
7. Atomic seat decrement on registration and duplicate rejection (409)
8. Millisecond-concurrent race condition: exactly 1 student takes last seat, other receives 400
9. Atomic cancellation and seat restoration (+1)
10. Admin attendee roster retrieval and CSV export
11. Event deletion cascading to all registrations
