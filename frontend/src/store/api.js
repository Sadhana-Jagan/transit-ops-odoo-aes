// Centralized API client for the TransitOps backend.
const BASE = import.meta.env.VITE_API_URL || '/api'

let authToken = localStorage.getItem('transitops_token') || null

export function setToken(token) {
  authToken = token
  if (token) localStorage.setItem('transitops_token', token)
  else localStorage.removeItem('transitops_token')
}

export function getToken() {
  return authToken
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (authToken) headers.Authorization = `Bearer ${authToken}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  })

  let data = null
  try { data = await res.json() } catch { /* no body */ }

  if (res.status === 401 && authToken && !path.startsWith('/auth/login') && !path.startsWith('/auth/register')) {
    // Session expired or token invalidated — notify the app to log out.
    setToken(null)
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('transitops:unauthorized'))
  }

  if (!res.ok || (data && data.success === false)) {
    const message = (data && data.message) || `Request failed (${res.status})`
    const err = new Error(message)
    err.status = res.status
    throw err
  }
  return data
}

export const api = {
  // ---- Auth ----
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  me: () => request('/auth/me'),

  // ---- Vehicles ----
  getVehicles: () => request('/vehicles'),
  createVehicle: (payload) => request('/vehicles', { method: 'POST', body: payload }),
  updateVehicle: (id, payload) => request(`/vehicles/${id}`, { method: 'PUT', body: payload }),
  updateVehicleStatus: (id, status) => request(`/vehicles/${id}/status`, { method: 'PATCH', body: { status } }),
  deleteVehicle: (id) => request(`/vehicles/${id}`, { method: 'DELETE' }),

  // ---- Drivers ----
  getDrivers: () => request('/drivers'),
  createDriver: (payload) => request('/drivers', { method: 'POST', body: payload }),
  updateDriver: (id, payload) => request(`/drivers/${id}`, { method: 'PUT', body: payload }),
  updateDriverStatus: (id, payload) => request(`/drivers/${id}/status`, { method: 'PATCH', body: payload }),
  deleteDriver: (id) => request(`/drivers/${id}`, { method: 'DELETE' }),

  // ---- Trips ----
  getTrips: () => request('/trips'),
  createTrip: (payload) => request('/trips', { method: 'POST', body: payload }),
  updateTripStatus: (id, payload) => request(`/trips/${id}/status`, { method: 'PATCH', body: payload }),

  // ---- Maintenance ----
  getMaintenance: () => request('/maintenance?status=all'),
  createMaintenance: (payload) => request('/maintenance', { method: 'POST', body: payload }),
  completeMaintenance: (id) => request(`/maintenance/${id}/complete`, { method: 'PATCH' }),
  deleteMaintenance: (id) => request(`/maintenance/${id}`, { method: 'DELETE' }),

  // ---- Fuel & Expenses ----
  getFuelLogs: () => request('/ops/fuel-logs'),
  addFuelLog: (payload) => request('/ops/fuel-logs', { method: 'POST', body: payload }),
  deleteFuelLog: (id) => request(`/ops/fuel-logs/${id}`, { method: 'DELETE' }),
  getExpenses: () => request('/ops/expenses'),
  addExpense: (payload) => request('/ops/expenses', { method: 'POST', body: payload }),
  deleteExpense: (id) => request(`/ops/expenses/${id}`, { method: 'DELETE' }),

  // ---- Reports ----
  getDashboardKpis: () => request('/reports/dashboard/kpis'),
  getAnalytics: () => request('/reports/analytics'),
}

