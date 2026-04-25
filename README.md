# ViaQuran

ViaQuran is a Quran-centered learning platform built with `Next.js`. It now supports:

- personal reflection and ayah-based guidance
- learning paths for structured study
- teaching circles and lesson-kit content
- saved reflections for reuse
- community sharing through a simple wall
- MariaDB/MySQL persistence with an automatic local JSON fallback

## Stack

- Frontend: `Next.js` App Router + `Tailwind CSS`
- Backend: `Next.js` route handlers on Node.js
- Persistence:
  - `MariaDB/MySQL` when DB credentials are configured
  - local file storage in `data/store.json` when DB is not available

## Local run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env`.

```env
VIAQURAN_STORAGE_MODE=auto
QURAN_API_BASE_URL=https://api.alquran.cloud/v1
QF_CLIENT_ID=
QF_CLIENT_SECRET=
QF_AUTH_BASE_URL=https://oauth2.quran.foundation
QF_API_BASE_URL=https://apis.quran.foundation
QF_ENGLISH_TRANSLATION_ID=131
QF_URDU_TRANSLATION_ID=
DB_HOST=localhost
DB_PORT=3306
DB_NAME=viaquran_786
DB_USER=viaquran_786
DB_PASSWORD=replace_with_rotated_password
```

Storage modes:

- `auto`: use MySQL if credentials work, otherwise fall back to `data/store.json`
- `mysql`: require MySQL/MariaDB
- `file`: force local JSON storage

## API routes

- `GET /api/today`: dashboard, saved items, community posts
- `POST /api/reflect`: reflection to theme + ayah + action steps
- `POST /api/save`: save a reflection to the library
- `POST /api/share`: publish a short note to the community wall
- `GET /api/health`: deployment health check and active storage mode
- `GET /api/diagnostics`: protected deep diagnostics for build/version/DB/API connectivity

## Database setup

If you want production persistence in MariaDB/MySQL:

1. Create a database with `utf8mb4`.
2. Add the DB credentials in `.env`.
3. Optionally run [data/schema.sql](/d:/projects/viaquran/data/schema.sql) manually.

The app also creates the required tables automatically on first use:

- `app_users`
- `reflections`
- `saved_reflections`
- `community_posts`

## Production build

```bash
npm run build
npm start
```

This project already uses `Next.js` standalone output. The root `server.js` starts the standalone bundle after build.

## cPanel / Node.js hosting

Typical deployment flow:

1. Upload the full project folder.
2. Run `npm install`.
3. Run `npm run build`.
4. Set startup file to `server.js`.
5. Add your environment variables in cPanel.
6. Verify `https://your-domain/api/health`.

If DB credentials are not ready yet, the platform will still run with local file storage.

## Deployment diagnostics

This repo now includes two ways to trace online deployment issues:

1. `GET /api/health`
   This stays lightweight and public. It returns the active storage mode, app version, build time, and commit.

2. `GET /api/diagnostics`
   This is intended for server-side troubleshooting and should be protected with `DIAGNOSTICS_TOKEN`.

Set these env vars on the server:

```env
DIAGNOSTICS_TOKEN=replace_with_random_secret
DIAGNOSTICS_GITHUB_REPO=sellinsales/viaquran
```

Then test the live deployment from your local machine:

```bash
DEPLOYMENT_URL=https://your-domain.com DIAGNOSTICS_TOKEN=replace_with_random_secret npm run check:deployment
```

The diagnostics report includes:

- app version and build timestamp
- deployed git commit and branch when available
- whether the running server matches the latest commit on `main`
- active storage mode
- MariaDB/MySQL connectivity
- local file-store availability
- Al Quran Cloud reachability
- Quran Foundation token flow reachability when credentials are configured

## Quran API notes

Primary Quran source:

- Quran.Foundation Content APIs when `QF_CLIENT_ID` and `QF_CLIENT_SECRET` are configured

Fallback Quran source:

- `Al Quran Cloud` using:
  - `quran-uthmani`
  - `en.sahih`
  - `ur.jalandhry`

If external requests fail, the app falls back to the local themed ayah content bundled in the repo.
