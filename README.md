# CampusPass — Experiments 1 & 2

## Experiment 1
Build responsive and interactive UIs using Tailwind CSS — Home, Login, Dashboard.

## Experiment 2
**Aim:** Implement forms, data fetching, and reusable custom hooks (React Hooks).

### What's implemented
- **useFetchEvents** (src/hooks/useFetchEvents.js) — custom hook wrapping
  useEffect + async/await; exposes { events, loading, error, refetch }.
  Home and Dashboard both call it instead of importing static data directly.
- **useForm** (src/hooks/useForm.js) — reusable form-handling hook: tracks
  values via useState, exposes handleChange/handleSubmit, runs a validate()
  function you pass in, and returns field-level errors. Used by the Login
  form (works for Register too via the isRegister flag).
- **useWindowSize** (src/hooks/useWindowSize.js) — taken from the CH-3 notes
  example: useState + useEffect + a 'resize' listener cleaned up on unmount.
  Used on the Dashboard to show the current viewport width.
- **Mock API layer** (src/api/eventsApi.js) — simulates an async backend call
  (700ms delay, ~5% simulated failure) with an axios-shaped { data } response,
  so swapping in the real Express endpoint in Exp 4 needs zero changes to the
  hooks or components.
- **Axios instance** (src/api/axiosInstance.js) — pre-configured with
  baseURL (from .env), a request interceptor for the future JWT, and a
  response interceptor for centralised error logging — ready for Exp 4/6.
- Loading states use skeleton cards (EventCardSkeleton.jsx); error states
  show a retry button — both driven entirely by useFetchEvents' state.

### Run it locally
```bash
npm install
npm run dev
```

### Folder structure (new since Exp 1)
```
src/
  api/
    axiosInstance.js   # configured axios client (interceptors, baseURL)
    eventsApi.js        # mock async "backend" call
  hooks/
    useFetchEvents.js   # data fetching + loading/error state
    useForm.js           # reusable form state + validation
    useWindowSize.js     # viewport size, from CH-3 notes example
  components/
    EventCardSkeleton.jsx
```

## Next experiments (per syllabus)
3. Redux/Context API — global login state, cart/app data
4. REST API + MongoDB + Mongoose — real CRUD APIs (swap into eventsApi.js)
5. Secure REST APIs — validation, error handling
6. JWT Authentication — real login (swap into Login's onValid), protected routes
7. Docker deployment
8. WebSockets — real-time notifications
9. Containerization — Docker Compose

## Experiment 8 — Real-Time WebSockets (Socket.IO)
**Aim:** Enable instant, bi-directional real-time communication between clients and the server using WebSockets (`Socket.IO`).

### What's implemented
- **Socket.IO Backend Integration** (`backend/server.js`): Wrapped Express app in Node `http.Server` sharing port 5000 with REST APIs and MongoDB. Handles `connection`, `chatMessage` broadcast, and `disconnect`.
- **Real-Time Chat Page** (`frontend/src/pages/Chat.jsx`): Interactive chat interface at `/chat` featuring live green/red connection status badge, editable username prefill from `AuthContext`, scrollable message history, sender-based message differentiation, and lifecycle cleanup via `useRef`.
- **Real-Time Event Notifications**: Emits `eventCreated` socket notification when admins publish new campus events.

> **Production Considerations Note:**
> The current chat implementation is a demonstration. For production deployment, real-time WebSockets should incorporate:
> 1. Socket Authentication (JWT token validation during handshake middleware).
> 2. Strict Input Validation & Sanitization (preventing XSS in broadcast messages).
> 3. Connection and Message Rate Limiting (mitigating spam and DDoS).
> 4. Secure WebSockets over HTTPS/WSS with persistent message storage in MongoDB.

