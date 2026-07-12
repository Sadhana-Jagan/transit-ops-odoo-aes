// Seed data + localStorage persistence for TransitOps

const KEY = 'transitops_state_v1'

const today = new Date()
const iso = (d) => d.toISOString().slice(0, 10)
const daysFromNow = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d) }

export const ROLES = {
  fleet_manager: 'Fleet Manager',
  driver: 'Driver',
  safety_officer: 'Safety Officer',
  financial_analyst: 'Financial Analyst',
}

export const ROLE_ACCESS = {
  fleet_manager: ['dashboard', 'vehicles', 'drivers', 'trips', 'maintenance', 'fuel', 'reports'],
  driver: ['dashboard', 'trips', 'vehicles', 'drivers'],
  safety_officer: ['dashboard', 'drivers', 'trips', 'reports'],
  financial_analyst: ['dashboard', 'fuel', 'reports', 'vehicles'],
}

export const USERS = [
  { id: 'u1', name: 'Morgan Reed', email: 'manager@transitops.io', password: 'demo123', role: 'fleet_manager' },
  { id: 'u2', name: 'Alex Turner', email: 'driver@transitops.io', password: 'demo123', role: 'driver' },
  { id: 'u3', name: 'Sam Okoye', email: 'safety@transitops.io', password: 'demo123', role: 'safety_officer' },
  { id: 'u4', name: 'Priya Nair', email: 'finance@transitops.io', password: 'demo123', role: 'financial_analyst' },
]

const seed = () => ({
  vehicles: [
    { id: 'v1', reg: 'VAN-05', name: 'Ford Transit', type: 'Van', capacity: 500, odometer: 84200, cost: 32000, revenue: 21000, region: 'North', status: 'Available' },
    { id: 'v2', reg: 'TRK-11', name: 'Volvo FH16', type: 'Truck', capacity: 24000, odometer: 152300, cost: 128000, revenue: 96000, region: 'East', status: 'On Trip' },
    { id: 'v3', reg: 'BUS-02', name: 'Mercedes Sprinter', type: 'Bus', capacity: 3500, odometer: 62100, cost: 68000, revenue: 44000, region: 'West', status: 'In Shop' },
    { id: 'v4', reg: 'VAN-08', name: 'Renault Master', type: 'Van', capacity: 1200, odometer: 41000, cost: 29000, revenue: 15000, region: 'North', status: 'Available' },
    { id: 'v5', reg: 'TRK-21', name: 'Scania R450', type: 'Truck', capacity: 18000, odometer: 210500, cost: 115000, revenue: 132000, region: 'South', status: 'Retired' },
    { id: 'v6', reg: 'PKP-03', name: 'Toyota Hilux', type: 'Pickup', capacity: 1000, odometer: 33400, cost: 34000, revenue: 12000, region: 'East', status: 'Available' },
  ],
  drivers: [
    { id: 'd1', name: 'Alex Turner', license: 'DL-88213', category: 'C', expiry: daysFromNow(220), contact: '+91 98765 43210', tripsCompleted: 128, safety: 92, status: 'On Trip' },
    { id: 'd2', name: 'Jordan Blake', license: 'DL-77410', category: 'B', expiry: daysFromNow(40), contact: '+91 98220 11983', tripsCompleted: 74, safety: 87, status: 'Available' },
    { id: 'd3', name: 'Casey Lin', license: 'DL-55102', category: 'D', expiry: daysFromNow(-12), contact: '+91 90011 22110', tripsCompleted: 45, safety: 74, status: 'Available' },
    { id: 'd4', name: 'Devon Marsh', license: 'DL-93021', category: 'C', expiry: daysFromNow(510), contact: '+91 99887 71770', tripsCompleted: 203, safety: 96, status: 'Available' },
    { id: 'd5', name: 'Riley Cross', license: 'DL-31288', category: 'B', expiry: daysFromNow(15), contact: '+91 98111 65650', tripsCompleted: 12, safety: 61, status: 'Suspended' },
    { id: 'd6', name: 'Taylor Quinn', license: 'DL-44900', category: 'C', expiry: daysFromNow(300), contact: '+91 97654 32100', tripsCompleted: 88, safety: 83, status: 'Off Duty' },
  ],
  trips: [
    { id: 't1', source: 'Chicago Depot', dest: 'Detroit Hub', vehicleId: 'v2', driverId: 'd1', cargo: 15000, distance: 460, status: 'Dispatched', finalOdometer: null, fuelUsed: null, createdAt: iso(today) },
    { id: 't2', source: 'Boston DC', dest: 'Albany Warehouse', vehicleId: 'v1', driverId: 'd4', cargo: 420, distance: 270, status: 'Completed', finalOdometer: 84200, fuelUsed: 34, createdAt: daysFromNow(-3) },
    { id: 't3', source: 'Newark Port', dest: 'Philadelphia', vehicleId: 'v4', driverId: 'd2', cargo: 900, distance: 150, status: 'Draft', finalOdometer: null, fuelUsed: null, createdAt: daysFromNow(-1) },
  ],
  maintenance: [
    { id: 'm1', vehicleId: 'v3', type: 'Engine Overhaul', cost: 2400, date: daysFromNow(-2), notes: 'Coolant leak + belts', status: 'Open', createdTs: Date.now() },
    { id: 'm2', vehicleId: 'v1', type: 'Oil Change', cost: 180, date: daysFromNow(-20), notes: 'Routine service', status: 'Closed', createdTs: Date.now() - 20 * 864e5 },
  ],
  fuel: [
    { id: 'f1', vehicleId: 'v1', liters: 34, cost: 61, date: daysFromNow(-3) },
    { id: 'f2', vehicleId: 'v2', liters: 180, cost: 320, date: daysFromNow(-1) },
    { id: 'f3', vehicleId: 'v4', liters: 40, cost: 72, date: daysFromNow(-5) },
  ],
  expenses: [
    { id: 'e1', tripId: 't1', vehicleId: 'v2', toll: 450, other: 200, date: daysFromNow(-1), notes: 'I-94 tolls' },
    { id: 'e2', tripId: 't2', vehicleId: 'v1', toll: 120, other: 80, date: daysFromNow(-3), notes: 'Overnight parking' },
  ],
})

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) { /* ignore */ }
  const s = seed()
  localStorage.setItem(KEY, JSON.stringify(s))
  return s
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function resetState() {
  localStorage.removeItem(KEY)
  return loadState()
}

