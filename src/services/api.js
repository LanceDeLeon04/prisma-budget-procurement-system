// Mock API layer — no backend yet

export const authAPI = {
  login: async (username, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (username === 'admin' && password === 'admin') {
          resolve({
            id: 1,
            username: 'admin',
            name: 'System Administrator',
            role: 'admin',
            avatar: null,
            department: 'IT & Operations',
            token: 'mock-jwt-token-prisma-2025',
          })
        } else {
          reject(new Error('Invalid username or password'))
        }
      }, 1500)
    })
  },
}

export const budgetAPI = {
  getSummary: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          totalBudget: 5000000,
          totalSpent: 2340000,
          totalRemaining: 2660000,
          pendingRequests: 14,
          approvedThisMonth: 8,
          departments: 6,
        })
      }, 500)
    })
  },
}

export const procurementAPI = {
  getRecentActivity: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: 1, item: 'Office Supplies Bundle', department: 'Admin', amount: 12500, status: 'approved', date: '2025-05-01', requestedBy: 'Maria Santos' },
          { id: 2, item: 'Laptop Units (x5)', department: 'IT', amount: 175000, status: 'pending', date: '2025-04-30', requestedBy: 'Juan Cruz' },
          { id: 3, item: 'Printer Ink Cartridges', department: 'Finance', amount: 4800, status: 'approved', date: '2025-04-29', requestedBy: 'Ana Reyes' },
          { id: 4, item: 'Conference Room Chairs', department: 'Facilities', amount: 38000, status: 'for_review', date: '2025-04-28', requestedBy: 'Carlos Mendoza' },
          { id: 5, item: 'Software License Renewal', department: 'IT', amount: 95000, status: 'approved', date: '2025-04-27', requestedBy: 'Juan Cruz' },
          { id: 6, item: 'Medical Supplies Kit', department: 'HR', amount: 7200, status: 'pending', date: '2025-04-26', requestedBy: 'Lisa Bautista' },
        ])
      }, 700)
    })
  },

  getMonthlySpending: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { month: 'Nov', spent: 380000, budget: 500000 },
          { month: 'Dec', spent: 420000, budget: 500000 },
          { month: 'Jan', spent: 290000, budget: 450000 },
          { month: 'Feb', spent: 510000, budget: 500000 },
          { month: 'Mar', spent: 340000, budget: 450000 },
          { month: 'Apr', spent: 400000, budget: 500000 },
        ])
      }, 600)
    })
  },

  getDepartmentBreakdown: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { department: 'IT', spent: 890000, color: '#06b6d4' },
          { department: 'Admin', spent: 450000, color: '#3b82f6' },
          { department: 'Finance', spent: 320000, color: '#8b5cf6' },
          { department: 'HR', spent: 280000, color: '#10b981' },
          { department: 'Facilities', spent: 250000, color: '#f59e0b' },
          { department: 'Operations', spent: 150000, color: '#ef4444' },
        ])
      }, 600)
    })
  },
}

export const notificationsAPI = {
  getAll: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: 1, type: 'approval', message: 'Laptop Units request is pending your approval', time: '2 min ago', read: false },
          { id: 2, type: 'alert', message: 'IT Department budget at 78% utilization', time: '1 hr ago', read: false },
          { id: 3, type: 'info', message: 'Monthly procurement report is ready', time: '3 hrs ago', read: true },
          { id: 4, type: 'success', message: 'Software License Renewal has been processed', time: 'Yesterday', read: true },
          { id: 5, type: 'alert', message: 'Q2 budget review meeting scheduled for May 10', time: '2 days ago', read: true },
        ])
      }, 400)
    })
  },
}