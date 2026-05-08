import { useSelector } from 'react-redux'

export function useRole() {
  const user = useSelector(s => s.auth.user)
  const role = user?.role || null
  return {
    user,
    role,
    isAdmin:   role === 'admin',
    isITStaff: role === 'it_staff',
    isStaff:   role === 'regular_staff',
    can: (action) => PERMISSIONS[role]?.includes(action) ?? false,
  }
}

export const PERMISSIONS = {
  admin: [
    'view_dashboard','view_shop','view_requests','view_budget',
    'view_reports','view_access','view_settings',
    'approve_requests','deny_requests','manage_users',
    'manage_catalog','manage_suppliers','set_budget','add_line_items',
    'view_all_reports','receive_budget_alerts',
  ],
  it_staff: [
    'view_dashboard','view_shop','view_requests','view_budget',
    'view_reports_own',
    'approve_requests','deny_requests','change_order_items',
    'receive_budget_alerts',
  ],
  regular_staff: [
    'view_dashboard_staff','view_shop_browse','view_requests_own',
    'submit_requests','view_budget_own',
    'view_reports_dept',
  ],
}
