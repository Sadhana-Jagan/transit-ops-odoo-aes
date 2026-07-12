import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useApp } from './store/AppContext.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Vehicles from './pages/Vehicles.jsx'
import Drivers from './pages/Drivers.jsx'
import Trips from './pages/Trips.jsx'
import Maintenance from './pages/Maintenance.jsx'
import Fuel from './pages/Fuel.jsx'
import Reports from './pages/Reports.jsx'

function Guard({ route, children }) {
  const { user, can } = useApp()
  const loc = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: loc }} replace />
  if (route && !can(route)) return <Navigate to="/" replace />
  return <Layout>{children}</Layout>
}

function Toasts() {
  const { toasts } = useApp()
  return (
    <div className="toast-wrap">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`}>{t.msg}</div>
      ))}
    </div>
  )
}

export default function App() {
  const { user } = useApp()
  return (
    <>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/" element={<Guard route="dashboard"><Dashboard /></Guard>} />
        <Route path="/vehicles" element={<Guard route="vehicles"><Vehicles /></Guard>} />
        <Route path="/drivers" element={<Guard route="drivers"><Drivers /></Guard>} />
        <Route path="/trips" element={<Guard route="trips"><Trips /></Guard>} />
        <Route path="/maintenance" element={<Guard route="maintenance"><Maintenance /></Guard>} />
        <Route path="/fuel" element={<Guard route="fuel"><Fuel /></Guard>} />
        <Route path="/reports" element={<Guard route="reports"><Reports /></Guard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toasts />
    </>
  )
}

