// Maps between backend enum/field shapes and the frontend display shape.

const VEHICLE_STATUS_TO_UI = { Available: 'Available', OnTrip: 'On Trip', InShop: 'In Shop', Retired: 'Retired' }
const VEHICLE_STATUS_TO_API = { Available: 'Available', 'On Trip': 'OnTrip', 'In Shop': 'InShop', Retired: 'Retired' }

const DRIVER_STATUS_TO_UI = { Available: 'Available', OnTrip: 'On Trip', OffDuty: 'Off Duty', Suspended: 'Suspended' }
const DRIVER_STATUS_TO_API = { Available: 'Available', 'On Trip': 'OnTrip', 'Off Duty': 'OffDuty', Suspended: 'Suspended' }

const MAINT_STATUS_TO_UI = { Open: 'Open', Completed: 'Closed' }

const SAFETY_TO_NUMBER = { High: 90, Medium: 70, Low: 50 }

export const ROLE_API_TO_UI = {
  FleetManager: 'fleet_manager',
  Driver: 'driver',
  SafetyOfficer: 'safety_officer',
  FinancialAnalyst: 'financial_analyst',
  Dispatcher: 'dispatcher',
}

export const ROLE_UI_TO_API = {
  fleet_manager: 'FleetManager',
  driver: 'Driver',
  safety_officer: 'SafetyOfficer',
  financial_analyst: 'FinancialAnalyst',
  dispatcher: 'Dispatcher',
}

const idOf = (ref) => (ref && typeof ref === 'object' ? ref._id : ref)
const isoDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '')

export const mapVehicle = (v) => ({
  id: v._id,
  reg: v.registrationNumber,
  name: v.vehicleName,
  type: v.vehicleType,
  capacity: v.maxLoadCapacity ?? 0,
  odometer: v.odometer ?? 0,
  cost: v.acquisitionCost ?? 0,
  revenue: v.revenue ?? 0,
  region: v.region || 'Default',
  status: VEHICLE_STATUS_TO_UI[v.status] || v.status,
})

export const vehicleToApi = (v) => ({
  registrationNumber: v.reg,
  vehicleName: v.name,
  vehicleType: v.type,
  maxLoadCapacity: Number(v.capacity),
  odometer: Number(v.odometer) || 0,
  acquisitionCost: Number(v.cost) || 0,
  averageRunningCost: Number(v.cost) || 0,
  revenue: Number(v.revenue) || 0,
  region: v.region,
  status: VEHICLE_STATUS_TO_API[v.status] || v.status,
})

export const mapDriver = (d) => ({
  id: d._id,
  name: d.name,
  license: d.licenseNumber,
  category: d.licenseCategory,
  expiry: isoDate(d.licenseExpiry),
  contact: d.contactNumber,
  tripsCompleted: d.tripCompletion ?? 0,
  safety: typeof d.safetyScore === 'number' ? d.safetyScore : (SAFETY_TO_NUMBER[d.safetyScore] ?? 80),
  status: DRIVER_STATUS_TO_UI[d.status] || d.status,
})

export const driverToApi = (d) => ({
  name: d.name,
  licenseNumber: d.license,
  licenseCategory: d.category,
  licenseExpiry: d.expiry,
  contactNumber: d.contact,
  tripCompletion: Number(d.tripsCompleted) || 0,
  safetyScore: Number(d.safety),
  status: DRIVER_STATUS_TO_API[d.status] || d.status,
})

export const mapTrip = (t) => ({
  id: t._id,
  source: t.source,
  dest: t.destination,
  vehicleId: idOf(t.vehicle),
  driverId: idOf(t.driver),
  cargo: t.cargoWeight,
  distance: t.plannedDistance,
  status: t.status,
  finalOdometer: t.finalOdometer || null,
  fuelUsed: t.fuelConsumed || null,
  createdAt: isoDate(t.createdAt),
})

export const mapMaintenance = (m) => ({
  id: m._id,
  vehicleId: idOf(m.vehicle),
  type: m.maintenanceType,
  cost: m.cost ?? 0,
  date: isoDate(m.serviceDate),
  notes: m.description || '',
  status: MAINT_STATUS_TO_UI[m.status] || m.status,
})

export const mapFuel = (f) => ({
  id: f._id,
  vehicleId: idOf(f.vehicle),
  liters: f.liters,
  cost: f.cost,
  date: isoDate(f.date),
})

export const mapExpense = (e) => ({
  id: e._id,
  tripId: idOf(e.trip),
  vehicleId: idOf(e.vehicle),
  toll: e.tollFee ?? 0,
  other: e.otherFee ?? 0,
  date: isoDate(e.date),
  notes: e.remarks || '',
})

