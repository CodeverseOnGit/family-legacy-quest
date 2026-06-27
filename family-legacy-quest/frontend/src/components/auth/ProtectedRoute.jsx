import { Navigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import LoadingScreen from '../shared/LoadingScreen'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default ProtectedRoute
