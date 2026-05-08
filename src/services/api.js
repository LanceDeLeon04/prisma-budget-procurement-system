// ================================================================
// PRISMA – Mock API  (IT Procurement Only)
// OpEx: consumables, licenses, maintenance, services
// CapEx: hardware, equipment, infrastructure
// Roles: admin | it_staff | regular_staff
// ================================================================
const delay = ms => new Promise(r => setTimeout(r, ms))

const USERS = [
  { id:1, username:'admin',   password:'admin',   name:'System Administrator', role:'admin',         department:'IT & Operations',       email:'admin@prisma.gov.ph',   avatar:'SA' },
  { id:2, username:'itstaff', password:'itstaff', name:'Juan Cruz',            role:'it_staff',      department:'Information Technology', email:'jcruz@prisma.gov.ph',   avatar:'JC' },
  { id:3, username:'staff',   password:'staff',   name:'Maria Santos',         role:'regular_staff', department:'Administration',          email:'msantos@prisma.gov.ph', avatar:'MS' },
]

export const authAPI = {
  login: async (username, password) => {
    await delay(1100)
    const u = USERS.find(u => u.username===username && u.password===password)
    if (u) { const {password:_,...safe}=u; return {...safe,token:`jwt-${safe.role}-2025`} }
    throw new Error('Invalid username or password')
  },
}

// ── BUDGET ────────────────────────────────────────────────────────
export const budgetAPI = {
  getSummary: async () => {
    await delay(400)
    return {
      opex:  { total:1800000, spent:1240000, remaining:560000, pct:69 },
      capex: { total:3200000, spent:1100000, remaining:2100000, pct:34 },
      totalBudget:5000000, totalSpent:2340000, totalRemaining:2660000,
      pendingRequests:7, approvedThisMonth:12, fiscalYear:'FY 2025',
    }
  },
  getDeptBudget: async (dept) => {
    await delay(350)
    const depts = {
      'Administration':  { opex:{total:300000,spent:185000,remaining:115000,pct:62}, capex:{total:200000,spent:80000,remaining:120000,pct:40} },
      'Finance':         { opex:{total:250000,spent:160000,remaining:90000,pct:64},  capex:{total:180000,spent:60000,remaining:120000,pct:33} },
      'HR':              { opex:{total:200000,spent:95000,remaining:105000,pct:48},   capex:{total:150000,spent:40000,remaining:110000,pct:27} },
      'Marketing':       { opex:{total:280000,spent:210000,remaining:70000,pct:75},   capex:{total:120000,spent:70000,remaining:50000,pct:58} },
      'Operations':      { opex:{total:220000,spent:100000,remaining:120000,pct:45},  capex:{total:180000,spent:55000,remaining:125000,pct:31} },
      'IT & Operations': { opex:{total:550000,spent:490000,remaining:60000,pct:89},   capex:{total:600000,spent:795000,remaining:-195000,pct:103} },
    }
    return depts[dept] || depts['Administration']
  },
  getLineItems: async () => {
    await delay(480)
    return [
      // CapEx
      { id:'LI-C01', name:'Laptops & Workstations',    type:'capex', category:'Endpoint Devices',  allocated:800000,  spent:612000, remaining:188000, utilization:77, warningPct:80 },
      { id:'LI-C02', name:'Network Infrastructure',     type:'capex', category:'Network Equipment', allocated:450000,  spent:180000, remaining:270000, utilization:40, warningPct:80 },
      { id:'LI-C03', name:'Servers & Storage',          type:'capex', category:'Server Hardware',   allocated:950000,  spent:70000,  remaining:880000, utilization:7,  warningPct:80 },
      { id:'LI-C04', name:'Peripherals & Accessories',  type:'capex', category:'Endpoint Devices',  allocated:200000,  spent:118500, remaining:81500,  utilization:59, warningPct:80 },
      { id:'LI-C05', name:'Printers & Scanners',        type:'capex', category:'Output Devices',    allocated:200000,  spent:85000,  remaining:115000, utilization:43, warningPct:80 },
      // OpEx
      { id:'LI-O01', name:'Software Licenses',          type:'opex',  category:'Software',          allocated:600000,  spent:395000, remaining:205000, utilization:66, warningPct:80 },
      { id:'LI-O02', name:'Cloud Services & Hosting',   type:'opex',  category:'Cloud & SaaS',      allocated:500000,  spent:420000, remaining:80000,  utilization:84, warningPct:80 },
      { id:'LI-O03', name:'IT Security & Antivirus',    type:'opex',  category:'Security Software', allocated:300000,  spent:267000, remaining:33000,  utilization:89, warningPct:80 },
      { id:'LI-O04', name:'Maintenance & Support',      type:'opex',  category:'Services',          allocated:200000,  spent:85000,  remaining:115000, utilization:43, warningPct:80 },
    ]
  },
  getTransactions: async () => {
    await delay(500)
    return [
      { id:'TXN-0541', date:'2025-05-01', lineItem:'LI-O02', lineItemName:'Cloud Services',      description:'AWS EC2 Reserved Instances Q2',          amount:120000, type:'debit',  ref:'PO-0541', by:'Juan Cruz',    expType:'opex'  },
      { id:'TXN-0540', date:'2025-04-30', lineItem:'LI-C01', lineItemName:'Laptops & Workstations',description:'Dell Latitude 5540 x5',                 amount:175000, type:'debit',  ref:'PO-0540', by:'Juan Cruz',    expType:'capex' },
      { id:'TXN-0539', date:'2025-04-27', lineItem:'LI-O01', lineItemName:'Software Licenses',    description:'Microsoft 365 Business Premium x20',     amount:95000,  type:'debit',  ref:'PO-0539', by:'Juan Cruz',    expType:'opex'  },
      { id:'TXN-0538', date:'2025-04-25', lineItem:'LI-O03', lineItemName:'IT Security',          description:'Kaspersky Endpoint Security x50',        amount:67000,  type:'debit',  ref:'PO-0538', by:'Juan Cruz',    expType:'opex'  },
      { id:'TXN-0537', date:'2025-04-23', lineItem:'LI-C04', lineItemName:'Peripherals',          description:'Logitech MX Keys + MX Master x5',        amount:18500,  type:'debit',  ref:'PO-0537', by:'Juan Cruz',    expType:'capex' },
      { id:'TXN-0536', date:'2025-04-20', lineItem:'LI-C02', lineItemName:'Network Infrastructure',description:'Cisco Catalyst 2960-X x2',              amount:80000,  type:'debit',  ref:'PO-0536', by:'Juan Cruz',    expType:'capex' },
      { id:'TXN-0535', date:'2025-04-01', lineItem:'—',      lineItemName:'Budget Release',       description:'Q2 2025 IT Procurement Budget Released',  amount:2500000,type:'credit', ref:'REL-Q2',  by:'Admin',        expType:null    },
    ]
  },
}

// ── CATALOG ───────────────────────────────────────────────────────
// expType: capex = physical assets, opex = software/services/consumables
export const shopAPI = {
  getCatalog: async () => {
    await delay(600)
    return [
      // CapEx – Endpoint Devices
      { id:'P001', name:'Dell Latitude 5540 Laptop',       expType:'capex', category:'Laptops',         price:35000,  stock:8,   unit:'unit',        sku:'DL-LAT-5540',   supplier:'Dell Philippines',   specs:'Intel i5-13th Gen, 16GB RAM, 512GB SSD, Win11 Pro',  lineItem:'LI-C01' },
      { id:'P002', name:'Lenovo ThinkPad E15 Gen 4',       expType:'capex', category:'Laptops',         price:32000,  stock:5,   unit:'unit',        sku:'LN-TP-E15G4',   supplier:'Lenovo PH',          specs:'Intel i5-12th Gen, 16GB RAM, 512GB SSD, Win11 Pro',  lineItem:'LI-C01' },
      { id:'P003', name:'HP EliteBook 840 G10',            expType:'capex', category:'Laptops',         price:42000,  stock:4,   unit:'unit',        sku:'HP-EB-840G10',  supplier:'HP Philippines',     specs:'Intel i7-13th Gen, 32GB RAM, 1TB SSD, Win11 Pro',    lineItem:'LI-C01' },
      { id:'P004', name:'HP EliteDesk 800 G9 SFF',         expType:'capex', category:'Desktops',        price:28000,  stock:3,   unit:'unit',        sku:'HP-ED-800G9',   supplier:'HP Philippines',     specs:'Intel i7-12th Gen, 16GB RAM, 1TB SSD',               lineItem:'LI-C01' },
      { id:'P005', name:'Dell UltraSharp 27" 4K Monitor',  expType:'capex', category:'Monitors',        price:22000,  stock:10,  unit:'unit',        sku:'DL-US-U2722D',  supplier:'Dell Philippines',   specs:'27 inch IPS 4K, USB-C 90W, 60Hz, Height Adjust',     lineItem:'LI-C01' },
      { id:'P006', name:'LG 24" Full HD IPS Monitor',      expType:'capex', category:'Monitors',        price:9500,   stock:15,  unit:'unit',        sku:'LG-24MK400',    supplier:'LG PH',              specs:'24 inch IPS FHD, VGA+HDMI, 75Hz',                    lineItem:'LI-C01' },
      // CapEx – Network
      { id:'P007', name:'Cisco Catalyst 2960-X 24-Port',   expType:'capex', category:'Switches',        price:85000,  stock:4,   unit:'unit',        sku:'CS-CAT-2960X',  supplier:'Cisco Philippines',  specs:'24x GbE PoE+, 4x SFP+, Layer 2',                    lineItem:'LI-C02' },
      { id:'P008', name:'Ubiquiti UniFi AP-AC Pro',         expType:'capex', category:'Access Points',   price:8500,   stock:12,  unit:'unit',        sku:'UB-UAP-ACPRO', supplier:'IT Solutions PH',    specs:'802.11ac Wave 2, Dual Band, Indoor',                 lineItem:'LI-C02' },
      { id:'P009', name:'TP-Link TL-SG1024D 24-Port',      expType:'capex', category:'Switches',        price:5200,   stock:8,   unit:'unit',        sku:'TP-SG1024D',    supplier:'IT Solutions PH',    specs:'24-Port Gigabit Unmanaged Desktop Switch',           lineItem:'LI-C02' },
      { id:'P010', name:'Fortinet FortiGate 60F Firewall', expType:'capex', category:'Security Hardware',price:95000,  stock:2,   unit:'unit',        sku:'FT-FG-60F',     supplier:'Fortinet PH',        specs:'Next-Gen Firewall, 10 GbE, SSL Inspection',          lineItem:'LI-C02' },
      // CapEx – Servers
      { id:'P011', name:'Dell PowerEdge R750 Server',      expType:'capex', category:'Servers',         price:350000, stock:2,   unit:'unit',        sku:'DL-PE-R750',    supplier:'Dell Philippines',   specs:'Dual Xeon, 64GB RAM, 4x2TB SSD RAID',               lineItem:'LI-C03' },
      { id:'P012', name:'Seagate IronWolf NAS 4TB',        expType:'capex', category:'Storage',         price:8200,   stock:10,  unit:'unit',        sku:'SG-IW-4TB',     supplier:'Seagate PH',         specs:'3.5 inch SATA, 5400 RPM, NAS Optimized',            lineItem:'LI-C03' },
      { id:'P013', name:'APC Smart-UPS 1500VA LCD',        expType:'capex', category:'Power',           price:18500,  stock:5,   unit:'unit',        sku:'APC-SMT1500',   supplier:'APC Schneider',      specs:'1500VA / 980W, LCD Panel, USB, 8 Outlets',           lineItem:'LI-C03' },
      // CapEx – Peripherals
      { id:'P014', name:'Logitech MX Keys S Keyboard',     expType:'capex', category:'Keyboards',       price:5200,   stock:12,  unit:'unit',        sku:'LG-MXK-S',      supplier:'Logitech PH',        specs:'Wireless Bluetooth, Multi-device, Backlit Keys',     lineItem:'LI-C04' },
      { id:'P015', name:'Logitech MX Master 3S Mouse',     expType:'capex', category:'Mice',            price:4800,   stock:14,  unit:'unit',        sku:'LG-MXM-3S',     supplier:'Logitech PH',        specs:'Wireless, 8000 DPI, Quiet Clicks, USB-C Charge',     lineItem:'LI-C04' },
      { id:'P016', name:'USB-C Hub 7-in-1',                expType:'capex', category:'Accessories',     price:1850,   stock:25,  unit:'unit',        sku:'ANK-A8346',     supplier:'Anker PH',           specs:'HDMI 4K, 3x USB-A, SD+MicroSD, PD 100W',            lineItem:'LI-C04' },
      { id:'P017', name:'Webcam Logitech C920 HD Pro',     expType:'capex', category:'Accessories',     price:3200,   stock:10,  unit:'unit',        sku:'LG-C920',       supplier:'Logitech PH',        specs:'1080p/30fps, Built-in Stereo Mic, USB-A',            lineItem:'LI-C04' },
      // CapEx – Printers
      { id:'P018', name:'HP LaserJet Pro M404dn',          expType:'capex', category:'Printers',        price:22000,  stock:4,   unit:'unit',        sku:'HP-LJ-M404DN',  supplier:'HP Philippines',     specs:'Duplex, LAN, 38ppm, PCL6, A4',                      lineItem:'LI-C05' },
      { id:'P019', name:'Epson EcoTank L15150 A3',         expType:'capex', category:'Printers',        price:28000,  stock:3,   unit:'unit',        sku:'EP-L15150',     supplier:'Epson PH',           specs:'Wi-Fi, A3, Print/Scan/Copy/Fax, Ink Tank',          lineItem:'LI-C05' },
      // OpEx – Software Licenses
      { id:'P020', name:'Microsoft 365 Business Premium',  expType:'opex',  category:'Productivity',    price:4750,   stock:999, unit:'license/yr',  sku:'MS-365-BP',     supplier:'Microsoft PH',       specs:'Word, Excel, Teams, 1TB OneDrive, 1 User 1 Year',    lineItem:'LI-O01' },
      { id:'P021', name:'Adobe Creative Cloud All Apps',   expType:'opex',  category:'Design Software', price:9500,   stock:999, unit:'license/yr',  sku:'ADO-CC-ALL',    supplier:'Adobe Systems',      specs:'Photoshop, Illustrator, Premiere, 1 User 1 Year',    lineItem:'LI-O01' },
      { id:'P022', name:'AutoCAD LT Subscription',         expType:'opex',  category:'CAD Software',    price:18000,  stock:999, unit:'license/yr',  sku:'ADSK-ACAD-LT',  supplier:'Autodesk PH',        specs:'2D Drafting & Documentation, 1 User 1 Year',         lineItem:'LI-O01' },
      // OpEx – Cloud & SaaS
      { id:'P023', name:'AWS EC2 Reserved Instance 1yr',   expType:'opex',  category:'Cloud Compute',   price:120000, stock:999, unit:'instance/yr', sku:'AWS-EC2-RI1Y',  supplier:'Amazon Web Services', specs:'t3.large, 2 vCPU, 8GB RAM, 1 Year Reserved',       lineItem:'LI-O02' },
      { id:'P024', name:'Azure Virtual Machine B2s 1yr',   expType:'opex',  category:'Cloud Compute',   price:95000,  stock:999, unit:'instance/yr', sku:'AZ-VM-B2S-1Y',  supplier:'Microsoft Azure',    specs:'2 vCPU, 4GB RAM, Windows Server, 1 Year',           lineItem:'LI-O02' },
      { id:'P025', name:'Google Workspace Business Plus',  expType:'opex',  category:'Cloud SaaS',      price:3200,   stock:999, unit:'user/yr',     sku:'GWS-BIZ-PLUS',  supplier:'Google PH',          specs:'Gmail, Drive 5TB, Meet, Admin Console, 1 Year',      lineItem:'LI-O02' },
      // OpEx – Security
      { id:'P026', name:'Kaspersky Endpoint Security 1yr', expType:'opex',  category:'Antivirus',       price:1340,   stock:999, unit:'license/yr',  sku:'KS-ES-1YR',     supplier:'Kaspersky PH',       specs:'Endpoint Protection, Firewall, 1 Device 1 Year',     lineItem:'LI-O03' },
      { id:'P027', name:'Bitdefender GravityZone Biz 1yr', expType:'opex',  category:'Antivirus',       price:1580,   stock:999, unit:'license/yr',  sku:'BD-GZ-BIZ',     supplier:'Bitdefender PH',     specs:'Next-Gen Antivirus, EDR, 1 Endpoint 1 Year',         lineItem:'LI-O03' },
      { id:'P028', name:'ManageEngine IT Help Desk Plus',  expType:'opex',  category:'ITSM',            price:85000,  stock:999, unit:'license/yr',  sku:'ME-ITHDP-1Y',   supplier:'ManageEngine PH',    specs:'ITSM Platform, Unlimited Requests, 5 Techs 1 Year',  lineItem:'LI-O03' },
      // OpEx – Maintenance
      { id:'P029', name:'Annual Hardware Maintenance SLA', expType:'opex',  category:'Maintenance',     price:45000,  stock:999, unit:'contract/yr', sku:'SVC-HW-SLA',    supplier:'IT Solutions PH',    specs:'Preventive Maintenance, On-site Support, 1 Year',    lineItem:'LI-O04' },
      { id:'P030', name:'Network Monitoring Service 1yr',  expType:'opex',  category:'Managed Services',price:60000,  stock:999, unit:'service/yr',  sku:'SVC-NOC-1YR',   supplier:'IT Solutions PH',    specs:'24/7 NOC, Alerting, Monthly Reports, 1 Year',        lineItem:'LI-O04' },
    ]
  },
  getSuppliers: async () => {
    await delay(300)
    return [
      { id:'S001', name:'Dell Philippines',    category:'Hardware',  contact:'02-8888-3355', email:'sales.ph@dell.com',          accredited:true  },
      { id:'S002', name:'Lenovo PH',           category:'Hardware',  contact:'02-7703-2700', email:'sales@lenovo.com.ph',         accredited:true  },
      { id:'S003', name:'HP Philippines',      category:'Hardware',  contact:'02-8892-8100', email:'hp-sales@hp.com',             accredited:true  },
      { id:'S004', name:'Cisco Philippines',   category:'Network',   contact:'02-8841-2000', email:'cisco-ph@cisco.com',          accredited:true  },
      { id:'S005', name:'IT Solutions PH',     category:'Various',   contact:'09171234567',  email:'sales@itsolutions.com.ph',    accredited:true  },
      { id:'S006', name:'Microsoft PH',        category:'Software',  contact:'1800-1441-0304',email:'mssales@microsoft.com',     accredited:true  },
      { id:'S007', name:'Adobe Systems',       category:'Software',  contact:'1-800-833-6687',email:'adobe@adobe.com',           accredited:true  },
      { id:'S008', name:'Kaspersky PH',        category:'Security',  contact:'09272345678',  email:'sales@kaspersky.com.ph',      accredited:false },
      { id:'S009', name:'Logitech PH',         category:'Peripherals',contact:'02-7903-1234',email:'logitech@logitech.com.ph',   accredited:true  },
      { id:'S010', name:'Amazon Web Services', category:'Cloud',     contact:'1800-1315-2100',email:'aws-ph@amazon.com',         accredited:true  },
      { id:'S011', name:'Microsoft Azure',     category:'Cloud',     contact:'1800-1441-0304',email:'azure@microsoft.com',       accredited:true  },
      { id:'S012', name:'Google PH',           category:'Cloud',     contact:'02-8849-5858', email:'google-sales@google.com',     accredited:true  },
      { id:'S013', name:'Fortinet PH',         category:'Security',  contact:'02-7792-1000', email:'fortinet@fortinet.com.ph',   accredited:true  },
      { id:'S014', name:'Seagate PH',          category:'Storage',   contact:'1800-9888-7374',email:'seagate@seagate.com',      accredited:true  },
      { id:'S015', name:'APC Schneider',       category:'Power',     contact:'02-8799-2000', email:'apc@schneider-electric.com',  accredited:true  },
    ]
  },
}

// ── REQUESTS ──────────────────────────────────────────────────────
export const requestsAPI = {
  getAll: async () => {
    await delay(500)
    return [
      {
        id:'REQ-2025-0214', title:'Laptops for New Admin Hires',
        requestedBy:'Maria Santos', requestorRole:'regular_staff', department:'Administration',
        date:'2025-05-02', expType:'capex', lineItem:'LI-C01', lineItemName:'Laptops & Workstations',
        items:[{productId:'P001',name:'Dell Latitude 5540 Laptop',qty:3,unitPrice:35000,sku:'DL-LAT-5540'}],
        total:105000, status:'pending', priority:'high',
        note:'3 new hires starting June 1. Current pool exhausted.',
        feedback:'', changeJustification:'', changedItems:null,
      },
      {
        id:'REQ-2025-0213', title:'Network Switch Replacement',
        requestedBy:'Juan Cruz', requestorRole:'it_staff', department:'Information Technology',
        date:'2025-05-01', expType:'capex', lineItem:'LI-C02', lineItemName:'Network Infrastructure',
        items:[{productId:'P007',name:'Cisco Catalyst 2960-X 24-Port',qty:2,unitPrice:85000,sku:'CS-CAT-2960X'}],
        total:170000, status:'approved', priority:'high',
        note:'Current switches failing intermittently. Risk of network outage.',
        feedback:'Approved. Coordinate delivery schedule with vendor.', changeJustification:'', changedItems:null,
      },
      {
        id:'REQ-2025-0212', title:'Microsoft 365 License Renewal',
        requestedBy:'Ana Reyes', requestorRole:'regular_staff', department:'Finance',
        date:'2025-04-30', expType:'opex', lineItem:'LI-O01', lineItemName:'Software Licenses',
        items:[{productId:'P020',name:'Microsoft 365 Business Premium',qty:10,unitPrice:4750,sku:'MS-365-BP'}],
        total:47500, status:'approved', priority:'medium',
        note:'Licenses expire May 15. Renewal required to avoid disruption.',
        feedback:'Approved. PO issued, IT Staff to coordinate with vendor.', changeJustification:'', changedItems:null,
      },
      {
        id:'REQ-2025-0211', title:'Antivirus Renewal – Finance Dept',
        requestedBy:'Ana Reyes', requestorRole:'regular_staff', department:'Finance',
        date:'2025-04-28', expType:'opex', lineItem:'LI-O03', lineItemName:'IT Security & Antivirus',
        items:[{productId:'P026',name:'Kaspersky Endpoint Security 1yr',qty:20,unitPrice:1340,sku:'KS-ES-1YR'}],
        total:26800, status:'for_review', priority:'high',
        note:'Licenses expire May 1. Urgent renewal needed.',
        feedback:'', changeJustification:'', changedItems:null,
      },
      {
        id:'REQ-2025-0210', title:'Wireless Peripherals for HR Team',
        requestedBy:'Lisa Bautista', requestorRole:'regular_staff', department:'HR',
        date:'2025-04-25', expType:'capex', lineItem:'LI-C04', lineItemName:'Peripherals & Accessories',
        items:[
          {productId:'P014',name:'Logitech MX Keys S Keyboard',qty:5,unitPrice:5200,sku:'LG-MXK-S'},
          {productId:'P015',name:'Logitech MX Master 3S Mouse',qty:5,unitPrice:4800,sku:'LG-MXM-3S'},
        ],
        total:50000, status:'rejected', priority:'low',
        note:'Current peripherals still functional. Requesting upgrade.',
        feedback:'Rejected. Defer to Q3. Existing peripherals are serviceable.', changeJustification:'', changedItems:null,
      },
      {
        id:'REQ-2025-0209', title:'Server Storage Expansion',
        requestedBy:'Juan Cruz', requestorRole:'it_staff', department:'Information Technology',
        date:'2025-04-22', expType:'capex', lineItem:'LI-C03', lineItemName:'Servers & Storage',
        items:[{productId:'P012',name:'Seagate IronWolf NAS 4TB',qty:4,unitPrice:8200,sku:'SG-IW-4TB'}],
        total:32800, status:'approved', priority:'high',
        note:'File server at 90% storage capacity. Expansion critical.',
        feedback:'Approved. Coordinate delivery and installation schedule.', changeJustification:'', changedItems:null,
      },
    ]
  },
}

// ── ACCESS CONTROL ────────────────────────────────────────────────
export const accessAPI = {
  getUsers: async () => {
    await delay(450)
    return [
      { id:1, name:'System Administrator', username:'admin',    email:'admin@prisma.gov.ph',    role:'admin',         department:'IT & Operations',       status:'active',   lastLogin:'2025-05-03 08:14', avatar:'SA' },
      { id:2, name:'Juan Cruz',            username:'itstaff',  email:'jcruz@prisma.gov.ph',    role:'it_staff',      department:'Information Technology', status:'active',   lastLogin:'2025-05-03 09:02', avatar:'JC' },
      { id:3, name:'Maria Santos',         username:'staff',    email:'msantos@prisma.gov.ph',  role:'regular_staff', department:'Administration',          status:'active',   lastLogin:'2025-05-02 14:30', avatar:'MS' },
      { id:4, name:'Ana Reyes',            username:'areyes',   email:'areyes@prisma.gov.ph',   role:'regular_staff', department:'Finance',                 status:'active',   lastLogin:'2025-05-01 14:30', avatar:'AR' },
      { id:5, name:'Carlos Mendoza',       username:'cmendoza', email:'cmendoza@prisma.gov.ph', role:'regular_staff', department:'Facilities',              status:'active',   lastLogin:'2025-04-30 16:10', avatar:'CM' },
      { id:6, name:'Lisa Bautista',        username:'lbautista',email:'lbautista@prisma.gov.ph',role:'regular_staff', department:'HR',                     status:'inactive', lastLogin:'2025-04-28 10:55', avatar:'LB' },
      { id:7, name:'Ramon Dela Cruz',      username:'rdelacruz',email:'rdelacruz@prisma.gov.ph',role:'it_staff',      department:'Information Technology', status:'active',   lastLogin:'2025-04-27 09:15', avatar:'RD' },
    ]
  },
  getRoles: async () => {
    await delay(280)
    return [
      {
        id:'admin', label:'Administrator', color:'#ef4444',
        permissions:['Full System Access','Approve / Deny Requests','Manage Catalog & Suppliers','Set Fiscal Year Budget','Add OpEx & CapEx Line Items','View All Reports & Analytics','Manage Users & Roles','Receive Budget Overspend Alerts (OpEx & CapEx)'],
      },
      {
        id:'it_staff', label:'IT Staff', color:'#06b6d4',
        permissions:['Browse & Purchase Catalog','Approve / Decline Requests','Change Order Items (with Justification)','Process Purchase Orders','View IT Budget Allocation','Receive Budget Alerts (OpEx & CapEx)','View IT Reports'],
      },
      {
        id:'regular_staff', label:'Regular Staff', color:'#10b981',
        permissions:['Submit IT Purchase Requests via Shop','View Own Request Status & Feedback','View Department Budget (OpEx & CapEx only)','Receive Over-Budget Alerts for Department','View Department-level Reports'],
      },
    ]
  },
}

// ── REPORTS ───────────────────────────────────────────────────────
export const reportsAPI = {
  getSummary: async () => {
    await delay(380)
    return { totalPOs:541, totalValue:2340000, approvalRate:82, avgProcessDays:1.8, opexSpend:1240000, capexSpend:1100000 }
  },
  getMonthlyTrend: async () => {
    await delay(500)
    return [
      { month:'Nov 24', opex:180000, capex:240000 },
      { month:'Dec 24', opex:210000, capex:310000 },
      { month:'Jan 25', opex:195000, capex:95000  },
      { month:'Feb 25', opex:220000, capex:290000 },
      { month:'Mar 25', opex:215000, capex:125000 },
      { month:'Apr 25', opex:220000, capex:264500 },
    ]
  },
  getCategoryBreakdown: async () => {
    await delay(450)
    return [
      { category:'Laptops & Workstations', amount:612000, pct:26, color:'#3b82f6',  type:'capex' },
      { category:'Cloud Services',          amount:420000, pct:18, color:'#06b6d4',  type:'opex'  },
      { category:'Software Licenses',       amount:395000, pct:17, color:'#8b5cf6',  type:'opex'  },
      { category:'IT Security',             amount:267000, pct:11, color:'#ef4444',  type:'opex'  },
      { category:'Network Infrastructure',  amount:180000, pct:8,  color:'#f59e0b',  type:'capex' },
      { category:'Peripherals',             amount:118500, pct:5,  color:'#10b981',  type:'capex' },
      { category:'Servers & Storage',       amount:70000,  pct:3,  color:'#64748b',  type:'capex' },
      { category:'Maintenance & SLA',       amount:85000,  pct:4,  color:'#94a3b8',  type:'opex'  },
      { category:'Printers',                amount:85000,  pct:4,  color:'#cbd5e1',  type:'capex' },
      { category:'Others',                  amount:107500, pct:4,  color:'#e2e8f0',  type:'opex'  },
    ]
  },
  getDeptReport: async (dept) => {
    await delay(400)
    return {
      dept,
      totalRequests: 8,
      approved:5, pending:2, rejected:1,
      opexSpend:185000, opexBudget:300000,
      capexSpend:80000,  capexBudget:200000,
      monthlyTrend:[
        { month:'Nov 24', opex:22000, capex:8000  },
        { month:'Dec 24', opex:28000, capex:40000 },
        { month:'Jan 25', opex:30000, capex:0     },
        { month:'Feb 25', opex:35000, capex:12000 },
        { month:'Mar 25', opex:32000, capex:0     },
        { month:'Apr 25', opex:38000, capex:20000 },
      ],
    }
  },
  getFiles: async () => {
    await delay(300)
    return [
      { id:'R001', title:'Monthly Budget Utilization',      type:'Budget',      period:'April 2025', size:'1.2 MB', generated:'2025-05-01', format:'PDF' },
      { id:'R002', title:'OpEx vs CapEx Spend Analysis',    type:'Finance',     period:'Q1 2025',    size:'2.4 MB', generated:'2025-04-15', format:'XLSX' },
      { id:'R003', title:'Procurement Activity Summary',    type:'Procurement', period:'Q1 2025',    size:'3.4 MB', generated:'2025-04-01', format:'XLSX' },
      { id:'R004', title:'Vendor Performance Report',       type:'Procurement', period:'Q1 2025',    size:'980 KB', generated:'2025-04-10', format:'PDF' },
      { id:'R005', title:'Annual IT Audit Trail',           type:'Compliance',  period:'2024',       size:'8.7 MB', generated:'2025-01-15', format:'PDF' },
    ]
  },
}

// ── NOTIFICATIONS ─────────────────────────────────────────────────
export const notificationsAPI = {
  getForRole: async (role, dept) => {
    await delay(300)
    const all = {
      admin: [
        { id:1, type:'alert',   msg:'CapEx line item "IT Security" at 89% — only ₱33k remaining',      time:'10 min ago', read:false },
        { id:2, type:'alert',   msg:'OpEx line item "Cloud Services" at 84% — only ₱80k remaining',    time:'30 min ago', read:false },
        { id:3, type:'approval',msg:'REQ-2025-0211 awaiting admin approval (Antivirus Renewal)',         time:'1 hr ago',   read:false },
        { id:4, type:'info',    msg:'Supplier "Kaspersky PH" accreditation pending review',              time:'3 hrs ago',  read:true  },
        { id:5, type:'success', msg:'Q2 2025 budget successfully released — ₱2.5M',                     time:'2 days ago', read:true  },
      ],
      it_staff: [
        { id:1, type:'alert',   msg:'OpEx alert: Cloud Services at 84% — ₱80k remaining',              time:'30 min ago', read:false },
        { id:2, type:'alert',   msg:'OpEx alert: IT Security at 89% — ₱33k remaining',                 time:'2 hrs ago',  read:false },
        { id:3, type:'approval',msg:'REQ-2025-0214 submitted by Maria Santos — action required',         time:'4 hrs ago',  read:false },
        { id:4, type:'success', msg:'REQ-2025-0213 approved — Cisco switch PO issued',                  time:'Yesterday',  read:true  },
      ],
      regular_staff: [
        { id:1, type:'success', msg:'REQ-2025-0212 approved — Microsoft 365 licenses ordered',           time:'1 hr ago',   read:false },
        { id:2, type:'info',    msg:'REQ-2025-0214 is under IT Staff review',                            time:'3 hrs ago',  read:true  },
        { id:3, type:'alert',   msg:`OpEx budget for ${dept} at 62% utilization`,                       time:'Yesterday',  read:true  },
        { id:4, type:'alert',   msg:'REQ-2025-0210 rejected — see IT Staff feedback',                   time:'2 days ago', read:true  },
      ],
    }
    return all[role] || []
  },
}

export const settingsAPI = {
  getProfile: async () => { await delay(300); return { name:'System Administrator', username:'admin', email:'admin@prisma.gov.ph', department:'IT & Operations', phone:'+63 917 123 4567', role:'Administrator', joinDate:'January 15, 2024' } },
  getSystemSettings: async () => { await delay(250); return { fiscalYear:'2025', currency:'PHP', timezone:'Asia/Manila', dateFormat:'MM/DD/YYYY', approvalThreshold:50000, autoApprove:false, emailNotifications:true, smsAlerts:false, budgetWarningPct:80, twoFactorAuth:false } },
}

// ── PROCUREMENT API (alias for Dashboard compatibility) ───────────
export const procurementAPI = {
  getRecentActivity: async () => {
    await delay(500)
    return [
      { id:1, item:'Dell Latitude 5540 Laptop x3',   department:'Administration', amount:105000, status:'pending',    date:'2025-05-02', requestedBy:'Maria Santos' },
      { id:2, item:'Cisco Catalyst 2960-X x2',        department:'IT',            amount:170000, status:'approved',   date:'2025-05-01', requestedBy:'Juan Cruz'    },
      { id:3, item:'Microsoft 365 License x10',       department:'Finance',       amount:47500,  status:'approved',   date:'2025-04-30', requestedBy:'Ana Reyes'    },
      { id:4, item:'Kaspersky Endpoint x20',          department:'Finance',       amount:26800,  status:'for_review', date:'2025-04-28', requestedBy:'Ana Reyes'    },
      { id:5, item:'Seagate IronWolf NAS 4TB x4',     department:'IT',            amount:32800,  status:'approved',   date:'2025-04-22', requestedBy:'Juan Cruz'    },
    ]
  },
  getMonthlySpending: async () => {
    await delay(500)
    return [
      { month:'Nov', spent:220000, budget:416000, opex:100000, capex:120000 },
      { month:'Dec', spent:310000, budget:416000, opex:140000, capex:170000 },
      { month:'Jan', spent:185000, budget:416000, opex:95000,  capex:90000  },
      { month:'Feb', spent:410000, budget:416000, opex:200000, capex:210000 },
      { month:'Mar', spent:268000, budget:416000, opex:130000, capex:138000 },
      { month:'Apr', spent:264500, budget:416000, opex:120000, capex:144500 },
    ]
  },
  getDepartmentBreakdown: async () => {
    await delay(500)
    return [
      { department:'IT',            spent:890000, color:'#06b6d4' },
      { department:'Administration',spent:185000, color:'#3b82f6' },
      { department:'Finance',       spent:220000, color:'#8b5cf6' },
      { department:'HR',            spent:95000,  color:'#10b981' },
      { department:'Facilities',    spent:80000,  color:'#f59e0b' },
      { department:'Operations',    spent:55000,  color:'#64748b' },
    ]
  },
}
