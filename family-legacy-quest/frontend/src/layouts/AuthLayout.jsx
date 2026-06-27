import { Outlet, Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import LoadingScreen from '../components/shared/LoadingScreen'
import './AuthLayout.css'

function AuthLayout() {
  const { user, loading } = useAuthStore()

  if (loading) return <LoadingScreen />
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <div className="auth-layout">
      <div className="auth-sidebar">
        <div className="auth-brand">
          <div className="auth-brand-icon">📖</div>
          <h1 className="auth-brand-name">Family Legacy Quest</h1>
          <p className="auth-brand-tagline">Preserve memories. Share stories. Build your family's legacy together.</p>
        </div>
        <div className="auth-features">
          <div className="auth-feature"><span>✨</span> Share cherished family stories</div>
          <div className="auth-feature"><span>🏆</span> Complete fun family challenges</div>
          <div className="auth-feature"><span>📅</span> Build a living family timeline</div>
          <div className="auth-feature"><span>❤️</span> Connect generations through memories</div>
        </div>
        <div className="auth-quote">
          <p>"The stories we tell become the memories we keep — for those who come after us."</p>
        </div>
      </div>
      <div className="auth-content">
        <Outlet />
      </div>
    </div>
  )
}

export default AuthLayout
