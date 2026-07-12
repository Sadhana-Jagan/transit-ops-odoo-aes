import { useEffect } from 'react'
import { FiX } from './icons.jsx'

// Currency formatter — Indian Rupee
export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')


export function Badge({ status }) {
  const map = {
    Available: 'b-green', 'On Trip': 'b-blue', 'In Shop': 'b-amber', Retired: 'b-gray',
    'Off Duty': 'b-gray', Suspended: 'b-red',
    Draft: 'b-gray', Dispatched: 'b-blue', Completed: 'b-green', Cancelled: 'b-red',
    Open: 'b-amber', Closed: 'b-green',
  }
  return <span className={`badge ${map[status] || 'b-gray'}`}><span className="dot" />{status}</span>
}

export function Modal({ title, onClose, children, footer, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className={`modal ${wide ? 'lg' : ''}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}><FiX /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

export function Field({ label, required, error, children }) {
  return (
    <div className="field">
      <label>{label} {required && <span className="tag-req">*</span>}</label>
      {children}
      {error && <div className="err">{error}</div>}
    </div>
  )
}

export function Empty({ Icon, text = 'No records found' }) {
  return <div className="empty"><div className="big">{Icon ? <Icon /> : null}</div>{text}</div>
}

export function PageHeader({ title, sub, actions }) {
  return (
    <div className="toolbar">
      <div className="grow">
        <div className="section-title" style={{ fontSize: 20 }}>{title}</div>
        {sub && <div className="section-sub">{sub}</div>}
      </div>
      {actions}
    </div>
  )
}

// CSV export helper
export function exportCSV(filename, rows) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

