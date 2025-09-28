# Booking App – Facility Booking (React + TypeScript + Redux Toolkit + Module Federation)

This repository contains the **booking micro‑frontend**. It provides a complete facility booking workflow and shared primitives that the host (and other MFEs) can consume at runtime.

---

## ✨ Features

* **BookingForm** – create facility bookings with conflict checks
* **BookingList** – list, filter, and manage your bookings
* **UserBooking** – opinionated container that wires store + views
* **Redux Toolkit slice** – `bookingsSlice` with actions/selectors
* **Session‑aware UI** – form tags bookings with the current user
* **Tailwind UI** – responsive, modern components
* **Charts‑ready** – data designed to feed reporting MFE (createdAt, status)

---

## 🧱 Tech Stack

* **React 18 + TypeScript**
* **@reduxjs/toolkit**, **react‑redux**
* **Webpack 5 Module Federation**
* **Tailwind CSS**

---

## 📁 Folder Structure (booking‑app)

```
├─ public/
│  └─ index.html
├─ src/
│  ├─ booking/
│  │   ├─ BookingForm.tsx
│  │   └─ BookingList.tsx
│  ├─ store/
│  │   └─ bookingsSlice.ts
│  ├─ UserBooking.tsx                 # container (RTK hooks, UI)
│  ├─ UserBookingWithStore.tsx        # exports with Provider wired
│  ├─ useSession.ts                   # shared session hook (exposed)
│  ├─ types.ts                        # Booking, Facility types
│  ├─ bootstrap.tsx
│  └─ index.ts
├─ webpack.config.js
├─ package.json
└─ README.md
```

---

## ⚙️ Module Federation Config (booking‑app)

```js
new ModuleFederationPlugin({
  name: "bookingApp",
  filename: "remoteEntry.js",
  exposes: {
    "./UserBooking": "./src/UserBookingWithStore",
    "./BookingForm": "./src/booking/BookingForm",
    "./BookingList": "./src/booking/BookingList",
    "./useSession": "./src/useSession",
    "./bookingsSlice": "./src/store/bookingsSlice"
  },
  shared: {
    react: { singleton: true, requiredVersion: deps.react },
    "react-dom": { singleton: true, requiredVersion: deps["react-dom"] },
    "react-redux": { singleton: true, requiredVersion: deps["react-redux"] },
    "@reduxjs/toolkit": { singleton: true, requiredVersion: deps["@reduxjs/toolkit"] }
  }
});
```

---

## 🔌 Exposed Modules & Contracts

* **`./UserBooking`** – a ready‑to‑use page combining `BookingForm` + `BookingList` with store already provided.
* **`./BookingForm`** – controlled form component; accepts `onCreate?(booking)` and uses `useSession` for user.
* **`./BookingList`** – reads from `bookingsSlice` (or accepts `bookings` prop in host‑managed mode).
* **`./bookingsSlice`** – RTK slice with `addBooking`, `updateBooking`, selectors. Host can import and **inject** the reducer if orchestrating a global store.
* **`./useSession`** – convenience hook resolving `{ id, name, email }` from localStorage / events.

---

## 🧠 State & Cross‑App Communication

* **Session:** resolved via `useSession()` which listens to `auth:login` / `auth:logout` CustomEvents and rehydrates from `localStorage`.
* **Bookings:** kept inside booking‑app’s RTK store by default (scoped to the remote). Optionally, host can consume `bookingsSlice` to centralize state.

> Admin visibility: if `user.email === "admin@example.com"`, the list/report views show **all bookings**; otherwise only bookings created by the current user.

---

## 🗓️ Business Rules (Form Validation)

* **Time‑slot conflict:** denies a new booking if another non‑cancelled booking exists with the **same `date` + `slot`**.
* **Past‑slot on same day:** on today’s date, slots **earlier than current time** are disabled / rejected.
* **Friendly error message:** *“Another booking already exists for this date and time slot.”* (clearer than facility wording when slots are global).

> Data includes `createdAt`, `status` (Pending/Approved/Cancelled), `facility`, and `slot` to enable downstream analytics.

---

## 🧰 Local Development

### Prereqs

* Node 18+

### Install & Run

```bash
npm install
npm run dev
```

Runs at `http://localhost:3002` by default.

### Build

```bash
npm run build
```

---

## 🔗 Using from the Host

### 1) Full page (with internal store)

```tsx
<RemoteLoader
  scope="bookingApp"
  module="./UserBooking"
  fallback={<div>Loading bookings…</div>}
  render={({ Component }) => <Component user={user} />}
/>
```

### 2) Host‑managed store (advanced)

If the host uses a global Redux store, consume the exposed slice:

```ts
const { bookingsReducer } = await window.bookingApp.get("./bookingsSlice").then(f => f());
store.injectReducer("bookings", bookingsReducer);
```

Then render exposed components that select from `state.bookings`.

---

## 🚀 Deployment Simulation

* Ship `remoteEntry.js` from this app (port or domain).
* The host’s `remotes.json` points to this URL.
* Update booking‑app independently → host picks it up on refresh (no rebuild).

---

## 🧪 Troubleshooting

* **`Cannot read properties of undefined (reading 'get')`:** The remote container didn’t initialize. Ensure `container.init(__webpack_share_scopes__.default)` is called in the host loader and that `remoteEntry.js` is reachable (no 404/CORS).
* **State resets on navigation:** If you remount `UserBooking` often, prefer keeping booking state in host Redux via `bookingsSlice` injection or avoid unmounts.
* **React hooks/duplicate React error:** Align `react`/`react‑dom` versions and mark as `singleton` across all MFEs.
* **Past slot still selectable:** Verify current‑time logic runs with user’s timezone and slots are parsed as times, not strings.

---

## ✅ Assessment Checklist (Booking App)

* [x] Exposes `BookingForm` & `BookingList` (+ `UserBooking` convenience page)
* [x] Redux slice exposed for host integration
* [x] Conflict detection & same‑day past‑slot guard
* [x] Admin sees all data; users see theirs
* [x] Works standalone on its own port
* [x] Ready for deployment simulation

---

## 📜 License

MIT (or company default)
