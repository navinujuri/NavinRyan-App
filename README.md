# 💪 Ryan Reynolds Physique Tracker

A premium, dark-mode gym progression tracker built for **Navin's 16-week Ryan
Reynolds aesthetic transformation** (Phase 1). Log every set from the program,
watch volume climb per muscle, track the cut with body metrics & progress
photos, self-score your physique on a radar, and generate a one-click coaching
report for ChatGPT.

Single user. No authentication. Local-first (JSON storage today, MongoDB-ready
for later).

---

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 · TypeScript · TailwindCSS · Recharts · Vite |
| Backend | Node.js · Express |
| Storage | Local JSON file (`server/data/db.json`) — pluggable driver, MongoDB-ready |

---

## Quick start

```bash
# 1. Install everything (root + server + client)
npm run setup

# 2. Run the API (port 4000) and the app (port 5173) together
npm run dev
```

Then open **http://localhost:5173**.

The Vite dev server proxies `/api/*` to the Express backend, so both share an
origin. On first run the backend seeds `server/data/db.json` with realistic
demo data (~6.5 weeks into the program).

### Configuration (`.env`)

The server runs with **local JSON storage** out of the box — no `.env` needed.
To point it at MongoDB, copy the template and fill in your values:

```bash
cp server/.env.example server/.env   # then set STORAGE_DRIVER=mongo + MONGO_URI
```

`server/.env` is git-ignored and must never be committed. See
`server/.env.example` for every supported variable.

### Production (single process)

```bash
npm start          # builds the client, then serves it from Express on :4000
```

Express serves the built SPA from `client/dist` and the API from `/api` on the
same port — open **http://localhost:4000**.

---

## Deploy for free (phone-friendly)

The whole app runs as **one Node web service** (Express serves the API *and* the
built SPA) backed by **MongoDB Atlas**, so it deploys cleanly to a single free
host. A ready-to-use **[`render.yaml`](render.yaml)** blueprint is included.

**1. MongoDB Atlas — allow the host to connect.**
Atlas → *Network Access* → *Add IP Address* → **Allow access from anywhere
(`0.0.0.0/0`)**. (Free hosts don't have fixed outbound IPs.) Keep a strong DB
password since the cluster is now reachable from anywhere.

**2. Render — deploy the blueprint.**
[render.com](https://render.com) → *New* → *Blueprint* → connect the GitHub repo
(`navinujuri/NavinRyan-App`). Render reads `render.yaml` and provisions a **Free**
web service. When prompted, paste your Atlas connection string as **`MONGO_URI`**
(it is a secret — never committed). Click *Apply*.

> Prefer manual setup? *New → Web Service*, then:
> - Build command: `npm run render-build`
> - Start command: `npm --prefix server start`
> - Env vars: `STORAGE_DRIVER=mongo`, `MONGO_DB_NAME=rr_physique_tracker`, `MONGO_URI=<your Atlas URI>`

**3. Use it on your phone.**
Open the `https://<name>.onrender.com` URL in your phone browser and
**Add to Home Screen** for an app-like icon. Your data lives in Atlas, so it's
the same on every device.

> ℹ️ Render's free instance sleeps after ~15 min idle, so the *first* request
> after a break cold-starts in ~30–50s. Fine for daily logging; upgrade the
> instance (or use a keep-alive ping) if you want it always-on.

Other free options with the same single-service model: **Fly.io**, **Koyeb**,
**Railway** (trial credits). The build/start commands above apply to all of them.

### Other scripts

| Command | What it does |
|---------|--------------|
| `npm run build` | Type-check + production build of the client |
| `npm run clean` | Delete `server/data/db.json` (re-seeds on next start) |

You can also reset to fresh demo data anytime from the app (the ↻ button in the
header, or `POST /api/reset`).

---

## Features (spec sections)

1. **Profile Dashboard** — name/age/height, weight/waist/body-fat vs goals, days
   completed & remaining, timeline progress %, current training phase.
2. **Workout Tracker** — the full Mon/Tue/Wed/Fri/Sat split preloaded from the
   program. Log weight × reps × sets per exercise; **volume auto-calculates** and
   the previous session is shown for progressive overload.
3. **Progression History** — previous vs current session per lift, with Δ weight,
   Δ reps, Δ volume and improvement % (green = up, red = down) + strength trend.
4. **Muscle Group Dashboard** — exercise→muscle map, current/previous weekly and
   monthly volume per muscle, ranked bars + weekly trend for all 12 muscles.
5. **Body Metrics** — weekly weight, waist, neck, chest, arms, thighs, body-fat;
   weight / waist / body-fat trend charts + full history table.
6. **Photo Tracker** — front/side/back uploads stored by month, with a
   month-over-month comparison gallery.
7. **Physique Score** — rate the 8 aesthetic muscles 1–10 on a radar (current vs
   start), with assessment history.
8. **Analytics** — strongest exercise, most improved, most trained muscle,
   lagging muscle, current weight loss, estimated goal date.
9. **Export JSON** — downloads `ryan-reynolds-phase1-export.json` with
   `{ profile, measurements, workouts, muscleVolumes, physiqueRatings, photos }`.
10. **ChatGPT Report** — one-click plain-text coaching summary (copy or download)
    to paste straight into ChatGPT.
11. **Charts** — Recharts throughout: weight/waist/body-fat trends, exercise
    strength trend, muscle volume trend, physique radar.
12. **Ryan Reynolds Progress %** — composite score:
    **40% body-fat reduction · 30% strength · 30% physique ratings**, shown as a
    ring on the dashboard.

---

## Project structure

```
.
├── server/                     # Express API + JSON storage
│   └── src/
│       ├── index.js            # entry — seeds storage, starts server
│       ├── app.js              # express app, routes, static client
│       ├── config.js           # env-driven config (port, storage driver, paths)
│       ├── domain/             # program definition (exercises, muscle map)
│       ├── data/seed.js        # deterministic realistic mock data
│       ├── storage/            # JsonStore + MongoStore stub + factory
│       └── routes/             # profile, collections, meta (bootstrap/export/reset)
└── client/                     # React + TS + Tailwind + Recharts SPA
    └── src/
        ├── App.tsx             # hash router + layout
        ├── lib/                # calculations, report builder, formatting
        ├── state/DataContext   # single data store + API mutators
        ├── components/         # ui primitives, charts, layout
        └── pages/              # one file per section
```

---

## Swapping in MongoDB later

Storage is a pluggable driver behind a single interface (see
`server/src/storage/`). The app ships with `JsonStore`; a `MongoStore` stub
documents the exact interface to implement.

```bash
npm --prefix server install mongodb
# implement server/src/storage/mongoStore.js against the documented interface
STORAGE_DRIVER=mongo MONGO_URI=mongodb://localhost:27017 npm start
```

No route code changes — the interface is identical.

---

## API reference

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/bootstrap` | Everything the SPA needs on load |
| GET | `/api/config` | Program, exercises, muscle map |
| GET/PUT | `/api/profile` | Read / update profile |
| GET/POST/PUT/DELETE | `/api/workouts` | Workout logs (volume derived) |
| GET/POST/PUT/DELETE | `/api/measurements` | Body measurements |
| GET/POST/PUT/DELETE | `/api/physique` | Physique ratings |
| GET/POST/DELETE | `/api/photos` | Progress photos (base64) |
| GET | `/api/export` | Full data export |
| POST | `/api/reset` | Reset to demo seed |
| GET | `/api/health` | Health check |

---

*Program non-negotiables (from the plan): Protein 160g+, Sleep 7.5–8h, Calories
2000–2200, Creatine 5g/day optional, Cardio after workouts. Deload on Week 9.*
