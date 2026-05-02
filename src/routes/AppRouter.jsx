import { Routes, Route, Navigate } from 'react-router-dom'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import ProtectedRoute from './ProtectedRoute'

import {
  Lock,
  ArrowLeft
} from 'lucide-react'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* LOCKED MODULES */}
      <Route path="/budget" element={<ProtectedRoute><LockedPage name="Budget Ledger" /></ProtectedRoute>} />
      <Route path="/shop" element={<ProtectedRoute><LockedPage name="Shop / Procurement" /></ProtectedRoute>} />
      <Route path="/requests" element={<ProtectedRoute><LockedPage name="Request Items" /></ProtectedRoute>} />
      <Route path="/access" element={<ProtectedRoute><LockedPage name="Access Control" /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><LockedPage name="Reports" /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><LockedPage name="Settings" /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

function LockedPage({ name }) {
  return (
    <div className="locked-root">
      <div className="locked-card">

        <div className="locked-icon">
          <Lock size={34} />
        </div>

        <h2 className="locked-title">{name}</h2>

        <p className="locked-text">
          This module is currently under development and locked by the system administrator.
        </p>

        <a href="/dashboard" className="locked-back">
          <ArrowLeft size={16} />
          Back to Dashboard
        </a>

      </div>
    </div>
  )
}