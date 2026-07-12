import { createContext, useContext, useEffect, useMemo, useReducer, useState, useCallback } from 'react'
import { loadState, saveState, resetState, USERS, ROLE_ACCESS } from './seed.js'

const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

const uid = (p) => p + Math.random().toString(36).slice(2, 9)
const todayISO = () => new Date().toISOString().slice(0, 10)

function reducer(state, action) {
  switch (action.type) {
    case 'SET': return action.payload
    case 'PATCH': return { ...state, ...action.payload }
    default: return state
  }
}

export function isLicenseExpired(driver) {
  return new Date(driver.expiry) < new Date(todayISO())
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, loadState)
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('transitops_user')) } catch { return null }
  })
  const [theme, setTheme] = useState(() => localStorage.getItem('transitops_theme') || 'light')
  const [toasts, setToasts] = useState([])

  useEffect(() => { saveState(state) }, [state])
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('transitops_theme', theme)
  }, [theme])

  // Auto-complete maintenance 15 minutes after creation (mirrors backend PATCH)
  const MAINT_TTL = 15 * 60 * 1000
  useEffect(() => {
    const tick = () => {
      const now = Date.now()
      const due = state.maintenance.filter((m) => m.status === 'Open' && m.createdTs && now - m.createdTs >= MAINT_TTL)
      if (!due.length) return
      const dueVehicleIds = new Set(due.map((m) => m.vehicleId))
      dispatch({
        type: 'PATCH',
        payload: {
          maintenance: state.maintenance.map((m) => (dueVehicleIds.has(m.vehicleId) && m.status === 'Open' ? { ...m, status: 'Closed' } : m)),
          vehicles: state.vehicles.map((v) => (dueVehicleIds.has(v.id) && v.status === 'In Shop' ? { ...v, status: 'Available' } : v)),
        },
      })
    }
    tick()
    const t = setInterval(tick, 30000)
    return () => clearInterval(t)
  }, [state.maintenance, state.vehicles])

  const toast = useCallback((msg, kind = 'success') => {
    const id = uid('t')
    setToasts((t) => [...t, { id, msg, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  // ---- Auth ----
  const login = (email, password) => {
    const u = USERS.find((x) => x.email === email && x.password === password)
    if (!u) return { ok: false, error: 'Invalid email or password' }
    const safe = { id: u.id, name: u.name, email: u.email, role: u.role }
    setUser(safe)
    localStorage.setItem('transitops_user', JSON.stringify(safe))
    return { ok: true }
  }
  const logout = () => { setUser(null); localStorage.removeItem('transitops_user') }
  const can = (route) => user && ROLE_ACCESS[user.role]?.includes(route)

  const patch = (partial) => dispatch({ type: 'PATCH', payload: partial })

  // ---- Vehicles ----
  const saveVehicle = (v) => {
    const dup = state.vehicles.find((x) => x.reg.toLowerCase() === v.reg.trim().toLowerCase() && x.id !== v.id)
    if (dup) return { ok: false, error: 'Registration number must be unique' }
    if (v.id) {
      patch({ vehicles: state.vehicles.map((x) => (x.id === v.id ? { ...x, ...v } : x)) })
      toast('Vehicle updated')
    } else {
      patch({ vehicles: [{ ...v, id: uid('v'), status: v.status || 'Available' }, ...state.vehicles] })
      toast('Vehicle registered')
    }
    return { ok: true }
  }
  const deleteVehicle = (id) => {
    patch({ vehicles: state.vehicles.filter((x) => x.id !== id) })
    toast('Vehicle deleted', 'error')
  }

  // ---- Drivers ----
  const saveDriver = (d) => {
    if (d.id) {
      patch({ drivers: state.drivers.map((x) => (x.id === d.id ? { ...x, ...d } : x)) })
      toast('Driver updated')
    } else {
      patch({ drivers: [{ ...d, id: uid('d'), status: d.status || 'Available' }, ...state.drivers] })
      toast('Driver added')
    }
    return { ok: true }
  }
  const deleteDriver = (id) => {
    patch({ drivers: state.drivers.filter((x) => x.id !== id) })
    toast('Driver deleted', 'error')
  }

  // ---- Trips ----
  const saveTrip = (t) => {
    const veh = state.vehicles.find((v) => v.id === t.vehicleId)
    const drv = state.drivers.find((d) => d.id === t.driverId)
    if (!veh) return { ok: false, error: 'Select a vehicle' }
    if (!drv) return { ok: false, error: 'Select a driver' }
    if (Number(t.cargo) > Number(veh.capacity))
      return { ok: false, error: `Cargo ${t.cargo}kg exceeds vehicle capacity (${veh.capacity}kg)` }
    if (t.id) {
      patch({ trips: state.trips.map((x) => (x.id === t.id ? { ...x, ...t } : x)) })
      toast('Trip updated')
    } else {
      patch({ trips: [{ ...t, id: uid('t'), status: 'Draft', finalOdometer: null, fuelUsed: null, createdAt: todayISO() }, ...state.trips] })
      toast('Trip created as Draft')
    }
    return { ok: true }
  }

  const dispatchTrip = (id) => {
    const trip = state.trips.find((t) => t.id === id)
    const veh = state.vehicles.find((v) => v.id === trip.vehicleId)
    const drv = state.drivers.find((d) => d.id === trip.driverId)
    if (['Retired', 'In Shop'].includes(veh.status)) return { ok: false, error: 'Vehicle is not dispatchable (Retired/In Shop)' }
    if (veh.status === 'On Trip') return { ok: false, error: 'Vehicle already On Trip' }
    if (drv.status === 'On Trip') return { ok: false, error: 'Driver already On Trip' }
    if (drv.status === 'Suspended') return { ok: false, error: 'Driver is Suspended' }
    if (isLicenseExpired(drv)) return { ok: false, error: 'Driver license is expired' }
    if (Number(trip.cargo) > Number(veh.capacity)) return { ok: false, error: 'Cargo exceeds capacity' }
    patch({
      trips: state.trips.map((t) => (t.id === id ? { ...t, status: 'Dispatched' } : t)),
      vehicles: state.vehicles.map((v) => (v.id === veh.id ? { ...v, status: 'On Trip' } : v)),
      drivers: state.drivers.map((d) => (d.id === drv.id ? { ...d, status: 'On Trip' } : d)),
    })
    toast('Trip dispatched — vehicle & driver now On Trip')
    return { ok: true }
  }

  const completeTrip = (id, finalOdometer, fuelUsed) => {
    const trip = state.trips.find((t) => t.id === id)
    const veh = state.vehicles.find((v) => v.id === trip.vehicleId)
    const newFuel = fuelUsed ? [{ id: uid('f'), vehicleId: veh.id, liters: Number(fuelUsed), cost: Math.round(Number(fuelUsed) * 1.8), date: todayISO() }] : []
    patch({
      trips: state.trips.map((t) => (t.id === id ? { ...t, status: 'Completed', finalOdometer: Number(finalOdometer) || veh.odometer, fuelUsed: Number(fuelUsed) || null } : t)),
      vehicles: state.vehicles.map((v) => (v.id === veh.id ? { ...v, status: 'Available', odometer: Number(finalOdometer) || v.odometer } : v)),
      drivers: state.drivers.map((d) => (d.id === trip.driverId ? { ...d, status: 'Available' } : d)),
      fuel: [...newFuel, ...state.fuel],
    })
    toast('Trip completed — vehicle & driver Available')
    return { ok: true }
  }

  const cancelTrip = (id) => {
    const trip = state.trips.find((t) => t.id === id)
    const restore = trip.status === 'Dispatched'
    patch({
      trips: state.trips.map((t) => (t.id === id ? { ...t, status: 'Cancelled' } : t)),
      vehicles: restore ? state.vehicles.map((v) => (v.id === trip.vehicleId ? { ...v, status: 'Available' } : v)) : state.vehicles,
      drivers: restore ? state.drivers.map((d) => (d.id === trip.driverId ? { ...d, status: 'Available' } : d)) : state.drivers,
    })
    toast('Trip cancelled', 'error')
    return { ok: true }
  }

  // ---- Maintenance ----
  const saveMaintenance = (m) => {
    const veh = state.vehicles.find((v) => v.id === m.vehicleId)
    if (!veh) return { ok: false, error: 'Select a vehicle' }
    if (m.id) {
      patch({ maintenance: state.maintenance.map((x) => (x.id === m.id ? { ...x, ...m } : x)) })
      toast('Maintenance updated')
    } else {
      if (veh.status === 'On Trip') return { ok: false, error: 'Vehicle is On Trip — complete the trip first' }
      patch({
        maintenance: [{ ...m, id: uid('m'), status: 'Open', date: m.date || todayISO(), createdTs: Date.now() }, ...state.maintenance],
        vehicles: state.vehicles.map((v) => (v.id === veh.id && v.status !== 'Retired' ? { ...v, status: 'In Shop' } : v)),
      })
      toast('Maintenance opened — vehicle now In Shop')
    }
    return { ok: true }
  }

  const closeMaintenance = (id) => {
    const m = state.maintenance.find((x) => x.id === id)
    const veh = state.vehicles.find((v) => v.id === m.vehicleId)
    patch({
      maintenance: state.maintenance.map((x) => (x.id === id ? { ...x, status: 'Closed' } : x)),
      vehicles: state.vehicles.map((v) => (v.id === veh.id && v.status !== 'Retired' ? { ...v, status: 'Available' } : v)),
    })
    toast('Maintenance closed — vehicle Available')
    return { ok: true }
  }
  const deleteMaintenance = (id) => {
    patch({ maintenance: state.maintenance.filter((x) => x.id !== id) })
    toast('Maintenance record deleted', 'error')
  }

  // ---- Fuel & Expenses ----
  const saveFuel = (f) => {
    if (f.id) patch({ fuel: state.fuel.map((x) => (x.id === f.id ? { ...x, ...f } : x)) })
    else patch({ fuel: [{ ...f, id: uid('f'), date: f.date || todayISO() }, ...state.fuel] })
    toast('Fuel log saved'); return { ok: true }
  }
  const deleteFuel = (id) => { patch({ fuel: state.fuel.filter((x) => x.id !== id) }); toast('Fuel log deleted', 'error') }
  const saveExpense = (e) => {
    if (e.id) patch({ expenses: state.expenses.map((x) => (x.id === e.id ? { ...x, ...e } : x)) })
    else patch({ expenses: [{ ...e, id: uid('e'), date: e.date || todayISO() }, ...state.expenses] })
    toast('Expense saved'); return { ok: true }
  }
  const deleteExpense = (id) => { patch({ expenses: state.expenses.filter((x) => x.id !== id) }); toast('Expense deleted', 'error') }

  const reset = () => { dispatch({ type: 'SET', payload: resetState() }); toast('Demo data reset') }

  const value = useMemo(() => ({
    ...state, user, theme, setTheme, toasts, toast,
    login, logout, can,
    saveVehicle, deleteVehicle,
    saveDriver, deleteDriver,
    saveTrip, dispatchTrip, completeTrip, cancelTrip,
    saveMaintenance, closeMaintenance, deleteMaintenance,
    saveFuel, deleteFuel, saveExpense, deleteExpense,
    reset,
  }), [state, user, theme, toasts])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

