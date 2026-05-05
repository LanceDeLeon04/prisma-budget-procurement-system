import { Routes, Route, Navigate } from 'react-router-dom'
import Login          from '../pages/Login'
import Dashboard      from '../pages/Dashboard'
import BudgetLedger   from '../pages/BudgetLedger'
import Shop           from '../pages/Shop'
import RequestItems   from '../pages/RequestItems'
import AccessControl  from '../pages/AccessControl'
import Reports        from '../pages/Reports'
import Settings       from '../pages/Settings'
import ProtectedRoute from './ProtectedRoute'

const wrap = (C) => <ProtectedRoute><C /></ProtectedRoute>

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login"     element={<Login />} />
      <Route path="/dashboard" element={wrap(Dashboard)} />
      <Route path="/budget"    element={wrap(BudgetLedger)} />
      <Route path="/shop"      element={wrap(Shop)} />
      <Route path="/requests"  element={wrap(RequestItems)} />
      <Route path="/access"    element={wrap(AccessControl)} />
      <Route path="/reports"   element={wrap(Reports)} />
      <Route path="/settings"  element={wrap(Settings)} />
      <Route path="*"          element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
