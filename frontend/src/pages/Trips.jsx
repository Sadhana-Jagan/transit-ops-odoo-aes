import { useMemo, useState } from 'react'
import { useApp, isLicenseExpired } from '../store/AppContext.jsx'
import { Badge, Modal, Field, Empty, PageHeader, exportCSV } from '../components/ui.jsx'
import { FiMap, FiPlus, FiDownload, FiSend, FiCheckCircle, FiSlash } from '../components/icons.jsx'

const EMPTY = { source: '', dest: '', vehicleId: '', driverId: '', cargo: '', distance: '' }

export default function Trips() {
  const { trips, vehicles, drivers, saveTrip, dispatchTrip, completeTrip, cancelTrip, user } = useApp()
  const canManage = ['fleet_manager', 'dispatcher', 'driver'].includes(user.role)
  const [status, setStatus] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [err, setErr] = useState('')
  const [complete, setComplete] = useState(null)
  const [odo, setOdo] = useState('')
  const [fuel, setFuel] = useState('')
  const [revenue, setRevenue] = useState('')

  const vName = (id) => vehicles.find((v) => v.id === id)
  const dName = (id) => drivers.find((d) => d.id === id)

  // Business rules: dispatch pool
  const availableVehicles = vehicles.filter((v) => v.status === 'Available')
  const availableDrivers = drivers.filter((d) => d.status === 'Available' && !isLicenseExpired(d))

  const rows = useMemo(() => trips.filter((t) => !status || t.status === status), [trips, status])

  const openNew = () => { setForm(EMPTY); setErr(''); setModal(true) }
  const submit = async (e) => {
    e.preventDefault()
    const res = await saveTrip({ ...form, cargo: Number(form.cargo), distance: Number(form.distance) })
    if (!res.ok) return setErr(res.error)
    setModal(null)
  }
  const doDispatch = async (id) => { const r = await dispatchTrip(id); if (!r.ok) alert(r.error) }
  const openComplete = (t) => { setComplete(t); setOdo(vName(t.vehicleId)?.odometer + t.distance || ''); setFuel(''); setRevenue('') }
  const doComplete = async () => { await completeTrip(complete.id, odo, fuel, revenue); setComplete(null) }

  const selectedVehicle = vName(form.vehicleId)

  return (
    <>
      <PageHeader title="Trip Management" sub={`${trips.length} trips · lifecycle Draft → Dispatched → Completed`}
        actions={<>
          <button className="btn" onClick={() => exportCSV('trips.csv', trips.map((t) => ({ ...t, vehicle: vName(t.vehicleId)?.reg, driver: dName(t.driverId)?.name })))}><FiDownload /> CSV</button>
          {canManage && <button className="btn primary" onClick={openNew}><FiPlus /> Create Trip</button>}
        </>} />

      <div className="toolbar">
        <select className="select" style={{ maxWidth: 200 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Trips</option>
          {['Draft', 'Dispatched', 'Completed', 'Cancelled'].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr><th>Route</th><th>Vehicle</th><th>Driver</th><th>Cargo</th><th>Distance</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td><strong>{t.source}</strong> → {t.dest}</td>
                <td>{vName(t.vehicleId)?.reg || '—'}</td>
                <td>{dName(t.driverId)?.name || '—'}</td>
                <td>{t.cargo?.toLocaleString()} kg</td>
                <td>{t.distance} km</td>
                <td><Badge status={t.status} /></td>
                <td>
                  <div className="row-actions">
                    {canManage && t.status === 'Draft' && <>
                      <button className="btn sm primary" onClick={() => doDispatch(t.id)}><FiSend /> Dispatch</button>
                      <button className="btn sm danger" onClick={() => cancelTrip(t.id)}><FiSlash /> Cancel</button>
                    </>}
                    {canManage && t.status === 'Dispatched' && <>
                      <button className="btn sm primary" onClick={() => openComplete(t)}><FiCheckCircle /> Complete</button>
                      <button className="btn sm danger" onClick={() => cancelTrip(t.id)}><FiSlash /> Cancel</button>
                    </>}
                    {(!canManage || ['Completed', 'Cancelled'].includes(t.status)) && <span className="section-sub">—</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <Empty Icon={FiMap} text="No trips found" />}
      </div>

      {modal && (
        <Modal title="Create Trip" onClose={() => setModal(null)} wide
          footer={<>
            <button className="btn" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn primary" onClick={submit}>Create as Draft</button>
          </>}>
          <form onSubmit={submit}>
            {err && <div className="form-alert">{err}</div>}
            <div className="form-grid">
              <Field label="Source" required>
                <input className="input" required value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
              </Field>
              <Field label="Destination" required>
                <input className="input" required value={form.dest} onChange={(e) => setForm({ ...form, dest: e.target.value })} />
              </Field>
              <Field label="Vehicle (Available only)" required>
                <select className="select" required value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
                  <option value="">Select vehicle…</option>
                  {availableVehicles.map((v) => <option key={v.id} value={v.id}>{v.reg} — {v.name} (max {v.capacity}kg)</option>)}
                </select>
              </Field>
              <Field label="Driver (Available, valid license)" required>
                <select className="select" required value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })}>
                  <option value="">Select driver…</option>
                  {availableDrivers.map((d) => <option key={d.id} value={d.id}>{d.name} — Cat {d.category}</option>)}
                </select>
              </Field>
              <Field label="Cargo Weight (kg)" required
                error={selectedVehicle && Number(form.cargo) > selectedVehicle.capacity ? `Exceeds capacity (${selectedVehicle.capacity}kg)` : ''}>
                <input className="input" type="number" min="0" required value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} />
              </Field>
              <Field label="Planned Distance (km)" required>
                <input className="input" type="number" min="0" required value={form.distance} onChange={(e) => setForm({ ...form, distance: e.target.value })} />
              </Field>
            </div>
            {!availableVehicles.length && <div className="form-alert">No available vehicles — retired/in-shop/on-trip vehicles are excluded from dispatch.</div>}
            {!availableDrivers.length && <div className="form-alert">No available drivers — suspended or expired-license drivers cannot be assigned.</div>}
          </form>
        </Modal>
      )}

      {complete && (
        <Modal title="Complete Trip" onClose={() => setComplete(null)}
          footer={<>
            <button className="btn" onClick={() => setComplete(null)}>Cancel</button>
            <button className="btn primary" onClick={doComplete}>Complete Trip</button>
          </>}>
          <div className="section-sub" style={{ marginBottom: 16 }}>
            {complete.source} → {complete.dest} · {vName(complete.vehicleId)?.reg}
          </div>
          <Field label="Final Odometer (km)" required>
            <input className="input" type="number" value={odo} onChange={(e) => setOdo(e.target.value)} />
          </Field>
          <Field label="Fuel Consumed (liters)">
            <input className="input" type="number" value={fuel} onChange={(e) => setFuel(e.target.value)} placeholder="Adds a fuel log automatically" />
          </Field>
          <Field label="Trip Revenue (₹)">
            <input className="input" type="number" min="0" value={revenue} onChange={(e) => setRevenue(e.target.value)} placeholder="Used for ROI reporting" />
          </Field>
        </Modal>
      )}
    </>
  )
}

