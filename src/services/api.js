// ================================================================
// PRISMA – Mock API  (IT Procurement System)
// Roles: admin | it_staff | regular_staff
// ================================================================
const delay = (ms) => new Promise(r => setTimeout(r, ms))

const USERS = [
  { id:1, username:'admin',   password:'admin',   name:'System Administrator', role:'admin',         department:'IT & Operations',       email:'admin@prisma.gov.ph',   avatar:'SA' },
  { id:2, username:'itstaff', password:'itstaff', name:'Juan Cruz',            role:'it_staff',      department:'Information Technology', email:'jcruz@prisma.gov.ph',   avatar:'JC' },
  { id:3, username:'staff',   password:'staff',   name:'Maria Santos',         role:'regular_staff', department:'Administration',          email:'msantos@prisma.gov.ph', avatar:'MS' },
]

export const authAPI = {
  login: async (username, password) => {
    await delay(1200)
    const user = USERS.find(u => u.username === username && u.password === password)
    if (user) {
      const { password: _, ...safe } = user
      return { ...safe, token: `mock-jwt-${safe.role}-2025` }
    }
    throw new Error('Invalid username or password')
  },
}

export const budgetAPI = {
  getSummary: async () => {
    await delay(450)
    return { totalBudget:5000000, totalSpent:2340000, totalRemaining:2660000, pendingRequests:7, approvedThisMonth:12, departments:6 }
  },
  getLedger: async () => {
    await delay(550)
    return [
      { id:'BL-001', department:'Information Technology', allocated:1200000, spent:890000, remaining:310000, utilization:74, status:'on_track',       officer:'Juan Cruz',     lastTxn:'2025-05-01' },
      { id:'BL-002', department:'Administration',         allocated:800000,  spent:450000, remaining:350000, utilization:56, status:'on_track',       officer:'Maria Santos',  lastTxn:'2025-05-01' },
      { id:'BL-003', department:'Finance',                allocated:600000,  spent:320000, remaining:280000, utilization:53, status:'on_track',       officer:'Ana Reyes',     lastTxn:'2025-04-29' },
      { id:'BL-004', department:'Human Resources',        allocated:500000,  spent:280000, remaining:220000, utilization:56, status:'on_track',       officer:'Lisa Bautista', lastTxn:'2025-04-26' },
      { id:'BL-005', department:'Facilities',             allocated:600000,  spent:250000, remaining:350000, utilization:42, status:'on_track',       officer:'Carlos Mendoza',lastTxn:'2025-04-28' },
      { id:'BL-006', department:'Operations',             allocated:400000,  spent:150000, remaining:250000, utilization:38, status:'under_utilized', officer:'Ramon DC',      lastTxn:'2025-04-20' },
      { id:'BL-007', department:'Marketing',              allocated:300000,  spent:280000, remaining:20000,  utilization:93, status:'critical',       officer:'Jenny Tan',     lastTxn:'2025-04-30' },
      { id:'BL-008', department:'Legal',                  allocated:200000,  spent:180000, remaining:20000,  utilization:90, status:'warning',        officer:'Miguel Lim',    lastTxn:'2025-04-25' },
    ]
  },
  getTransactions: async () => {
    await delay(500)
    return [
      { id:'TXN-2025-0541', date:'2025-05-01', department:'IT',         description:'Cloud Server Subscription – AWS',  amount:45000,   type:'debit',  ref:'PO-0891' },
      { id:'TXN-2025-0540', date:'2025-05-01', department:'Admin',      description:'Office Supplies Bundle Q2',         amount:12500,   type:'debit',  ref:'PO-0890' },
      { id:'TXN-2025-0539', date:'2025-04-30', department:'IT',         description:'Laptop Units Procurement (x5)',     amount:175000,  type:'debit',  ref:'PO-0889' },
      { id:'TXN-2025-0538', date:'2025-04-29', department:'Finance',    description:'Printer Ink Cartridges (x20)',      amount:4800,    type:'debit',  ref:'PO-0888' },
      { id:'TXN-2025-0537', date:'2025-04-28', department:'Facilities', description:'Conference Room Chair Set',         amount:38000,   type:'debit',  ref:'PO-0887' },
      { id:'TXN-2025-0536', date:'2025-04-27', department:'IT',         description:'Adobe Creative Suite License',     amount:95000,   type:'debit',  ref:'PO-0886' },
      { id:'TXN-2025-0535', date:'2025-04-26', department:'HR',         description:'Medical Supplies First Aid Kit',   amount:7200,    type:'debit',  ref:'PO-0885' },
      { id:'TXN-2025-0534', date:'2025-04-25', department:'Marketing',  description:'Digital Ad Campaign – Meta',        amount:60000,   type:'debit',  ref:'PO-0884' },
      { id:'TXN-2025-0533', date:'2025-04-24', department:'Operations', description:'Fuel & Vehicle Maintenance',        amount:15000,   type:'debit',  ref:'PO-0883' },
      { id:'TXN-2025-0532', date:'2025-04-23', department:'—',          description:'Q2 Budget Release – DOF',          amount:2500000, type:'credit', ref:'REL-Q2-2025' },
    ]
  },
  getLineItems: async () => {
    await delay(480)
    return [
      { id:'LI-001', name:'Laptops & Workstations',   category:'Hardware', allocated:800000, spent:612000, remaining:188000, utilization:77 },
      { id:'LI-002', name:'Network Equipment',         category:'Hardware', allocated:450000, spent:180000, remaining:270000, utilization:40 },
      { id:'LI-003', name:'Software Licenses',         category:'Software', allocated:600000, spent:395000, remaining:205000, utilization:66 },
      { id:'LI-004', name:'Peripherals & Accessories', category:'Hardware', allocated:200000, spent:118500, remaining:81500,  utilization:59 },
      { id:'LI-005', name:'Cloud Services & Hosting',  category:'Services', allocated:500000, spent:420000, remaining:80000,  utilization:84 },
      { id:'LI-006', name:'IT Security & Antivirus',   category:'Software', allocated:300000, spent:267000, remaining:33000,  utilization:89 },
      { id:'LI-007', name:'Printers & Scanners',       category:'Hardware', allocated:200000, spent:85000,  remaining:115000, utilization:43 },
      { id:'LI-008', name:'Servers & Storage',         category:'Hardware', allocated:950000, spent:70000,  remaining:880000, utilization:7  },
    ]
  },
}

export const procurementAPI = {
  getRecentActivity: async () => {
    await delay(600)
    return [
      { id:1, item:'Office Supplies Bundle',      department:'Admin',     amount:12500,  status:'approved',   date:'2025-05-01', requestedBy:'Maria Santos' },
      { id:2, item:'Laptop Units (x5)',            department:'IT',        amount:175000, status:'pending',    date:'2025-04-30', requestedBy:'Juan Cruz'    },
      { id:3, item:'Printer Ink Cartridges',       department:'Finance',   amount:4800,   status:'approved',   date:'2025-04-29', requestedBy:'Ana Reyes'    },
      { id:4, item:'Conference Room Chairs',       department:'Facilities',amount:38000,  status:'for_review', date:'2025-04-28', requestedBy:'Carlos Mendoza'},
      { id:5, item:'Software License Renewal',     department:'IT',        amount:95000,  status:'approved',   date:'2025-04-27', requestedBy:'Juan Cruz'    },
      { id:6, item:'Medical Supplies Kit',         department:'HR',        amount:7200,   status:'pending',    date:'2025-04-26', requestedBy:'Lisa Bautista'},
    ]
  },
  getMonthlySpending: async () => {
    await delay(550)
    return [
      { month:'Nov', spent:380000, budget:500000 },
      { month:'Dec', spent:420000, budget:500000 },
      { month:'Jan', spent:290000, budget:450000 },
      { month:'Feb', spent:510000, budget:500000 },
      { month:'Mar', spent:340000, budget:450000 },
      { month:'Apr', spent:400000, budget:500000 },
    ]
  },
  getDepartmentBreakdown: async () => {
    await delay(550)
    return [
      { department:'IT',         spent:890000, color:'#06b6d4' },
      { department:'Admin',      spent:450000, color:'#3b82f6' },
      { department:'Finance',    spent:320000, color:'#8b5cf6' },
      { department:'HR',         spent:280000, color:'#10b981' },
      { department:'Facilities', spent:250000, color:'#f59e0b' },
      { department:'Operations', spent:150000, color:'#ef4444' },
    ]
  },
  getCatalog: async () => {
    await delay(600)
    return [
      { id:'P001', name:'Dell Latitude 5540 Laptop',    category:'Laptops',    price:35000, stock:8,  unit:'unit',       sku:'DL-LAT-5540',  supplier:'Dell Philippines',  image:'💻', rating:4.8 },
      { id:'P002', name:'Lenovo ThinkPad E15',           category:'Laptops',    price:32000, stock:5,  unit:'unit',       sku:'LN-TP-E15',    supplier:'Lenovo PH',         image:'💻', rating:4.7 },
      { id:'P003', name:'Dell UltraSharp 27" 4K',        category:'Monitors',   price:22000, stock:10, unit:'unit',       sku:'DL-US-U2722D', supplier:'Dell Philippines',  image:'🖥️', rating:4.9 },
      { id:'P004', name:'HP EliteDesk 800 G9 SFF',       category:'Desktops',   price:28000, stock:3,  unit:'unit',       sku:'HP-ED-800G9',  supplier:'HP Philippines',    image:'🖥️', rating:4.6 },
      { id:'P005', name:'Cisco Catalyst 2960-X 24-Port', category:'Network',    price:85000, stock:4,  unit:'unit',       sku:'CS-CAT-2960X', supplier:'Cisco PH',          image:'🔀', rating:4.8 },
      { id:'P006', name:'Ubiquiti UniFi AP-AC Pro',      category:'Network',    price:8500,  stock:15, unit:'unit',       sku:'UB-UAP-ACPRO',supplier:'IT Solutions PH',   image:'📡', rating:4.7 },
      { id:'P007', name:'Microsoft 365 Business',        category:'Software',   price:4750,  stock:999,unit:'license/yr', sku:'MS-365-BP',    supplier:'Microsoft PH',      image:'📦', rating:4.9 },
      { id:'P008', name:'Adobe Creative Cloud',          category:'Software',   price:9500,  stock:999,unit:'license/yr', sku:'ADO-CC-1YR',   supplier:'Adobe Systems',     image:'🎨', rating:4.8 },
      { id:'P009', name:'Kaspersky Endpoint Security',   category:'Security',   price:1340,  stock:999,unit:'license/yr', sku:'KS-ES-1YR',    supplier:'Kaspersky PH',      image:'🛡️', rating:4.7 },
      { id:'P010', name:'Logitech MX Keys S',            category:'Peripherals',price:5200,  stock:12, unit:'unit',       sku:'LG-MXK-S',     supplier:'Logitech PH',       image:'⌨️', rating:4.8 },
      { id:'P011', name:'Logitech MX Master 3S',         category:'Peripherals',price:4800,  stock:14, unit:'unit',       sku:'LG-MXM-3S',    supplier:'Logitech PH',       image:'🖱️', rating:4.9 },
      { id:'P012', name:'USB-C Hub 7-in-1',              category:'Peripherals',price:1850,  stock:25, unit:'unit',       sku:'ANK-A8346',    supplier:'Anker PH',          image:'🔌', rating:4.6 },
      { id:'P013', name:'HP LaserJet Pro M404dn',        category:'Printers',   price:22000, stock:4,  unit:'unit',       sku:'HP-LJ-M404DN', supplier:'HP Philippines',    image:'🖨️', rating:4.7 },
      { id:'P014', name:'Seagate IronWolf NAS 4TB',      category:'Storage',    price:8200,  stock:10, unit:'unit',       sku:'SG-IW-4TB',    supplier:'Seagate PH',        image:'💾', rating:4.7 },
      { id:'P015', name:'APC Smart-UPS 1500VA',          category:'Power',      price:18500, stock:5,  unit:'unit',       sku:'APC-SMT1500',  supplier:'APC Schneider',     image:'🔋', rating:4.8 },
    ]
  },
  getSuppliers: async () => {
    await delay(350)
    return [
      { id:'S001', name:'Dell Philippines',   category:'Hardware',   contact:'02-8888-3355', email:'sales.ph@dell.com',        accredited:true  },
      { id:'S002', name:'Lenovo PH',          category:'Hardware',   contact:'02-7703-2700', email:'sales@lenovo.com.ph',       accredited:true  },
      { id:'S003', name:'HP Philippines',     category:'Hardware',   contact:'02-8892-8100', email:'hp-sales@hp.com',           accredited:true  },
      { id:'S004', name:'Cisco PH',           category:'Network',    contact:'02-8841-2000', email:'cisco-ph@cisco.com',        accredited:true  },
      { id:'S005', name:'IT Solutions PH',    category:'Various',    contact:'09171234567',  email:'sales@itsolutions.com.ph',  accredited:true  },
      { id:'S006', name:'Microsoft PH',       category:'Software',   contact:'1800-1441-0304',email:'mssales@microsoft.com',   accredited:true  },
      { id:'S007', name:'Adobe Systems',      category:'Software',   contact:'1-800-833-6687',email:'adobe@adobe.com',         accredited:true  },
      { id:'S008', name:'Kaspersky PH',       category:'Security',   contact:'09272345678',  email:'sales@kaspersky.com.ph',    accredited:false },
      { id:'S009', name:'Logitech PH',        category:'Peripherals',contact:'02-7903-1234', email:'logitech@logitech.com.ph',  accredited:true  },
      { id:'S010', name:'Seagate PH',         category:'Storage',    contact:'1800-9888-7374',email:'seagate@seagate.com',     accredited:true  },
    ]
  },
}

export const requestsAPI = {
  getAll: async () => {
    await delay(550)
    return [
      { id:'REQ-2025-0214', title:'Laptops for New IT Hires',          requestedBy:'Maria Santos', department:'Administration', date:'2025-05-02', amount:105000, status:'pending',    priority:'high',   items:3,  category:'IT Equipment', note:'3 new hires starting June 1',            feedback:'' },
      { id:'REQ-2025-0213', title:'Network Switch Replacement',         requestedBy:'Juan Cruz',    department:'IT',            date:'2025-05-01', amount:170000, status:'approved',   priority:'high',   items:2,  category:'Network',       note:'Current switches failing intermittently', feedback:'Approved – proceed with procurement.' },
      { id:'REQ-2025-0212', title:'Microsoft 365 License Renewal',      requestedBy:'Ana Reyes',    department:'Finance',       date:'2025-04-30', amount:47500,  status:'approved',   priority:'medium', items:10, category:'Software',      note:'Licenses expire May 15',                 feedback:'Approved. PO issued.' },
      { id:'REQ-2025-0211', title:'Antivirus Renewal – Finance Dept',   requestedBy:'Ana Reyes',    department:'Finance',       date:'2025-04-28', amount:26800,  status:'for_review', priority:'high',   items:20, category:'Security',      note:'Licenses expire May 1',                  feedback:'' },
      { id:'REQ-2025-0210', title:'Wireless Peripherals for HR',        requestedBy:'Lisa Bautista',department:'HR',            date:'2025-04-25', amount:50000,  status:'rejected',   priority:'low',    items:10, category:'Peripherals',   note:'Old ones still functional',              feedback:'Rejected – defer to next quarter.' },
      { id:'REQ-2025-0209', title:'Server Storage Upgrade',             requestedBy:'Juan Cruz',    department:'IT',            date:'2025-04-22', amount:32800,  status:'approved',   priority:'high',   items:4,  category:'Storage',       note:'Server at 90% capacity',                 feedback:'Approved. Coordinate delivery.' },
      { id:'REQ-2025-0208', title:'USB-C Hubs for Finance Team',        requestedBy:'Ana Reyes',    department:'Finance',       date:'2025-04-20', amount:14800,  status:'approved',   priority:'low',    items:8,  category:'Peripherals',   note:'Team using new docking solutions',        feedback:'Approved.' },
    ]
  },
}

export const accessAPI = {
  getUsers: async () => {
    await delay(500)
    return [
      { id:1, name:'System Administrator', username:'admin',    email:'admin@prisma.gov.ph',   role:'admin',         department:'IT & Operations',       status:'active',   lastLogin:'2025-05-03 08:14', avatar:'SA', permissions:['Full System Access','Manage Catalog','Set Budget','Add Line Items','Manage Users','View All Reports'] },
      { id:2, name:'Juan Cruz',            username:'itstaff',  email:'jcruz@prisma.gov.ph',   role:'it_staff',      department:'Information Technology', status:'active',   lastLogin:'2025-05-03 09:02', avatar:'JC', permissions:['View Catalog','Purchase Items','Process Requests','Provide Feedback','View IT Budget','Budget Alerts'] },
      { id:3, name:'Maria Santos',         username:'staff',    email:'msantos@prisma.gov.ph', role:'regular_staff', department:'Administration',          status:'active',   lastLogin:'2025-05-02 14:30', avatar:'MS', permissions:['Submit Requests','View Own Requests','View Request Status'] },
      { id:4, name:'Ana Reyes',            username:'areyes',   email:'areyes@prisma.gov.ph',  role:'regular_staff', department:'Finance',                 status:'active',   lastLogin:'2025-05-01 14:30', avatar:'AR', permissions:['Submit Requests','View Own Requests','View Request Status'] },
      { id:5, name:'Carlos Mendoza',       username:'cmendoza', email:'cmendoza@prisma.gov.ph',role:'regular_staff', department:'Facilities',              status:'active',   lastLogin:'2025-04-30 16:10', avatar:'CM', permissions:['Submit Requests','View Own Requests','View Request Status'] },
      { id:6, name:'Lisa Bautista',        username:'lbautista',email:'lbautista@prisma.gov.ph',role:'regular_staff',department:'HR',                     status:'inactive', lastLogin:'2025-04-28 10:55', avatar:'LB', permissions:['Submit Requests','View Own Requests'] },
      { id:7, name:'Jenny Tan',            username:'jtan',     email:'jtan@prisma.gov.ph',    role:'regular_staff', department:'Marketing',               status:'active',   lastLogin:'2025-04-29 11:22', avatar:'JT', permissions:['Submit Requests','View Own Requests','View Request Status'] },
      { id:8, name:'Ramon Dela Cruz',      username:'rdelacruz',email:'rdelacruz@prisma.gov.ph',role:'it_staff',     department:'IT',                     status:'active',   lastLogin:'2025-04-27 09:15', avatar:'RD', permissions:['View Catalog','Purchase Items','Process Requests','Provide Feedback','View IT Budget','Budget Alerts'] },
    ]
  },
  getRoles: async () => {
    await delay(350)
    return [
      { id:'admin',         label:'Administrator',  color:'#ef4444', desc:'Full system access – manages catalog, suppliers, budget, and users.',                       count:1, icon:'👑', permissions:['Manage Catalog','Set Fiscal Year Budget','Add Line Items','Add Supplier Items','Approve Requests','View All Reports','Manage Users'] },
      { id:'it_staff',      label:'IT Staff',        color:'#06b6d4', desc:'IT Department – shops catalog, processes requests, provides feedback, receives budget alerts.',count:2, icon:'🖥️', permissions:['Browse & Purchase from Catalog','Process & Review Requests','Provide Feedback on Requests','Receive Budget Alerts','View IT Budget'] },
      { id:'regular_staff', label:'Regular Staff',   color:'#10b981', desc:'Any department – submits IT procurement requests only.',                                     count:5, icon:'👤', permissions:['Submit IT Procurement Requests','View Own Request Status','Receive Request Updates'] },
    ]
  },
}

export const reportsAPI = {
  getOverview: async () => {
    await delay(400)
    return { totalTransactions:541, totalProcessed:2340000, avgRequestAmount:43200, approvalRate:78, avgApprovalDays:2.4, topDepartment:'IT' }
  },
  getQuarterlyData: async () => {
    await delay(550)
    return [
      { quarter:'Q1 2024', budget:1200000, spent:980000,  saved:220000 },
      { quarter:'Q2 2024', budget:1300000, spent:1100000, saved:200000 },
      { quarter:'Q3 2024', budget:1100000, spent:870000,  saved:230000 },
      { quarter:'Q4 2024', budget:1400000, spent:1250000, saved:150000 },
      { quarter:'Q1 2025', budget:1250000, spent:940000,  saved:310000 },
      { quarter:'Q2 2025', budget:1300000, spent:400000,  saved:900000 },
    ]
  },
  getCategorySpend: async () => {
    await delay(500)
    return [
      { category:'IT Equipment',      amount:780000, pct:33, color:'#06b6d4' },
      { category:'Software & Licenses',amount:420000,pct:18, color:'#3b82f6' },
      { category:'Furniture',          amount:310000, pct:13, color:'#8b5cf6' },
      { category:'Office Supplies',    amount:250000, pct:11, color:'#10b981' },
      { category:'Medical & Safety',   amount:200000, pct:9,  color:'#f59e0b' },
      { category:'Marketing',          amount:180000, pct:8,  color:'#f43f5e' },
      { category:'Maintenance',        amount:130000, pct:6,  color:'#94a3b8' },
      { category:'Others',             amount:70000,  pct:3,  color:'#cbd5e1' },
    ]
  },
  getAvailableReports: async () => {
    await delay(320)
    return [
      { id:'R001', title:'Monthly Budget Utilization',    type:'Budget',      period:'April 2025', size:'1.2 MB', generated:'2025-05-01', format:'PDF' },
      { id:'R002', title:'Procurement Activity Summary',  type:'Procurement', period:'Q1 2025',    size:'3.4 MB', generated:'2025-04-01', format:'XLSX' },
      { id:'R003', title:'Department Spending Breakdown', type:'Budget',      period:'FY 2025',    size:'2.1 MB', generated:'2025-04-15', format:'PDF' },
      { id:'R004', title:'Vendor Performance Report',     type:'Procurement', period:'Q1 2025',    size:'980 KB', generated:'2025-04-10', format:'PDF' },
      { id:'R005', title:'Annual Audit Trail',            type:'Compliance',  period:'2024',       size:'8.7 MB', generated:'2025-01-15', format:'PDF' },
    ]
  },
}

export const settingsAPI = {
  getProfile: async () => {
    await delay(350)
    return { name:'System Administrator', username:'admin', email:'admin@prisma.gov.ph', department:'IT & Operations', phone:'+63 917 123 4567', role:'Administrator', joinDate:'January 15, 2024' }
  },
  getSystemSettings: async () => {
    await delay(280)
    return { fiscalYear:'2025', currency:'PHP', timezone:'Asia/Manila', dateFormat:'MM/DD/YYYY', approvalThreshold:50000, autoApprove:false, emailNotifications:true, smsAlerts:false, budgetWarningPct:80, twoFactorAuth:false }
  },
}

export const notificationsAPI = {
  getAll: async () => {
    await delay(350)
    return [
      { id:1, type:'approval', message:'Laptop Units request is pending your approval', time:'2 min ago', read:false },
      { id:2, type:'alert',    message:'IT Department budget at 78% utilization',        time:'1 hr ago',  read:false },
      { id:3, type:'info',     message:'Monthly procurement report is ready',             time:'3 hrs ago', read:true  },
      { id:4, type:'success',  message:'Software License Renewal has been processed',    time:'Yesterday', read:true  },
      { id:5, type:'alert',    message:'Q2 budget review meeting scheduled for May 10',  time:'2 days ago',read:true  },
    ]
  },
}
