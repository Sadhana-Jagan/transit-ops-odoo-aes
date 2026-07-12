import { useMemo, useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { Badge, Modal, Field, Empty, PageHeader, exportCSV, inr } from '../components/ui.jsx'
import { FiTruck, FiSearch, FiPlus, FiDownload, FiEdit2, FiTrash2 } from '../components/icons.jsx'

const EMPTY = { reg: '', name: '', type: 'Van', capacity: '', odometer: '', cost: '', revenue: 0, region: 'North', status: 'Available' }
const TYPES = ['Van', 'Truck', 'Bus', 'Pickup', 'Car']
const STATUSES = ['Available', 'On Trip', 'In Shop', 'Retired']

export default function Vehicles() {
  const { vehicles, saveVehicle, deleteVehicle, user } = useApp()
  const readOnly = user.role !== 'fleet_manager'
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [sort, setSort] = useState({ key: 'reg', dir: 1 })
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [err, setErr] = useState('')

  const rows = useMemo(() => {
    let r = vehicles.filter((v) =>
      (!q || `${v.reg} ${v.name} ${v.type}`.toLowerCase().includes(q.toLowerCase())) &&
      (!status || v.status === status) && (!type || v.type === type))
    r = [...r].sort((a, b) => {
      const x = a[sort.key], y = b[sort.key]
      return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y))) * sort.dir
    })
    return r
  }, [vehicles, q, status, type, sort])

  const th = (key, label) => (
    <th onClick={() => setSort((s) => ({ key, dir: s.key === key ? -s.dir : 1 }))}>
      {label}{sort.key === key ? (sort.dir === 1 ? ' ▲' : ' ▼') : ''}
    </th>
  )

  const openNew = () => { setForm(EMPTY); setErr(''); setModal('new') }
  const openEdit = (v) => { setForm(v); setErr(''); setModal('edit') }

  const submit = async (e) => {
    e.preventDefault()
    const payload = { ...form, capacity: Number(form.capacity), odometer: Number(form.odometer), cost: Number(form.cost), revenue: Number(form.revenue) || 0 }
    const res = await saveVehicle(payload)
    if (!res.ok) return setErr(res.error)
    setModal(null)
  }

  return (
    <>
      <PageHeader title="Vehicle Registry" sub={`${vehicles.length} vehicles in fleet`}
        actions={<>
          <button className="btn" onClick={() => exportCSV('vehicles.csv', vehicles)}><FiDownload /> CSV</button>
          {!readOnly && <button className="btn primary" onClick={openNew}><FiPlus /> Register Vehicle</button>}
        </>} />

      <div className="toolbar">
        <div className="search grow">
          <span className="ic"><FiSearch /></span>
          <input className="input" placeholder="Search reg, model or type…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="select" style={{ maxWidth: 160 }} value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All Types</option>{TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select className="select" style={{ maxWidth: 160 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              {th('reg', 'Reg No.')}{th('name', 'Model')}{th('type', 'Type')}
              {th('capacity', 'Capacity (kg)')}{th('odometer', 'Odometer')}{th('cost', 'Cost')}
              {th('region', 'Region')}{th('status', 'Status')}<th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.id}>
                <td><strong>{v.reg}</strong></td><td>{v.name}</td><td>{v.type}</td>
                <td>{v.capacity.toLocaleString()}</td><td>{v.odometer.toLocaleString()}</td>
                <td>{inr(v.cost)}</td><td>{v.region}</td>
                <td><Badge status={v.status} /></td>
                <td>
                  <div className="row-actions">
                    {!readOnly ? <>
                      <button className="btn sm" onClick={() => openEdit(v)}><FiEdit2 /> Edit</button>
                      <button className="btn sm danger" onClick={() => deleteVehicle(v.id)}><FiTrash2 /> Delete</button>
                    </> : <span className="section-sub">—</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <Empty Icon={FiTruck} text="No vehicles match your filters" />}
      </div>

      {modal && (
        <Modal title={modal === 'new' ? 'Register Vehicle' : 'Edit Vehicle'} onClose={() => setModal(null)} wide
          footer={<>
            <button className="btn" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn primary" onClick={submit}>Save Vehicle</button>
          </>}>
          <form onSubmit={submit}>
            {err && <div className="form-alert">{err}</div>}
            <div className="form-grid">
              <Field label="Registration Number" required>
                <input className="input" value={form.reg} required onChange={(e) => setForm({ ...form, reg: e.target.value })} placeholder="VAN-09" />
              </Field>
              <Field label="Model / Name" required>
                <input className="input" value={form.name} required onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ford Transit" />
              </Field>
              <Field label="Type" required>
                <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
              </Field>
              <Field label="Max Load Capacity (kg)" required>
                <input className="input" type="number" min="0" required value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
              </Field>
              <Field label="Odometer (km)" required>
                <input className="input" type="number" min="0" required value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} />
              </Field>
              <Field label="Average Cost (₹)" required>
                <input className="input" type="number" min="0" required value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
              </Field>
              <Field label="Revenue Generated (₹)">
                <input className="input" type="number" min="0" value={form.revenue} onChange={(e) => setForm({ ...form, revenue: e.target.value })} />
              </Field>
              <Field label="Status">
                <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
              </Field>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

