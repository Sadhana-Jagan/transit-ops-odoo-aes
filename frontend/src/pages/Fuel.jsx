import { useMemo, useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { Modal, Field, Empty, PageHeader, exportCSV, inr } from '../components/ui.jsx'
import { FiDroplet, FiFileText, FiPlus, FiDownload, FiTrash2 } from '../components/icons.jsx'

export default function Fuel() {
  const { fuel, expenses, vehicles, trips, maintenance, saveFuel, deleteFuel, saveExpense, deleteExpense } = useApp()
  const [tab, setTab] = useState('fuel')
  const [modal, setModal] = useState(null)
  const [fForm, setFForm] = useState({ vehicleId: '', liters: '', cost: '', date: '' })
  const [eForm, setEForm] = useState({ tripId: '', vehicleId: '', toll: '', other: '', date: '' })

  const vName = (id) => vehicles.find((v) => v.id === id)?.reg || '—'
  const expTotal = (x) => (Number(x.toll) || 0) + (Number(x.other) || 0)

  // Operational cost per vehicle = fuel + maintenance + expenses
  const perVehicle = useMemo(() => vehicles.map((v) => {
    const f = fuel.filter((x) => x.vehicleId === v.id).reduce((s, x) => s + x.cost, 0)
    const m = maintenance.filter((x) => x.vehicleId === v.id).reduce((s, x) => s + x.cost, 0)
    const e = expenses.filter((x) => x.vehicleId === v.id).reduce((s, x) => s + expTotal(x), 0)
    return { reg: v.reg, name: v.name, fuel: f, maintenance: m, expenses: e, total: f + m + e }
  }), [vehicles, fuel, maintenance, expenses])

  const totalFuel = fuel.reduce((s, x) => s + x.cost, 0)
  const totalExp = expenses.reduce((s, x) => s + expTotal(x), 0)
  const totalMaint = maintenance.reduce((s, x) => s + x.cost, 0)

  const submitFuel = async (e) => { e.preventDefault(); await saveFuel({ ...fForm, liters: Number(fForm.liters), cost: Number(fForm.cost) }); setModal(null); setFForm({ vehicleId: '', liters: '', cost: '', date: '' }) }
  const submitExp = async (e) => {
    e.preventDefault()
    await saveExpense({ ...eForm, toll: Number(eForm.toll) || 0, other: Number(eForm.other) || 0 })
    setModal(null); setEForm({ tripId: '', vehicleId: '', toll: '', other: '', date: '' })
  }

  return (
    <>
      <PageHeader title="Fuel & Expenses" sub="Track fuel logs, tolls and other operational expenses" />

      <div className="grid kpi-grid" style={{ marginBottom: 20 }}>
        <div className="card kpi"><span className="label">Total Fuel Cost</span><span className="value">{inr(totalFuel)}</span></div>
        <div className="card kpi"><span className="label">Total Maintenance</span><span className="value">{inr(totalMaint)}</span></div>
        <div className="card kpi"><span className="label">Other Expenses</span><span className="value">{inr(totalExp)}</span></div>
        <div className="card kpi"><span className="label">Total Operational Cost</span><span className="value" style={{ color: 'var(--primary)' }}>{inr(totalFuel + totalMaint + totalExp)}</span></div>
      </div>

      <div className="toolbar">
        <button className={`btn ${tab === 'fuel' ? 'primary' : ''}`} onClick={() => setTab('fuel')}><FiDroplet /> Fuel Logs</button>
        <button className={`btn ${tab === 'exp' ? 'primary' : ''}`} onClick={() => setTab('exp')}><FiFileText /> Expenses</button>
        <button className={`btn ${tab === 'cost' ? 'primary' : ''}`} onClick={() => setTab('cost')}>Cost per Vehicle</button>
        <div className="grow" />
        {tab === 'fuel' && <button className="btn primary" onClick={() => setModal('fuel')}><FiPlus /> Add Fuel Log</button>}
        {tab === 'exp' && <button className="btn primary" onClick={() => setModal('exp')}><FiPlus /> Add Expense</button>}
        {tab === 'cost' && <button className="btn" onClick={() => exportCSV('operational-cost.csv', perVehicle)}><FiDownload /> CSV</button>}
      </div>

      {tab === 'fuel' && (
        <div className="card table-wrap">
          <table>
            <thead><tr><th>Vehicle</th><th>Liters</th><th>Cost</th><th>₹/L</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {fuel.map((f) => (
                <tr key={f.id}>
                  <td><strong>{vName(f.vehicleId)}</strong></td><td>{f.liters} L</td><td>{inr(f.cost)}</td>
                  <td>{inr((f.cost / f.liters).toFixed(2))}</td><td>{f.date}</td>
                  <td><button className="btn sm danger" onClick={() => deleteFuel(f.id)}><FiTrash2 /> Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!fuel.length && <Empty Icon={FiDroplet} text="No fuel logs yet" />}
        </div>
      )}

      {tab === 'exp' && (
        <div className="card table-wrap">
          <table>
            <thead><tr><th>Trip</th><th>Vehicle</th><th>Toll Fee</th><th>Other Fee</th><th>Total</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {expenses.map((x) => (
                <tr key={x.id}>
                  <td>{trips.find((t) => t.id === x.tripId) ? `${trips.find((t) => t.id === x.tripId).source} → ${trips.find((t) => t.id === x.tripId).dest}` : '—'}</td>
                  <td><strong>{vName(x.vehicleId)}</strong></td>
                  <td>{inr(x.toll)}</td><td>{inr(x.other)}</td>
                  <td style={{ fontWeight: 700 }}>{inr(expTotal(x))}</td>
                  <td>{x.date}</td>
                  <td><button className="btn sm danger" onClick={() => deleteExpense(x.id)}><FiTrash2 /> Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!expenses.length && <Empty Icon={FiFileText} text="No expenses yet" />}
        </div>
      )}

      {tab === 'cost' && (
        <div className="card table-wrap">
          <table>
            <thead><tr><th>Vehicle</th><th>Model</th><th>Fuel</th><th>Maintenance</th><th>Expenses</th><th>Total Op. Cost</th></tr></thead>
            <tbody>
              {perVehicle.map((r) => (
                <tr key={r.reg}>
                  <td><strong>{r.reg}</strong></td><td>{r.name}</td>
                  <td>{inr(r.fuel)}</td><td>{inr(r.maintenance)}</td>
                  <td>{inr(r.expenses)}</td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{inr(r.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal === 'fuel' && (
        <Modal title="Add Fuel Log" onClose={() => setModal(null)}
          footer={<><button className="btn" onClick={() => setModal(null)}>Cancel</button><button className="btn primary" onClick={submitFuel}>Save</button></>}>
          <form onSubmit={submitFuel}>
            <Field label="Vehicle" required>
              <select className="select" required value={fForm.vehicleId} onChange={(e) => setFForm({ ...fForm, vehicleId: e.target.value })}>
                <option value="">Select…</option>{vehicles.map((v) => <option key={v.id} value={v.id}>{v.reg}</option>)}
              </select>
            </Field>
            <div className="form-grid">
              <Field label="Liters" required><input className="input" type="number" min="0" required value={fForm.liters} onChange={(e) => setFForm({ ...fForm, liters: e.target.value })} /></Field>
              <Field label="Fuel Cost (₹)" required><input className="input" type="number" min="0" required value={fForm.cost} onChange={(e) => setFForm({ ...fForm, cost: e.target.value })} /></Field>
            </div>
            <Field label="Date"><input className="input" type="date" value={fForm.date} onChange={(e) => setFForm({ ...fForm, date: e.target.value })} /></Field>
          </form>
        </Modal>
      )}

      {modal === 'exp' && (
        <Modal title="Add Expense" onClose={() => setModal(null)}
          footer={<><button className="btn" onClick={() => setModal(null)}>Cancel</button><button className="btn primary" onClick={submitExp}>Save</button></>}>
          <form onSubmit={submitExp}>
            <Field label="Trip">
              <select className="select" value={eForm.tripId} onChange={(e) => {
                const t = trips.find((x) => x.id === e.target.value)
                setEForm({ ...eForm, tripId: e.target.value, vehicleId: t ? t.vehicleId : eForm.vehicleId })
              }}>
                <option value="">Select trip…</option>
                {trips.map((t) => <option key={t.id} value={t.id}>{t.source} → {t.dest}</option>)}
              </select>
            </Field>
            <Field label="Vehicle" required>
              <select className="select" required value={eForm.vehicleId} onChange={(e) => setEForm({ ...eForm, vehicleId: e.target.value })}>
                <option value="">Select…</option>{vehicles.map((v) => <option key={v.id} value={v.id}>{v.reg}</option>)}
              </select>
            </Field>
            <div className="form-grid">
              <Field label="Toll Fee (₹)"><input className="input" type="number" min="0" value={eForm.toll} onChange={(e) => setEForm({ ...eForm, toll: e.target.value })} /></Field>
              <Field label="Other Fee (₹)"><input className="input" type="number" min="0" value={eForm.other} onChange={(e) => setEForm({ ...eForm, other: e.target.value })} /></Field>
            </div>
            <Field label={`Total Cost: ${inr((Number(eForm.toll) || 0) + (Number(eForm.other) || 0))}`}>
              <input className="input" type="date" value={eForm.date} onChange={(e) => setEForm({ ...eForm, date: e.target.value })} />
            </Field>
          </form>
        </Modal>
      )}
    </>
  )
}

