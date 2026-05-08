import { Routes, Route, Navigate } from 'react-router-dom'
import Login         from '../pages/Login'
import Dashboard     from '../pages/Dashboard'
import Shop          from '../pages/Shop'
import RequestItems  from '../pages/RequestItems'
import Budget        from '../pages/Budget'
import Reports       from '../pages/Reports'
import AccessControl from '../pages/AccessControl'
import Settings      from '../pages/Settings'
import ProtectedRoute from './ProtectedRoute'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login"     element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/shop"      element={<ProtectedRoute><Shop /></ProtectedRoute>} />
      <Route path="/requests"  element={<ProtectedRoute><RequestItems /></ProtectedRoute>} />
      <Route path="/budget"    element={<ProtectedRoute><Budget /></ProtectedRoute>} />
      <Route path="/reports"   element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/access"    element={<ProtectedRoute><AccessControl /></ProtectedRoute>} />
      <Route path="/settings"  element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="*"          element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
