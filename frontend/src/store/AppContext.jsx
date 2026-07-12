import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { api, setToken, getToken } from './api.js'
import {
  mapVehicle, vehicleToApi,
  mapDriver, driverToApi,
  mapTrip, mapMaintenance, mapFuel, mapExpense,
  ROLE_API_TO_UI, ROLE_UI_TO_API,
} from './mappers.js'
import { ROLE_ACCESS } from './seed.js'

const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

const todayISO = () => new Date().toISOString().slice(0, 10)

export function isLicenseExpired(driver) {
  return new Date(driver.expiry) < new Date(todayISO())
}

const EMPTY = { vehicles: [], drivers: [], trips: [], maintenance: [], fuel: [], expenses: [] }

export function AppProvider({ children }) {
  const [state, setState] = useState(EMPTY)
  const [user, setUser] = useState(null)
  const [booting, setBooting] = useState(true)
  const [theme, setTheme] = useState(() => localStorage.getItem('transitops_theme') || 'light')
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('transitops_theme', theme)
  }, [theme])

  const toast = useCallback((msg, kind = 'success') => {
    const id = Math.random().toString(36).slice(2, 9)
    setToasts((t) => [...t, { id, msg, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  // ---- Data loading ----
  const loadAll = useCallback(async () => {
    try {
      const [v, d, t, m, f, e] = await Promise.all([
        api.getVehicles(), api.getDrivers(), api.getTrips(),
        api.getMaintenance(), api.getFuelLogs(), api.getExpenses(),
      ])
      setState({
        vehicles: (v.data || []).map(mapVehicle),
        drivers: (d.data || []).map(mapDriver),
        trips: (t.data || []).map(mapTrip),
        maintenance: (m.data || []).map(mapMaintenance),
        fuel: (f.data || []).map(mapFuel),
        expenses: (e.data || []).map(mapExpense),
      })
    } catch (err) {
      toast(err.message || 'Failed to load data', 'error')
    }
  }, [toast])

  // Restore session on mount
  useEffect(() => {
    let active = true
    const boot = async () => {
      const token = getToken()
      if (token) {
        try {
          const res = await api.me()
          if (active && res?.data) {
            setUser({ ...res.data, role: ROLE_API_TO_UI[res.data.role] || res.data.role })
            await loadAll()
          }
        } catch {
          setToken(null)
        }
      }
      if (active) setBooting(false)
    }
    boot()
    return () => { active = false }
  }, [loadAll])

  // Poll for backend-driven changes (e.g. maintenance auto-close) while logged in
  useEffect(() => {
    if (!user) return undefined
    const t = setInterval(() => { loadAll() }, 60000)
    return () => clearInterval(t)
  }, [user, loadAll])

  // Handle expired/invalid sessions surfaced by the API client
  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null)
      setState(EMPTY)
      toast('Session expired — please sign in again', 'error')
    }
    window.addEventListener('transitops:unauthorized', onUnauthorized)
    return () => window.removeEventListener('transitops:unauthorized', onUnauthorized)
  }, [toast])

  // ---- Auth ----
  const login = async (email, password) => {
    try {
      const res = await api.login(email, password)
      if (res.token) setToken(res.token)
      const u = res.data
      setUser({ ...u, role: ROLE_API_TO_UI[u.role] || u.role })
      await loadAll()
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.message || 'Invalid email or password' }
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    setState(EMPTY)
  }

  const signup = async ({ name, email, password, role }) => {
    try {
      const apiRole = ROLE_UI_TO_API[role] || role
      await api.register({ name, email, password, role: apiRole })
      // auto sign-in after successful registration
      return await login(email, password)
    } catch (err) {
      return { ok: false, error: err.message || 'Registration failed' }
    }
  }

  const can = (route) => user && ROLE_ACCESS[user.role]?.includes(route)


  // ---- helper to wrap a mutation ----
  const run = async (fn, okMsg, okKind = 'success') => {
    try {
      await fn()
      await loadAll()
      if (okMsg) toast(okMsg, okKind)
      return { ok: true }
    } catch (err) {
      const message = err.message || 'Operation failed'
      toast(message, 'error')
      return { ok: false, error: message }
    }
  }

  // ---- Vehicles ----
  const saveVehicle = (v) => run(
    () => (v.id ? api.updateVehicle(v.id, vehicleToApi(v)) : api.createVehicle(vehicleToApi(v))),
    v.id ? 'Vehicle updated' : 'Vehicle registered',
  )
  const deleteVehicle = (id) => run(() => api.deleteVehicle(id), 'Vehicle deleted', 'error')

  // ---- Drivers ----
  const saveDriver = (d) => run(
    () => (d.id ? api.updateDriver(d.id, driverToApi(d)) : api.createDriver(driverToApi(d))),
    d.id ? 'Driver updated' : 'Driver added',
  )
  const deleteDriver = (id) => run(() => api.deleteDriver(id), 'Driver deleted', 'error')

  // ---- Trips ----
  const saveTrip = (t) => run(
    () => api.createTrip({
      source: t.source,
      destination: t.dest,
      vehicleId: t.vehicleId,
      driverId: t.driverId,
      cargoWeight: Number(t.cargo),
      plannedDistance: Number(t.distance),
      status: 'Draft',
    }),
    'Trip created as Draft',
  )
  const dispatchTrip = (id) => run(() => api.updateTripStatus(id, { status: 'Dispatched' }), 'Trip dispatched')
  const completeTrip = async (id, finalOdometer, fuelUsed, revenue) => {
    const trip = state.trips.find((t) => t.id === id)
    return run(
      () => api.updateTripStatus(id, {
        status: 'Completed',
        finalOdometer: Number(finalOdometer) || undefined,
        fuelConsumed: Number(fuelUsed) || undefined,
        revenue: Number(revenue) || undefined,
        actualDistance: trip?.distance,
      }),
      'Trip completed',
    )
  }
  const cancelTrip = (id) => run(() => api.updateTripStatus(id, { status: 'Cancelled' }), 'Trip cancelled', 'error')

  // ---- Maintenance ----
  const saveMaintenance = (m) => run(
    () => api.createMaintenance({
      vehicleId: m.vehicleId,
      maintenanceType: m.type,
      cost: Number(m.cost),
      date: m.date || todayISO(),
      description: m.notes,
    }),
    'Maintenance opened — vehicle now In Shop',
  )
  const closeMaintenance = (id) => run(() => api.completeMaintenance(id), 'Maintenance closed — vehicle Available')
  const deleteMaintenance = (id) => run(() => api.deleteMaintenance(id), 'Maintenance record deleted', 'error')

  // ---- Fuel & Expenses ----
  const saveFuel = (f) => run(
    () => api.addFuelLog({ vehicleId: f.vehicleId, liters: Number(f.liters), fuelCost: Number(f.cost), date: f.date || todayISO() }),
    'Fuel log saved',
  )
  const deleteFuel = (id) => run(() => api.deleteFuelLog(id), 'Fuel log deleted', 'error')
  const saveExpense = (e) => run(
    () => api.addExpense({
      vehicleId: e.vehicleId,
      tripId: e.tripId || undefined,
      tollFee: Number(e.toll) || 0,
      otherFee: Number(e.other) || 0,
      maintenanceCost: 0,
      date: e.date || todayISO(),
    }),
    'Expense saved',
  )
  const deleteExpense = (id) => run(() => api.deleteExpense(id), 'Expense deleted', 'error')

  // ---- Reports (server-computed analytics) ----
  const fetchDashboardKpis = useCallback(async () => {
    const res = await api.getDashboardKpis()
    return res.data
  }, [])
  const fetchAnalytics = useCallback(async () => {
    const res = await api.getAnalytics()
    return res.data
  }, [])

  const reset = () => loadAll()

  const value = useMemo(() => ({
    ...state, user, booting, theme, setTheme, toasts, toast,
    login, logout, can, signup,    saveVehicle, deleteVehicle,
    saveDriver, deleteDriver,
    saveTrip, dispatchTrip, completeTrip, cancelTrip,
    saveMaintenance, closeMaintenance, deleteMaintenance,
    saveFuel, deleteFuel, saveExpense, deleteExpense,
    fetchDashboardKpis, fetchAnalytics,
    reset, reload: loadAll,
  }), [state, user, booting, theme, toasts])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
