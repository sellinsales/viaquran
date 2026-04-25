# ViaQuran

ViaQuran is a mobile-first Quran reflection MVP built as a standalone `Next.js` project. A user writes what they did or felt, the app maps that input to an Islamic theme, fetches a relevant ayah, then returns a short explanation and an action step.

## MVP scope

- Activity or feeling input
- Simple theme mapping engine
- Ayah retrieval with Arabic, English, and Urdu
- Human-friendly explanation and action steps
- XP, levels, streaks, and daily challenge loop
- Swipeable short-card UI for mobile users

## Stack

- Frontend: `Next.js` App Router + `Tailwind CSS`
- Backend: `Next.js` route handlers running on Node.js
- Persistence: MariaDB/MySQL via `mysql2`

## Project structure

- `app/`: UI routes and API routes
- `components/`: interactive client components
- `lib/`: theme engine, Quran service, daily guidance, persistence
- `data/`: SQL schema and local project data files

## API notes

ViaQuran can use Quran.Foundation Content APIs as the primary authenticated Quran source and fall back to Al Quran Cloud if those credentials are not configured or the request fails.

Quran.Foundation setup:

```env
QF_CLIENT_ID=your_client_id
QF_CLIENT_SECRET=your_client_secret
QF_AUTH_BASE_URL=https://oauth2.quran.foundation
QF_API_BASE_URL=https://apis.quran.foundation
QF_ENGLISH_TRANSLATION_ID=131
QF_URDU_TRANSLATION_ID=your_urdu_translation_resource_id
```

The integration follows Quran.Foundation's documented production flow:

- token endpoint: `POST /oauth2/token`
- flow: `client_credentials`
- scope: `content`
- required headers: `x-auth-token` and `x-client-id`
- production auth base: `https://oauth2.quran.foundation`
- production API base: `https://apis.quran.foundation`

Fallback source:

ViaQuran also supports `Al Quran Cloud` for verse retrieval with multiple editions. The fallback requests:

- `quran-uthmani` for Arabic
- `en.sahih` for English
- `ur.jalandhry` for Urdu

If external requests fail, the app falls back to curated local ayah content for the MVP experience.

Primary source used for the API contract:

- https://api-docs.quran.com/docs/quickstart/
- https://api-docs.quran.com/docs/content_apis_versioned/4.0.0/verses-by-verse-key/
- https://alquran.cloud/api

## Local run

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Database setup

Create a `.env` file from `.env.example` and provide your MariaDB credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=viaquran_786
DB_USER=viaquran_786
DB_PASSWORD=your_database_password
```

The app will create `app_users` and `reflections` automatically on first API call. If you prefer to prepare the schema manually, run [data/schema.sql](/d:/projects/786rides/viaquran/data/schema.sql) in phpMyAdmin first.

For Quranic Arabic and Urdu text, ensure the database and tables use `utf8mb4`, not `latin1/cp1252`.

## cPanel Node.js deployment

This project is prepared for Node.js hosting with `Next.js` standalone output.

Typical flow:

```bash
npm install
npm run build
npm start
```

In cPanel `Setup Node.js App`, use:

- Application root: your uploaded project folder
- Startup file: `server.js`

The root `server.js` loads the built standalone Next.js server after `npm run build`.

## Production note

This version stores user progress in MariaDB. For production, add real authentication, rotate exposed secrets, and review all Quranic content workflows for religious and security accuracy before launch.
