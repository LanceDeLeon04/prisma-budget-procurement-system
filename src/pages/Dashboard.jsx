import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useRole } from '../hooks/useRole'
import PageLayout from '../components/PageLayout'
import Card from '../components/Card'
import { budgetAPI, procurementAPI, notificationsAPI, requestsAPI } from '../services/api'

const fmt = n => '₱' + Number(n ?? 0).toLocaleString()

const BudgetIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
const ArrowUpIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5,12 12,5 19,12"/></svg>
const BankIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12,2 22,7 2,7"/></svg>
const ClipIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
const AlertIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
const MailIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
const InfoIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
const CheckIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>

const STATUS_CFG = {
  approved:   { label:'Approved',   color:'#10b981', bg:'rgba(16,185,129,.1)' },
  pending:    { label:'Pending',     color:'#f59e0b', bg:'rgba(245,158,11,.1)' },
  for_review: { label:'For Review',  color:'#3b82f6', bg:'rgba(59,130,246,.1)' },
  rejected:   { label:'Rejected',    color:'#ef4444', bg:'rgba(239,68,68,.1)'  },
}
const NOTIF_ICON = { approval:<MailIcon/>, alert:<AlertIcon/>, info:<InfoIcon/>, success:<CheckIcon/> }
const NOTIF_COLOR = { approval:'#3b82f6', alert:'#f59e0b', info:'#94a3b8', success:'#10b981' }

// Safe category getter with fallback
const safeGet = (obj, ...keys) => {
  let v = obj
  for (const k of keys) { if (v == null) return undefined; v = v[k] }
  return v
}

export default function Dashboard() {
  const { user, role, isAdmin, isITStaff, isStaff } = useRole()
  const [summary,     setSummary]     = useState(null)
  const [deptBudget,  setDeptBudget]  = useState(null)
  const [activity,    setActivity]    = useState([])
  const [monthly,     setMonthly]     = useState([])
  const [depts,       setDepts]       = useState([])
  const [notifs,      setNotifs]      = useState([])
  const [requests,    setRequests]    = useState([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    budgetAPI.getSummary().then(d => { setSummary(d); setLoading(false) })
    budgetAPI.getDeptBudget(user?.department).then(setDeptBudget)
    procurementAPI.getRecentActivity().then(setActivity)
    procurementAPI.getMonthlySpending().then(setMonthly)
    procurementAPI.getDepartmentBreakdown().then(setDepts)
    notificationsAPI.getForRole(role, user?.department).then(setNotifs)
    requestsAPI.getAll().then(setRequests)
  }, [role])

  const unread = notifs.filter(n => !n.read).length
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'

  const myRequests   = requests.filter(r => isStaff ? r.requestedBy === user?.name : true)
  const pendingCount = requests.filter(r =>
    (isITStaff || isAdmin) ? (r.status === 'pending' || r.status === 'for_review') : (r.requestedBy === user?.name && r.status === 'pending')
  ).length

  // Safe category reads — never crashes even if summary is null or categories is missing
  const cats = summary?.categories ?? {}
  const hw  = cats.hardware        ?? { pct:0, spent:0, remaining:0, allocated:0 }
  const sw  = cats.softwareLicense ?? { pct:0, spent:0, remaining:0, allocated:0 }
  const svc = cats.service         ?? { pct:0, spent:0, remaining:0, allocated:0 }

  const hwOver  = hw.pct  >= 80
  const swOver  = sw.pct  >= 80
  const svcOver = svc.pct >= 80
  const anyOver = hwOver || swOver || svcOver

  const dh  = deptBudget?.hardware        ?? { pct:0, spent:0, remaining:0, total:0 }
  const dsw = deptBudget?.softwareLicense ?? { pct:0, spent:0, remaining:0, total:0 }
  const dvc = deptBudget?.service         ?? { pct:0, spent:0, remaining:0, total:0 }
  const deptAnyOver = dh.pct >= 80 || dsw.pct >= 80 || dvc.pct >= 80

  const CAT_CARDS = [
    { key:'hardware',        label:'Hardware (CapEx)',        color:'#3b82f6', data: hw  },
    { key:'softwareLicense', label:'Software License (OpEx)', color:'#8b5cf6', data: sw  },
    { key:'service',         label:'Service (OpEx)',          color:'#06b6d4', data: svc },
  ]
  const DEPT_CARDS = [
    { key:'hardware',        label:'Hardware Budget',         color:'#3b82f6', data: dh  },
    { key:'softwareLicense', label:'SW License Budget',       color:'#8b5cf6', data: dsw },
    { key:'service',         label:'Service Budget',          color:'#06b6d4', data: dvc },
  ]

  return (
    <PageLayout
      title={`${greeting}, ${user?.name?.split(' ')[0] ?? 'User'}`}
      subtitle={new Date().toLocaleDateString('en-PH', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
      badge="Dashboard"
    >
      {/* Over-budget alerts — admin & IT staff */}
      {(isAdmin || isITStaff) && anyOver && (
        <div className="alert-bar critical" style={{ marginBottom:16 }}>
          <div className="alert-bar-icon" style={{ color:'#ef4444' }}><AlertIcon/></div>
          <div className="alert-bar-text">
            <div className="alert-bar-title">Budget Alert — Over 80% Threshold</div>
            <div className="alert-bar-sub">
              {hwOver  && `Hardware: ${hw.pct}% used (₱${hw.remaining.toLocaleString()} left)  `}
              {swOver  && `SW License: ${sw.pct}% used (₱${sw.remaining.toLocaleString()} left)  `}
              {svcOver && `Service: ${svc.pct}% used (₱${svc.remaining.toLocaleString()} left)`}
            </div>
          </div>
        </div>
      )}

      {/* Over-budget alert — regular staff */}
      {isStaff && deptAnyOver && (
        <div className="alert-bar warning" style={{ marginBottom:16 }}>
          <div className="alert-bar-icon" style={{ color:'#f59e0b' }}><AlertIcon/></div>
          <div className="alert-bar-text">
            <div className="alert-bar-title">Department Budget Alert</div>
            <div className="alert-bar-sub">
              {dh.pct  >= 80 && `Hardware: ${dh.pct}% utilized  `}
              {dsw.pct >= 80 && `SW License: ${dsw.pct}% utilized  `}
              {dvc.pct >= 80 && `Service: ${dvc.pct}% utilized`}
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      {(isAdmin || isITStaff) && (
        <div className="stat-grid">
          <Card title="Total IT Budget"       value={summary ? fmt(summary.totalBudget)    : '—'} subtitle="FY 2025 Allocation"    icon={<BudgetIcon/>} accent="#06b6d4" trend={5}  loading={loading}/>
          <Card title="Total Spent"           value={summary ? fmt(summary.totalSpent)     : '—'} subtitle={`${summary ? Math.round(summary.totalSpent/summary.totalBudget*100) : 0}% used`} icon={<ArrowUpIcon/>} accent="#3b82f6" trend={12} loading={loading}/>
          <Card title="Remaining Budget"      value={summary ? fmt(summary.totalRemaining) : '—'} subtitle="Available funds"        icon={<BankIcon/>}   accent="#10b981" trend={-3} loading={loading}/>
          <Card title={isAdmin ? 'Pending Approval' : 'Requests to Review'} value={loading ? '—' : pendingCount} subtitle="Awaiting action" icon={<ClipIcon/>}  accent="#f59e0b"           loading={loading}/>
        </div>
      )}

      {isStaff && (
        <div className="stat-grid" style={{ gridTemplateColumns:'repeat(2,1fr)' }}>
          <Card title="Dept Hardware Remaining"   value={fmt(dh.remaining)}  subtitle={`${dh.pct}% of hardware budget used`}    icon={<BudgetIcon/>} accent="#3b82f6" loading={!deptBudget}/>
          <Card title="Dept SW License Remaining" value={fmt(dsw.remaining)} subtitle={`${dsw.pct}% of SW license budget used`}  icon={<BankIcon/>}   accent="#8b5cf6" loading={!deptBudget}/>
        </div>
      )}

      {/* Budget Category breakdown — admin/IT staff */}
      {(isAdmin || isITStaff) && summary && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:22, animation:'cardReveal .4s ease both .08s' }}>
          {CAT_CARDS.map(({ key, label, color, data }) => (
            <div key={key} style={{ background:'#fff', border:`1.5px solid ${data.pct>=80?'rgba(239,68,68,.3)':'var(--n100)'}`, borderRadius:18, padding:'20px 22px', boxShadow:'0 2px 10px rgba(0,0,0,.07)', position:'relative', overflow:'hidden', transition:'all .2s' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background: data.pct>=90?'#ef4444': data.pct>=80?'#f59e0b':color, opacity:.8 }}/>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <span style={{ fontSize:11.5, fontWeight:800, color, fontFamily:'JetBrains Mono,monospace', textTransform:'uppercase', letterSpacing:'.05em' }}>{label}</span>
                <span style={{ fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:6, background:`${data.pct>=80?'rgba(239,68,68,.1)':`${color}15`}`, color: data.pct>=80?'#ef4444':color, fontFamily:'JetBrains Mono,monospace' }}>{data.pct}%</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                <div><div style={{ fontSize:10, color:'#94a3b8', fontFamily:'JetBrains Mono,monospace', marginBottom:2 }}>SPENT</div><div style={{ fontFamily:'Outfit,sans-serif', fontSize:19, fontWeight:900, color }}>{fmt(data.spent)}</div></div>
                <div style={{ textAlign:'right' }}><div style={{ fontSize:10, color:'#94a3b8', fontFamily:'JetBrains Mono,monospace', marginBottom:2 }}>REMAINING</div><div style={{ fontFamily:'Outfit,sans-serif', fontSize:19, fontWeight:900, color: data.pct>=90?'#ef4444': data.pct>=80?'#f59e0b':'#10b981' }}>{fmt(data.remaining)}</div></div>
              </div>
              <div style={{ height:7, background:'#f1f5f9', borderRadius:100, overflow:'hidden', marginBottom:4 }}>
                <div style={{ height:'100%', borderRadius:100, width:`${Math.min(data.pct,100)}%`, background: data.pct>=90?'linear-gradient(90deg,#f59e0b,#ef4444)': data.pct>=80?'#f59e0b':color, transition:'width 1s cubic-bezier(.4,0,.2,1)' }}/>
              </div>
              <div style={{ fontSize:11, color:'#94a3b8', fontFamily:'JetBrains Mono,monospace' }}>of {fmt(data.allocated)} allocated</div>
            </div>
          ))}
        </div>
      )}

      {/* Dept budget breakdown — regular staff */}
      {isStaff && deptBudget && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:22, animation:'cardReveal .4s ease both .08s' }}>
          {DEPT_CARDS.map(({ key, label, color, data }) => (
            <div key={key} style={{ background:'#fff', border:'1.5px solid var(--n100)', borderRadius:18, padding:'20px 22px', boxShadow:'0 2px 10px rgba(0,0,0,.07)', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:color, opacity:.7 }}/>
              <div style={{ fontSize:11.5, fontWeight:800, color, fontFamily:'JetBrains Mono,monospace', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:10 }}>{label}</div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                <div><div style={{ fontSize:10, color:'#94a3b8', fontFamily:'JetBrains Mono,monospace', marginBottom:2 }}>SPENT</div><div style={{ fontFamily:'Outfit,sans-serif', fontSize:18, fontWeight:900, color }}>{fmt(data.spent)}</div></div>
                <div style={{ textAlign:'right' }}><div style={{ fontSize:10, color:'#94a3b8', fontFamily:'JetBrains Mono,monospace', marginBottom:2 }}>REMAINING</div><div style={{ fontFamily:'Outfit,sans-serif', fontSize:18, fontWeight:900, color: data.pct>=80?'#ef4444':'#10b981' }}>{fmt(data.remaining)}</div></div>
              </div>
              <div style={{ height:6, background:'#f1f5f9', borderRadius:100, overflow:'hidden', marginBottom:4 }}>
                <div style={{ height:'100%', borderRadius:100, width:`${Math.min(data.pct,100)}%`, background: data.pct>=80?'#ef4444':color, transition:'width 1s cubic-bezier(.4,0,.2,1)' }}/>
              </div>
              <div style={{ fontSize:11, color:'#94a3b8', fontFamily:'JetBrains Mono,monospace' }}>{data.pct}% of {fmt(data.total)} · {user?.department}</div>
            </div>
          ))}
        </div>
      )}

      {/* Charts — admin / IT staff */}
      {(isAdmin || isITStaff) && (
        <div className="chart-row">
          <div className="glass-card">
            <div className="card-header"><h3 className="card-title">Monthly Spend — Plan vs Actual</h3><span className="card-badge">FY 2025</span></div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthly} margin={{ top:8, right:8, left:0, bottom:0 }}>
                <defs>
                  <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#06b6d4" stopOpacity={.25}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={.02}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => '₱'+v/1000+'k'}/>
                <Tooltip formatter={v => fmt(v)} contentStyle={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10 }}/>
                <Area type="monotone" dataKey="budget" stroke="#e2e8f0" strokeWidth={2} strokeDasharray="4 4" fill="none" name="Planned"/>
                <Area type="monotone" dataKey="spent"  stroke="#06b6d4" strokeWidth={2.5} fill="url(#ag)" name="Actual"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card">
            <div className="card-header"><h3 className="card-title">By Department</h3></div>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={depts} dataKey="spent" nameKey="department" cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={3}>
                  {depts.map((d,i) => <Cell key={i} fill={d.color || '#06b6d4'}/>)}
                </Pie>
                <Tooltip formatter={v => fmt(v)} contentStyle={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10 }}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display:'flex', flexDirection:'column', gap:5, marginTop:10 }}>
              {depts.slice(0,4).map(d => (
                <div key={d.department} style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:8, height:8, borderRadius:2, background:d.color, flexShrink:0 }}/>
                  <span style={{ flex:1, fontSize:12, color:'#475569', fontWeight:600 }}>{d.department}</span>
                  <span style={{ fontSize:11.5, color:'#94a3b8', fontFamily:'JetBrains Mono,monospace' }}>{fmt(d.spent)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Activity + Notifications */}
      <div className="bottom-row">
        <div className="glass-card" style={{ padding:'22px 24px 8px', animation:'cardReveal .4s ease both .36s' }}>
          <div className="card-header">
            <h3 className="card-title">{isStaff ? 'My Requests' : 'Recent Activity'}</h3>
            <span className="card-badge">{isStaff ? myRequests.length : activity.length} items</span>
          </div>
          <div>
            {(isStaff ? myRequests.slice(0,5) : activity.slice(0,5)).map((item, i) => {
              const s = STATUS_CFG[item.status || 'pending'] || STATUS_CFG.pending
              return (
                <div key={i} className="feed-item">
                  <div style={{ flex:1, minWidth:0 }}>
                    <span className="feed-name">{isStaff ? item.title : item.item}</span>
                    <span className="feed-meta">{item.department} · {item.date}</span>
                  </div>
                  <div className="feed-right">
                    <span className="feed-amt">{fmt(isStaff ? item.total : item.amount)}</span>
                    <span className="pill" style={{ color:s.color, background:s.bg }}>{s.label}</span>
                  </div>
                </div>
              )
            })}
            {(isStaff ? myRequests : activity).length === 0 && (
              <div style={{ padding:'30px 0', textAlign:'center', color:'#94a3b8', fontSize:13 }}>No activity yet</div>
            )}
          </div>
        </div>

        <div className="glass-card" style={{ padding:'22px 24px 8px', animation:'cardReveal .4s ease both .44s' }}>
          <div className="card-header">
            <h3 className="card-title">Notifications</h3>
            {unread > 0 && <span className="card-badge" style={{ background:'#fee2e2', color:'#ef4444', border:'1px solid #fecaca' }}>{unread} new</span>}
          </div>
          <div className="notif-list">
            {notifs.map(n => (
              <div key={n.id} className={`notif-item${!n.read ? ' unread' : ''}`}>
                <div className="notif-icon-wrap" style={{ color: NOTIF_COLOR[n.type] || '#94a3b8' }}>
                  {NOTIF_ICON[n.type] || <InfoIcon/>}
                </div>
                <div className="notif-body">
                  <span className="notif-msg">{n.msg}</span>
                  <span className="notif-time">{n.time}</span>
                </div>
                {!n.read && <span className="notif-dot"/>}
              </div>
            ))}
            {notifs.length === 0 && (
              <div style={{ padding:'30px 0', textAlign:'center', color:'#94a3b8', fontSize:13 }}>No notifications</div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
