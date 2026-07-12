// Demo login hints + role-based route access for TransitOps.
// Data now comes from the backend API (see api.js / AppContext.jsx).

export const ROLES = {
  fleet_manager: 'Fleet Manager',
  driver: 'Driver',
  safety_officer: 'Safety Officer',
  financial_analyst: 'Financial Analyst',
  dispatcher: 'Dispatcher',
}

export const ROLE_ACCESS = {
  fleet_manager: ['dashboard', 'vehicles', 'drivers', 'trips', 'maintenance', 'fuel', 'reports'],
  driver: ['dashboard', 'trips', 'vehicles', 'drivers'],
  safety_officer: ['dashboard', 'drivers', 'trips', 'reports'],
  financial_analyst: ['dashboard', 'fuel', 'reports', 'vehicles'],
  dispatcher: ['dashboard', 'vehicles', 'drivers', 'trips'],
}

// Matches the demo accounts created by the backend seed script (npm run seed).
export const USERS = [
  { id: 'u1', name: 'Morgan Reed', email: 'manager@transitops.io', password: 'demo123', role: 'fleet_manager' },
  { id: 'u2', name: 'Alex Turner', email: 'driver@transitops.io', password: 'demo123', role: 'driver' },
  { id: 'u3', name: 'Sam Okoye', email: 'safety@transitops.io', password: 'demo123', role: 'safety_officer' },
  { id: 'u4', name: 'Priya Nair', email: 'finance@transitops.io', password: 'demo123', role: 'financial_analyst' },
  { id: 'u5', name: 'Dana Cole', email: 'dispatch@transitops.io', password: 'demo123', role: 'dispatcher' },
]
