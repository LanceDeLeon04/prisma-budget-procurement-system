import { useState, useEffect } from 'react'

/**
 * useRole – reads the authenticated user from sessionStorage (set on login)
 * Exposes: user, role, isAdmin, isITStaff, isStaff, setUser
 */
export function useRole() {
  const [user, setUserState] = useState(() => {
    try {
      const raw = sessionStorage.getItem('prisma_user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  const setUser = (u) => {
    if (u) {
      sessionStorage.setItem('prisma_user', JSON.stringify(u))
    } else {
      sessionStorage.removeItem('prisma_user')
    }
    setUserState(u)
  }

  const role      = user?.role ?? 'regular_staff'
  const isAdmin   = role === 'admin'
  const isITStaff = role === 'it_staff'
  const isStaff   = role === 'regular_staff'

  return { user, role, isAdmin, isITStaff, isStaff, setUser }
}
