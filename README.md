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

## Real-Time Architecture — Authenticated WebSockets (Socket.IO)

**Aim:** Integrated real-time synchronization across event and registration flows using authenticated WebSockets (`Socket.IO`).

### Real-Time Events Implemented
1. **`event:created`** (Server-Emitted on `POST /api/events`): Broadcasts new event metadata to all connected clients. Automatically inserts the event card into live dashboards and triggers a toast alert (`New event added: [title]`) without page refresh.
2. **`event:updated`** (Server-Emitted on `PUT /api/events/:id`): Broadcasts event modifications live across all dashboards.
3. **`event:deleted`** (Server-Emitted on `DELETE /api/events/:id`): Broadcasts event deletion. Removes the card from dashboards and automatically alerts and redirects users viewing the deleted event's detail page.
4. **`event:seatsUpdated`** (Server-Emitted on `POST /api/registrations` & `DELETE /api/registrations/:id`): Broadcasts instant seat count changes (`seatsLeft`, `seatsTotal`, `isFull`) to all open event cards and detail pages with highlight animations. Automatically flips button state to "Seats full" when capacity is reached.
5. **`event:lowSeats`** (Server-Emitted): Alerts students when event capacity drops below 10%.
6. **`admin:notification`** (Server-Emitted to `'admins'` room only): Notifies administrators in real time when students register or cancel (`[Student] registered for [Event]`).
7. **`registration:created` & `registration:cancelled`** (Server-Emitted to `'admins'` room): Dynamically adds or removes student records in the admin registrants table live.

### Socket Authentication & Security
- **JWT Handshake Middleware**: Socket connections authenticate using the user's JWT (`auth: { token }`).
- **Role-Based Rooms**: Verified admins automatically join the protected `'admins'` room; authenticated students join `'authenticated'`.
- **Public Visitor Support**: Visitors connecting without a token are granted guest access to public updates (new events, live seat counts) while admin notifications remain completely inaccessible.
- **Token Rejection**: Expired or forged tokens are rejected immediately at the handshake level with an authentication error.
- **Client Security**: Clients never broadcast events directly; all real-time events originate exclusively from verified backend controller operations following successful database writes.

