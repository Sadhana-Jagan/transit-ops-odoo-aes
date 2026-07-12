import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store/AppContext.jsx'
import { USERS, ROLES } from '../store/seed.js'
import { Field } from '../components/ui.jsx'

const SIGNUP_ROLES = ['fleet_manager', 'dispatcher', 'driver', 'safety_officer', 'financial_analyst']

export default function Login() {
  const { login, signup } = useApp()
  const nav = useNavigate()
  const [mode, setMode] = useState('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('manager@transitops.io')
  const [password, setPassword] = useState('demo123')
  const [role, setRole] = useState('fleet_manager')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    const res = mode === 'signin'
      ? await login(email.trim(), password)
      : await signup({ name: name.trim(), email: email.trim(), password, role })
    setBusy(false)
    if (!res.ok) return setError(res.error)
    nav('/')
  }

  const switchMode = (m) => {
    setMode(m)
    setError('')
    if (m === 'signup') { setEmail(''); setPassword(''); setName('') }
    else { setEmail('manager@transitops.io'); setPassword('demo123') }
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
          <h2>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h2>
          <div className="muted">
            {mode === 'signin' ? 'Sign in to your TransitOps account' : 'Sign up and choose your role'}
          </div>

          <div className="toolbar" style={{ margin: '16px 0' }}>
            <button type="button" className={`btn ${mode === 'signin' ? 'primary' : ''}`} onClick={() => switchMode('signin')}>Sign In</button>
            <button type="button" className={`btn ${mode === 'signup' ? 'primary' : ''}`} onClick={() => switchMode('signup')}>Sign Up</button>
          </div>

          <form onSubmit={submit}>
            {error && <div className="form-alert">{error}</div>}

            {mode === 'signup' && (
              <Field label="Full Name" required>
                <input className="input" value={name} required onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
              </Field>
            )}

            <Field label="Email" required>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
            </Field>
            <Field label="Password" required>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
            </Field>

            {mode === 'signup' && (
              <Field label="Role" required>
                <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
                  {SIGNUP_ROLES.map((r) => <option key={r} value={r}>{ROLES[r]}</option>)}
                </select>
              </Field>
            )}

            <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }} type="submit" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {mode === 'signin' && (
            <div className="demo-users">
              <div className="section-sub" style={{ marginBottom: 8 }}>Demo accounts (click to fill)</div>
              {USERS.map((u) => (
                <div key={u.id} className="du" onClick={() => quick(u)}>
                  <span><strong>{ROLES[u.role]}</strong> — {u.email}</span>
                  <span className="badge b-purple">demo123</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
