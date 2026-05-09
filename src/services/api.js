// ================================================================
// PRISMA – IT Budget & Cost Management Tracker
// ITIL Financial Management Aligned
// Categories: Hardware | Software License | Service
// ================================================================
const delay = ms => new Promise(r => setTimeout(r, ms))

// ── MOCK DATABASE ────────────────────────────────────────────────
const DB = {
  fiscalYear: 'FY 2025',
  currency: 'PHP',

  // Budget Allocations per ITIL category
  budgetAllocations: {
    total: 5000000,
    hardware:         { allocated: 2600000, label: 'Hardware',         color: '#3b82f6', icon: 'hardware' },
    softwareLicense:  { allocated: 1400000, label: 'Software License', color: '#8b5cf6', icon: 'software' },
    service:          { allocated: 1000000, label: 'Service',          color: '#06b6d4', icon: 'service'  },
  },

  // Expense Log (mock transactions)
  expenses: [
    { id:'EXP-2025-001', date:'2025-01-08', category:'hardware',        subcategory:'Laptops',          description:'Dell Latitude 5540 x5',            vendor:'Dell Philippines',     amount:175000, lineItem:'LI-H01', status:'approved',  approvedBy:'Juan Cruz',    invoiceNo:'INV-DELL-001', paymentStatus:'paid'   },
    { id:'EXP-2025-002', date:'2025-01-15', category:'softwareLicense', subcategory:'Productivity',     description:'Microsoft 365 Business Premium x20', vendor:'Microsoft PH',        amount:95000,  lineItem:'LI-S01', status:'approved',  approvedBy:'Juan Cruz',    invoiceNo:'INV-MS-001',   paymentStatus:'paid'   },
    { id:'EXP-2025-003', date:'2025-01-22', category:'service',         subcategory:'Cloud Hosting',    description:'AWS EC2 Reserved Instances Q1',      vendor:'Amazon Web Services',  amount:120000, lineItem:'LI-V01', status:'approved',  approvedBy:'Admin',        invoiceNo:'INV-AWS-001',  paymentStatus:'paid'   },
    { id:'EXP-2025-004', date:'2025-02-05', category:'hardware',        subcategory:'Network',          description:'Cisco Catalyst 2960-X x2',           vendor:'Cisco Philippines',    amount:170000, lineItem:'LI-H02', status:'approved',  approvedBy:'Juan Cruz',    invoiceNo:'INV-CS-001',   paymentStatus:'paid'   },
    { id:'EXP-2025-005', date:'2025-02-12', category:'softwareLicense', subcategory:'Security',         description:'Kaspersky Endpoint Security x50',    vendor:'Kaspersky PH',         amount:67000,  lineItem:'LI-S02', status:'approved',  approvedBy:'Juan Cruz',    invoiceNo:'INV-KS-001',   paymentStatus:'paid'   },
    { id:'EXP-2025-006', date:'2025-02-20', category:'service',         subcategory:'Maintenance',      description:'Annual Hardware Maintenance SLA',     vendor:'IT Solutions PH',      amount:45000,  lineItem:'LI-V02', status:'approved',  approvedBy:'Admin',        invoiceNo:'INV-ITS-001',  paymentStatus:'paid'   },
    { id:'EXP-2025-007', date:'2025-03-03', category:'hardware',        subcategory:'Peripherals',      description:'Logitech MX Keys + MX Master x10',   vendor:'Logitech PH',          amount:100000, lineItem:'LI-H03', status:'approved',  approvedBy:'Juan Cruz',    invoiceNo:'INV-LG-001',   paymentStatus:'paid'   },
    { id:'EXP-2025-008', date:'2025-03-14', category:'softwareLicense', subcategory:'Design',           description:'Adobe Creative Cloud x5',            vendor:'Adobe Systems',        amount:47500,  lineItem:'LI-S01', status:'approved',  approvedBy:'Juan Cruz',    invoiceNo:'INV-ADO-001',  paymentStatus:'paid'   },
    { id:'EXP-2025-009', date:'2025-03-25', category:'service',         subcategory:'Cloud Hosting',    description:'AWS EC2 Reserved Instances Q2',      vendor:'Amazon Web Services',  amount:120000, lineItem:'LI-V01', status:'approved',  approvedBy:'Admin',        invoiceNo:'INV-AWS-002',  paymentStatus:'paid'   },
    { id:'EXP-2025-010', date:'2025-04-02', category:'hardware',        subcategory:'Monitors',         description:'Dell UltraSharp 27" 4K x8',          vendor:'Dell Philippines',     amount:176000, lineItem:'LI-H01', status:'approved',  approvedBy:'Juan Cruz',    invoiceNo:'INV-DELL-002', paymentStatus:'paid'   },
    { id:'EXP-2025-011', date:'2025-04-10', category:'softwareLicense', subcategory:'ITSM',             description:'ManageEngine IT Help Desk Plus',     vendor:'ManageEngine PH',      amount:85000,  lineItem:'LI-S03', status:'approved',  approvedBy:'Admin',        invoiceNo:'INV-ME-001',   paymentStatus:'paid'   },
    { id:'EXP-2025-012', date:'2025-04-18', category:'service',         subcategory:'Managed Services', description:'Network Monitoring Service Q2',      vendor:'IT Solutions PH',      amount:60000,  lineItem:'LI-V03', status:'approved',  approvedBy:'Admin',        invoiceNo:'INV-ITS-002',  paymentStatus:'paid'   },
    { id:'EXP-2025-013', date:'2025-04-25', category:'hardware',        subcategory:'Servers',          description:'Dell PowerEdge R750 Server',         vendor:'Dell Philippines',     amount:350000, lineItem:'LI-H04', status:'approved',  approvedBy:'Admin',        invoiceNo:'INV-DELL-003', paymentStatus:'pending'},
    { id:'EXP-2025-014', date:'2025-05-01', category:'softwareLicense', subcategory:'Cloud SaaS',       description:'Google Workspace Business x30',      vendor:'Google PH',            amount:96000,  lineItem:'LI-S01', status:'pending',   approvedBy:'',             invoiceNo:'INV-GGL-001',  paymentStatus:'unpaid' },
    { id:'EXP-2025-015', date:'2025-05-03', category:'service',         subcategory:'Maintenance',      description:'Server Room Air-Con Preventive Maint',vendor:'CoolTech Services',   amount:25000,  lineItem:'LI-V02', status:'for_review',approvedBy:'',             invoiceNo:'INV-CT-001',   paymentStatus:'unpaid' },
  ],

  // Budget Line Items
  lineItems: [
    // Hardware
    { id:'LI-H01', name:'Endpoint Devices',      category:'hardware', allocated:800000,  spent:351000, color:'#3b82f6' },
    { id:'LI-H02', name:'Network Equipment',      category:'hardware', allocated:450000,  spent:170000, color:'#60a5fa' },
    { id:'LI-H03', name:'Peripherals & Access.',  category:'hardware', allocated:200000,  spent:100000, color:'#93c5fd' },
    { id:'LI-H04', name:'Servers & Storage',      category:'hardware', allocated:950000,  spent:350000, color:'#2563eb' },
    { id:'LI-H05', name:'Printers & Scanners',    category:'hardware', allocated:200000,  spent:0,      color:'#1d4ed8' },
    // Software License
    { id:'LI-S01', name:'Productivity & SaaS',    category:'softwareLicense', allocated:600000, spent:238000, color:'#8b5cf6' },
    { id:'LI-S02', name:'Security Software',       category:'softwareLicense', allocated:400000, spent:67000,  color:'#a78bfa' },
    { id:'LI-S03', name:'ITSM & Operations',       category:'softwareLicense', allocated:250000, spent:85000,  color:'#7c3aed' },
    { id:'LI-S04', name:'Dev Tools & Licenses',    category:'softwareLicense', allocated:150000, spent:0,      color:'#6d28d9' },
    // Service
    { id:'LI-V01', name:'Cloud Hosting & Compute', category:'service', allocated:500000, spent:240000, color:'#06b6d4' },
    { id:'LI-V02', name:'Maintenance & Support',   category:'service', allocated:300000, spent:70000,  color:'#22d3ee' },
    { id:'LI-V03', name:'Managed IT Services',     category:'service', allocated:150000, spent:60000,  color:'#0891b2' },
    { id:'LI-V04', name:'Consulting & Training',   category:'service', allocated:50000,  spent:0,      color:'#0e7490' },
  ],

  // Monthly Budget Plan vs Actual (for variance)
  monthlyData: [
    { month:'Jan 25', planned:380000, actual:390000, hardware:175000, softwareLicense:95000,  service:120000 },
    { month:'Feb 25', planned:420000, actual:282000, hardware:170000, softwareLicense:67000,  service:45000  },
    { month:'Mar 25', planned:400000, actual:267500, hardware:100000, softwareLicense:47500,  service:120000 },
    { month:'Apr 25', planned:450000, actual:671000, hardware:526000, softwareLicense:85000,  service:60000  },
    { month:'May 25', planned:380000, actual:121000, hardware:0,      softwareLicense:96000,  service:25000  },
    { month:'Jun 25', planned:400000, actual:0,      hardware:0,      softwareLicense:0,      service:0      },
    { month:'Jul 25', planned:380000, actual:0,      hardware:0,      softwareLicense:0,      service:0      },
    { month:'Aug 25', planned:350000, actual:0,      hardware:0,      softwareLicense:0,      service:0      },
    { month:'Sep 25', planned:390000, actual:0,      hardware:0,      softwareLicense:0,      service:0      },
    { month:'Oct 25', planned:410000, actual:0,      hardware:0,      softwareLicense:0,      service:0      },
    { month:'Nov 25', planned:380000, actual:0,      hardware:0,      softwareLicense:0,      service:0      },
    { month:'Dec 25', planned:360000, actual:0,      hardware:0,      softwareLicense:0,      service:0      },
  ],

  // Quarterly
  quarterlyData: [
    { quarter:'Q1 2025', planned:1200000, actual:939500,  hardware:445000, softwareLicense:209500, service:285000, variance:-260500 },
    { quarter:'Q2 2025', planned:1230000, actual:792000,  hardware:526000, softwareLicense:181000, service:85000,  variance:-438000 },
    { quarter:'Q3 2025', planned:1120000, actual:0,       hardware:0,      softwareLicense:0,      service:0,      variance:0       },
    { quarter:'Q4 2025', planned:1150000, actual:0,       hardware:0,      softwareLicense:0,      service:0,      variance:0       },
  ],

  // Users
  users: [
    { id:1, username:'admin',   password:'admin',   name:'System Administrator', role:'admin',         department:'IT & Operations',       email:'admin@prisma.gov.ph',   avatar:'SA' },
    { id:2, username:'itstaff', password:'itstaff', name:'Juan Cruz',            role:'it_staff',      department:'Information Technology', email:'jcruz@prisma.gov.ph',   avatar:'JC' },
    { id:3, username:'staff',   password:'staff',   name:'Maria Santos',         role:'regular_staff', department:'Administration',          email:'msantos@prisma.gov.ph', avatar:'MS' },
  ],
}

// ── COMPUTED VALUES ───────────────────────────────────────────────
function computeBudgetSummary() {
  const totalSpent = DB.expenses.filter(e => e.status === 'approved').reduce((a, e) => a + e.amount, 0)
  const hwSpent  = DB.expenses.filter(e => e.status==='approved' && e.category==='hardware').reduce((a,e)=>a+e.amount,0)
  const swSpent  = DB.expenses.filter(e => e.status==='approved' && e.category==='softwareLicense').reduce((a,e)=>a+e.amount,0)
  const svcSpent = DB.expenses.filter(e => e.status==='approved' && e.category==='service').reduce((a,e)=>a+e.amount,0)
  return {
    totalBudget:    DB.budgetAllocations.total,
    totalSpent,
    totalRemaining: DB.budgetAllocations.total - totalSpent,
    totalVariance:  totalSpent - DB.budgetAllocations.total * 0.37,
    fiscalYear:     DB.fiscalYear,
    categories: {
      hardware:        { ...DB.budgetAllocations.hardware,        spent: hwSpent,  remaining: DB.budgetAllocations.hardware.allocated - hwSpent,        pct: Math.round(hwSpent/DB.budgetAllocations.hardware.allocated*100)        },
      softwareLicense: { ...DB.budgetAllocations.softwareLicense, spent: swSpent,  remaining: DB.budgetAllocations.softwareLicense.allocated - swSpent,  pct: Math.round(swSpent/DB.budgetAllocations.softwareLicense.allocated*100)  },
      service:         { ...DB.budgetAllocations.service,         spent: svcSpent, remaining: DB.budgetAllocations.service.allocated - svcSpent,         pct: Math.round(svcSpent/DB.budgetAllocations.service.allocated*100)         },
    },
    pendingExpenses: DB.expenses.filter(e => e.status !== 'approved').length,
    approvedThisMonth: DB.expenses.filter(e => e.status==='approved' && e.date.startsWith('2025-05')).length,
  }
}

// ── AUTH ─────────────────────────────────────────────────────────
export const authAPI = {
  login: async (username, password) => {
    await delay(1100)
    const u = DB.users.find(u => u.username===username && u.password===password)
    if (u) { const {password:_,...safe}=u; return {...safe,token:`jwt-${safe.role}-2025`} }
    throw new Error('Invalid username or password')
  },
}

// ── BUDGET ────────────────────────────────────────────────────────
export const budgetAPI = {
  getSummary: async () => { await delay(400); return computeBudgetSummary() },

  getLineItems: async () => {
    await delay(450)
    return DB.lineItems.map(li => ({
      ...li,
      spent: DB.expenses.filter(e=>e.lineItem===li.id && e.status==='approved').reduce((a,e)=>a+e.amount,0) || li.spent,
      utilization: Math.round(li.spent / li.allocated * 100),
      remaining: li.allocated - li.spent,
      isOverBudget: li.spent > li.allocated,
      warningLevel: li.spent/li.allocated >= 1 ? 'critical' : li.spent/li.allocated >= 0.8 ? 'warning' : 'ok',
    }))
  },

  getDeptBudget: async (dept) => {
    await delay(350)
    const depts = {
      'Administration':  { hardware:{total:200000,spent:80000}, softwareLicense:{total:150000,spent:60000}, service:{total:80000,spent:25000} },
      'Finance':         { hardware:{total:180000,spent:60000}, softwareLicense:{total:200000,spent:85000}, service:{total:70000,spent:20000} },
      'HR':              { hardware:{total:150000,spent:40000}, softwareLicense:{total:120000,spent:35000}, service:{total:50000,spent:15000} },
      'Marketing':       { hardware:{total:120000,spent:70000}, softwareLicense:{total:180000,spent:95000}, service:{total:60000,spent:30000} },
      'Information Technology': { hardware:{total:2600000,spent:1301000}, softwareLicense:{total:1400000,spent:390000}, service:{total:1000000,spent:325000} },
      'IT & Operations': { hardware:{total:2600000,spent:1301000}, softwareLicense:{total:1400000,spent:390000}, service:{total:1000000,spent:325000} },
    }
    const d = depts[dept] || depts['Administration']
    return {
      hardware:        { ...d.hardware,        remaining: d.hardware.total-d.hardware.spent,               pct: Math.round(d.hardware.spent/d.hardware.total*100)               },
      softwareLicense: { ...d.softwareLicense, remaining: d.softwareLicense.total-d.softwareLicense.spent, pct: Math.round(d.softwareLicense.spent/d.softwareLicense.total*100) },
      service:         { ...d.service,         remaining: d.service.total-d.service.spent,                 pct: Math.round(d.service.spent/d.service.total*100)                 },
    }
  },

  getMonthlyData: async () => { await delay(500); return DB.monthlyData },
  getQuarterlyData: async () => { await delay(450); return DB.quarterlyData },

  getVarianceReport: async () => {
    await delay(500)
    const summary = computeBudgetSummary()
    return {
      period: 'January – May 2025',
      totalBudgeted: 3250000,
      totalActual:   1731500,
      totalVariance: -1518500,
      variancePct:   -46.7,
      byCategory: [
        { category:'Hardware',         budgeted:1301000, actual:1301000, variance:0,       variancePct:0.0,   status:'on_track'  },
        { category:'Software License', budgeted:603500,  actual:390000,  variance:-213500,  variancePct:-35.4, status:'under'     },
        { category:'Service',          budgeted:540000,  actual:325000,  variance:-215000,  variancePct:-39.8, status:'under'     },
      ],
      byMonth: DB.monthlyData.slice(0,5).map(m => ({
        month: m.month,
        planned: m.planned,
        actual: m.actual,
        variance: m.actual - m.planned,
        variancePct: m.planned > 0 ? Math.round(((m.actual-m.planned)/m.planned)*100) : 0,
      })),
      alerts: [
        { type:'warning', message:'Q2 hardware spend exceeded plan by ₱76,000 due to emergency server procurement' },
        { type:'info',    message:'Software license spend is 35.4% under budget — review upcoming renewal schedule' },
        { type:'info',    message:'Cloud hosting on track; Q3 AWS renewal due June 30' },
      ],
    }
  },

  // Admin: set budget allocation
  setBudgetAllocation: async (data) => {
    await delay(600)
    Object.assign(DB.budgetAllocations, data)
    return { success: true }
  },

  addLineItem: async (item) => {
    await delay(400)
    const id = `LI-${item.category==='hardware'?'H':item.category==='softwareLicense'?'S':'V'}${String(DB.lineItems.length+1).padStart(2,'0')}`
    const newLI = { id, ...item, spent:0, remaining:item.allocated, utilization:0, isOverBudget:false, warningLevel:'ok', color:'#06b6d4' }
    DB.lineItems.push(newLI)
    return newLI
  },
}

// ── EXPENSES ──────────────────────────────────────────────────────
export const expenseAPI = {
  getAll: async () => { await delay(400); return [...DB.expenses].reverse() },

  getByCategory: async (cat) => {
    await delay(350)
    return cat === 'all' ? DB.expenses : DB.expenses.filter(e => e.category === cat)
  },

  addExpense: async (expense) => {
    await delay(500)
    const id = `EXP-2025-${String(DB.expenses.length+1).padStart(3,'0')}`
    const newExp = { id, ...expense, status:'pending', approvedBy:'', invoiceNo:`INV-${Date.now()}`, paymentStatus:'unpaid' }
    DB.expenses.push(newExp)
    return newExp
  },

  updateStatus: async (id, status, approvedBy='') => {
    await delay(400)
    const exp = DB.expenses.find(e => e.id === id)
    if (exp) { exp.status = status; exp.approvedBy = approvedBy }
    return exp
  },
}

// ── CATALOG / SHOP ────────────────────────────────────────────────
export const shopAPI = {
  getCatalog: async () => {
    await delay(600)
    return [
      // Hardware - Laptops
      { id:'P001', name:'Dell Latitude 5540 Laptop',       category:'hardware', subcategory:'Laptops',     price:35000,  stock:8,   unit:'unit',        sku:'DL-LAT-5540',   vendor:'Dell Philippines',   specs:'Intel i5-13th Gen, 16GB RAM, 512GB SSD',     lineItem:'LI-H01' },
      { id:'P002', name:'Lenovo ThinkPad E15 Gen 4',       category:'hardware', subcategory:'Laptops',     price:32000,  stock:5,   unit:'unit',        sku:'LN-TP-E15G4',   vendor:'Lenovo PH',          specs:'Intel i5-12th Gen, 16GB RAM, 512GB SSD',     lineItem:'LI-H01' },
      { id:'P003', name:'HP EliteBook 840 G10',            category:'hardware', subcategory:'Laptops',     price:42000,  stock:4,   unit:'unit',        sku:'HP-EB-840G10',  vendor:'HP Philippines',     specs:'Intel i7-13th Gen, 32GB RAM, 1TB SSD',       lineItem:'LI-H01' },
      { id:'P004', name:'Dell UltraSharp 27" 4K Monitor',  category:'hardware', subcategory:'Monitors',    price:22000,  stock:10,  unit:'unit',        sku:'DL-US-U2722D',  vendor:'Dell Philippines',   specs:'27in IPS 4K, USB-C 90W, 60Hz',              lineItem:'LI-H01' },
      { id:'P005', name:'HP EliteDesk 800 G9 SFF',         category:'hardware', subcategory:'Desktops',    price:28000,  stock:3,   unit:'unit',        sku:'HP-ED-800G9',   vendor:'HP Philippines',     specs:'Intel i7-12th Gen, 16GB RAM, 1TB SSD',       lineItem:'LI-H01' },
      { id:'P006', name:'Cisco Catalyst 2960-X 24-Port',   category:'hardware', subcategory:'Network',     price:85000,  stock:4,   unit:'unit',        sku:'CS-CAT-2960X',  vendor:'Cisco Philippines',  specs:'24x GbE PoE+, 4x SFP+, Layer 2',            lineItem:'LI-H02' },
      { id:'P007', name:'Ubiquiti UniFi AP-AC Pro',        category:'hardware', subcategory:'Network',     price:8500,   stock:12,  unit:'unit',        sku:'UB-UAP-ACPRO',  vendor:'IT Solutions PH',    specs:'802.11ac Dual Band, Indoor',                 lineItem:'LI-H02' },
      { id:'P008', name:'Logitech MX Keys S Keyboard',     category:'hardware', subcategory:'Peripherals', price:5200,   stock:12,  unit:'unit',        sku:'LG-MXK-S',      vendor:'Logitech PH',        specs:'Wireless Bluetooth, Multi-device, Backlit',   lineItem:'LI-H03' },
      { id:'P009', name:'Logitech MX Master 3S Mouse',     category:'hardware', subcategory:'Peripherals', price:4800,   stock:14,  unit:'unit',        sku:'LG-MXM-3S',     vendor:'Logitech PH',        specs:'Wireless, 8000 DPI, USB-C Charge',            lineItem:'LI-H03' },
      { id:'P010', name:'Dell PowerEdge R750 Server',      category:'hardware', subcategory:'Servers',     price:350000, stock:2,   unit:'unit',        sku:'DL-PE-R750',    vendor:'Dell Philippines',   specs:'Dual Xeon, 64GB RAM, 4x2TB SSD RAID',        lineItem:'LI-H04' },
      { id:'P011', name:'APC Smart-UPS 1500VA',            category:'hardware', subcategory:'Power',       price:18500,  stock:5,   unit:'unit',        sku:'APC-SMT1500',   vendor:'APC Schneider',      specs:'1500VA/980W, LCD, USB, 8 Outlets',            lineItem:'LI-H04' },
      { id:'P012', name:'HP LaserJet Pro M404dn',          category:'hardware', subcategory:'Printers',    price:22000,  stock:4,   unit:'unit',        sku:'HP-LJ-M404DN',  vendor:'HP Philippines',     specs:'Duplex, LAN, 38ppm, PCL6',                   lineItem:'LI-H05' },
      // Software License
      { id:'P013', name:'Microsoft 365 Business Premium',  category:'softwareLicense', subcategory:'Productivity', price:4750,  stock:999, unit:'license/yr',  sku:'MS-365-BP',    vendor:'Microsoft PH',       specs:'Word, Excel, Teams, 1TB OneDrive, 1yr',      lineItem:'LI-S01' },
      { id:'P014', name:'Adobe Creative Cloud All Apps',   category:'softwareLicense', subcategory:'Design',       price:9500,  stock:999, unit:'license/yr',  sku:'ADO-CC-ALL',   vendor:'Adobe Systems',      specs:'Photoshop, Illustrator, Premiere, 1yr',      lineItem:'LI-S01' },
      { id:'P015', name:'Google Workspace Business Plus',  category:'softwareLicense', subcategory:'Productivity', price:3200,  stock:999, unit:'user/yr',     sku:'GWS-BIZ-PLUS', vendor:'Google PH',          specs:'Gmail, Drive 5TB, Meet, 1yr',                lineItem:'LI-S01' },
      { id:'P016', name:'Kaspersky Endpoint Security',     category:'softwareLicense', subcategory:'Security',     price:1340,  stock:999, unit:'license/yr',  sku:'KS-ES-1YR',    vendor:'Kaspersky PH',       specs:'Endpoint Protection, 1 Device 1yr',          lineItem:'LI-S02' },
      { id:'P017', name:'Bitdefender GravityZone Biz',     category:'softwareLicense', subcategory:'Security',     price:1580,  stock:999, unit:'license/yr',  sku:'BD-GZ-BIZ',    vendor:'Bitdefender PH',     specs:'Next-Gen AV, EDR, 1 Endpoint 1yr',           lineItem:'LI-S02' },
      { id:'P018', name:'ManageEngine IT Help Desk Plus',  category:'softwareLicense', subcategory:'ITSM',         price:85000, stock:999, unit:'license/yr',  sku:'ME-ITHDP-1Y',  vendor:'ManageEngine PH',    specs:'ITSM Platform, 5 Techs, 1yr',                lineItem:'LI-S03' },
      { id:'P019', name:'AutoCAD LT Subscription',         category:'softwareLicense', subcategory:'CAD',          price:18000, stock:999, unit:'license/yr',  sku:'ADSK-ACAD-LT', vendor:'Autodesk PH',        specs:'2D Drafting, 1 User 1yr',                    lineItem:'LI-S04' },
      // Service
      { id:'P020', name:'AWS EC2 Reserved Instance 1yr',   category:'service', subcategory:'Cloud Hosting', price:120000, stock:999, unit:'instance/yr', sku:'AWS-EC2-RI1Y',  vendor:'Amazon Web Services', specs:'t3.large, 2 vCPU, 8GB RAM, 1yr Reserved',   lineItem:'LI-V01' },
      { id:'P021', name:'Azure Virtual Machine B2s 1yr',   category:'service', subcategory:'Cloud Hosting', price:95000,  stock:999, unit:'instance/yr', sku:'AZ-VM-B2S-1Y',  vendor:'Microsoft Azure',     specs:'2 vCPU, 4GB RAM, Windows Server, 1yr',       lineItem:'LI-V01' },
      { id:'P022', name:'Annual Hardware Maintenance SLA', category:'service', subcategory:'Maintenance',   price:45000,  stock:999, unit:'contract/yr', sku:'SVC-HW-SLA',    vendor:'IT Solutions PH',     specs:'Preventive Maintenance, On-site Support, 1yr',lineItem:'LI-V02' },
      { id:'P023', name:'Network Monitoring Service 1yr',  category:'service', subcategory:'Managed Svc',   price:60000,  stock:999, unit:'service/yr',  sku:'SVC-NOC-1YR',   vendor:'IT Solutions PH',     specs:'24/7 NOC, Alerting, Monthly Reports, 1yr',   lineItem:'LI-V03' },
      { id:'P024', name:'IT Consulting Package (40hrs)',   category:'service', subcategory:'Consulting',    price:80000,  stock:999, unit:'package',     sku:'SVC-CONS-40H',  vendor:'TechConsult PH',      specs:'Senior IT Consultant, 40 hours',              lineItem:'LI-V04' },
    ]
  },

  getVendors: async () => {
    await delay(300)
    return [
      { id:'V001', name:'Dell Philippines',    category:'Hardware',  contact:'02-8888-3355', email:'sales.ph@dell.com',         accredited:true  },
      { id:'V002', name:'Lenovo PH',           category:'Hardware',  contact:'02-7703-2700', email:'sales@lenovo.com.ph',        accredited:true  },
      { id:'V003', name:'HP Philippines',      category:'Hardware',  contact:'02-8892-8100', email:'hp-sales@hp.com',            accredited:true  },
      { id:'V004', name:'Cisco Philippines',   category:'Network',   contact:'02-8841-2000', email:'cisco-ph@cisco.com',         accredited:true  },
      { id:'V005', name:'IT Solutions PH',     category:'Various',   contact:'09171234567',  email:'sales@itsolutions.com.ph',   accredited:true  },
      { id:'V006', name:'Microsoft PH',        category:'Software',  contact:'1800-1441-0304',email:'mssales@microsoft.com',    accredited:true  },
      { id:'V007', name:'Adobe Systems',       category:'Software',  contact:'1-800-833-6687',email:'adobe@adobe.com',          accredited:true  },
      { id:'V008', name:'Kaspersky PH',        category:'Security',  contact:'09272345678',  email:'sales@kaspersky.com.ph',     accredited:false },
      { id:'V009', name:'Amazon Web Services', category:'Cloud',     contact:'1800-1315-2100',email:'aws-ph@amazon.com',        accredited:true  },
      { id:'V010', name:'Microsoft Azure',     category:'Cloud',     contact:'1800-1441-0304',email:'azure@microsoft.com',      accredited:true  },
      { id:'V011', name:'Google PH',           category:'Cloud',     contact:'02-8849-5858', email:'google-sales@google.com',    accredited:true  },
      { id:'V012', name:'ManageEngine PH',     category:'ITSM',      contact:'1800-1000-6300',email:'sales@manageengine.com.ph',accredited:true  },
      { id:'V013', name:'Logitech PH',         category:'Peripherals',contact:'02-7903-1234',email:'logitech@logitech.com.ph',  accredited:true  },
      { id:'V014', name:'APC Schneider',       category:'Power',     contact:'02-8799-2000', email:'apc@schneider-electric.com', accredited:true  },
      { id:'V015', name:'Bitdefender PH',      category:'Security',  contact:'09171230001',  email:'sales@bitdefender.com.ph',   accredited:false },
    ]
  },
}

// ── REQUESTS ──────────────────────────────────────────────────────
export const requestsAPI = {
  getAll: async () => {
    await delay(500)
    return [
      { id:'REQ-2025-0214', title:'Laptops for New Admin Hires', requestedBy:'Maria Santos', requestorRole:'regular_staff', department:'Administration', date:'2025-05-02', category:'hardware', lineItem:'LI-H01', lineItemName:'Endpoint Devices', items:[{productId:'P001',name:'Dell Latitude 5540 Laptop',qty:3,unitPrice:35000,sku:'DL-LAT-5540'}], total:105000, status:'pending',    priority:'high',   note:'3 new hires starting June 1.', feedback:'', changeJustification:'' },
      { id:'REQ-2025-0213', title:'Network Switch Replacement',   requestedBy:'Juan Cruz',    requestorRole:'it_staff',      department:'IT',             date:'2025-05-01', category:'hardware', lineItem:'LI-H02', lineItemName:'Network Equipment',  items:[{productId:'P006',name:'Cisco Catalyst 2960-X',qty:2,unitPrice:85000,sku:'CS-CAT-2960X'}],    total:170000, status:'approved',   priority:'high',   note:'Current switches failing.', feedback:'Approved. PO issued.', changeJustification:'' },
      { id:'REQ-2025-0212', title:'Microsoft 365 Renewal',        requestedBy:'Ana Reyes',    requestorRole:'regular_staff', department:'Finance',        date:'2025-04-30', category:'softwareLicense', lineItem:'LI-S01', lineItemName:'Productivity & SaaS', items:[{productId:'P013',name:'Microsoft 365 Business Premium',qty:10,unitPrice:4750,sku:'MS-365-BP'}], total:47500, status:'approved', priority:'medium', note:'Licenses expire May 15.', feedback:'Approved.', changeJustification:'' },
      { id:'REQ-2025-0211', title:'Antivirus Renewal – Finance',   requestedBy:'Ana Reyes',    requestorRole:'regular_staff', department:'Finance',        date:'2025-04-28', category:'softwareLicense', lineItem:'LI-S02', lineItemName:'Security Software',   items:[{productId:'P016',name:'Kaspersky Endpoint Security',qty:20,unitPrice:1340,sku:'KS-ES-1YR'}],  total:26800, status:'for_review',priority:'high',   note:'Licenses expire May 1.', feedback:'', changeJustification:'' },
      { id:'REQ-2025-0210', title:'HR Peripherals Upgrade',        requestedBy:'Lisa Bautista',requestorRole:'regular_staff', department:'HR',             date:'2025-04-25', category:'hardware', lineItem:'LI-H03', lineItemName:'Peripherals', items:[{productId:'P008',name:'Logitech MX Keys S',qty:5,unitPrice:5200,sku:'LG-MXK-S'},{productId:'P009',name:'Logitech MX Master 3S',qty:5,unitPrice:4800,sku:'LG-MXM-3S'}], total:50000, status:'rejected', priority:'low', note:'Upgrade request.', feedback:'Rejected – defer to Q3.', changeJustification:'' },
      { id:'REQ-2025-0209', title:'Server Storage Expansion',      requestedBy:'Juan Cruz',    requestorRole:'it_staff',      department:'IT',             date:'2025-04-22', category:'hardware', lineItem:'LI-H04', lineItemName:'Servers & Storage',   items:[{productId:'P010',name:'Dell PowerEdge R750',qty:1,unitPrice:350000,sku:'DL-PE-R750'}],         total:350000, status:'approved',  priority:'high',   note:'Server at 90% capacity.', feedback:'Approved.', changeJustification:'' },
    ]
  },
}

// ── ACCESS CONTROL ────────────────────────────────────────────────
export const accessAPI = {
  getUsers: async () => {
    await delay(450)
    return DB.users.map(({password:_,...u}) => ({
      ...u, status:'active', lastLogin: u.id===1?'2025-05-03 08:14':u.id===2?'2025-05-03 09:02':'2025-05-02 14:30',
    }))
  },
  getRoles: async () => {
    await delay(280)
    return [
      { id:'admin',         label:'Administrator',  color:'#ef4444', desc:'Full system access.', permissions:['Manage Budget Allocations','Set Fiscal Year Budget','Add/Edit Line Items','Log & Approve Expenses','View All Reports','Export Excel/PDF','Manage Users','Receive Over-Budget Alerts'] },
      { id:'it_staff',      label:'IT Staff',        color:'#06b6d4', desc:'IT Department operations.', permissions:['Log Expenses','Process Purchase Requests','Browse Catalog','Approve Requests','View IT Budget','Receive Budget Alerts','View Reports'] },
      { id:'regular_staff', label:'Regular Staff',   color:'#10b981', desc:'Submit requests only.', permissions:['Submit Purchase Requests','View Own Request Status','View Dept Budget Summary'] },
    ]
  },
}

// ── REPORTS ───────────────────────────────────────────────────────
export const reportsAPI = {
  getSummary: async () => { await delay(380); return computeBudgetSummary() },
  getMonthlyData: async () => { await delay(500); return DB.monthlyData },
  getQuarterlyData: async () => { await delay(450); return DB.quarterlyData },
  getVarianceReport: async () => { await delay(500); return await budgetAPI.getVarianceReport() },
  getExpensesByCategory: async () => {
    await delay(400)
    const s = computeBudgetSummary()
    return [
      { name:'Hardware',         value: s.categories.hardware.spent,        budget: s.categories.hardware.allocated,        pct: s.categories.hardware.pct,        color:'#3b82f6' },
      { name:'Software License', value: s.categories.softwareLicense.spent, budget: s.categories.softwareLicense.allocated, pct: s.categories.softwareLicense.pct, color:'#8b5cf6' },
      { name:'Service',          value: s.categories.service.spent,          budget: s.categories.service.allocated,          pct: s.categories.service.pct,          color:'#06b6d4' },
    ]
  },
  getFiles: async () => {
    await delay(300)
    return [
      { id:'R001', title:'Monthly Budget Utilization Report',      type:'Budget',      period:'April 2025', size:'1.2 MB', generated:'2025-05-01', format:'PDF' },
      { id:'R002', title:'Hardware vs SW License vs Service Breakdown', type:'Finance', period:'Q1 2025',   size:'2.4 MB', generated:'2025-04-15', format:'CSV' },
      { id:'R003', title:'Procurement Activity Summary',           type:'Procurement', period:'Q1 2025',    size:'3.4 MB', generated:'2025-04-01', format:'CSV' },
      { id:'R004', title:'Vendor Performance Report',              type:'Procurement', period:'Q1 2025',    size:'980 KB', generated:'2025-04-10', format:'PDF' },
      { id:'R005', title:'Annual IT Audit Trail',                  type:'Compliance',  period:'2024',       size:'8.7 MB', generated:'2025-01-15', format:'PDF' },
      { id:'R006', title:'Variance Analysis Report FY 2025',       type:'Finance',     period:'FY 2025',    size:'1.8 MB', generated:'2025-05-03', format:'PDF' },
    ]
  },
}

// ── NOTIFICATIONS ─────────────────────────────────────────────────
export const notificationsAPI = {
  getForRole: async (role, dept) => {
    await delay(300)
    const s = computeBudgetSummary()
    const alerts = []
    Object.entries(s.categories).forEach(([key, cat]) => {
      if (cat.pct >= 90) alerts.push({ id:`alert-${key}-crit`, type:'alert',   msg:`CRITICAL: ${cat.label} budget at ${cat.pct}% — only ₱${cat.remaining.toLocaleString()} remaining`, time:'Just now', read:false })
      else if (cat.pct >= 80) alerts.push({ id:`alert-${key}-warn`, type:'alert', msg:`Warning: ${cat.label} budget at ${cat.pct}% — ₱${cat.remaining.toLocaleString()} remaining`, time:'1 hr ago', read:false })
    })
    const all = {
      admin: [...alerts,
        { id:'n1', type:'approval', msg:'REQ-2025-0211 awaiting your approval (Antivirus Renewal)', time:'2 hrs ago', read:false },
        { id:'n2', type:'info',     msg:'Q2 Variance Report is ready for review',                    time:'3 hrs ago', read:true  },
        { id:'n3', type:'success',  msg:'Q2 2025 budget released — ₱5,000,000 total allocation',      time:'2 days ago',read:true  },
      ],
      it_staff: [...alerts,
        { id:'n4', type:'approval', msg:'REQ-2025-0214 submitted by Maria Santos — action required',  time:'4 hrs ago', read:false },
        { id:'n5', type:'success',  msg:'REQ-2025-0213 approved — Cisco switch PO issued',            time:'Yesterday', read:true  },
      ],
      regular_staff: [
        { id:'n6', type:'success',  msg:'REQ-2025-0212 approved — Microsoft 365 renewal ordered',    time:'1 hr ago',  read:false },
        { id:'n7', type:'info',     msg:'REQ-2025-0214 is under IT Staff review',                     time:'3 hrs ago', read:true  },
        { id:'n8', type:'alert',    msg:`${dept} budget utilization at 62% — review spending`,        time:'Yesterday', read:true  },
        { id:'n9', type:'alert',    msg:'REQ-2025-0210 rejected — see IT Staff feedback',             time:'2 days ago',read:true  },
      ],
    }
    return all[role] || []
  },
}

// ── SETTINGS ─────────────────────────────────────────────────────
export const settingsAPI = {
  getProfile: async () => { await delay(300); return { name:'System Administrator', username:'admin', email:'admin@prisma.gov.ph', department:'IT & Operations', phone:'+63 917 123 4567', role:'Administrator', joinDate:'January 15, 2024' } },
  getSystemSettings: async () => { await delay(250); return { fiscalYear:'2025', currency:'PHP', timezone:'Asia/Manila', dateFormat:'MM/DD/YYYY', approvalThreshold:50000, autoApprove:false, emailNotifications:true, smsAlerts:false, budgetWarningPct:80, twoFactorAuth:false } },
}

// Compatibility aliases
export const budgetAPICompat = budgetAPI
export const procurementAPI = {
  getRecentActivity: async () => {
    await delay(400)
    return DB.expenses.slice(-6).reverse().map(e => ({
      id: e.id, item: e.description, department: e.category === 'hardware' ? 'IT' : 'IT',
      amount: e.amount, status: e.status, date: e.date, requestedBy: e.approvedBy || 'Pending'
    }))
  },
  getMonthlySpending: async () => { await delay(500); return DB.monthlyData.slice(0,6).map(m=>({month:m.month.split(' ')[0],spent:m.actual,budget:m.planned,hardware:m.hardware,softwareLicense:m.softwareLicense,service:m.service})) },
  getDepartmentBreakdown: async () => {
    await delay(400)
    return [
      { department:'IT',            spent:890000, color:'#06b6d4' },
      { department:'Administration',spent:185000, color:'#3b82f6' },
      { department:'Finance',       spent:220000, color:'#8b5cf6' },
      { department:'HR',            spent:95000,  color:'#10b981' },
      { department:'Marketing',     spent:80000,  color:'#f59e0b' },
    ]
  },
}
