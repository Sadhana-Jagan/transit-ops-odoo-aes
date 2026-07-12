import { useMemo, useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { Badge, Modal, Field, Empty, PageHeader, exportCSV, inr } from '../components/ui.jsx'
import { FiTool, FiPlus, FiDownload, FiCheckCircle, FiTrash2 } from '../components/icons.jsx'

const EMPTY = { vehicleId: '', type: 'Oil Change', cost: '', date: '', notes: '' }
const TYPES = ['Oil Change', 'Tire Replacement', 'Brake Service', 'Engine Overhaul', 'Inspection', 'Other']

export default function Maintenance() {
  const { maintenance, vehicles, saveMaintenance, closeMaintenance, deleteMaintenance } = useApp()
  const [status, setStatus] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [err, setErr] = useState('')

  const vName = (id) => vehicles.find((v) => v.id === id)
  const rows = useMemo(() => maintenance.filter((m) => !status || m.status === status), [maintenance, status])
  // eligible vehicles: not On Trip, not Retired
  const eligible = vehicles.filter((v) => !['On Trip', 'Retired'].includes(v.status))

  const openNew = () => { setForm(EMPTY); setErr(''); setModal(true) }
  const submit = (e) => {
    e.preventDefault()
    const res = saveMaintenance({ ...form, cost: Number(form.cost) })
    if (!res.ok) return setErr(res.error)
    setModal(false)
  }

  return (
    <>
      <PageHeader title="Maintenance" sub="Opening a record sets the vehicle to In Shop; it auto-completes 15 minutes later and the vehicle returns to Available"
        actions={<>
          <button className="btn" onClick={() => exportCSV('maintenance.csv', maintenance.map((m) => ({ ...m, vehicle: vName(m.vehicleId)?.reg })))}><FiDownload /> CSV</button>
          <button className="btn primary" onClick={openNew}><FiPlus /> New Maintenance</button>
        </>} />

      <div className="toolbar">
        <select className="select" style={{ maxWidth: 180 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option><option>Open</option><option>Closed</option>
        </select>
      </div>

      <div className="card table-wrap">
        <table>
          <thead><tr><th>Vehicle</th><th>Type</th><th>Cost</th><th>Date</th><th>Notes</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id}>
                <td><strong>{vName(m.vehicleId)?.reg || '—'}</strong></td>
                <td>{m.type}</td>
                <td>{inr(m.cost)}</td>
                <td>{m.date}</td>
                <td style={{ color: 'var(--text-muted)' }}>{m.notes}</td>
                <td><Badge status={m.status} /></td>
                <td>
                  <div className="row-actions">
                    {m.status === 'Open' && <button className="btn sm primary" onClick={() => closeMaintenance(m.id)}><FiCheckCircle /> Close</button>}
                    <button className="btn sm danger" onClick={() => deleteMaintenance(m.id)}><FiTrash2 /> Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <Empty Icon={FiTool} text="No maintenance records" />}
      </div>

      {modal && (
        <Modal title="New Maintenance Record" onClose={() => setModal(false)}
          footer={<>
            <button className="btn" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn primary" onClick={submit}>Open Maintenance</button>
          </>}>
          <form onSubmit={submit}>
            {err && <div className="form-alert">{err}</div>}
            <Field label="Vehicle" required>
              <select className="select" required value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
                <option value="">Select vehicle…</option>
                {eligible.map((v) => <option key={v.id} value={v.id}>{v.reg} — {v.name} ({v.status})</option>)}
              </select>
            </Field>
            <Field label="Maintenance Type" required>
              <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
            </Field>
            <div className="form-grid">
              <Field label="Cost (₹)" required>
                <input className="input" type="number" min="0" required value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
              </Field>
              <Field label="Date">
                <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </Field>
            </div>
            <Field label="Notes">
              <textarea className="input" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
          </form>
        </Modal>
      )}
    </>
  )
}

