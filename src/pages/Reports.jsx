import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import PageLayout from '../components/PageLayout'
import { reportsAPI } from '../services/api'
import { useRole } from '../hooks/useRole'

const fmt = n => '₱' + Number(n).toLocaleString()

export default function Reports() {
  const { isAdmin, isITStaff, isStaff, user } = useRole()
  const [kpis, setKPIs] = useState(null)
  const [monthly, setMonthly] = useState([])
  const [cats, setCats] = useState([])
  const [deptReport, setDeptReport] = useState(null)
  const [files, setFiles] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isStaff) setActiveTab('dept')
    reportsAPI.getSummary().then(setKPIs)
    reportsAPI.getMonthlyTrend().then(setMonthly)
    reportsAPI.getCategoryBreakdown().then(setCats)
    reportsAPI.getDeptReport(user?.department).then(setDeptReport)
    reportsAPI.getFiles().then(setFiles)
    setLoading(false)
  }, [])

  const TABS = [
    ...(!isStaff?[{ key:'overview', label:'Overview' }]:[]),
    ...(!isStaff?[{ key:'categories', label:'Categories' }]:[]),
    { key:'dept', label:isStaff?`${user?.department} Report`:'By Department' },
    ...(isAdmin?[{ key:'files', label:'Report Files' }]:[]),
  ]

  return (
    <PageLayout title="Reports & Analytics" subtitle={isStaff?`Procurement analytics for ${user?.department}`:'IT procurement spend analytics and compliance reports'} badge="Reports"
      actions={isAdmin && <button className="btn btn-secondary btn-sm">Export Report</button>}
    >
      {/* KPI strip — not for regular staff */}
      {(isAdmin||isITStaff) && kpis && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:22,animation:'cardReveal .35s ease both'}}>
          {[
            {label:'Total Transactions',val:kpis.totalPOs.toLocaleString(), color:'#06b6d4'},
            {label:'OpEx Spend',val:fmt(kpis.opexSpend),color:'#8b5cf6'},
            {label:'CapEx Spend',val:fmt(kpis.capexSpend),color:'#3b82f6'},
          ].map(k=>(
            <div key={k.label} style={{background:'#fff',border:'1.5px solid #f1f5f9',borderRadius:18,padding:'18px 20px',boxShadow:'0 2px 10px rgba(0,0,0,.07)',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:k.color,opacity:.7}}/>
              <div style={{fontSize:11,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',fontFamily:'JetBrains Mono,monospace',marginBottom:6}}>{k.label}</div>
              <div style={{fontFamily:'Outfit,sans-serif',fontSize:24,fontWeight:900,color:'#0f172a',letterSpacing:'-.6px'}}>{k.val}</div>
            </div>
          ))}
        </div>
      )}

      <div className="tabs">
        {TABS.map(t=><button key={t.key} className={`tab${activeTab===t.key?' active':''}`} onClick={()=>setActiveTab(t.key)}>{t.label}</button>)}
      </div>

      {/* Overview — admin & IT staff */}
      {activeTab==='overview' && (isAdmin||isITStaff) && (
        <div style={{display:'flex',flexDirection:'column',gap:18}}>
          <div className="glass-card" style={{padding:26}}>
            <div className="card-header"><h3 className="card-title">Monthly IT Spend — OpEx vs CapEx</h3><span className="card-badge">Last 6 Months</span></div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthly} margin={{left:20,right:20,top:10}}>
                <XAxis dataKey="month" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={v=>'₱'+v/1000+'k'}/>
                <Tooltip formatter={v=>fmt(v)} contentStyle={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:12}}/>
                <Bar dataKey="opex"  fill="#8b5cf6" radius={[5,5,0,0]} name="OpEx"/>
                <Bar dataKey="capex" fill="#3b82f6" radius={[5,5,0,0]} name="CapEx"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Categories */}
      {activeTab==='categories' && (isAdmin||isITStaff) && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
          <div className="glass-card" style={{padding:26}}>
            <div className="card-header"><h3 className="card-title">Spend by Category</h3><span className="card-badge">FY 2025</span></div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart><Pie data={cats} dataKey="amount" nameKey="category" cx="50%" cy="50%" innerRadius={65} outerRadius={110} paddingAngle={3}>
                {cats.map((c,i)=><Cell key={i} fill={c.color}/>)}
              </Pie><Tooltip formatter={v=>fmt(v)} contentStyle={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:12}}/></PieChart>
            </ResponsiveContainer>
          </div>
          <div className="glass-card" style={{padding:26}}>
            <h3 className="card-title" style={{marginBottom:18}}>Category Breakdown</h3>
            <div style={{display:'flex',flexDirection:'column',gap:11}}>
              {cats.map(c=>(
                <div key={c.category}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                    <span style={{display:'flex',alignItems:'center',gap:8,fontSize:12.5,fontWeight:700,color:'#334155'}}>
                      <span style={{width:10,height:10,borderRadius:3,background:c.color,flexShrink:0,display:'inline-block'}}/>
                      {c.category}
                      <span className={c.type==='capex'?'badge-capex':'badge-opex'} style={{fontSize:9,padding:'1px 6px'}}>{c.type==='capex'?'CapEx':'OpEx'}</span>
                    </span>
                    <span style={{fontSize:11.5,fontFamily:'JetBrains Mono,monospace',color:'#64748b'}}>{fmt(c.amount)} · {c.pct}%</span>
                  </div>
                  <div className="mini-track" style={{height:6}}><div className="mini-fill" style={{width:`${c.pct*2}%`,background:c.color}}/></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Department Report — all roles see this */}
      {activeTab==='dept' && deptReport && (
        <div style={{display:'flex',flexDirection:'column',gap:18}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:16}}>
            {[
              {label:'OpEx Spend',val:fmt(deptReport.opexSpend),total:deptReport.opexBudget,color:'#8b5cf6'},
              {label:'CapEx Spend',val:fmt(deptReport.capexSpend),total:deptReport.capexBudget,color:'#3b82f6'},
            ].map(k=>(
              <div key={k.label} style={{background:'#fff',border:'1.5px solid #f1f5f9',borderRadius:16,padding:'18px 20px',boxShadow:'0 2px 10px rgba(0,0,0,.07)',position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:k.color,opacity:.7}}/>
                <div style={{fontSize:11,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',fontFamily:'JetBrains Mono,monospace',marginBottom:5}}>{k.label}</div>
                <div style={{fontFamily:'Outfit,sans-serif',fontSize:22,fontWeight:900,color:'#0f172a',marginBottom:8}}>{k.val}</div>
                <div style={{height:6,background:'#f1f5f9',borderRadius:100,overflow:'hidden'}}>
                  <div style={{height:'100%',borderRadius:100,background:k.color,width:`${Math.min(Math.round(k.val.replace(/[₱,]/g,'')/k.total*100),100)}%`}}/>
                </div>
                <div style={{fontSize:11,color:'#94a3b8',fontFamily:'JetBrains Mono,monospace',marginTop:5}}>of {fmt(k.total)} budget</div>
              </div>
            ))}
          </div>
          <div className="glass-card" style={{padding:26}}>
            <div className="card-header"><h3 className="card-title">{deptReport.dept} — Monthly Spend Trend</h3><span className="card-badge">Last 6 Months</span></div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={deptReport.monthlyTrend} margin={{top:8,right:8,left:0,bottom:0}}>
                <defs>
                  <linearGradient id="dg1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={.25}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={.02}/></linearGradient>
                  <linearGradient id="dg2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={.25}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={.02}/></linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={v=>'₱'+v/1000+'k'}/>
                <Tooltip formatter={v=>fmt(v)} contentStyle={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:10}}/>
                <Area type="monotone" dataKey="opex"  stroke="#8b5cf6" strokeWidth={2} fill="url(#dg1)" name="OpEx"/>
                <Area type="monotone" dataKey="capex" stroke="#3b82f6" strokeWidth={2} fill="url(#dg2)" name="CapEx"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Metric</th><th>Value</th></tr></thead>
              <tbody>
                {[
                  {label:'Total Requests Filed',val:deptReport.totalRequests},
                  {label:'Approved',val:deptReport.approved},
                  {label:'Pending',val:deptReport.pending},
                  {label:'Rejected',val:deptReport.rejected},
                  {label:'Approval Rate',val:`${Math.round(deptReport.approved/deptReport.totalRequests*100)}%`},
                  {label:'OpEx Utilization',val:`${Math.round(deptReport.opexSpend/deptReport.opexBudget*100)}%`},
                  {label:'CapEx Utilization',val:`${Math.round(deptReport.capexSpend/deptReport.capexBudget*100)}%`},
                ].map(r=><tr key={r.label} className="tr"><td style={{fontWeight:600,color:'#475569'}}>{r.label}</td><td style={{fontFamily:'JetBrains Mono,monospace',fontWeight:700,color:'#1e293b'}}>{r.val}</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report Files — admin only */}
      {activeTab==='files' && isAdmin && (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>ID</th><th>Title</th><th>Type</th><th>Period</th><th>Generated</th><th>Size</th><th>Format</th><th>Action</th></tr></thead>
            <tbody>
              {files.map(f=>(
                <tr key={f.id} className="tr">
                  <td><span className="mono">{f.id}</span></td>
                  <td><strong style={{color:'#1e293b'}}>{f.title}</strong></td>
                  <td><span style={{fontSize:11.5,fontWeight:700,padding:'2px 9px',borderRadius:6,background:'rgba(6,182,212,.08)',color:'#0891b2',fontFamily:'JetBrains Mono,monospace'}}>{f.type}</span></td>
                  <td><span className="dt">{f.period}</span></td>
                  <td><span className="dt">{f.generated}</span></td>
                  <td><span className="dt">{f.size}</span></td>
                  <td><span className="pill" style={{color:f.format==='PDF'?'#ef4444':'#10b981',background:f.format==='PDF'?'rgba(239,68,68,.1)':'rgba(16,185,129,.1)'}}>{f.format}</span></td>
                  <td><button className="btn btn-secondary btn-sm" onClick={()=>alert(`Downloading ${f.title}`)}>Download</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageLayout>
  )
}
