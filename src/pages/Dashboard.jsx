import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Navbar from '../components/Navbar'
import Card from '../components/Card'
import { budgetAPI, procurementAPI, notificationsAPI } from '../services/api'

const fmt = (n) => '₱' + (n ?? 0).toLocaleString()
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)

const STATUS_CFG = {
  approved:   { label:'Approved',   color:'#10b981', bg:'rgba(16,185,129,.1)' },
  pending:    { label:'Pending',     color:'#f59e0b', bg:'rgba(245,158,11,.1)' },
  for_review: { label:'For Review',  color:'#3b82f6', bg:'rgba(59,130,246,.1)' },
  rejected:   { label:'Rejected',    color:'#ef4444', bg:'rgba(239,68,68,.1)'  },
}

const NOTIF_ICON = { approval:'📬', alert:'⚠️', info:'ℹ️', success:'✅' }

export default function Dashboard() {
  const user = useSelector((s) => s.auth.user)
  const [summary,       setSummary]       = useState(null)
  const [activity,      setActivity]      = useState([])
  const [monthly,       setMonthly]       = useState([])
  const [departments,   setDepartments]   = useState([])
  const [notifications, setNotifications] = useState([])
  const [loadingCards,  setLoadingCards]  = useState(true)

  useEffect(() => {
    budgetAPI.getSummary().then(d => { setSummary(d); setLoadingCards(false) })
    procurementAPI.getRecentActivity().then(setActivity)
    procurementAPI.getMonthlySpending().then(setMonthly)
    procurementAPI.getDepartmentBreakdown().then(setDepartments)
    notificationsAPI.getAll().then(setNotifications)
  }, [])

  const spentPct = summary ? pct(summary.totalSpent, summary.totalBudget) : 0
  const unread   = notifications.filter(n => !n.read).length
  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'

  return (
    <div className="dashboard-root">
      <Navbar />
      <main className="dashboard-main">

        {/* Header */}
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-greeting">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="dashboard-date">
              {new Date().toLocaleDateString('en-PH', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
            </p>
          </div>
          <div className="dashboard-header-right">
            <button className="header-notif-btn">
              🔔 {unread > 0 && <span className="notif-badge">{unread}</span>}
            </button>
            <div className="header-avatar">{user?.name?.charAt(0) || 'A'}</div>
          </div>
        </header>

        {/* Budget Banner */}
        {summary && (
          <div className="budget-banner">
            <div className="budget-banner-left">
              <span className="budget-banner-label">FY Budget Utilization</span>
              <span className="budget-banner-pct" style={{ color: spentPct > 80 ? '#ef4444' : '#22d3ee' }}>
                {spentPct}% Used
              </span>
            </div>
            <div className="budget-progress-track">
              <div className="budget-progress-fill" style={{
                width: `${spentPct}%`,
                background: spentPct > 80
                  ? 'linear-gradient(90deg,#f59e0b,#ef4444)'
                  : 'linear-gradient(90deg,#06b6d4,#3b82f6)',
              }}/>
            </div>
            <div className="budget-banner-right">{fmt(summary.totalSpent)} of {fmt(summary.totalBudget)}</div>
          </div>
        )}

        {/* KPI Cards */}
        <section className="cards-grid">
          <Card title="Total Budget"     value={summary ? fmt(summary.totalBudget)    : '—'} subtitle="FY 2025 Allocation"  icon="💰" accent="#06b6d4" trend={5}   loading={loadingCards}/>
          <Card title="Total Spent"      value={summary ? fmt(summary.totalSpent)     : '—'} subtitle={`${spentPct}% used`} icon="📤" accent="#3b82f6" trend={12}  loading={loadingCards}/>
          <Card title="Remaining"        value={summary ? fmt(summary.totalRemaining) : '—'} subtitle="Available funds"     icon="🏦" accent="#10b981" trend={-3}  loading={loadingCards}/>
          <Card title="Pending Requests" value={summary ? summary.pendingRequests     : '—'} subtitle="Awaiting approval"   icon="📋" accent="#f59e0b"             loading={loadingCards}/>
        </section>

        {/* Charts */}
        <section className="charts-row">
          <div className="chart-card chart-card-wide">
            <div className="chart-card-header">
              <h3 className="chart-title">Monthly Spending vs Budget</h3>
              <span className="chart-badge">Last 6 Months</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthly} margin={{ top:10, right:10, left:0, bottom:0 }}>
                <defs>
                  <linearGradient id="spentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02}/>
                  </linearGradient>
                  <linearGradient id="budgetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize:12, fill:'#94a3b8' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v=>'₱'+v/1000+'k'}/>
                <Tooltip formatter={v=>fmt(v)} contentStyle={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12 }}/>
                <Area type="monotone" dataKey="budget" stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 4" fill="url(#budgetGrad)" name="Budget"/>
                <Area type="monotone" dataKey="spent"  stroke="#06b6d4" strokeWidth={2.5} fill="url(#spentGrad)" name="Spent"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <h3 className="chart-title">By Department</h3>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={departments} dataKey="spent" nameKey="department" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                  {departments.map((d,i) => <Cell key={i} fill={d.color||'#06b6d4'}/>)}
                </Pie>
                <Tooltip formatter={v=>fmt(v)} contentStyle={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12 }}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="dept-legend">
              {departments.map(d => (
                <div key={d.department} className="dept-legend-item">
                  <span className="dept-dot" style={{ background:d.color }}/>
                  <span className="dept-name">{d.department}</span>
                  <span className="dept-amount">{fmt(d.spent)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Activity + Notifications */}
        <section className="bottom-row">
          <div className="chart-card" style={{ animation:'cardReveal .4s ease both .38s', padding:'24px 24px 8px' }}>
            <div className="chart-card-header">
              <h3 className="chart-title">Recent Activity</h3>
              <span className="chart-badge">{activity.length} items</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column' }}>
              {activity.map(item => {
                const s = STATUS_CFG[item.status] || STATUS_CFG.pending
                return (
                  <div key={item.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 0', borderBottom:'1px solid #f1f5f9', gap:16 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <span style={{ display:'block', fontSize:13.5, fontWeight:700, color:'#1e293b', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginBottom:3 }}>{item.item}</span>
                      <span style={{ display:'block', fontSize:11.5, color:'#94a3b8', fontFamily:'JetBrains Mono,monospace' }}>{item.department} · {item.requestedBy} · {item.date}</span>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5, flexShrink:0 }}>
                      <span style={{ fontFamily:'Outfit,sans-serif', fontSize:14.5, fontWeight:800, color:'#1e293b' }}>{fmt(item.amount)}</span>
                      <span className="status-pill" style={{ color:s.color, background:s.bg }}>{s.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="notif-card">
            <div className="chart-card-header">
              <h3 className="chart-title">Notifications</h3>
              {unread > 0 && <span className="chart-badge" style={{ background:'#fee2e2', color:'#ef4444', border:'1px solid #fecaca' }}>{unread} new</span>}
            </div>
            <div className="notif-list">
              {notifications.map(n => (
                <div key={n.id} className={`notif-item${!n.read?' notif-unread':''}`}>
                  <span className="notif-icon">{NOTIF_ICON[n.type] || 'ℹ️'}</span>
                  <div className="notif-body">
                    <span className="notif-msg">{n.message}</span>
                    <span className="notif-time">{n.time}</span>
                  </div>
                  {!n.read && <span className="notif-dot"/>}
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}
