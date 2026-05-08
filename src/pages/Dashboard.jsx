import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useRole } from '../hooks/useRole'
import PageLayout from '../components/PageLayout'
import Card from '../components/Card'
import { budgetAPI, procurementAPI, notificationsAPI, requestsAPI } from '../services/api'

const fmt = n => '₱' + (n ?? 0).toLocaleString()

const BudgetIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
const ArrowUpIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5,12 12,5 19,12"/></svg>
const BankIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12,2 22,7 2,7"/></svg>
const ClipIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
const BellIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
const AlertTriIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
const CheckCircleIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>
const InfoIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
const MailIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>

const STATUS_CFG = {
  approved:   { label:'Approved',   color:'#10b981', bg:'rgba(16,185,129,.1)' },
  pending:    { label:'Pending',     color:'#f59e0b', bg:'rgba(245,158,11,.1)' },
  for_review: { label:'For Review',  color:'#3b82f6', bg:'rgba(59,130,246,.1)' },
  rejected:   { label:'Rejected',    color:'#ef4444', bg:'rgba(239,68,68,.1)'  },
}
const NOTIF_ICON_MAP = { approval:<MailIcon/>, alert:<AlertTriIcon/>, info:<InfoIcon/>, success:<CheckCircleIcon/> }
const NOTIF_COLOR = { approval:'#3b82f6', alert:'#f59e0b', info:'#94a3b8', success:'#10b981' }

export default function Dashboard() {
  const { user, role, isAdmin, isITStaff, isStaff } = useRole()
  const [summary, setSummary] = useState(null)
  const [deptBudget, setDeptBudget] = useState(null)
  const [activity, setActivity] = useState([])
  const [monthly, setMonthly] = useState([])
  const [depts, setDepts] = useState([])
  const [notifs, setNotifs] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

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
  const myRequests = requests.filter(r => isStaff ? r.requestedBy === user?.name : true)
  const pendingCount = requests.filter(r => (isITStaff || isAdmin) ? r.status === 'pending' || r.status === 'for_review' : r.requestedBy === user?.name && r.status === 'pending').length

  const opexOver = summary && summary.opex.pct >= 80
  const capexOver = summary && summary.capex.pct >= 80
  const deptOpexOver = deptBudget && deptBudget.opex.pct >= 80
  const deptCapexOver = deptBudget && deptBudget.capex.pct >= 80

  return (
    <PageLayout
      title={`${greeting}, ${user?.name?.split(' ')[0]}`}
      subtitle={new Date().toLocaleDateString('en-PH', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
      badge="Dashboard"
      actions={
        <button className="btn btn-ghost btn-sm" style={{ gap:6 }}>
          <BellIcon />
          {unread > 0 && <span style={{ background:'#ef4444',color:'#fff',fontSize:10,fontWeight:800,padding:'1px 6px',borderRadius:100,fontFamily:'JetBrains Mono,monospace' }}>{unread}</span>}
        </button>
      }
    >
      {/* Budget Alerts for admin/it_staff */}
      {(isAdmin || isITStaff) && (opexOver || capexOver) && (
        <div className={`alert-bar ${opexOver || capexOver ? 'critical' : 'warning'}`}>
          <div className="alert-bar-icon" style={{ color:'#ef4444' }}><AlertTriIcon /></div>
          <div className="alert-bar-text">
            <div className="alert-bar-title">Budget Overspend Alert</div>
            <div className="alert-bar-sub">
              {opexOver && `OpEx at ${summary.opex.pct}% (₱${summary.opex.remaining.toLocaleString()} remaining)`}
              {opexOver && capexOver && ' · '}
              {capexOver && `CapEx at ${summary.capex.pct}% (₱${summary.capex.remaining.toLocaleString()} remaining)`}
            </div>
          </div>
        </div>
      )}
      {/* Dept alerts for regular staff */}
      {isStaff && (deptOpexOver || deptCapexOver) && (
        <div className="alert-bar warning">
          <div className="alert-bar-icon" style={{ color:'#f59e0b' }}><AlertTriIcon /></div>
          <div className="alert-bar-text">
            <div className="alert-bar-title">Department Budget Alert</div>
            <div className="alert-bar-sub">
              {deptOpexOver && `Dept OpEx at ${deptBudget.opex.pct}%`}
              {deptOpexOver && deptCapexOver && ' · '}
              {deptCapexOver && `Dept CapEx at ${deptBudget.capex.pct}%`}
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards — role-aware */}
      {(isAdmin || isITStaff) && summary && (
        <div className="stat-grid">
          <Card title="Total IT Budget" value={fmt(summary.totalBudget)} subtitle="FY 2025 Allocation" icon={<BudgetIcon/>} accent="#06b6d4" trend={5} loading={loading}/>
          <Card title="Total Spent" value={fmt(summary.totalSpent)} subtitle={`${Math.round(summary.totalSpent/summary.totalBudget*100)}% used`} icon={<ArrowUpIcon/>} accent="#3b82f6" trend={12} loading={loading}/>
          <Card title="Remaining" value={fmt(summary.totalRemaining)} subtitle="Available funds" icon={<BankIcon/>} accent="#10b981" trend={-3} loading={loading}/>
          <Card title={isAdmin ? 'Pending Approval' : 'Requests to Review'} value={pendingCount} subtitle="Awaiting action" icon={<ClipIcon/>} accent="#f59e0b" loading={loading}/>
        </div>
      )}
      {isStaff && deptBudget && (
        <div className="stat-grid" style={{ gridTemplateColumns:'repeat(2,1fr)' }}>
          <Card title="Dept OpEx Remaining" value={fmt(deptBudget.opex.remaining)} subtitle={`${deptBudget.opex.pct}% of OpEx used`} icon={<BudgetIcon/>} accent="#8b5cf6" loading={!deptBudget}/>
          <Card title="Dept CapEx Remaining" value={fmt(deptBudget.capex.remaining)} subtitle={`${deptBudget.capex.pct}% of CapEx used`} icon={<BankIcon/>} accent="#3b82f6" loading={!deptBudget}/>
        </div>
      )}

      {/* OpEx/CapEx dual budget bars — admin & it_staff */}
      {(isAdmin || isITStaff) && summary && (
        <div className="dual-budget-grid">
          {[
            { key:'opex', label:'OpEx — Software, Cloud & Services', color:'#8b5cf6' },
            { key:'capex', label:'CapEx — Hardware & Equipment', color:'#3b82f6' },
          ].map(b => {
            const d = summary[b.key]
            return (
              <div key={b.key} className="dual-budget-card">
                <div className="dbc-header">
                  <span className="dbc-title">{b.label}</span>
                  <span className="dbc-pct" style={{ background:`${b.color}15`, color:b.color }}>{d.pct}% used</span>
                </div>
                <div className="dbc-amounts">
                  <div><div className="dbc-sub">Spent</div><div className="dbc-val" style={{ color:b.color }}>{fmt(d.spent)}</div></div>
                  <div style={{ textAlign:'right' }}><div className="dbc-sub">Remaining</div><div className="dbc-val">{fmt(d.remaining)}</div></div>
                </div>
                <div className="dbc-track"><div className="dbc-fill" style={{ width:`${d.pct}%`, background: d.pct>=80?'linear-gradient(90deg,#f59e0b,#ef4444)':`linear-gradient(90deg,${b.color},${b.color}aa)` }}/></div>
                <div className="dbc-meta">of {fmt(d.total)} total allocation</div>
              </div>
            )
          })}
        </div>
      )}
      {/* Dept budget bars for staff */}
      {isStaff && deptBudget && (
        <div className="dual-budget-grid">
          {[
            { key:'opex', label:'Department OpEx Budget', color:'#8b5cf6' },
            { key:'capex', label:'Department CapEx Budget', color:'#3b82f6' },
          ].map(b => {
            const d = deptBudget[b.key]
            return (
              <div key={b.key} className="dual-budget-card">
                <div className="dbc-header">
                  <span className="dbc-title">{b.label}</span>
                  <span className="dbc-pct" style={{ background:`${b.color}15`, color:b.color }}>{d.pct}% used</span>
                </div>
                <div className="dbc-amounts">
                  <div><div className="dbc-sub">Spent</div><div className="dbc-val" style={{ color:b.color }}>{fmt(d.spent)}</div></div>
                  <div style={{ textAlign:'right' }}><div className="dbc-sub">Remaining</div><div className="dbc-val">{fmt(d.remaining)}</div></div>
                </div>
                <div className="dbc-track"><div className="dbc-fill" style={{ width:`${Math.min(d.pct,100)}%`, background: d.pct>=80?'#ef4444':`linear-gradient(90deg,${b.color},${b.color}aa)` }}/></div>
                <div className="dbc-meta">of {fmt(d.total)} allocation for {user?.department}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Charts for admin/it_staff */}
      {(isAdmin || isITStaff) && (
        <div className="chart-row">
          <div className="glass-card">
            <div className="card-header"><h3 className="card-title">Monthly Spend — OpEx vs CapEx</h3><span className="card-badge">Last 6 Months</span></div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthly} margin={{ top:8,right:8,left:0,bottom:0 }}>
                <defs>
                  <linearGradient id="og" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={.25}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={.02}/></linearGradient>
                  <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={.25}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={.02}/></linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize:11,fill:'#94a3b8' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:11,fill:'#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v=>'₱'+v/1000+'k'}/>
                <Tooltip formatter={v=>fmt(v)} contentStyle={{ background:'#fff',border:'1px solid #e2e8f0',borderRadius:10 }}/>
                <Area type="monotone" dataKey="spent" stroke="#8b5cf6" strokeWidth={2} fill="url(#og)" name="OpEx"/>
                <Area type="monotone" dataKey="budget" stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 4" fill="url(#cg)" name="CapEx"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="glass-card">
            <div className="card-header"><h3 className="card-title">By Department</h3></div>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart><Pie data={depts} dataKey="spent" nameKey="department" cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={3}>
                {depts.map((d,i)=><Cell key={i} fill={d.color||'#06b6d4'}/>)}
              </Pie><Tooltip formatter={v=>fmt(v)} contentStyle={{ background:'#fff',border:'1px solid #e2e8f0',borderRadius:10 }}/></PieChart>
            </ResponsiveContainer>
            <div style={{ display:'flex',flexDirection:'column',gap:4,marginTop:10 }}>
              {depts.slice(0,4).map(d=>(
                <div key={d.department} style={{ display:'flex',alignItems:'center',gap:8 }}>
                  <span style={{ width:8,height:8,borderRadius:2,background:d.color,flexShrink:0 }}/>
                  <span style={{ flex:1,fontSize:12,color:'#475569',fontWeight:600 }}>{d.department}</span>
                  <span style={{ fontSize:11.5,color:'#94a3b8',fontFamily:'JetBrains Mono,monospace' }}>{fmt(d.spent)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom row */}
      <div className="bottom-row">
        {/* Activity / My Requests */}
        <div className="glass-card" style={{ padding:'22px 24px 8px',animation:'cardReveal .4s ease both .36s' }}>
          <div className="card-header">
            <h3 className="card-title">{isStaff ? 'My Requests' : 'Recent Activity'}</h3>
            <span className="card-badge">{isStaff ? myRequests.length : activity.length} items</span>
          </div>
          <div>
            {(isStaff ? myRequests : activity).slice(0,5).map((item,i) => {
              const isReq = isStaff
              const s = STATUS_CFG[item.status || 'pending'] || STATUS_CFG.pending
              return (
                <div key={i} className="feed-item">
                  <div style={{ flex:1,minWidth:0 }}>
                    <span className="feed-name">{isReq ? item.title : item.item}</span>
                    <span className="feed-meta">{isReq ? `${item.department} · ${item.date}` : `${item.department} · ${item.date}`}</span>
                  </div>
                  <div className="feed-right">
                    <span className="feed-amt">{fmt(isReq ? item.total : item.amount)}</span>
                    <span className="pill" style={{ color:s.color,background:s.bg }}>{s.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Notifications */}
        <div className="glass-card" style={{ padding:'22px 24px 8px',animation:'cardReveal .4s ease both .44s' }}>
          <div className="card-header">
            <h3 className="card-title">Notifications</h3>
            {unread > 0 && <span className="card-badge" style={{ background:'#fee2e2',color:'#ef4444',border:'1px solid #fecaca' }}>{unread} new</span>}
          </div>
          <div className="notif-list">
            {notifs.map(n => (
              <div key={n.id} className={`notif-item${!n.read?' unread':''}`}>
                <div className="notif-icon-wrap" style={{ color:NOTIF_COLOR[n.type]||'#94a3b8' }}>{NOTIF_ICON_MAP[n.type]||<InfoIcon/>}</div>
                <div className="notif-body">
                  <span className="notif-msg">{n.msg}</span>
                  <span className="notif-time">{n.time}</span>
                </div>
                {!n.read && <span className="notif-dot"/>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
