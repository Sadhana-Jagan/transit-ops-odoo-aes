import { useEffect, useMemo, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'
import { useApp, isLicenseExpired } from '../store/AppContext.jsx'
import { Badge } from '../components/ui.jsx'
import { FiTruck, FiCheckCircle, FiTool, FiMap, FiClock, FiUsers, FiActivity, FiAlertTriangle } from '../components/icons.jsx'

function Kpi({ label, value, Icon, tone }) {
  return (
    <div className="card kpi">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="label">{label}</span>
        <span className="ic" style={{ background: `var(--${tone}-soft)`, color: `var(--${tone})` }}><Icon /></span>
      </div>
      <span className="value">{value}</span>
    </div>
  )
}

const COLORS = { Available: '#16a34a', 'On Trip': '#0284c7', 'In Shop': '#d97706', Retired: '#94a3b8' }

export default function Dashboard() {
  const { vehicles, drivers, trips, fetchDashboardKpis } = useApp()
  const [fType, setFType] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [fRegion, setFRegion] = useState('')
  const [srvKpis, setSrvKpis] = useState(null)

  useEffect(() => {
    let active = true
    fetchDashboardKpis().then((d) => { if (active) setSrvKpis(d) }).catch(() => {})
    return () => { active = false }
  }, [fetchDashboardKpis, vehicles, trips, drivers])

  const fv = useMemo(() => vehicles.filter((v) =>
    (!fType || v.type === fType) && (!fStatus || v.status === fStatus) && (!fRegion || v.region === fRegion)
  ), [vehicles, fType, fStatus, fRegion])

  // KPI cards use server-computed metrics; fall back to local calc until loaded.
  const kpis = useMemo(() => {
    if (srvKpis) {
      const onTrip = Math.max(0, (srvKpis.activeVehicles ?? 0) - (srvKpis.availableVehicles ?? 0) - (srvKpis.vehiclesInMaintenance ?? 0))
      return {
        active: onTrip,
        available: srvKpis.availableVehicles ?? 0,
        inShop: srvKpis.vehiclesInMaintenance ?? 0,
        activeTrips: srvKpis.activeTrips ?? 0,
        pendingTrips: srvKpis.pendingTrips ?? 0,
        onDuty: srvKpis.driversOnDuty ?? 0,
        utilization: Math.round(srvKpis.fleetUtilization ?? 0),
      }
    }
    const active = vehicles.filter((v) => v.status === 'On Trip').length
    const available = vehicles.filter((v) => v.status === 'Available').length
    const inShop = vehicles.filter((v) => v.status === 'In Shop').length
    const operable = vehicles.filter((v) => v.status !== 'Retired').length
    return {
      active, available, inShop,
      activeTrips: trips.filter((t) => t.status === 'Dispatched').length,
      pendingTrips: trips.filter((t) => t.status === 'Draft').length,
      onDuty: drivers.filter((d) => d.status === 'On Trip').length,
      utilization: operable ? Math.round((active / operable) * 100) : 0,
    }
  }, [srvKpis, vehicles, trips, drivers])

  const statusData = useMemo(() => {
    const c = {}
    fv.forEach((v) => { c[v.status] = (c[v.status] || 0) + 1 })
    return Object.entries(c).map(([name, value]) => ({ name, value }))
  }, [fv])

  const typeData = useMemo(() => {
    const c = {}
    fv.forEach((v) => { c[v.type] = (c[v.type] || 0) + 1 })
    return Object.entries(c).map(([name, count]) => ({ name, count }))
  }, [fv])

  const types = [...new Set(vehicles.map((v) => v.type))]
  const regions = [...new Set(vehicles.map((v) => v.region))]
  const expiring = drivers.filter((d) => isLicenseExpired(d) || (new Date(d.expiry) - new Date()) / 86400000 < 30)

  return (
    <div className="grid" style={{ gap: 20 }}>
      <div className="toolbar">
        <select className="select" style={{ maxWidth: 180 }} value={fType} onChange={(e) => setFType(e.target.value)}>
          <option value="">All Types</option>
          {types.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select className="select" style={{ maxWidth: 180 }} value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
          <option value="">All Status</option>
          {['Available', 'On Trip', 'In Shop', 'Retired'].map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="select" style={{ maxWidth: 180 }} value={fRegion} onChange={(e) => setFRegion(e.target.value)}>
          <option value="">All Regions</option>
          {regions.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>

      <div className="grid kpi-grid">
        <Kpi label="Active Vehicles" value={kpis.active} Icon={FiTruck} tone="info" />
        <Kpi label="Available Vehicles" value={kpis.available} Icon={FiCheckCircle} tone="success" />
        <Kpi label="In Maintenance" value={kpis.inShop} Icon={FiTool} tone="warn" />
        <Kpi label="Active Trips" value={kpis.activeTrips} Icon={FiMap} tone="primary" />
        <Kpi label="Pending Trips" value={kpis.pendingTrips} Icon={FiClock} tone="warn" />
        <Kpi label="Drivers On Duty" value={kpis.onDuty} Icon={FiUsers} tone="info" />
        <Kpi label="Fleet Utilization" value={kpis.utilization + '%'} Icon={FiActivity} tone="primary" />
      </div>

      <div className="grid charts-grid">
        <div className="card card-pad">
          <div className="section-title">Fleet Status Distribution</div>
          <div className="section-sub" style={{ marginBottom: 12 }}>Vehicles by operational status</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                {statusData.map((e) => <Cell key={e.name} fill={COLORS[e.name] || '#94a3b8'} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card card-pad">
          <div className="section-title">Vehicles by Type</div>
          <div className="section-sub" style={{ marginBottom: 12 }}>Fleet composition</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={typeData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" fontSize={12} /><YAxis fontSize={12} allowDecimals={false} />
              <Tooltip cursor={{ opacity: 0.1 }} />
              <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid charts-grid">
        <div className="card card-pad">
          <div className="section-title">Active & Pending Trips</div>
          <div className="section-sub" style={{ marginBottom: 8 }}>Dispatched and draft trips</div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Route</th><th>Vehicle</th><th>Status</th></tr></thead>
              <tbody>
                {trips.filter((t) => ['Dispatched', 'Draft'].includes(t.status)).map((t) => (
                  <tr key={t.id}>
                    <td>{t.source} → {t.dest}</td>
                    <td>{vehicles.find((v) => v.id === t.vehicleId)?.reg || '—'}</td>
                    <td><Badge status={t.status} /></td>
                  </tr>
                ))}
                {!trips.some((t) => ['Dispatched', 'Draft'].includes(t.status)) && (
                  <tr><td colSpan={3} style={{ color: 'var(--text-muted)' }}>No active or pending trips</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card card-pad">
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FiAlertTriangle /> License Compliance Alerts</div>
          <div className="section-sub" style={{ marginBottom: 8 }}>Expired or expiring within 30 days</div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Driver</th><th>Expiry</th><th>State</th></tr></thead>
              <tbody>
                {expiring.map((d) => (
                  <tr key={d.id}>
                    <td>{d.name}</td><td>{d.expiry}</td>
                    <td>{isLicenseExpired(d)
                      ? <span className="badge b-red"><span className="dot" />Expired</span>
                      : <span className="badge b-amber"><span className="dot" />Expiring soon</span>}
                    </td>
                  </tr>
                ))}
                {!expiring.length && <tr><td colSpan={3} style={{ color: 'var(--success)' }}>All licenses valid</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

