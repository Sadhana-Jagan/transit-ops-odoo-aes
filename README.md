# TransitOps

TransitOps is a full-stack MERN fleet and transport-operations dashboard. It provides a role-aware interface for managing vehicles, drivers, trips, maintenance, fuel and expenses, plus operational analytics such as fleet utilization, fuel efficiency and vehicle ROI.

The project consists of a React/Vite frontend and an Express/MongoDB API.

## Features

- JWT- and cookie-backed authentication with five business roles.
- Fleet vehicle registry with status, capacity, odometer, cost, revenue and region tracking.
- Driver registry with licence expiry, safety score and availability status.
- Trip lifecycle management: `Draft → Dispatched → Completed` or `Cancelled`.
- Dispatch validation for vehicle availability, driver availability, licence validity, capacity and active assignments.
- Maintenance workflow that places a vehicle `InShop`, supports manual completion and automatically completes records after 15 minutes.
- Fuel-log and operating-expense tracking, including vehicle-level operational cost summaries.
- Dashboard KPIs, fleet-distribution charts, trip overview and licence-expiry alerts.
- Analytics for fuel efficiency, fleet utilization, operational cost and return on investment (ROI).
- CSV export for the primary operational tables and reports.
- Light/dark theme, persisted in browser storage.

## Technology

| Area | Technology |
| --- | --- |
| Frontend | React 18, Vite 5, React Router, Recharts, React Icons |
| Backend | Node.js, Express 5 |
| Database | MongoDB with Mongoose |
| Authentication | JSON Web Tokens, bcrypt, HTTP-only cookie support |
| Development | Nodemon, Vite development proxy |

## Repository layout

```text
.
├── backend/
│   ├── config/          # MongoDB connection
│   ├── controllers/     # API and business logic
│   ├── middleware/      # JWT authentication and role checks
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express route declarations
│   ├── utils/           # JWT and status mapping utilities
│   ├── seed.js          # Demo-data seeding script
│   └── server.js        # API entry point
└── frontend/
    ├── public/          # Static assets
    └── src/
        ├── components/  # Shared layout and UI components
        ├── pages/       # Application screens
        └── store/       # API client, data mappers and React context
```

## Prerequisites

- Node.js 18 or newer
- npm
- A running MongoDB instance (local MongoDB or MongoDB Atlas)

## Quick start

1. Clone the repository and install dependencies.

   ```bash
   cd transit-ops-odoo-aes
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. Create `backend/.env`.

   ```env
   MONGO_URI=mongodb://127.0.0.1:27017/transitops
   JWT_SECRET=replace-with-a-long-random-secret
   JWT_EXPIRES_IN=12h
   PORT=5000
   ```

   `MONGO_URI` is required. `JWT_SECRET`, `JWT_EXPIRES_IN` and `PORT` have development defaults, but explicit values are recommended.

3. Seed the database (optional, but recommended for a first run).

   ```bash
   cd backend
   npm run seed
   ```

   > The seed command clears the existing TransitOps collections before inserting demo data.

4. Start the backend in one terminal.

   ```bash
   cd backend
   npm run dev
   ```

5. Start the frontend in another terminal.

   ```bash
   cd frontend
   npm run dev
   ```

6. Open the Vite URL shown in the terminal (normally `http://localhost:5173`). Requests to `/api` are proxied to `http://localhost:5000` in development.

## Scripts

| Directory | Command | Purpose |
| --- | --- | --- |
| `backend` | `npm start` | Start the API with Node.js |
| `backend` | `npm run dev` | Start the API with Nodemon |
| `backend` | `npm run seed` | Replace database contents with demo data |
| `frontend` | `npm run dev` | Start the Vite development server |
| `frontend` | `npm run build` | Create a production frontend build |
| `frontend` | `npm run preview` | Preview the production frontend build |

## Demo accounts

After running `npm run seed`, use password `demo123` with any of the following accounts.

| Role | Email |
| --- | --- |
| Fleet Manager | `manager@transitops.io` |
| Driver | `driver@transitops.io` |
| Safety Officer | `safety@transitops.io` |
| Financial Analyst | `finance@transitops.io` |
| Dispatcher | `dispatch@transitops.io` |

These credentials are for local demonstration only. Do not use them outside a development environment.

## Roles and frontend access

The frontend controls page visibility by role; the backend also enforces role checks on write operations.

| Role | Frontend pages |
| --- | --- |
| Fleet Manager | Dashboard, Vehicles, Drivers, Trips, Maintenance, Fuel & Expenses, Reports |
| Driver | Dashboard, Vehicles, Drivers, Trips |
| Safety Officer | Dashboard, Drivers, Trips, Reports |
| Financial Analyst | Dashboard, Vehicles, Fuel & Expenses, Reports |
| Dispatcher | Dashboard, Vehicles, Drivers, Trips |

## Core workflows and rules

### Vehicle statuses

Vehicles use `Available`, `OnTrip`, `InShop` and `Retired` statuses. A vehicle cannot be dispatched if it is retired, in the shop or otherwise unavailable.

### Driver compliance

Drivers have a licence number, category and expiry date, a safety score (`Low`, `Medium`, `High`) and availability statuses. Expired licences, suspended drivers and drivers who are not `Available` cannot be dispatched.

### Trips

Creating or dispatching a trip validates the following:

- the vehicle and driver exist;
- cargo does not exceed the vehicle's maximum capacity;
- the vehicle is available and not retired or in maintenance;
- the driver is available, not suspended and has a valid licence; and
- neither driver nor vehicle is already assigned to a dispatched trip.

Dispatching marks the vehicle and driver as on-trip. Completing or cancelling returns them to available status (unless the vehicle is retired). Completing a trip can update odometer, fuel used, distance and revenue; positive fuel use also creates a fuel-log record.

### Maintenance

Creating maintenance changes a non-retired vehicle to `InShop`. The record can be completed explicitly, or it automatically completes after 15 minutes while the API process remains running. Completion returns a non-retired vehicle to `Available`.

### Reporting

The reports API calculates:

- fuel efficiency: completed-trip distance divided by logged fuel litres;
- fleet utilization: on-trip vehicles divided by all non-retired vehicles;
- operational costs: fuel, maintenance and other expenses by vehicle; and
- vehicle ROI: `(revenue - maintenance cost - fuel cost) / acquisition cost`.

## API reference

All API responses use a JSON envelope with at least a `success` field. Except for registration and login, every route requires authentication. Send the token returned by login as `Authorization: Bearer <token>`; the backend also supports its login cookie.

### Authentication

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Create a user account. Body: `name`, `email`, `password`, `role` |
| `POST` | `/api/auth/login` | Public | Authenticate and receive a JWT. Body: `email`, `password` |
| `GET` | `/api/auth/me` | Authenticated | Return the current user |

Backend role values are `FleetManager`, `Dispatcher`, `SafetyOfficer`, `FinancialAnalyst` and `Driver`.

### Vehicles

| Method | Endpoint | Write access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/vehicles` | — | List vehicles; optional query filters: `type`, `status`, `region` |
| `POST` | `/api/vehicles` | Fleet Manager | Create a vehicle |
| `PUT` | `/api/vehicles/:id` | Fleet Manager | Update a vehicle |
| `PATCH` | `/api/vehicles/:id/status` | Fleet Manager, Dispatcher | Update vehicle status |
| `DELETE` | `/api/vehicles/:id` | Fleet Manager | Delete a vehicle |

### Drivers

| Method | Endpoint | Write access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/drivers` | — | List drivers |
| `POST` | `/api/drivers` | Fleet Manager, Safety Officer | Create a driver profile |
| `PUT` | `/api/drivers/:id` | Fleet Manager, Safety Officer | Update a driver profile |
| `PATCH` | `/api/drivers/:id/status` | Fleet Manager, Safety Officer, Dispatcher | Update status, safety status or safety score |
| `DELETE` | `/api/drivers/:id` | Fleet Manager, Safety Officer | Delete a driver profile |

### Trips

| Method | Endpoint | Write access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/trips` | — | List trips with populated vehicle and driver details |
| `POST` | `/api/trips` | Fleet Manager, Dispatcher, Driver | Create a draft or dispatched trip |
| `PATCH` | `/api/trips/:id/status` | Fleet Manager, Dispatcher, Driver | Dispatch, complete or cancel a trip |

### Maintenance

| Method | Endpoint | Write access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/maintenance` | — | List maintenance records; optional `status` query parameter |
| `POST` | `/api/maintenance` | Fleet Manager | Create a maintenance record |
| `PATCH` | `/api/maintenance/:id/complete` | Fleet Manager | Complete an open maintenance record |
| `DELETE` | `/api/maintenance/:id` | Fleet Manager | Delete a maintenance record |

### Fuel and expenses

| Method | Endpoint | Write access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/ops/fuel-logs` | — | List fuel logs |
| `POST` | `/api/ops/fuel-logs` | Fleet Manager, Dispatcher, Financial Analyst | Add a fuel log |
| `DELETE` | `/api/ops/fuel-logs/:id` | Fleet Manager, Financial Analyst | Delete a fuel log |
| `GET` | `/api/ops/expenses` | — | List expenses |
| `POST` | `/api/ops/expenses` | Fleet Manager, Financial Analyst | Add an expense |
| `DELETE` | `/api/ops/expenses/:id` | Fleet Manager, Financial Analyst | Delete an expense |

### Reports

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/reports/dashboard/kpis` | Any authenticated user | Dashboard KPI aggregates |
| `GET` | `/api/reports/analytics` | Fleet Manager, Financial Analyst, Safety Officer | Fleet analytics |

## Data model

| Collection | Main responsibility | Key relations |
| --- | --- | --- |
| `User` | Credentials, name, email and role | — |
| `Vehicle` | Fleet asset and operating state | Referenced by trips, maintenance, fuel logs and expenses |
| `Driver` | Licence, safety and availability data | Referenced by trips |
| `Trip` | Route, cargo, lifecycle and operational result | References one vehicle and one driver |
| `Maintenance` | Maintenance event and completion state | References one vehicle |
| `FuelLog` | Fuel quantity and cost | References a vehicle; may reference a trip |
| `Expense` | Tolls, other fees and maintenance cost snapshot | References a vehicle; may reference a trip |

## Frontend configuration

The frontend uses `/api` by default. For a separately hosted backend, create `frontend/.env`:

```env
VITE_API_URL=https://your-api.example.com/api
```

Vite exposes only variables prefixed with `VITE_` to the client. Do not put backend secrets in this file.

## Production notes

- Configure CORS with explicit production origins instead of the development setting `origin: true`.
- Set a strong `JWT_SECRET`; do not rely on the fallback secret.
- Use `secure: true` for auth cookies when serving over HTTPS.
- Persist or schedule maintenance auto-completion outside process memory for reliable production operation. The current `setTimeout` approach does not survive an API restart.
- Build the frontend with `npm run build` and serve `frontend/dist` from a static host or reverse proxy.

## License

No project license has been specified. Add a license file before distributing the project.
