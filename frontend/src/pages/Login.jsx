import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext.jsx'
import { USERS, ROLES } from '../store/seed.js'
import { Field } from '../components/ui.jsx'

export default function Login() {
  const { login } = useApp()
  const nav = useNavigate()
  const [email, setEmail] = useState('manager@transitops.io')
  const [password, setPassword] = useState('demo123')
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const res = login(email.trim(), password)
    if (!res.ok) return setError(res.error)
    nav('/')
  }

  const quick = (u) => { setEmail(u.email); setPassword(u.password); setError('') }

  return (
    <div className="login-wrap">
      <div className="login-brand">
        <div className="brand" style={{ padding: 0, fontSize: 24 }}>
          <img src="/logo.svg" alt="" style={{ width: 40, height: 40 }} /> TransitOps
        </div>
        <h1>Smart Transport Operations</h1>
        <p>Fleet, drivers and dispatch — in one place.</p>
      </div>

      <div className="login-form-side">
        <div className="login-card">
          <h2>Welcome back</h2>
          <div className="muted">Sign in to your TransitOps account</div>
          <form onSubmit={submit}>
            {error && <div className="form-alert">{error}</div>}
            <Field label="Email" required>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
            </Field>
            <Field label="Password" required>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
            </Field>
            <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }} type="submit">Sign In</button>
          </form>

          <div className="demo-users">
            <div className="section-sub" style={{ marginBottom: 8 }}>Demo accounts (click to fill)</div>
            {USERS.map((u) => (
              <div key={u.id} className="du" onClick={() => quick(u)}>
                <span><strong>{ROLES[u.role]}</strong> — {u.email}</span>
                <span className="badge b-purple">demo123</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

