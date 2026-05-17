import { useEffect, useState, useCallback } from 'react'
import PageLayout from '../components/PageLayout'
import { subscriptionsAPI } from '../services/api'
import { useRole } from '../hooks/useRole'

const fmt  = n => '₱' + Number(n ?? 0).toLocaleString()
const fmtM = n => n >= 1000000 ? '₱'+(n/1000000).toFixed(2)+'M' : n >= 1000 ? '₱'+(n/1000).toFixed(1)+'k' : '₱'+n

const DEPT_COLORS = {
  'IT':'#06b6d4','Administration':'#3b82f6','Finance':'#8b5cf6',
  'HR':'#10b981','Marketing':'#f59e0b','Operations':'#ef4444',
}
const CYCLE_CFG = {
  monthly: { label:'Monthly', color:'#06b6d4', bg:'rgba(6,182,212,.1)' },
  annual:  { label:'Annual',  color:'#8b5cf6', bg:'rgba(139,92,246,.1)' },
}
const STATUS_CFG = {
  active:   { label:'Active',   color:'#10b981', bg:'rgba(16,185,129,.1)'  },
  inactive: { label:'Inactive', color:'#94a3b8', bg:'rgba(148,163,184,.1)' },
  expiring: { label:'Expiring', color:'#f59e0b', bg:'rgba(245,158,11,.1)'  },
}

const I = ({ d, size=16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d}/>
  </svg>
)
const Icons = {
  Plus:    () => <I d="M12 5v14 M5 12h14" />,
  Trash:   () => <I d="M3 6h18 M8 6V4h8v2 M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />,
  Edit:    () => <I d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />,
  User:    () => <I d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z" />,
  X:       () => <I d="M18 6L6 18 M6 6l12 12" />,
  Search:  () => <I d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />,
  Refresh: () => <I d="M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0114.85-3.36L23 10 M1 14l4.64 4.36A9 9 0 0020.49 15" />,
  Bell:    () => <I d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0" />,
  Dollar:  () => <I d="M12 1v22 M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />,
  Check:   () => <I d="M20 6L9 17l-5-5" />,
}

const Pill = ({ label, color, bg, size=11 }) => (
  <span style={{ fontSize:size, fontWeight:700, padding:'2px 9px', borderRadius:6,
    fontFamily:'JetBrains Mono,monospace', color, background:bg, whiteSpace:'nowrap' }}>
    {label}
  </span>
)

// ── Toast ──────────────────────────────────────────────────────────
let _tt
const Toast = ({ msg, type='success', onDone }) => {
  useEffect(() => { clearTimeout(_tt); _tt=setTimeout(onDone,3000); return ()=>clearTimeout(_tt) }, [msg])
  const bg = type==='success'?'#10b981':type==='error'?'#ef4444':'#3b82f6'
  return (
    <div style={{ position:'fixed',bottom:28,right:28,zIndex:9999,background:bg,color:'#fff',
      padding:'13px 20px',borderRadius:12,fontWeight:700,fontSize:13.5,
      boxShadow:'0 8px 32px rgba(0,0,0,.22)',display:'flex',alignItems:'center',gap:10,
      animation:'slideUp .3s ease' }}>
      {type==='success'?<Icons.Check/>:<Icons.X/>} {msg}
    </div>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────
const KPICard = ({ label, value, sub, color, icon }) => (
  <div style={{ background:'#fff',border:'1.5px solid #f1f5f9',borderRadius:16,padding:'18px 20px',
    boxShadow:'0 2px 8px rgba(0,0,0,.06)',position:'relative',overflow:'hidden' }}>
    <div style={{ position:'absolute',top:0,left:0,right:0,height:3,background:color }} />
    <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between' }}>
      <div>
        <div style={{ fontSize:10.5,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',fontFamily:'JetBrains Mono,monospace',marginBottom:6 }}>{label}</div>
        <div style={{ fontFamily:'Outfit,sans-serif',fontSize:24,fontWeight:900,color:'#0f172a',letterSpacing:'-.5px' }}>{value}</div>
        {sub && <div style={{ fontSize:11.5,color:'#94a3b8',marginTop:3 }}>{sub}</div>}
      </div>
      <div style={{ width:40,height:40,borderRadius:12,background:`${color}15`,display:'flex',alignItems:'center',justifyContent:'center',color }}>
        {icon}
      </div>
    </div>
  </div>
)

// ── Subscription Card ─────────────────────────────────────────────
const SubCard = ({ sub, onEdit, onDelete, onManageAccounts, isAdmin }) => {
  const cycle = CYCLE_CFG[sub.billingCycle] || CYCLE_CFG.monthly
  const renewBg = sub.renewalStatus==='urgent'?'rgba(239,68,68,.08)':sub.renewalStatus==='soon'?'rgba(245,158,11,.08)':'rgba(16,185,129,.08)'
  const renewColor = sub.renewalStatus==='urgent'?'#ef4444':sub.renewalStatus==='soon'?'#f59e0b':'#10b981'

  // Group accounts by dept
  const deptGroups = sub.assignedAccounts.reduce((acc,a)=>{ (acc[a.department]=acc[a.department]||[]).push(a); return acc },{})

  return (
    <div style={{ background:'#fff',border:'1.5px solid #f1f5f9',borderRadius:18,padding:22,
      boxShadow:'0 2px 12px rgba(0,0,0,.06)',display:'flex',flexDirection:'column',gap:16,
      transition:'box-shadow .2s',position:'relative',overflow:'hidden' }}
      onMouseEnter={e=>e.currentTarget.style.boxShadow='0 8px 32px rgba(0,0,0,.1)'}
      onMouseLeave={e=>e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,.06)'}>

      {/* Header */}
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:10 }}>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:4 }}>
            <span style={{ fontSize:15,fontWeight:800,color:'#0f172a',fontFamily:'Outfit,sans-serif' }}>{sub.name}</span>
            <Pill {...cycle} label={cycle.label} />
            <Pill {...(STATUS_CFG[sub.status]||STATUS_CFG.active)} label={STATUS_CFG[sub.status]?.label||'Active'} />
          </div>
          <div style={{ fontSize:12,color:'#64748b',fontFamily:'JetBrains Mono,monospace' }}>{sub.vendor}</div>
        </div>
        {isAdmin && (
          <div style={{ display:'flex',gap:6,flexShrink:0 }}>
            <button onClick={()=>onManageAccounts(sub)} style={{ padding:'6px 10px',borderRadius:8,border:'1.5px solid #e2e8f0',background:'#f8fafc',cursor:'pointer',color:'#64748b',display:'flex',alignItems:'center',gap:5,fontSize:12,fontWeight:600 }}>
              <Icons.User/> Accounts
            </button>
            <button onClick={()=>onEdit(sub)} style={{ padding:'6px 10px',borderRadius:8,border:'1.5px solid #e2e8f0',background:'#f8fafc',cursor:'pointer',color:'#64748b',display:'flex',alignItems:'center',gap:5,fontSize:12,fontWeight:600 }}>
              <Icons.Edit/>
            </button>
            <button onClick={()=>onDelete(sub.id)} style={{ padding:'6px 10px',borderRadius:8,border:'1.5px solid rgba(239,68,68,.2)',background:'rgba(239,68,68,.06)',cursor:'pointer',color:'#ef4444',display:'flex',alignItems:'center',gap:5,fontSize:12,fontWeight:600 }}>
              <Icons.Trash/>
            </button>
          </div>
        )}
      </div>

      {/* Billing breakdown */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10 }}>
        {[
          { label:'Per Head',      val:fmt(sub.billing.perHead)+`/${sub.billingCycle==='monthly'?'mo':'yr'}`, color:'#06b6d4' },
          { label:'Monthly Total', val:fmtM(sub.billing.monthly), color:'#3b82f6' },
          { label:'Annual Total',  val:fmtM(sub.billing.annual),  color:'#8b5cf6' },
        ].map(k=>(
          <div key={k.label} style={{ background:'#f8fafc',borderRadius:10,padding:'10px 12px',border:'1px solid #f1f5f9' }}>
            <div style={{ fontSize:9.5,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',fontFamily:'JetBrains Mono,monospace',marginBottom:3 }}>{k.label}</div>
            <div style={{ fontSize:14,fontWeight:800,color:k.color,fontFamily:'Outfit,sans-serif' }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Head count + dept breakdown */}
      <div>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8 }}>
          <div style={{ fontSize:11.5,color:'#64748b',fontWeight:700 }}>
            <span style={{ color:'#0f172a',fontSize:16,fontWeight:900,fontFamily:'Outfit,sans-serif' }}>{sub.headCount}</span> assigned users
          </div>
          <div style={{ display:'flex',gap:4,flexWrap:'wrap',justifyContent:'flex-end' }}>
            {Object.entries(deptGroups).map(([dept,users])=>(
              <span key={dept} style={{ fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:5,
                background:`${DEPT_COLORS[dept]||'#94a3b8'}15`,color:DEPT_COLORS[dept]||'#94a3b8',
                fontFamily:'JetBrains Mono,monospace' }}>
                {dept} ({users.length})
              </span>
            ))}
          </div>
        </div>
        {/* Avatar row */}
        <div style={{ display:'flex',gap:4,flexWrap:'wrap' }}>
          {sub.assignedAccounts.slice(0,10).map(acc=>(
            <div key={acc.userId} title={`${acc.name} — ${acc.department}`}
              style={{ width:28,height:28,borderRadius:8,background:DEPT_COLORS[acc.department]||'#94a3b8',
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:9,fontWeight:800,color:'#fff',letterSpacing:'.02em' }}>
              {acc.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
            </div>
          ))}
          {sub.assignedAccounts.length>10 && (
            <div style={{ width:28,height:28,borderRadius:8,background:'#f1f5f9',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:800,color:'#64748b' }}>
              +{sub.assignedAccounts.length-10}
            </div>
          )}
        </div>
      </div>

      {/* Renewal */}
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',borderRadius:10,background:renewBg }}>
        <div style={{ fontSize:11.5,color:'#64748b' }}>
          <span style={{ fontWeight:700,color:renewColor }}>
            {sub.daysToRenewal <= 0 ? 'Expired' : `${sub.daysToRenewal}d until renewal`}
          </span>
          {' '}— {sub.renewalDate}
        </div>
        {sub.notes && <span style={{ fontSize:10.5,color:'#94a3b8',fontStyle:'italic',maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{sub.notes}</span>}
      </div>
    </div>
  )
}

// ── Modal wrapper ─────────────────────────────────────────────────
const Modal = ({ title, onClose, children, width=540 }) => (
  <div style={{ position:'fixed',inset:0,background:'rgba(15,23,42,.55)',backdropFilter:'blur(4px)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
    <div style={{ background:'#fff',borderRadius:20,padding:28,width:'100%',maxWidth:width,boxShadow:'0 24px 80px rgba(0,0,0,.2)',maxHeight:'90vh',overflowY:'auto' }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22 }}>
        <h3 style={{ margin:0,fontSize:16,fontWeight:800,color:'#0f172a',fontFamily:'Outfit,sans-serif' }}>{title}</h3>
        <button onClick={onClose} style={{ padding:6,borderRadius:8,border:'none',background:'#f1f5f9',cursor:'pointer',color:'#64748b',display:'flex',alignItems:'center' }}><Icons.X/></button>
      </div>
      {children}
    </div>
  </div>
)

const Field = ({ label, children }) => (
  <div style={{ marginBottom:14 }}>
    <label style={{ display:'block',fontSize:11.5,fontWeight:700,color:'#64748b',marginBottom:5,textTransform:'uppercase',letterSpacing:'.05em' }}>{label}</label>
    {children}
  </div>
)
const inputStyle = { width:'100%',padding:'9px 12px',borderRadius:8,border:'1.5px solid #e2e8f0',fontSize:13,outline:'none',fontFamily:'inherit',boxSizing:'border-box' }

export default function Subscriptions() {
  const { isAdmin, isITStaff } = useRole()
  const canManage = isAdmin || isITStaff

  const [subs,    setSubs]    = useState([])
  const [summary, setSummary] = useState(null)
  const [allUsers,setAllUsers]= useState([])
  const [loading, setLoading] = useState(true)
  const [toast,   setToast]   = useState(null)
  const [search,  setSearch]  = useState('')
  const [filterCycle, setFilterCycle] = useState('all')
  const [filterDept,  setFilterDept]  = useState('all')

  // Modals
  const [showCreate,   setShowCreate]   = useState(false)
  const [editSub,      setEditSub]      = useState(null)
  const [manageSub,    setManageSub]    = useState(null)
  const [confirmDel,   setConfirmDel]   = useState(null)

  const [form, setForm] = useState({ name:'', vendor:'', category:'softwareLicense', pricePerHead:'', billingCycle:'monthly', lineItem:'LI-S01', startDate:'', renewalDate:'', notes:'' })

  const load = useCallback(async () => {
    const [s, sum, users] = await Promise.all([subscriptionsAPI.getAll(), subscriptionsAPI.getSummary(), subscriptionsAPI.getAllUsers()])
    setSubs(s); setSummary(sum); setAllUsers(users); setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const showToast = (msg, type='success') => setToast({ msg, type })

  const filteredSubs = subs.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.vendor.toLowerCase().includes(search.toLowerCase())
    const matchCycle  = filterCycle === 'all' || s.billingCycle === filterCycle
    const matchDept   = filterDept  === 'all' || s.assignedAccounts.some(a => a.department === filterDept)
    return matchSearch && matchCycle && matchDept
  })

  const allDepts = [...new Set(subs.flatMap(s => s.assignedAccounts.map(a => a.department)))]

  const handleCreate = async () => {
    if (!form.name || !form.pricePerHead) return
    await subscriptionsAPI.create({ ...form, pricePerHead: Number(form.pricePerHead) })
    showToast(`Subscription "${form.name}" created`)
    setShowCreate(false); setForm({ name:'', vendor:'', category:'softwareLicense', pricePerHead:'', billingCycle:'monthly', lineItem:'LI-S01', startDate:'', renewalDate:'', notes:'' })
    load()
  }

  const handleEdit = async () => {
    await subscriptionsAPI.update(editSub.id, { ...form, pricePerHead: Number(form.pricePerHead) })
    showToast('Subscription updated'); setEditSub(null); load()
  }

  const handleDelete = async (id) => {
    await subscriptionsAPI.delete(id)
    showToast('Subscription removed', 'error'); setConfirmDel(null); load()
  }

  const openEdit = (sub) => { setForm({ name:sub.name, vendor:sub.vendor, category:sub.category, pricePerHead:sub.pricePerHead, billingCycle:sub.billingCycle, lineItem:sub.lineItem||'LI-S01', startDate:sub.startDate||'', renewalDate:sub.renewalDate||'', notes:sub.notes||'' }); setEditSub(sub) }

  const handleAssign = async (userId) => {
    const user = allUsers.find(u => u.id === userId)
    if (!user) return
    const alreadyIn = manageSub.assignedAccounts.some(a => a.userId === userId)
    if (alreadyIn) {
      const updated = await subscriptionsAPI.removeAccount(manageSub.id, userId)
      setManageSub(updated)
    } else {
      const updated = await subscriptionsAPI.assignAccount(manageSub.id, { userId:user.id, name:user.name, department:user.department, email:user.email })
      setManageSub(updated)
    }
    load()
  }

  const SubForm = ({ onSave, onCancel, saveLabel }) => (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <Field label="Subscription Name">
          <input style={inputStyle} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Canva Pro" />
        </Field>
        <Field label="Vendor">
          <input style={inputStyle} value={form.vendor} onChange={e=>setForm(f=>({...f,vendor:e.target.value}))} placeholder="e.g. Canva" />
        </Field>
        <Field label="Price Per Head (₱)">
          <input style={inputStyle} type="number" value={form.pricePerHead} onChange={e=>setForm(f=>({...f,pricePerHead:e.target.value}))} placeholder="239" />
        </Field>
        <Field label="Billing Cycle">
          <select style={inputStyle} value={form.billingCycle} onChange={e=>setForm(f=>({...f,billingCycle:e.target.value}))}>
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>
        </Field>
        <Field label="Start Date">
          <input style={inputStyle} type="date" value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))} />
        </Field>
        <Field label="Renewal Date">
          <input style={inputStyle} type="date" value={form.renewalDate} onChange={e=>setForm(f=>({...f,renewalDate:e.target.value}))} />
        </Field>
        <Field label="Category">
          <select style={inputStyle} value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
            <option value="softwareLicense">Software License</option>
            <option value="service">Service</option>
          </select>
        </Field>
        <Field label="Line Item">
          <select style={inputStyle} value={form.lineItem} onChange={e=>setForm(f=>({...f,lineItem:e.target.value}))}>
            <option value="LI-S01">Productivity & SaaS</option>
            <option value="LI-S02">Security Software</option>
            <option value="LI-S03">ITSM & Operations</option>
            <option value="LI-S04">Dev Tools & Licenses</option>
            <option value="LI-V01">Cloud Hosting</option>
          </select>
        </Field>
      </div>
      <Field label="Notes">
        <input style={inputStyle} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Optional notes..." />
      </Field>
      {/* Preview */}
      {form.pricePerHead && (
        <div style={{ background:'rgba(6,182,212,.05)',border:'1px solid rgba(6,182,212,.15)',borderRadius:10,padding:'12px 14px',marginBottom:16 }}>
          <div style={{ fontSize:11,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6 }}>Billing Preview (0 users assigned)</div>
          <div style={{ display:'flex',gap:20,fontSize:13,fontWeight:700,color:'#0f172a' }}>
            <span>Monthly: <span style={{color:'#3b82f6'}}>{fmt(form.billingCycle==='monthly'?Number(form.pricePerHead)*0:0)}</span></span>
            <span>Annual: <span style={{color:'#8b5cf6'}}>{fmt(form.billingCycle==='monthly'?Number(form.pricePerHead)*0*12:Number(form.pricePerHead)*0)}</span></span>
            <span style={{color:'#64748b'}}>Per head/mo: <span style={{color:'#06b6d4'}}>{fmt(form.billingCycle==='monthly'?Number(form.pricePerHead):Math.round(Number(form.pricePerHead)/12))}</span></span>
          </div>
        </div>
      )}
      <div style={{ display:'flex',justifyContent:'flex-end',gap:10 }}>
        <button onClick={onCancel} style={{ padding:'9px 18px',borderRadius:8,border:'1.5px solid #e2e8f0',background:'#f8fafc',cursor:'pointer',fontWeight:600,fontSize:13 }}>Cancel</button>
        <button onClick={onSave} style={{ padding:'9px 18px',borderRadius:8,border:'none',background:'linear-gradient(135deg,#06b6d4,#3b82f6)',color:'#fff',cursor:'pointer',fontWeight:700,fontSize:13 }}>{saveLabel}</button>
      </div>
    </div>
  )

  if (loading) return (
    <PageLayout title="Subscription Management" subtitle="Loading..." badge="Subscriptions">
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:20 }}>
        {[1,2,3,4].map(i=><div key={i} style={{ height:90,borderRadius:16,background:'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',backgroundSize:'200% 100%',animation:'shimmer 1.4s infinite'}} />)}
      </div>
    </PageLayout>
  )

  return (
    <PageLayout title="Subscription Management" subtitle="Track SaaS subscriptions, assign accounts, and auto-compute billings" badge="Subscriptions"
      actions={canManage && (
        <button onClick={()=>setShowCreate(true)} className="btn btn-primary btn-sm" style={{gap:7}}>
          <Icons.Plus/> New Subscription
        </button>
      )}>

      {/* KPI Strip */}
      {summary && (
        <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:22,animation:'cardReveal .35s ease both' }}>
          <KPICard label="Active Subscriptions" value={summary.activeSubscriptions} sub={`${summary.totalSubscriptions} total`} color="#06b6d4" icon={<Icons.Refresh/>} />
          <KPICard label="Monthly Billing" value={fmtM(summary.totalMonthlyBilling)} sub="All active subs" color="#3b82f6" icon={<Icons.Dollar/>} />
          <KPICard label="Annual Billing" value={fmtM(summary.totalAnnualBilling)} sub="Projected" color="#8b5cf6" icon={<Icons.Dollar/>} />
          <KPICard label="Total Assigned" value={`${summary.totalHeads} users`} sub={`${summary.upcomingRenewals} renewals in 60d`} color={summary.upcomingRenewals>0?'#f59e0b':'#10b981'} icon={<Icons.Bell/>} />
        </div>
      )}

      {/* Filters */}
      <div style={{ display:'flex',gap:10,marginBottom:20,flexWrap:'wrap',alignItems:'center' }}>
        <div style={{ position:'relative',flex:1,minWidth:200 }}>
          <span style={{ position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:'#94a3b8' }}><Icons.Search/></span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search subscriptions..."
            style={{ width:'100%',padding:'9px 12px 9px 36px',borderRadius:10,border:'1.5px solid #e2e8f0',fontSize:13,outline:'none',boxSizing:'border-box' }}/>
        </div>
        {['all','monthly','annual'].map(c=>(
          <button key={c} onClick={()=>setFilterCycle(c)}
            style={{ padding:'8px 16px',borderRadius:9,border:`1.5px solid ${filterCycle===c?'#06b6d4':'#e2e8f0'}`,
              background:filterCycle===c?'rgba(6,182,212,.1)':'#fff',color:filterCycle===c?'#0891b2':'#64748b',
              cursor:'pointer',fontWeight:700,fontSize:12,textTransform:'capitalize' }}>
            {c==='all'?'All Cycles':c.charAt(0).toUpperCase()+c.slice(1)}
          </button>
        ))}
        <select value={filterDept} onChange={e=>setFilterDept(e.target.value)}
          style={{ padding:'8px 14px',borderRadius:9,border:'1.5px solid #e2e8f0',background:'#fff',fontSize:13,outline:'none',color:'#334155',cursor:'pointer' }}>
          <option value="all">All Departments</option>
          {allDepts.map(d=><option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Cards grid */}
      {filteredSubs.length === 0 ? (
        <div style={{ textAlign:'center',padding:'60px 20px',color:'#94a3b8' }}>
          <div style={{ fontSize:40,marginBottom:12 }}>📋</div>
          <div style={{ fontSize:16,fontWeight:700,color:'#64748b',marginBottom:6 }}>No subscriptions found</div>
          <div style={{ fontSize:13 }}>Try adjusting your filters or create a new subscription.</div>
        </div>
      ) : (
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(400px,1fr))',gap:16 }}>
          {filteredSubs.map(sub=>(
            <SubCard key={sub.id} sub={sub} isAdmin={canManage}
              onEdit={openEdit} onDelete={id=>setConfirmDel(id)} onManageAccounts={s=>setManageSub(s)} />
          ))}
        </div>
      )}

      {/* Billing Summary Table */}
      <div className="glass-card" style={{ padding:24,marginTop:24 }}>
        <div className="card-header" style={{ marginBottom:16 }}>
          <h3 className="card-title">Billing Summary — All Subscriptions</h3>
          <span className="card-badge">FY 2025</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Subscription</th><th>Vendor</th><th>Cycle</th><th>Users</th>
                <th>Per Head</th><th>Monthly</th><th>Annual</th><th>Renewal</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {subs.map(s => {
                const cyc = CYCLE_CFG[s.billingCycle]||CYCLE_CFG.monthly
                const sta = STATUS_CFG[s.status]||STATUS_CFG.active
                const renColor = s.renewalStatus==='urgent'?'#ef4444':s.renewalStatus==='soon'?'#f59e0b':'#10b981'
                return (
                  <tr key={s.id} className="tr">
                    <td><strong style={{ color:'#0f172a' }}>{s.name}</strong></td>
                    <td style={{ fontSize:12,color:'#64748b' }}>{s.vendor}</td>
                    <td><Pill label={cyc.label} color={cyc.color} bg={cyc.bg} /></td>
                    <td><span style={{ fontFamily:'JetBrains Mono,monospace',fontSize:13,fontWeight:700,color:'#0f172a' }}>{s.headCount}</span></td>
                    <td><span style={{ fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'#06b6d4' }}>{fmt(s.billing.perHead)}</span></td>
                    <td><span style={{ fontFamily:'JetBrains Mono,monospace',fontSize:13,fontWeight:700,color:'#3b82f6' }}>{fmt(s.billing.monthly)}</span></td>
                    <td><span style={{ fontFamily:'JetBrains Mono,monospace',fontSize:13,fontWeight:700,color:'#8b5cf6' }}>{fmt(s.billing.annual)}</span></td>
                    <td><span style={{ fontSize:12,fontWeight:700,color:renColor,fontFamily:'JetBrains Mono,monospace' }}>{s.renewalDate}</span></td>
                    <td><Pill label={sta.label} color={sta.color} bg={sta.bg} /></td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} style={{ textAlign:'right',fontWeight:800,color:'#0f172a',fontSize:13,paddingTop:10 }}>TOTALS →</td>
                <td><span style={{ fontFamily:'JetBrains Mono,monospace',fontSize:13,fontWeight:900,color:'#3b82f6' }}>{fmt(summary?.totalMonthlyBilling||0)}</span></td>
                <td><span style={{ fontFamily:'JetBrains Mono,monospace',fontSize:13,fontWeight:900,color:'#8b5cf6' }}>{fmt(summary?.totalAnnualBilling||0)}</span></td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── Modals ── */}

      {/* Create */}
      {showCreate && (
        <Modal title="New Subscription" onClose={()=>setShowCreate(false)} width={600}>
          <SubForm onSave={handleCreate} onCancel={()=>setShowCreate(false)} saveLabel="Create Subscription" />
        </Modal>
      )}

      {/* Edit */}
      {editSub && (
        <Modal title={`Edit: ${editSub.name}`} onClose={()=>setEditSub(null)} width={600}>
          <SubForm onSave={handleEdit} onCancel={()=>setEditSub(null)} saveLabel="Save Changes" />
        </Modal>
      )}

      {/* Manage Accounts */}
      {manageSub && (
        <Modal title={`Manage Accounts — ${manageSub.name}`} onClose={()=>setManageSub(null)} width={640}>
          {/* Billing preview */}
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:18 }}>
            {[
              { label:'Users', val:`${manageSub.headCount}`, color:'#06b6d4' },
              { label:'Monthly', val:fmt(manageSub.billing.monthly), color:'#3b82f6' },
              { label:'Annual',  val:fmt(manageSub.billing.annual), color:'#8b5cf6' },
            ].map(k=>(
              <div key={k.label} style={{ background:'#f8fafc',borderRadius:10,padding:'10px 12px',border:'1px solid #f1f5f9',textAlign:'center' }}>
                <div style={{ fontSize:9.5,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',fontFamily:'JetBrains Mono,monospace',marginBottom:4 }}>{k.label}</div>
                <div style={{ fontSize:16,fontWeight:900,color:k.color,fontFamily:'Outfit,sans-serif' }}>{k.val}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:11.5,color:'#64748b',marginBottom:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.05em' }}>
            All Users — click to assign/remove
          </div>
          <div style={{ maxHeight:360,overflowY:'auto',display:'flex',flexDirection:'column',gap:6 }}>
            {allUsers.map(u => {
              const isAssigned = manageSub.assignedAccounts.some(a=>a.userId===u.id)
              return (
                <div key={u.id} onClick={()=>handleAssign(u.id)}
                  style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:10,
                    border:`1.5px solid ${isAssigned?'rgba(16,185,129,.3)':'#e2e8f0'}`,
                    background:isAssigned?'rgba(16,185,129,.05)':'#fff',cursor:'pointer',transition:'all .15s' }}
                  onMouseEnter={e=>{ if(!isAssigned) e.currentTarget.style.background='#f8fafc' }}
                  onMouseLeave={e=>{ if(!isAssigned) e.currentTarget.style.background='#fff' }}>
                  <div style={{ width:32,height:32,borderRadius:9,background:DEPT_COLORS[u.department]||'#94a3b8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,color:'#fff',flexShrink:0 }}>
                    {u.avatar}
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:13,fontWeight:700,color:'#0f172a' }}>{u.name}</div>
                    <div style={{ fontSize:11,color:'#64748b' }}>{u.department} · {u.email}</div>
                  </div>
                  <div style={{ flexShrink:0 }}>
                    {isAssigned
                      ? <span style={{ fontSize:10.5,fontWeight:700,color:'#10b981',background:'rgba(16,185,129,.1)',padding:'3px 10px',borderRadius:6,fontFamily:'JetBrains Mono,monospace' }}>✓ Assigned</span>
                      : <span style={{ fontSize:10.5,fontWeight:700,color:'#94a3b8',background:'#f1f5f9',padding:'3px 10px',borderRadius:6,fontFamily:'JetBrains Mono,monospace' }}>+ Assign</span>
                    }
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ marginTop:16,padding:'10px 14px',borderRadius:10,background:'rgba(6,182,212,.05)',border:'1px solid rgba(6,182,212,.15)',fontSize:12,color:'#0891b2',fontWeight:600 }}>
            Billing auto-updates: ₱{manageSub.billing.perHead.toLocaleString()} × {manageSub.headCount} users = <strong>{fmt(manageSub.billing.monthly)}/mo</strong> · <strong>{fmt(manageSub.billing.annual)}/yr</strong>
          </div>
        </Modal>
      )}

      {/* Confirm Delete */}
      {confirmDel && (
        <Modal title="Remove Subscription" onClose={()=>setConfirmDel(null)} width={400}>
          <div style={{ textAlign:'center',padding:'10px 0 20px' }}>
            <div style={{ fontSize:40,marginBottom:12 }}>🗑️</div>
            <div style={{ fontSize:15,fontWeight:700,color:'#0f172a',marginBottom:6 }}>Are you sure?</div>
            <div style={{ fontSize:13,color:'#64748b',marginBottom:20 }}>This will permanently remove this subscription and all billing data.</div>
            <div style={{ display:'flex',gap:10,justifyContent:'center' }}>
              <button onClick={()=>setConfirmDel(null)} style={{ padding:'9px 20px',borderRadius:8,border:'1.5px solid #e2e8f0',background:'#f8fafc',cursor:'pointer',fontWeight:600 }}>Cancel</button>
              <button onClick={()=>handleDelete(confirmDel)} style={{ padding:'9px 20px',borderRadius:8,border:'none',background:'#ef4444',color:'#fff',cursor:'pointer',fontWeight:700 }}>Delete</button>
            </div>
          </div>
        </Modal>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)} />}
    </PageLayout>
  )
}
