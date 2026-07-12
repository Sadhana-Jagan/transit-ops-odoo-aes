import { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, LineChart, Line, Legend } from 'recharts'
import { useApp } from '../store/AppContext.jsx'
import { PageHeader, exportCSV, Empty, inr } from '../components/ui.jsx'
import { FiTrendingUp, FiDownload } from '../components/icons.jsx'

export default function Reports() {
  const { vehicles, trips, fetchAnalytics } = useApp()
  const [server, setServer] = useState(null)

  useEffect(() => {
    let active = true
    fetchAnalytics().then((d) => { if (active) setServer(d) }).catch(() => {})
    return () => { active = false }
  }, [fetchAnalytics, vehicles, trips])

  const nameByReg = useMemo(() => {
    const m = {}
    vehicles.forEach((v) => { m[v.reg] = v.name })
    return m
  }, [vehicles])

  // Build the analytics rows from the server response, merging the three datasets by registration number.
  const analytics = useMemo(() => {
    if (!server) return []
    const eff = Object.fromEntries((server.fuelEfficiency || []).map((r) => [r.registrationNumber, r]))
    const cost = Object.fromEntries((server.operationalCost || []).map((r) => [r.registrationNumber, r]))
    return (server.vehicleROI || []).map((r) => {
      const e = eff[r.registrationNumber] || {}
      const c = cost[r.registrationNumber] || {}
      return {
        reg: r.registrationNumber,
        name: nameByReg[r.registrationNumber] || '—',
        distance: e.distance || 0,
        liters: e.liters || 0,
        efficiency: Number(e.kmPerLiter || 0),
        opCost: c.totalOperationalCost || 0,
        revenue: r.revenue || 0,
        roi: Number(((r.roi || 0) * 100).toFixed(1)),
      }
    })
  }, [server, nameByReg])

  const utilization = server ? Math.round(server.fleetUtilization || 0) : 0
  const totalOpCost = analytics.reduce((s, a) => s + a.opCost, 0)
  const avgEff = analytics.filter((a) => a.efficiency > 0)
  const fleetEff = avgEff.length ? (avgEff.reduce((s, a) => s + a.efficiency, 0) / avgEff.length).toFixed(2) : '0'

  return (
    <>
      <PageHeader title="Reports & Analytics" sub="Fuel efficiency, utilization, operational cost & ROI"
        actions={<button className="btn primary" onClick={() => exportCSV('fleet-analytics.csv', analytics)}><FiDownload /> Export CSV</button>} />

      <div className="grid kpi-grid" style={{ marginBottom: 20 }}>
        <div className="card kpi"><span className="label">Fleet Utilization</span><span className="value">{utilization}%</span></div>
        <div className="card kpi"><span className="label">Avg Fuel Efficiency</span><span className="value">{fleetEff} <small style={{ fontSize: 14, color: 'var(--text-muted)' }}>km/L</small></span></div>
        <div className="card kpi"><span className="label">Total Operational Cost</span><span className="value">{inr(totalOpCost)}</span></div>
        <div className="card kpi"><span className="label">Completed Trips</span><span className="value">{trips.filter((t) => t.status === 'Completed').length}</span></div>
      </div>

      <div className="grid charts-grid" style={{ marginBottom: 20 }}>
        <div className="card card-pad">
          <div className="section-title">Fuel Efficiency by Vehicle (km/L)</div>
          <div className="section-sub" style={{ marginBottom: 12 }}>Distance travelled per litre</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={analytics.filter((a) => a.efficiency > 0)}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="reg" fontSize={12} /><YAxis fontSize={12} />
              <Tooltip cursor={{ opacity: 0.1 }} />
              <Bar dataKey="efficiency" fill="#16a34a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card card-pad">
          <div className="section-title">Vehicle ROI (%)</div>
          <div className="section-sub" style={{ marginBottom: 12 }}>(Revenue − (Maintenance + Fuel)) / Acquisition Cost</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={analytics}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="reg" fontSize={12} /><YAxis fontSize={12} />
              <Tooltip cursor={{ opacity: 0.1 }} />
              <Bar dataKey="roi" radius={[6, 6, 0, 0]}>
                {analytics.map((a) => <Cell key={a.reg} fill={a.roi >= 0 ? '#4f46e5' : '#dc2626'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div className="section-title">Operational Cost vs Revenue</div>
        <div className="section-sub" style={{ marginBottom: 12 }}>Per vehicle comparison</div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analytics}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="reg" fontSize={12} /><YAxis fontSize={12} />
            <Tooltip /><Legend />
            <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} name="Revenue" />
            <Line type="monotone" dataKey="opCost" stroke="#dc2626" strokeWidth={2} name="Operational Cost" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr><th>Vehicle</th><th>Model</th><th>Distance</th><th>Fuel (L)</th><th>Efficiency (km/L)</th><th>Op. Cost</th><th>Revenue</th><th>ROI</th></tr>
          </thead>
          <tbody>
            {analytics.map((a) => (
              <tr key={a.reg}>
                <td><strong>{a.reg}</strong></td><td>{a.name}</td>
                <td>{a.distance.toLocaleString()} km</td><td>{a.liters}</td>
                <td>{a.efficiency || '—'}</td><td>{inr(a.opCost)}</td>
                <td>{inr(a.revenue)}</td>
                <td><span className={`badge ${a.roi >= 0 ? 'b-green' : 'b-red'}`}>{a.roi}%</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!analytics.length && <Empty Icon={FiTrendingUp} text="No data to report" />}
      </div>
    </>
  )
}

