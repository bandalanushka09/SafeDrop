 problem statement
 Rural communities may face drinking-water contamination due to inadequate sanitation, damaged pipelines, poor water storage, flooding, and other environmental factors. Residents may not know which water sources have concerning test results, where to report problems, or how contaminated water can contribute to disease transmission.

# SafeDrop

SafeDrop is a MERN application for rural water-safety monitoring in India. It connects the public with registered drinking-water sources, water-quality testing, public concern reporting, health-worker review, and administration.

## Features

- Public India water map with source-risk markers, location search, source search, and state, district, type, risk, operational-status, and testing filters.
- MongoDB-backed source records and source detail pages with tests, active advisories, and related reports.
- Public water-concern submission without an account, including contact details, location selection, optional source association, multiple supporting photos, a generated SafeDrop reference, and duplicate-report warnings.
- Public report tracking by SafeDrop reference number, with optional phone-number verification and no reporter contact details exposed.
- Health-worker and admin report review, assignment, status updates, notes, audit logging, and department routing.
- Structured government-submission payload preparation. A government submission is only reported as submitted or confirmed when the configured integration responds accordingly; without configuration, the report remains ready for official submission.
- Public health alerts and water-safety education.

## Technology

- React 18, Vite, Tailwind CSS, React Router, Leaflet / React-Leaflet, and Lucide.
- Node.js, Express, MongoDB, and Mongoose.
- JWT authentication and role-based authorization for staff and authenticated-user operations.

## Map and water-source architecture

Water-source markers are loaded from `GET /api/water-sources?forMap=true&limit=2000`, not defined as frontend demo markers. The map opens over India and uses OpenStreetMap tiles. Search suggestions are served by `GET /api/location/search` (local Indian-state results plus OpenStreetMap Nominatim geocoding); selecting a result pans the embedded SafeDrop map without redirecting. Geocoded source markers use the source's risk level. The public source API supports pagination, source filters, and map bounds.

## Public reporting and government integration

`POST /api/reports/public` validates and sanitizes anonymous submissions, generates an `SD-YYYY-NNNNNN` reference, routes the report to an enabled configured department when one matches, and stores the report and structured official payload in MongoDB. Public uploads use `POST /api/upload/public`; accepted formats are JPEG, PNG, and WebP, with a 5 MB limit per image and a six-image report limit.

Reports are tracked through `GET /api/reports/track?referenceId=...`; the response intentionally excludes the reporter's name, phone, email, and description. Government credentials remain backend-only. Leave government variables empty until an official API is available and authorized; SafeDrop then marks a report as ready for official submission and does not claim that a department received it.

## Environment configuration

Copy `server/.env.example` to `server/.env` and `client/.env.example` to `client/.env`. Set a long, unique `JWT_SECRET`, MongoDB connection string, and initial admin credentials before deployment. Never commit `.env` files or place backend secrets in `client/.env`.

Important backend variables:

| Variable | Purpose |
|---|---|
| `PORT`, `NODE_ENV`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN` | API server, database, and authentication |
| `CORS_ORIGIN`, `PUBLIC_APP_URL` | Allowed web origin and links in email confirmations |
| `GEOCODING_API_URL`, `GEOCODING_API_KEY`, `GEOCODING_USER_AGENT` | Optional geocoder configuration; Nominatim is the default |
| `GOVERNMENT_API_URL`, `GOVERNMENT_API_KEY`, `GOVERNMENT_API_SECRET`, `GOVERNMENT_STATUS_URL` | Optional official submission/status API |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM` | Optional report confirmation email |
| `ADMIN_INITIAL_EMAIL`, `ADMIN_INITIAL_PASSWORD`, `ADMIN_INITIAL_NAME`, `ADMIN_INITIAL_VILLAGE` | Initial administrator setup |

The frontend only needs `VITE_API_BASE_URL` (see `client/.env.example`).

## Installation and running

Requirements: Node.js and npm. For persistent local data, run MongoDB and set `MONGODB_URI`; the server can use its in-memory MongoDB fallback for local development if MongoDB is unavailable.

```powershell
npm run install:all
```

In separate terminals:

```powershell
npm run server
npm run client
```

The frontend runs on Vite's local development URL (normally `http://localhost:5173`); the API defaults to `http://localhost:5000`.

## Demo data

For an empty non-production database, the server bootstraps baseline demo content. Automatic demo seeding is disabled in production. To explicitly seed demo data, run:

```powershell
npm run seed:demo
```

To create or update an administrator using the configured initial credentials:

```powershell
npm run seed:admin
```

Seeded sample accounts and sources are for development only; replace credentials and demo data before deployment.

## Testing and production build

```powershell
npm test
npm --prefix client run build
```

The backend tests use an in-memory MongoDB fallback when a local MongoDB instance is unavailable. The production frontend bundle is written to `client/dist`.

## Security notes

- Public reports and public image uploads are rate limited and server validated; uploads are restricted by file type and size.
- Staff-only report and source operations use authentication and role authorization.
- Public report tracking returns status and location information only, not reporter identity or report description.
- Configure real government and email integrations only with server-side credentials. Empty government settings intentionally disable official submission.
- Use HTTPS, a managed MongoDB deployment, a unique secret, backups, and appropriate operational monitoring before production deployment.

## Future improvements

- Add marker clustering or viewport-based map loading for very large production datasets.
- Connect an authorized, documented government reporting API and verify its response/status contract.
- Expand accessibility and responsive UI testing across supported mobile devices.