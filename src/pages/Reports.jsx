import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'
import PageLayout from '../components/PageLayout'
import { reportsAPI } from '../services/api'
import { useRole } from '../hooks/useRole'

const fmt  = n => '₱' + Number(n ?? 0).toLocaleString()
const fmtS = n => { if(n>=1000000) return '₱'+(n/1000000).toFixed(1)+'M'; if(n>=1000) return '₱'+(n/1000).toFixed(0)+'k'; return '₱'+n }

const CAT_CFG = {
  Hardware:        { color:'#3b82f6' },
  'Software License':{ color:'#8b5cf6' },
  Service:         { color:'#06b6d4' },
}

const DownloadIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
const AlertIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
const InfoIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>

// ── EXPORT HELPERS ────────────────────────────────────────────────
function exportExcel(data, filename) {
  if (!data || data.length === 0) return
  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = String(row[h] ?? '').replace(/"/g, '""')
        return val.includes(',') || val.includes('"') || val.includes('\n') ? `"${val}"` : val
      }).join(',')
    )
  ]
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename + '.csv'; a.click()
  URL.revokeObjectURL(url)
}

function exportPDF(title, columns, rows, filename) {
  const styles = `
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #1e293b; }
    .header { background: #0f172a; color: white; padding: 16px 20px; margin: -20px -20px 20px; }
    .header h1 { font-size: 16px; margin: 0 0 4px; }
    .header p  { font-size: 10px; color: #94a3b8; margin: 0; }
    h2 { font-size: 13px; color: #0f172a; margin-bottom: 4px; }
    .meta { font-size: 9px; color: #64748b; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    thead tr { background: #06b6d4; color: white; }
    th { padding: 7px 10px; text-align: left; font-weight: 700; }
    td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) td { background: #f8fafc; }
    .footer { margin-top: 20px; font-size: 8px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
    @media print { body { padding: 10px; } .header { margin: -10px -10px 15px; } }
  `
  const thead = `<tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr>`
  const tbody = rows.map(r => `<tr>${r.map(c => `<td>${c ?? '—'}</td>`).join('')}</tr>`).join('')
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${filename}</title><style>${styles}</style></head>
  <body>
    <div class="header"><h1>PRISMA — IT Budget & Cost Management Tracker</h1><p>ITIL Financial Management Aligned &nbsp;|&nbsp; FY 2025</p></div>
    <h2>${title}</h2>
    <p class="meta">Generated: ${new Date().toLocaleString('en-PH')}</p>
    <table><thead>${thead}</thead><tbody>${tbody}</tbody></table>
    <div class="footer">PRISMA IT Budget Tracker &nbsp;|&nbsp; Confidential &nbsp;|&nbsp; ${filename}</div>
  </body></html>`
  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print() }, 600)
}

export default function Reports() {
  const { isAdmin, isITStaff, isStaff, user } = useRole()
  const [summary,   setSummary]   = useState(null)
  const [monthly,   setMonthly]   = useState([])
  const [quarterly, setQuarterly] = useState([])
  const [variance,  setVariance]  = useState(null)
  const [catData,   setCatData]   = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [loading,   setLoading]   = useState(true)
  const [exporting, setExporting] = useState('')

  useEffect(() => {
    setActiveTab(isStaff ? 'dept' : 'overview')
    Promise.all([
      reportsAPI.getSummary(),
      reportsAPI.getMonthlyData(),
      reportsAPI.getQuarterlyData(),
      reportsAPI.getVarianceReport(),
      reportsAPI.getExpensesByCategory(),
    ]).then(([s,m,q,v,c]) => {
      setSummary(s); setMonthly(m); setQuarterly(q)
      setVariance(v); setCatData(c); setLoading(false)
    })
  }, [])

  // Export handlers
  const handleExportMonthlyExcel = () => {
    setExporting('monthly-xl')
    const rows = monthly.filter(m=>m.actual>0).map(m => ({
      'Month': m.month,
      'Planned (₱)': m.planned,
      'Actual (₱)': m.actual,
      'Hardware (₱)': m.hardware,
      'Software License (₱)': m.softwareLicense,
      'Service (₱)': m.service,
      'Variance (₱)': m.actual - m.planned,
      'Variance (%)': `${Math.round(((m.actual-m.planned)/m.planned)*100)}%`,
    }))
    exportExcel(rows, 'PRISMA_Monthly_Report_FY2025', 'Monthly Report')
    setExporting('')
  }

  const handleExportMonthlyPDF = () => {
    setExporting('monthly-pdf')
    const cols = ['Month','Planned','Actual','Hardware','Sw License','Service','Variance','Var %']
    const rows = monthly.filter(m=>m.actual>0).map(m => [
      m.month, fmt(m.planned), fmt(m.actual), fmt(m.hardware), fmt(m.softwareLicense), fmt(m.service),
      fmt(m.actual-m.planned), `${Math.round(((m.actual-m.planned)/m.planned)*100)}%`,
    ])
    exportPDF('Monthly IT Budget Report — FY 2025', cols, rows, 'PRISMA_Monthly_Report_FY2025')
    setExporting('')
  }

  const handleExportQuarterlyExcel = () => {
    setExporting('qtly-xl')
    const rows = quarterly.map(q => ({
      'Quarter': q.quarter, 'Planned (₱)': q.planned, 'Actual (₱)': q.actual,
      'Hardware (₱)': q.hardware, 'Software License (₱)': q.softwareLicense,
      'Service (₱)': q.service, 'Variance (₱)': q.variance,
      'Variance (%)': q.actual>0?`${Math.round(q.variance/q.planned*100)}%`:'—',
    }))
    exportExcel(rows, 'PRISMA_Quarterly_Report_FY2025', 'Quarterly Report')
    setExporting('')
  }

  const handleExportQuarterlyPDF = () => {
    setExporting('qtly-pdf')
    const cols = ['Quarter','Planned','Actual','Hardware','Sw License','Service','Variance','Var %']
    const rows = quarterly.map(q => [
      q.quarter, fmt(q.planned), q.actual>0?fmt(q.actual):'—',
      q.hardware>0?fmt(q.hardware):'—', q.softwareLicense>0?fmt(q.softwareLicense):'—',
      q.service>0?fmt(q.service):'—', q.actual>0?fmt(q.variance):'—',
      q.actual>0?`${Math.round(q.variance/q.planned*100)}%`:'—',
    ])
    exportPDF('Quarterly IT Budget Report — FY 2025', cols, rows, 'PRISMA_Quarterly_Report_FY2025')
    setExporting('')
  }

  const handleExportVariancePDF = () => {
    setExporting('var-pdf')
    const cols = ['Category','Budgeted','Actual','Variance','Var %','Status']
    const rows = variance?.byCategory?.map(r=>[r.category,fmt(r.budgeted),fmt(r.actual),fmt(r.variance),`${r.variancePct}%`,r.status]) || []
    exportPDF('Variance Report — FY 2025 (Jan–May)', cols, rows, 'PRISMA_Variance_Report_FY2025')
    setExporting('')
  }

  const handleExportVarianceExcel = () => {
    setExporting('var-xl')
    const rows = variance?.byCategory?.map(r=>({'Category':r.category,'Budgeted (₱)':r.budgeted,'Actual (₱)':r.actual,'Variance (₱)':r.variance,'Variance (%)':r.variancePct+'%','Status':r.status})) || []
    exportExcel(rows, 'PRISMA_Variance_Report_FY2025', 'Variance Report')
    setExporting('')
  }

  const TABS = [
    ...(!isStaff?[{key:'overview',label:'Overview'}]:[]),
    ...(!isStaff?[{key:'monthly',label:'Monthly Report'}]:[]),
    ...(!isStaff?[{key:'quarterly',label:'Quarterly Report'}]:[]),
    ...(!isStaff?[{key:'variance',label:'Variance Report'}]:[]),
    {key:'dept',label:isStaff?`${user?.department} Report`:'By Category'},
  ]

  return (
    <PageLayout title="Reports & Analytics" subtitle="Monthly, quarterly, and variance reports with Excel and PDF export" badge="Reports"
      actions={null}
    >
      {/* KPI strip */}
      {summary && !isStaff && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:20,animation:'cardReveal .35s ease both'}}>
          {[
            {label:'Total IT Budget',          val:fmt(summary.totalBudget),    color:'#06b6d4'},
            {label:'Total Spent (Approved)',   val:fmt(summary.totalSpent),     color:'#3b82f6'},
            {label:'Total Remaining',          val:fmt(summary.totalRemaining), color:'#10b981'},
            {label:'Overall Utilization',      val:`${Math.round(summary.totalSpent/summary.totalBudget*100)}%`, color:'#f59e0b'},
          ].map(k=>(
            <div key={k.label} style={{background:'#fff',border:'1.5px solid #f1f5f9',borderRadius:16,padding:'16px 18px',boxShadow:'0 2px 8px rgba(0,0,0,.06)',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:k.color,opacity:.7}}/>
              <div style={{fontSize:10,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',fontFamily:'JetBrains Mono,monospace',marginBottom:5}}>{k.label}</div>
              <div style={{fontFamily:'Outfit,sans-serif',fontSize:22,fontWeight:900,color:'#0f172a',letterSpacing:'-.5px'}}>{k.val}</div>
            </div>
          ))}
        </div>
      )}

      <div className="tabs">
        {TABS.map(t=><button key={t.key} className={`tab${activeTab===t.key?' active':''}`} onClick={()=>setActiveTab(t.key)}>{t.label}</button>)}
      </div>

      {/* OVERVIEW */}
      {activeTab==='overview' && !isStaff && (
        <div style={{display:'flex',flexDirection:'column',gap:18}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
            <div className="glass-card" style={{padding:24}}>
              <div className="card-header"><h3 className="card-title">Spend by Category</h3><span className="card-badge">FY 2025</span></div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    {catData.map((c,i)=><Cell key={i} fill={c.color}/>)}
                  </Pie>
                  <Tooltip formatter={v=>fmt(v)} contentStyle={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:10}}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:8}}>
                {catData.map(c=>(
                  <div key={c.name} style={{display:'flex',alignItems:'center',gap:9,padding:'6px 10px',borderRadius:8,transition:'background .15s'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <span style={{width:10,height:10,borderRadius:3,background:c.color,flexShrink:0}}/>
                    <span style={{flex:1,fontSize:13,fontWeight:700,color:'#334155'}}>{c.name}</span>
                    <span style={{fontSize:12,fontFamily:'JetBrains Mono,monospace',color:'#64748b'}}>{fmt(c.value)} / {fmt(c.budget)}</span>
                    <span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:5,background:`${c.color}15`,color:c.color,fontFamily:'JetBrains Mono,monospace'}}>{c.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card" style={{padding:24}}>
              <div className="card-header"><h3 className="card-title">Budget vs Actual (Monthly)</h3></div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthly.slice(0,6)} margin={{left:10,right:10}}>
                  <XAxis dataKey="month" tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={fmtS}/>
                  <Tooltip formatter={v=>fmt(v)} contentStyle={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:10}}/>
                  <Legend/>
                  <Bar dataKey="planned" fill="#e2e8f0" radius={[4,4,0,0]} name="Planned"/>
                  <Bar dataKey="actual"  fill="#06b6d4" radius={[4,4,0,0]} name="Actual"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* MONTHLY REPORT */}
      {activeTab==='monthly' && !isStaff && (
        <div style={{display:'flex',flexDirection:'column',gap:18}}>
          <div style={{display:'flex',justifyContent:'flex-end',gap:10}}>
            <button className="btn btn-secondary btn-sm" onClick={handleExportMonthlyExcel} disabled={!!exporting} style={{gap:7}}><DownloadIcon/>{exporting==='monthly-xl'?'Exporting...':'Export CSV'}</button>
            <button className="btn btn-primary btn-sm" onClick={handleExportMonthlyPDF} disabled={!!exporting} style={{gap:7}}><DownloadIcon/>{exporting==='monthly-pdf'?'Exporting...':'Export PDF'}</button>
          </div>
          <div className="glass-card" style={{padding:24}}>
            <div className="card-header"><h3 className="card-title">Monthly Spend — Plan vs Actual with Category Breakdown</h3><span className="card-badge">FY 2025</span></div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthly.slice(0,6)} margin={{left:10,right:10}}>
                <XAxis dataKey="month" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={fmtS}/>
                <Tooltip formatter={v=>fmt(v)} contentStyle={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:10}}/>
                <Legend/>
                <Bar dataKey="hardware"        fill="#3b82f6" radius={[0,0,0,0]} name="Hardware"         stackId="a"/>
                <Bar dataKey="softwareLicense" fill="#8b5cf6" radius={[0,0,0,0]} name="Software License" stackId="a"/>
                <Bar dataKey="service"         fill="#06b6d4" radius={[4,4,0,0]} name="Service"          stackId="a"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Month</th><th>Planned</th><th>Actual</th><th>Hardware</th><th>Sw License</th><th>Service</th><th>Variance (₱)</th><th>Variance (%)</th></tr></thead>
              <tbody>
                {monthly.slice(0,6).map(m=>{
                  const v = m.actual - m.planned
                  const vp = m.planned>0?Math.round((v/m.planned)*100):0
                  return (
                    <tr key={m.month} className="tr">
                      <td><strong>{m.month}</strong></td>
                      <td><span className="amt">{fmt(m.planned)}</span></td>
                      <td><span className="amt" style={{color:m.actual>0?'#1e293b':'#94a3b8'}}>{m.actual>0?fmt(m.actual):'—'}</span></td>
                      <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:12}}>{m.hardware>0?fmt(m.hardware):'—'}</td>
                      <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:12}}>{m.softwareLicense>0?fmt(m.softwareLicense):'—'}</td>
                      <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:12}}>{m.service>0?fmt(m.service):'—'}</td>
                      <td><span style={{fontFamily:'JetBrains Mono,monospace',fontSize:12.5,fontWeight:700,color:m.actual===0?'#94a3b8':v>0?'#ef4444':'#10b981'}}>{m.actual===0?'—':v>0?'+'+fmt(v):fmt(v)}</span></td>
                      <td><span className="pill" style={{color:m.actual===0?'#94a3b8':v>0?'#ef4444':v<0?'#10b981':'#06b6d4',background:m.actual===0?'rgba(148,163,184,.1)':v>0?'rgba(239,68,68,.1)':v<0?'rgba(16,185,129,.1)':'rgba(6,182,212,.1)'}}>{m.actual===0?'—':`${vp>0?'+':''}${vp}%`}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QUARTERLY REPORT */}
      {activeTab==='quarterly' && !isStaff && (
        <div style={{display:'flex',flexDirection:'column',gap:18}}>
          <div style={{display:'flex',justifyContent:'flex-end',gap:10}}>
            <button className="btn btn-secondary btn-sm" onClick={handleExportQuarterlyExcel} disabled={!!exporting} style={{gap:7}}><DownloadIcon/>{exporting==='qtly-xl'?'Exporting...':'Export CSV'}</button>
            <button className="btn btn-primary btn-sm" onClick={handleExportQuarterlyPDF} disabled={!!exporting} style={{gap:7}}><DownloadIcon/>{exporting==='qtly-pdf'?'Exporting...':'Export PDF'}</button>
          </div>
          <div className="glass-card" style={{padding:24}}>
            <div className="card-header"><h3 className="card-title">Quarterly Budget vs Actual</h3><span className="card-badge">FY 2025</span></div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={quarterly} margin={{left:10,right:10}}>
                <XAxis dataKey="quarter" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={fmtS}/>
                <Tooltip formatter={v=>fmt(v)} contentStyle={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:10}}/>
                <Legend/>
                <Bar dataKey="planned"         fill="#e2e8f0"  radius={[4,4,0,0]} name="Planned"/>
                <Bar dataKey="hardware"        fill="#3b82f6"  radius={[0,0,0,0]} name="Hardware"         stackId="a"/>
                <Bar dataKey="softwareLicense" fill="#8b5cf6"  radius={[0,0,0,0]} name="Software License" stackId="a"/>
                <Bar dataKey="service"         fill="#06b6d4"  radius={[4,4,0,0]} name="Service"          stackId="a"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Quarter</th><th>Planned</th><th>Actual</th><th>Hardware</th><th>Sw License</th><th>Service</th><th>Variance (₱)</th><th>Variance (%)</th></tr></thead>
              <tbody>
                {quarterly.map(q=>{
                  const vp = q.actual>0?Math.round(q.variance/q.planned*100):0
                  return (
                    <tr key={q.quarter} className="tr">
                      <td><strong>{q.quarter}</strong></td>
                      <td><span className="amt">{fmt(q.planned)}</span></td>
                      <td><span className="amt" style={{color:q.actual>0?'#1e293b':'#94a3b8'}}>{q.actual>0?fmt(q.actual):'Pending'}</span></td>
                      <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:12}}>{q.hardware>0?fmt(q.hardware):'—'}</td>
                      <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:12}}>{q.softwareLicense>0?fmt(q.softwareLicense):'—'}</td>
                      <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:12}}>{q.service>0?fmt(q.service):'—'}</td>
                      <td><span style={{fontFamily:'JetBrains Mono,monospace',fontSize:12.5,fontWeight:700,color:q.actual===0?'#94a3b8':q.variance>0?'#ef4444':'#10b981'}}>{q.actual===0?'—':q.variance>0?'+'+fmt(q.variance):fmt(q.variance)}</span></td>
                      <td><span className="pill" style={{color:q.actual===0?'#94a3b8':q.variance>0?'#ef4444':'#10b981',background:q.actual===0?'rgba(148,163,184,.1)':q.variance>0?'rgba(239,68,68,.1)':'rgba(16,185,129,.1)'}}>{q.actual===0?'—':`${vp>0?'+':''}${vp}%`}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VARIANCE REPORT */}
      {activeTab==='variance' && !isStaff && variance && (
        <div style={{display:'flex',flexDirection:'column',gap:18}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{background:'rgba(6,182,212,.05)',border:'1px solid rgba(6,182,212,.15)',borderRadius:12,padding:'10px 16px',fontSize:13,color:'#0891b2',fontWeight:600}}>
              Period: {variance.period} · Planned: {fmt(variance.totalBudgeted)} · Actual: {fmt(variance.totalActual)} · Variance: <span style={{color:variance.totalVariance>0?'#ef4444':'#10b981',fontWeight:800}}>{variance.totalVariancePct}%</span>
            </div>
            <div style={{display:'flex',gap:10}}>
              <button className="btn btn-secondary btn-sm" onClick={handleExportVarianceExcel} disabled={!!exporting} style={{gap:7}}><DownloadIcon/>{exporting==='var-xl'?'Exporting...':'Export CSV'}</button>
              <button className="btn btn-primary btn-sm" onClick={handleExportVariancePDF} disabled={!!exporting} style={{gap:7}}><DownloadIcon/>{exporting==='var-pdf'?'Exporting...':'Export PDF'}</button>
            </div>
          </div>
          {variance.alerts?.length>0 && (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {variance.alerts.map((a,i)=>(
                <div key={i} className={`alert-bar ${a.type==='warning'?'warning':'warning'}`} style={{background:a.type==='warning'?'rgba(245,158,11,.07)':'rgba(6,182,212,.06)',borderColor:a.type==='warning'?'rgba(245,158,11,.2)':'rgba(6,182,212,.2)'}}>
                  <div className="alert-bar-icon" style={{color:a.type==='warning'?'#f59e0b':'#06b6d4'}}>{a.type==='warning'?<AlertIcon/>:<InfoIcon/>}</div>
                  <div className="alert-bar-text"><div style={{fontSize:13,color:'#334155'}}>{a.message}</div></div>
                </div>
              ))}
            </div>
          )}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Category</th><th>Budgeted</th><th>Actual</th><th>Variance (₱)</th><th>Variance (%)</th><th>Status</th></tr></thead>
                <tbody>
                  {variance.byCategory?.map(r=>(
                    <tr key={r.category} className="tr">
                      <td><strong style={{color:CAT_CFG[r.category]?.color||'#1e293b'}}>{r.category}</strong></td>
                      <td><span className="amt">{fmt(r.budgeted)}</span></td>
                      <td><span className="amt">{fmt(r.actual)}</span></td>
                      <td><span style={{fontFamily:'JetBrains Mono,monospace',fontWeight:800,color:r.variance>0?'#ef4444':'#10b981'}}>{r.variance>0?'+':''}{fmt(r.variance)}</span></td>
                      <td><span className="pill" style={{color:r.variance>0?'#ef4444':r.variancePct<-30?'#10b981':'#f59e0b',background:r.variance>0?'rgba(239,68,68,.1)':r.variancePct<-30?'rgba(16,185,129,.1)':'rgba(245,158,11,.1)'}}>{r.variancePct>0?'+':''}{r.variancePct}%</span></td>
                      <td><span className="pill" style={{color:r.status==='over'?'#ef4444':r.status==='under'?'#10b981':'#06b6d4',background:r.status==='over'?'rgba(239,68,68,.1)':r.status==='under'?'rgba(16,185,129,.1)':'rgba(6,182,212,.1)'}}>{r.status==='on_track'?'On Track':r.status==='under'?'Under Budget':'Over Budget'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="glass-card" style={{padding:24}}>
              <div className="card-header"><h3 className="card-title">Monthly Variance</h3></div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={variance.byMonth} margin={{left:10,right:10}}>
                  <XAxis dataKey="month" tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={fmtS}/>
                  <Tooltip formatter={v=>fmt(v)} contentStyle={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:10}}/>
                  <Legend/>
                  <Bar dataKey="planned" fill="#e2e8f0" radius={[4,4,0,0]} name="Planned"/>
                  <Bar dataKey="actual"  radius={[4,4,0,0]} name="Actual">
                    {variance.byMonth?.map((m,i)=><Cell key={i} fill={m.actual>m.planned?'#ef4444':'#10b981'}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* DEPARTMENT / CATEGORY (all roles) */}
      {activeTab==='dept' && (
        <div style={{display:'flex',flexDirection:'column',gap:18}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
            {catData.map(c=>(
              <div key={c.name} style={{background:'#fff',border:'1.5px solid #f1f5f9',borderRadius:16,padding:'18px 20px',boxShadow:'0 2px 8px rgba(0,0,0,.06)',position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:c.color,opacity:.7}}/>
                <div style={{fontSize:11,color:'#94a3b8',fontWeight:800,textTransform:'uppercase',letterSpacing:'.07em',fontFamily:'JetBrains Mono,monospace',marginBottom:5}}>{c.name}</div>
                <div style={{fontFamily:'Outfit,sans-serif',fontSize:22,fontWeight:900,color:'#0f172a',marginBottom:2}}>{fmt(c.value)}</div>
                <div style={{fontSize:11.5,color:'#94a3b8',fontFamily:'JetBrains Mono,monospace',marginBottom:10}}>of {fmt(c.budget)} budget</div>
                <div style={{height:6,background:'#f1f5f9',borderRadius:100,overflow:'hidden'}}>
                  <div style={{height:'100%',borderRadius:100,background:c.color,width:`${Math.min(c.pct,100)}%`,transition:'width 1s cubic-bezier(.4,0,.2,1)'}}/>
                </div>
                <div style={{fontSize:11,color:c.pct>=80?'#ef4444':'#94a3b8',fontFamily:'JetBrains Mono,monospace',marginTop:4,fontWeight:c.pct>=80?700:400}}>{c.pct}% utilized</div>
              </div>
            ))}
          </div>
          <div className="glass-card" style={{padding:24}}>
            <div className="card-header"><h3 className="card-title">Category Spend — Bar Comparison</h3></div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={catData.map(c=>({name:c.name,Budget:c.budget,Spent:c.value}))} margin={{left:20,right:20}}>
                <XAxis dataKey="name" tick={{fontSize:12,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={fmtS}/>
                <Tooltip formatter={v=>fmt(v)} contentStyle={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:10}}/>
                <Legend/>
                <Bar dataKey="Budget" fill="#e2e8f0" radius={[5,5,0,0]}/>
                <Bar dataKey="Spent"  radius={[5,5,0,0]}>
                  {catData.map((c,i)=><Cell key={i} fill={c.color}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
