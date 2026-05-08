import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
export default function ProtectedRoute({ children }) {
  const ok = useSelector(s => s.auth.isAuthenticated)
  return ok ? children : <Navigate to="/login" replace />
}
