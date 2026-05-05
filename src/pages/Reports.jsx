import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts'
import PageLayout from '../components/PageLayout'
import { reportsAPI } from '../services/api'

const fmt = (n) => '₱' + Number(n).toLocaleString()

export default function Reports() {
  const [overview,  setOverview]  = useState(null)
  const [quarterly, setQuarterly] = useState([])
  const [catSpend,  setCatSpend]  = useState([])
  const [reportList,setReportList]= useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      reportsAPI.getOverview(),
      reportsAPI.getQuarterlyData(),
      reportsAPI.getCategorySpend(),
      reportsAPI.getAvailableReports(),
    ]).then(([o,q,c,r]) => {
      setOverview(o); setQuarterly(q); setCatSpend(c); setReportList(r); setLoading(false)
    })
  }, [])

  return (
    <PageLayout
      title="Reports & Analytics"
      subtitle="Comprehensive spending analytics and downloadable compliance reports"
      badge="📈 Reports"
      actions={<button className="btn-primary">⬇ Export Report</button>}
    >
      {/* KPI Strip */}
      {overview && (
        <div className="ledger-summary-row">
          {[
            { label:'Total Transactions', value: overview.totalTransactions.toLocaleString(), icon:'🔄', accent:'#06b6d4' },
            { label:'Total Processed',    value: fmt(overview.totalProcessed),                icon:'💳', accent:'#3b82f6' },
            { label:'Approval Rate',      value: `${overview.approvalRate}%`,                 icon:'✅', accent:'#10b981' },
            { label:'Avg Approval Time',  value: `${overview.avgApprovalDays} days`,          icon:'⏱',  accent:'#f59e0b' },
          ].map(s => (
            <div key={s.label} className="ledger-stat" style={{ '--acc': s.accent }}>
              <div className="ledger-stat-icon" style={{ background:`${s.accent}18`, color:s.accent }}>{s.icon}</div>
              <div>
                <div className="ledger-stat-value">{s.value}</div>
                <div className="ledger-stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="page-tabs">
        {[
          { key:'overview',  label:'📊 Quarterly' },
          { key:'category',  label:'🏷 Categories' },
          { key:'files',     label:'📁 Report Files' },
        ].map(t => (
          <button key={t.key} className={`page-tab ${activeTab===t.key?'page-tab-active':''}`} onClick={()=>setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Quarterly Overview */}
      {activeTab==='overview' && (
        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
          <div className="chart-card" style={{ padding:28 }}>
            <div className="chart-card-header">
              <h3 className="chart-title">Quarterly Budget vs Actual Spend</h3>
              <span className="chart-badge">FY 2024–2025</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={quarterly} margin={{ left:20, right:20, top:10 }}>
                <XAxis dataKey="quarter" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v=>'₱'+v/1000+'k'}/>
                <Tooltip formatter={v=>fmt(v)} contentStyle={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12 }}/>
                <Legend/>
                <Bar dataKey="budget" fill="#e2e8f0" radius={[6,6,0,0]} name="Budget"/>
                <Bar dataKey="spent"  fill="#06b6d4" radius={[6,6,0,0]} name="Spent"/>
                <Bar dataKey="saved"  fill="#10b981" radius={[6,6,0,0]} name="Saved"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="table-card">
            <table className="data-table">
              <thead><tr><th>Quarter</th><th>Budget</th><th>Spent</th><th>Saved</th><th>Utilization</th></tr></thead>
              <tbody>
                {quarterly.map(q => {
                  const util = Math.round((q.spent/q.budget)*100)
                  return (
                    <tr key={q.quarter} className="table-row">
                      <td><strong>{q.quarter}</strong></td>
                      <td><span className="amount-cell">{fmt(q.budget)}</span></td>
                      <td><span className="amount-cell">{fmt(q.spent)}</span></td>
                      <td><span className="amount-cell" style={{ color:'#10b981' }}>{fmt(q.saved)}</span></td>
                      <td>
                        <div className="util-cell">
                          <div className="mini-bar-track">
                            <div className="mini-bar-fill" style={{ width:`${util}%`, background: util>85?'#ef4444':'#06b6d4' }}/>
                          </div>
                          <span className="util-pct">{util}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {activeTab==='category' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
          <div className="chart-card" style={{ padding:28 }}>
            <div className="chart-card-header">
              <h3 className="chart-title">Spend by Category</h3>
              <span className="chart-badge">FY 2025</span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={catSpend} dataKey="amount" nameKey="category" cx="50%" cy="50%" innerRadius={65} outerRadius={110} paddingAngle={3}>
                  {catSpend.map((c,i)=><Cell key={i} fill={c.color}/>)}
                </Pie>
                <Tooltip formatter={v=>fmt(v)} contentStyle={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12 }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-card" style={{ padding:28 }}>
            <h3 className="chart-title" style={{ marginBottom:20 }}>Category Breakdown</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {catSpend.map(c => (
                <div key={c.category}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:700, color:'#334155' }}>
                      <span style={{ width:10, height:10, borderRadius:3, background:c.color, display:'inline-block', flexShrink:0 }}/>
                      {c.category}
                    </span>
                    <span style={{ fontSize:12, fontFamily:'JetBrains Mono,monospace', color:'#64748b' }}>
                      {fmt(c.amount)} · {c.pct}%
                    </span>
                  </div>
                  <div className="mini-bar-track" style={{ height:7 }}>
                    <div className="mini-bar-fill" style={{ width:`${c.pct}%`, background:c.color }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Report Files */}
      {activeTab==='files' && (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr><th>ID</th><th>Title</th><th>Type</th><th>Period</th><th>Generated</th><th>Size</th><th>Format</th><th>Action</th></tr>
            </thead>
            <tbody>
              {reportList.map(r => (
                <tr key={r.id} className="table-row">
                  <td><span className="mono-tag">{r.id}</span></td>
                  <td><strong>{r.title}</strong></td>
                  <td><span className="cat-badge">{r.type}</span></td>
                  <td><span className="date-cell">{r.period}</span></td>
                  <td><span className="date-cell">{r.generated}</span></td>
                  <td style={{ color:'#94a3b8', fontSize:12, fontFamily:'JetBrains Mono,monospace' }}>{r.size}</td>
                  <td>
                    <span className="status-pill" style={{
                      color:r.format==='PDF'?'#ef4444':'#10b981',
                      background:r.format==='PDF'?'rgba(239,68,68,.1)':'rgba(16,185,129,.1)'
                    }}>{r.format}</span>
                  </td>
                  <td>
                    <button className="btn-action" onClick={()=>alert(`Downloading ${r.title}…`)}>⬇ Download</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageLayout>
  )
}
