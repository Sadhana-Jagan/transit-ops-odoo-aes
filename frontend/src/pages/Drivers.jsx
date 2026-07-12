import { useMemo, useState } from 'react'
import { useApp, isLicenseExpired } from '../store/AppContext.jsx'
import { Badge, Modal, Field, Empty, PageHeader, exportCSV } from '../components/ui.jsx'
import { FiUsers, FiSearch, FiPlus, FiDownload, FiEdit2, FiTrash2 } from '../components/icons.jsx'

const EMPTY = { name: '', license: '', category: 'B', expiry: '', contact: '', tripsCompleted: 0, safety: 80, status: 'Available' }
const CATS = ['A', 'B', 'C', 'D', 'E']
const STATUSES = ['Available', 'On Trip', 'Suspended']

export default function Drivers() {
  const { drivers, saveDriver, deleteDriver, user } = useApp()
  const canEdit = ['fleet_manager', 'safety_officer'].includes(user.role)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)

  const rows = useMemo(() => drivers.filter((d) =>
    (!q || `${d.name} ${d.license}`.toLowerCase().includes(q.toLowerCase())) &&
    (!status || d.status === status)
  ), [drivers, q, status])

  const openNew = () => { setForm(EMPTY); setModal('new') }
  const openEdit = (d) => { setForm(d); setModal('edit') }
  const submit = (e) => {
    e.preventDefault()
    saveDriver({ ...form, safety: Number(form.safety), tripsCompleted: Number(form.tripsCompleted) || 0 })
    setModal(null)
  }

  return (
    <>
      <PageHeader title="Driver Management" sub={`${drivers.length} drivers registered`}
        actions={<>
          <button className="btn" onClick={() => exportCSV('drivers.csv', drivers)}><FiDownload /> CSV</button>
          {canEdit && <button className="btn primary" onClick={openNew}><FiPlus /> Add Driver</button>}
        </>} />

      <div className="toolbar">
        <div className="search grow">
          <span className="ic"><FiSearch /></span>
          <input className="input" placeholder="Search name or license…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="select" style={{ maxWidth: 180 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>License</th><th>Category</th><th>Expiry</th><th>Contact</th><th>Trips</th><th>Safety</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {rows.map((d) => {
              const expired = isLicenseExpired(d)
              return (
                <tr key={d.id}>
                  <td><strong>{d.name}</strong></td>
                  <td>{d.license}</td>
                  <td><span className="badge b-purple">Cat {d.category}</span></td>
                  <td style={{ color: expired ? 'var(--danger)' : 'inherit', fontWeight: expired ? 600 : 400 }}>
                    {d.expiry}{expired ? ' (expired)' : ''}
                  </td>
                  <td>{d.contact}</td>
                  <td><strong>{d.tripsCompleted ?? 0}</strong></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress" style={{ width: 60 }}><span style={{ width: `${d.safety}%`, background: d.safety > 80 ? 'var(--success)' : d.safety > 60 ? 'var(--warn)' : 'var(--danger)' }} /></div>
                      {d.safety}
                    </div>
                  </td>
                  <td><Badge status={d.status} /></td>
                  <td>
                    <div className="row-actions">
                      {canEdit ? <>
                        <button className="btn sm" onClick={() => openEdit(d)}><FiEdit2 /> Edit</button>
                        <button className="btn sm danger" onClick={() => deleteDriver(d.id)}><FiTrash2 /> Delete</button>
                      </> : <span className="section-sub">—</span>}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!rows.length && <Empty Icon={FiUsers} text="No drivers match your filters" />}
      </div>

      {modal && (
        <Modal title={modal === 'new' ? 'Add Driver' : 'Edit Driver'} onClose={() => setModal(null)} wide
          footer={<>
            <button className="btn" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn primary" onClick={submit}>Save Driver</button>
          </>}>
          <form onSubmit={submit}>
            <div className="form-grid">
              <Field label="Full Name" required>
                <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="License Number" required>
                <input className="input" required value={form.license} onChange={(e) => setForm({ ...form, license: e.target.value })} />
              </Field>
              <Field label="License Category" required>
                <select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
              </Field>
              <Field label="License Expiry" required>
                <input className="input" type="date" required value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} />
              </Field>
              <Field label="Contact Number" required>
                <input className="input" required value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
              </Field>
              <Field label="Trips Completed">
                <input className="input" type="number" min="0" value={form.tripsCompleted} onChange={(e) => setForm({ ...form, tripsCompleted: e.target.value })} />
              </Field>
              <Field label={`Safety Score (${form.safety})`}>
                <input type="range" min="0" max="100" value={form.safety} style={{ width: '100%' }} onChange={(e) => setForm({ ...form, safety: e.target.value })} />
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

