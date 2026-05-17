import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend } from 'recharts'
import PageLayout from '../components/PageLayout'
import { budgetAPI, expenseAPI } from '../services/api'
import { useRole } from '../hooks/useRole'

const fmt = n => '₱' + Number(n ?? 0).toLocaleString()
const fmtShort = n => { if(n>=1000000) return '₱'+(n/1000000).toFixed(1)+'M'; if(n>=1000) return '₱'+(n/1000).toFixed(0)+'k'; return '₱'+n }

const CAT_CFG = {
  hardware:        { label:'Hardware',         color:'#3b82f6', bg:'rgba(59,130,246,.1)',  border:'rgba(59,130,246,.2)'  },
  softwareLicense: { label:'Software License', color:'#8b5cf6', bg:'rgba(139,92,246,.1)',  border:'rgba(139,92,246,.2)'  },
  service:         { label:'Service',          color:'#06b6d4', bg:'rgba(6,182,212,.1)',   border:'rgba(6,182,212,.2)'   },
}
const EXPENSE_STATUS = {
  approved:   { label:'Approved',   color:'#10b981', bg:'rgba(16,185,129,.1)' },
  pending:    { label:'Pending',     color:'#f59e0b', bg:'rgba(245,158,11,.1)' },
  for_review: { label:'For Review',  color:'#3b82f6', bg:'rgba(59,130,246,.1)' },
  rejected:   { label:'Rejected',    color:'#ef4444', bg:'rgba(239,68,68,.1)'  },
}

const PlusIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const AlertIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
const CheckIcon  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>

export default function Budget() {
  const { isAdmin, isITStaff, user } = useRole()
  const [summary, setSummary]     = useState(null)
  const [lineItems, setLI]        = useState([])
  const [expenses, setExpenses]   = useState([])
  const [monthly, setMonthly]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [catFilter, setCatFilter] = useState('all')
  const [expSearch, setExpSearch] = useState('')
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showAddLI, setShowAddLI] = useState(false)
  const [showSetBudget, setShowSetBudget] = useState(false)
  const [newExp, setNewExp]       = useState({ date:'', category:'hardware', subcategory:'', description:'', vendor:'', amount:'', lineItem:'LI-H01' })
  const [newLI, setNewLI]         = useState({ name:'', category:'hardware', allocated:'' })
  const [budgetForm, setBudgetForm] = useState({ hardware:'2600000', softwareLicense:'1400000', service:'1000000', fy:'2025' })
  const [deptBudgets, setDeptBudgets] = useState([])
  const [showDeptBudget, setShowDeptBudget] = useState(false)
  const [deptBudgetForm, setDeptBudgetForm] = useState({ dept:'IT', hardware:'', softwareLicense:'', service:'' })
  const [deptBudgetSaving, setDeptBudgetSaving] = useState(false)

  useEffect(() => {
    Promise.all([budgetAPI.getSummary(), budgetAPI.getLineItems(), expenseAPI.getAll(), budgetAPI.getMonthlyData(), budgetAPI.getAllDeptBudgets()]).then(([s,li,ex,m,db]) => {
      setSummary(s); setLI(li); setExpenses(ex); setMonthly(m); setDeptBudgets(db.filter(Boolean)); setLoading(false)
    })
  }, [])

  const alerts = lineItems.filter(li => li.warningLevel !== 'ok')
  const filteredExp = expenses.filter(e =>
    (catFilter === 'all' || e.category === catFilter) &&
    (e.description.toLowerCase().includes(expSearch.toLowerCase()) || e.id.toLowerCase().includes(expSearch.toLowerCase()) || e.vendor.toLowerCase().includes(expSearch.toLowerCase()))
  )
  const handleApproveExp = async id => {
    await expenseAPI.updateStatus(id, 'approved', user?.name)
    setExpenses(prev => prev.map(e => e.id===id ? {...e,status:'approved',approvedBy:user?.name} : e))
    const s = await budgetAPI.getSummary(); setSummary(s)
  }
  const handleRejectExp = async id => {
    await expenseAPI.updateStatus(id, 'rejected', user?.name)
    setExpenses(prev => prev.map(e => e.id===id ? {...e,status:'rejected'} : e))
  }
  const handleAddExpense = async () => {
    if (!newExp.description || !newExp.amount) return
    const added = await expenseAPI.addExpense(newExp)
    setExpenses(prev => [added, ...prev])
    setNewExp({ date:'', category:'hardware', subcategory:'', description:'', vendor:'', amount:'', lineItem:'LI-H01' })
    setShowAddExpense(false)
  }
  const handleAddLI = async () => {
    if (!newLI.name || !newLI.allocated) return
    const added = await budgetAPI.addLineItem({ ...newLI, allocated: Number(newLI.allocated) })
    setLI(prev => [...prev, added])
    setNewLI({ name:'', category:'hardware', allocated:'' })
    setShowAddLI(false)
  }

  const capexItems  = lineItems.filter(l => l.category === 'hardware')
  const opexSWItems = lineItems.filter(l => l.category === 'softwareLicense')
  const opexSvcItems= lineItems.filter(l => l.category === 'service')

  return (
    <PageLayout title="Budget & Cost Management" subtitle="IT spending tracking — Hardware, Software License, and Service categories" badge="Budget"
      actions={isAdmin && (
        <div style={{display:'flex',gap:10}}>
          <button className="btn btn-secondary btn-sm" onClick={()=>setShowDeptBudget(true)}>Dept Budgets</button>
          <button className="btn btn-secondary btn-sm" onClick={()=>setShowSetBudget(true)}>Set FY Budget</button>
          <button className="btn btn-secondary btn-sm" onClick={()=>setShowAddLI(true)}>Add Line Item</button>
          <button className="btn btn-primary btn-sm" onClick={()=>setShowAddExpense(true)}><PlusIcon/> Log Expense</button>
        </div>
      )}
    >
      {/* Over-budget alerts */}
      {alerts.length > 0 && (
        <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:20}}>
          {alerts.map(li => (
            <div key={li.id} className={`alert-bar ${li.warningLevel==='critical'?'critical':'warning'}`}>
              <div className="alert-bar-icon" style={{color:li.warningLevel==='critical'?'#ef4444':'#f59e0b'}}><AlertIcon/></div>
              <div className="alert-bar-text">
                <div className="alert-bar-title">{li.warningLevel==='critical'?'Over Budget':'Budget Warning'} — {li.name}</div>
                <div className="alert-bar-sub">{li.utilization}% utilized · ₱{li.spent.toLocaleString()} spent of ₱{li.allocated.toLocaleString()} allocated · ₱{Math.abs(li.remaining).toLocaleString()} {li.remaining<0?'over budget':'remaining'}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Summary Cards */}
      {summary && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:22,animation:'cardReveal .35s ease both'}}>
          {Object.entries(summary.categories).map(([key,cat]) => {
            const cfg = CAT_CFG[key]
            return (
              <div key={key} style={{background:'#fff',border:`1.5px solid ${cfg.border}`,borderRadius:18,padding:'20px 22px',boxShadow:'0 2px 10px rgba(0,0,0,.07)',position:'relative',overflow:'hidden',transition:'all .2s',cursor:'default'}}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 8px 32px rgba(0,0,0,.11)'}}
                onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 2px 10px rgba(0,0,0,.07)'}}>
                <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:cfg.color,opacity:.8}}/>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                  <div style={{fontSize:12,fontWeight:800,color:cfg.color,textTransform:'uppercase',letterSpacing:'.06em',fontFamily:'JetBrains Mono,monospace'}}>{cfg.label}</div>
                  <span style={{fontSize:11,fontWeight:700,padding:'2px 9px',borderRadius:6,background:cfg.bg,color:cfg.color,fontFamily:'JetBrains Mono,monospace'}}>{cat.pct}%</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
                  <div><div style={{fontSize:10,color:'#94a3b8',fontFamily:'JetBrains Mono,monospace',marginBottom:2}}>SPENT</div><div style={{fontFamily:'Outfit,sans-serif',fontSize:20,fontWeight:900,color:cfg.color}}>{fmt(cat.spent)}</div></div>
                  <div style={{textAlign:'right'}}><div style={{fontSize:10,color:'#94a3b8',fontFamily:'JetBrains Mono,monospace',marginBottom:2}}>REMAINING</div><div style={{fontFamily:'Outfit,sans-serif',fontSize:20,fontWeight:900,color:cat.pct>=90?'#ef4444':cat.pct>=80?'#f59e0b':'#10b981'}}>{fmt(cat.remaining)}</div></div>
                </div>
                <div style={{height:7,background:'#f1f5f9',borderRadius:100,overflow:'hidden',marginBottom:5}}>
                  <div style={{height:'100%',borderRadius:100,background:cat.pct>=90?'linear-gradient(90deg,#f59e0b,#ef4444)':cat.pct>=80?'#f59e0b':cfg.color,width:`${Math.min(cat.pct,100)}%`,transition:'width 1s cubic-bezier(.4,0,.2,1)'}}/>
                </div>
                <div style={{fontSize:11,color:'#94a3b8',fontFamily:'JetBrains Mono,monospace'}}>of {fmt(cat.allocated)} allocated</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Total summary band */}
      {summary && (
        <div style={{background:'linear-gradient(135deg,#0c1627,#0a2440)',borderRadius:16,padding:'18px 26px',display:'flex',alignItems:'center',gap:24,marginBottom:22,position:'relative',overflow:'hidden',boxShadow:'0 8px 32px rgba(0,0,0,.15)'}}>
          <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px)',backgroundSize:'28px 28px',pointerEvents:'none'}}/>
          <div style={{position:'absolute',top:-60,right:-40,width:200,height:200,background:'radial-gradient(circle,rgba(6,182,212,.12) 0%,transparent 70%)',pointerEvents:'none'}}/>
          {[
            {label:'FY 2025 Total Budget',    val:fmt(summary.totalBudget),    color:'#22d3ee'},
            {label:'Total Spent (Approved)',  val:fmt(summary.totalSpent),     color:'#60a5fa'},
            {label:'Remaining Budget',        val:fmt(summary.totalRemaining), color:'#34d399'},
            {label:'Pending Expenses',        val:summary.pendingExpenses,     color:'#fbbf24'},
          ].map(s=>(
            <div key={s.label} style={{flex:1,position:'relative',zIndex:1}}>
              <div style={{fontSize:10,color:'rgba(255,255,255,.38)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',fontFamily:'JetBrains Mono,monospace',marginBottom:4}}>{s.label}</div>
              <div style={{fontFamily:'Outfit,sans-serif',fontSize:22,fontWeight:900,color:s.color,letterSpacing:'-.5px'}}>{s.val}</div>
            </div>
          ))}
          <div style={{flex:1,position:'relative',zIndex:1}}>
            <div style={{fontSize:10,color:'rgba(255,255,255,.38)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',fontFamily:'JetBrains Mono,monospace',marginBottom:6}}>Overall Utilization</div>
            <div style={{height:8,background:'rgba(255,255,255,.08)',borderRadius:100,overflow:'hidden'}}>
              <div style={{height:'100%',borderRadius:100,background:'linear-gradient(90deg,#06b6d4,#3b82f6)',width:`${Math.round(summary.totalSpent/summary.totalBudget*100)}%`,transition:'width 1.2s cubic-bezier(.4,0,.2,1)'}}/>
            </div>
            <div style={{fontSize:11,color:'rgba(255,255,255,.35)',fontFamily:'JetBrains Mono,monospace',marginTop:4}}>{Math.round(summary.totalSpent/summary.totalBudget*100)}% of {fmt(summary.totalBudget)}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {[...['overview','hardware','softwareLicense','service','expenses','chart'],...(isAdmin||isITStaff?['deptBudgets']:[])].map(t=>(
          <button key={t} className={`tab${activeTab===t?' active':''}`} onClick={()=>setActiveTab(t)}>
            {t==='overview'?'All Line Items':t==='softwareLicense'?'Software License':t==='expenses'?'Expense Log':t==='chart'?'Charts':t==='deptBudgets'?'Dept Budgets':t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {/* Line Items — overview/hardware/software/service */}
      {['overview','hardware','softwareLicense','service'].includes(activeTab) && (
        <div className="li-grid">
          {loading ? [...Array(6)].map((_,i)=><div key={i} className="sk-line" style={{height:180,borderRadius:16}}/>) :
            (activeTab==='overview'?lineItems:lineItems.filter(l=>l.category===activeTab)).map(li=>{
              const cfg = CAT_CFG[li.category]
              return (
                <div key={li.id} className="li-card" style={{borderColor: li.isOverBudget?'rgba(239,68,68,.3)':li.warningLevel==='warning'?'rgba(245,158,11,.3)':'var(--n100)'}}>
                  <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:li.isOverBudget?'#ef4444':li.warningLevel==='warning'?'#f59e0b':cfg.color,opacity:.8}}/>
                  <div className="li-header">
                    <span className="li-id">{li.id}</span>
                    <span style={{fontSize:10.5,fontWeight:700,padding:'2px 8px',borderRadius:5,background:cfg.bg,color:cfg.color,fontFamily:'JetBrains Mono,monospace'}}>{cfg.label}</span>
                  </div>
                  <div className="li-name">{li.name}</div>
                  {li.isOverBudget && <div style={{display:'flex',alignItems:'center',gap:5,fontSize:11,fontWeight:700,color:'#ef4444',marginBottom:8,fontFamily:'JetBrains Mono,monospace'}}><AlertIcon/> OVER BUDGET by {fmt(Math.abs(li.remaining))}</div>}
                  {!li.isOverBudget && li.warningLevel==='warning' && <div style={{display:'flex',alignItems:'center',gap:5,fontSize:11,fontWeight:700,color:'#f59e0b',marginBottom:8,fontFamily:'JetBrains Mono,monospace'}}><AlertIcon/> WARNING: {li.utilization}% utilized</div>}
                  <div className="li-amounts">
                    <div><div className="li-a-label">Allocated</div><div className="li-a-val">{fmt(li.allocated)}</div></div>
                    <div style={{textAlign:'right'}}><div className="li-a-label">Spent</div><div className="li-a-val" style={{color:cfg.color}}>{fmt(li.spent)}</div></div>
                  </div>
                  <div className="li-track"><div className="li-fill" style={{width:`${Math.min(li.utilization,100)}%`,background:li.isOverBudget?'#ef4444':li.warningLevel==='warning'?'#f59e0b':cfg.color}}/></div>
                  <div style={{display:'flex',justifyContent:'space-between',marginTop:5}}>
                    <span className="li-pct">{li.utilization}% utilized</span>
                    <span style={{fontSize:10.5,color:li.remaining<0?'#ef4444':'#10b981',fontWeight:700,fontFamily:'JetBrains Mono,monospace'}}>{li.remaining<0?'−'+fmt(Math.abs(li.remaining)):fmt(li.remaining)+' left'}</span>
                  </div>
                </div>
              )
            })
          }
        </div>
      )}


      {/* Dept Budgets Tab */}
      {activeTab==='deptBudgets' && (isAdmin||isITStaff) && (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
            {deptBudgets.map(d=>{
              const DCOL={'IT':'#06b6d4','Administration':'#3b82f6','Finance':'#8b5cf6','HR':'#10b981','Marketing':'#f59e0b','Operations':'#ef4444'}
              const col=DCOL[d.department]||'#06b6d4'
              return (
                <div key={d.department} style={{background:'#fff',border:'1.5px solid #f1f5f9',borderRadius:16,padding:'18px 20px',boxShadow:'0 2px 8px rgba(0,0,0,.06)',position:'relative',overflow:'hidden',cursor:'pointer',transition:'box-shadow .2s'}}
                  onClick={()=>{setDeptBudgetForm({dept:d.department,hardware:d.hardware.allocated,softwareLicense:d.softwareLicense.allocated,service:d.service.allocated});setShowDeptBudget(true)}}
                  onMouseEnter={e=>e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,.1)'}
                  onMouseLeave={e=>e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,.06)'}>
                  <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:col}}/>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                    <span style={{fontSize:14,fontWeight:800,color:'#0f172a',fontFamily:'Outfit,sans-serif'}}>{d.department}</span>
                    <span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:5,background:`${col}15`,color:col,fontFamily:'JetBrains Mono,monospace'}}>{d.pct}%</span>
                  </div>
                  <div style={{fontFamily:'Outfit,sans-serif',fontSize:22,fontWeight:900,color:'#0f172a',marginBottom:2}}>{fmt(d.total)}</div>
                  <div style={{fontSize:11.5,color:'#94a3b8',fontFamily:'JetBrains Mono,monospace',marginBottom:10}}>total allocated</div>
                  <div style={{height:6,background:'#f1f5f9',borderRadius:100,overflow:'hidden',marginBottom:8}}>
                    <div style={{height:'100%',borderRadius:100,background:col,width:`${Math.min(d.pct,100)}%`,transition:'width 1s ease'}}/>
                  </div>
                  {[{label:'Hardware',val:d.hardware,color:'#3b82f6'},{label:'SW License',val:d.softwareLicense,color:'#8b5cf6'},{label:'Service',val:d.service,color:'#06b6d4'}].map(c=>(
                    <div key={c.label} style={{display:'flex',justifyContent:'space-between',fontSize:11,marginTop:4}}>
                      <span style={{color:'#64748b'}}>{c.label}</span>
                      <span style={{fontFamily:'JetBrains Mono,monospace',fontWeight:700,color:c.color}}>{fmt(c.val.allocated)}</span>
                    </div>
                  ))}
                  <div style={{marginTop:8,fontSize:11,color:'#94a3b8',textAlign:'center'}}>Click to edit budget →</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Expense Log */}
      {activeTab==='expenses' && (
        <>
          <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
            {['all','hardware','softwareLicense','service'].map(c=>(
              <button key={c} className={`cat-chip${catFilter===c?' active':''}`} onClick={()=>setCatFilter(c)} style={catFilter===c&&c!=='all'?{background:CAT_CFG[c]?.color,borderColor:'transparent'}:{}}>
                {c==='all'?'All Categories':c==='softwareLicense'?'Software License':c.charAt(0).toUpperCase()+c.slice(1)}
              </button>
            ))}
            <input className="search-input" placeholder="Search expenses..." value={expSearch} onChange={e=>setExpSearch(e.target.value)}/>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Expense ID</th><th>Date</th><th>Category</th><th>Description</th><th>Vendor</th><th>Line Item</th><th>Amount</th><th>Payment</th><th>Status</th>{(isAdmin||isITStaff)&&<th>Actions</th>}</tr></thead>
              <tbody>
                {filteredExp.map(e=>{
                  const sc = EXPENSE_STATUS[e.status]||EXPENSE_STATUS.pending
                  const cc = CAT_CFG[e.category]
                  return (
                    <tr key={e.id} className="tr">
                      <td><span className="mono">{e.id}</span></td>
                      <td><span className="dt">{e.date}</span></td>
                      <td><span className="pill" style={{color:cc?.color,background:cc?.bg}}>{cc?.label}</span></td>
                      <td style={{maxWidth:220,fontSize:12.5}}><div style={{fontWeight:600,color:'#1e293b'}}>{e.description}</div><div style={{fontSize:11,color:'#94a3b8',marginTop:1}}>INV: {e.invoiceNo}</div></td>
                      <td style={{fontSize:12.5,color:'#475569'}}>{e.vendor}</td>
                      <td><span className="mono" style={{fontSize:10.5}}>{e.lineItem}</span></td>
                      <td><span className="amt">{fmt(e.amount)}</span></td>
                      <td><span className="pill" style={{color:e.paymentStatus==='paid'?'#10b981':e.paymentStatus==='pending'?'#f59e0b':'#94a3b8',background:e.paymentStatus==='paid'?'rgba(16,185,129,.1)':e.paymentStatus==='pending'?'rgba(245,158,11,.1)':'rgba(148,163,184,.1)'}}>{e.paymentStatus}</span></td>
                      <td><span className="pill" style={{color:sc.color,background:sc.bg}}>{sc.label}</span></td>
                      {(isAdmin||isITStaff) && (
                        <td>
                          {e.status==='pending'||e.status==='for_review'?(
                            <div style={{display:'flex',gap:5}}>
                              <button className="btn btn-success btn-sm" style={{padding:'4px 10px',fontSize:11}} onClick={()=>handleApproveExp(e.id)}><CheckIcon/></button>
                              <button className="btn btn-danger btn-sm" style={{padding:'4px 10px',fontSize:11}} onClick={()=>handleRejectExp(e.id)}>✕</button>
                            </div>
                          ):<span style={{fontSize:11.5,color:'#94a3b8'}}>{e.approvedBy||'—'}</span>}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Charts */}
      {activeTab==='chart' && (
        <div style={{display:'flex',flexDirection:'column',gap:18}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
            <div className="glass-card" style={{padding:24}}>
              <div className="card-header"><h3 className="card-title">Budget vs Spent by Category</h3></div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={summary?Object.entries(summary.categories).map(([k,v])=>({name:CAT_CFG[k].label,Allocated:v.allocated,Spent:v.spent})):[]} margin={{left:10,right:10}}>
                  <XAxis dataKey="name" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={fmtShort}/>
                  <Tooltip formatter={v=>fmt(v)} contentStyle={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:10}}/>
                  <Legend/>
                  <Bar dataKey="Allocated" fill="#e2e8f0" radius={[5,5,0,0]}/>
                  <Bar dataKey="Spent" radius={[5,5,0,0]}>
                    {summary && Object.keys(summary.categories).map((k,i)=><Cell key={i} fill={CAT_CFG[k].color}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="glass-card" style={{padding:24}}>
              <div className="card-header"><h3 className="card-title">Monthly Spend Trend</h3><span className="card-badge">FY 2025</span></div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={monthly.slice(0,6)} margin={{left:10,right:10}}>
                  <XAxis dataKey="month" tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={fmtShort}/>
                  <Tooltip formatter={v=>fmt(v)} contentStyle={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:10}}/>
                  <Legend/>
                  <Line type="monotone" dataKey="planned" stroke="#e2e8f0" strokeWidth={2} strokeDasharray="4 4" name="Planned" dot={false}/>
                  <Line type="monotone" dataKey="actual"  stroke="#06b6d4" strokeWidth={2.5} name="Actual" dot={{r:4}}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="glass-card" style={{padding:24}}>
            <div className="card-header"><h3 className="card-title">Monthly Category Breakdown</h3></div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthly.slice(0,6)} margin={{left:10,right:10}}>
                <XAxis dataKey="month" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={fmtShort}/>
                <Tooltip formatter={v=>fmt(v)} contentStyle={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:10}}/>
                <Legend/>
                <Bar dataKey="hardware"        fill="#3b82f6" radius={[3,3,0,0]} name="Hardware"         stackId="a"/>
                <Bar dataKey="softwareLicense" fill="#8b5cf6" radius={[0,0,0,0]} name="Software License" stackId="a"/>
                <Bar dataKey="service"         fill="#06b6d4" radius={[3,3,0,0]} name="Service"          stackId="a"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Log Expense Modal */}
      {showAddExpense && (isAdmin||isITStaff) && (
        <div className="overlay" onClick={()=>setShowAddExpense(false)}>
          <div className="modal modal-lg" onClick={e=>e.stopPropagation()}>
            <div className="modal-head"><h2 className="modal-title">Log New Expense</h2><button className="modal-close" onClick={()=>setShowAddExpense(false)}>&times;</button></div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="field"><label className="field-label">Date</label><input className="field-input" type="date" value={newExp.date} onChange={e=>setNewExp(p=>({...p,date:e.target.value}))}/></div>
                <div className="field"><label className="field-label">Category</label>
                  <select className="field-input field-select" value={newExp.category} onChange={e=>setNewExp(p=>({...p,category:e.target.value}))}>
                    <option value="hardware">Hardware</option>
                    <option value="softwareLicense">Software License</option>
                    <option value="service">Service</option>
                  </select>
                </div>
                <div className="field"><label className="field-label">Subcategory</label><input className="field-input" placeholder="e.g. Laptops, Cloud Hosting" value={newExp.subcategory} onChange={e=>setNewExp(p=>({...p,subcategory:e.target.value}))}/></div>
                <div className="field"><label className="field-label">Vendor / Supplier</label><input className="field-input" placeholder="e.g. Dell Philippines" value={newExp.vendor} onChange={e=>setNewExp(p=>({...p,vendor:e.target.value}))}/></div>
                <div className="field form-full"><label className="field-label">Description</label><input className="field-input" placeholder="e.g. Dell Latitude 5540 x5" value={newExp.description} onChange={e=>setNewExp(p=>({...p,description:e.target.value}))}/></div>
                <div className="field"><label className="field-label">Amount (₱)</label><input className="field-input" type="number" placeholder="0" value={newExp.amount} onChange={e=>setNewExp(p=>({...p,amount:e.target.value}))}/></div>
                <div className="field"><label className="field-label">Line Item</label>
                  <select className="field-input field-select" value={newExp.lineItem} onChange={e=>setNewExp(p=>({...p,lineItem:e.target.value}))}>
                    {lineItems.map(li=><option key={li.id} value={li.id}>{li.id} — {li.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-primary" onClick={handleAddExpense}>Log Expense</button>
              <button className="btn btn-ghost" onClick={()=>setShowAddExpense(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Line Item Modal */}
      {showAddLI && isAdmin && (
        <div className="overlay" onClick={()=>setShowAddLI(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:440}}>
            <div className="modal-head"><h2 className="modal-title">Add Budget Line Item</h2><button className="modal-close" onClick={()=>setShowAddLI(false)}>&times;</button></div>
            <div className="modal-body">
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                <div className="field"><label className="field-label">Line Item Name</label><input className="field-input" placeholder="e.g. Cloud Infrastructure" value={newLI.name} onChange={e=>setNewLI(p=>({...p,name:e.target.value}))}/></div>
                <div className="field"><label className="field-label">Category</label>
                  <select className="field-input field-select" value={newLI.category} onChange={e=>setNewLI(p=>({...p,category:e.target.value}))}>
                    <option value="hardware">Hardware</option>
                    <option value="softwareLicense">Software License</option>
                    <option value="service">Service</option>
                  </select>
                </div>
                <div className="field"><label className="field-label">Allocated Budget (₱)</label><input className="field-input" type="number" placeholder="0" value={newLI.allocated} onChange={e=>setNewLI(p=>({...p,allocated:e.target.value}))}/></div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-primary" onClick={handleAddLI}>Add Line Item</button>
              <button className="btn btn-ghost" onClick={()=>setShowAddLI(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Set FY Budget Modal */}
      {showSetBudget && isAdmin && (
        <div className="overlay" onClick={()=>setShowSetBudget(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:440}}>
            <div className="modal-head"><h2 className="modal-title">Set Fiscal Year Budget</h2><button className="modal-close" onClick={()=>setShowSetBudget(false)}>&times;</button></div>
            <div className="modal-body">
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                <div className="field"><label className="field-label">Fiscal Year</label><input className="field-input" value={budgetForm.fy} onChange={e=>setBudgetForm(p=>({...p,fy:e.target.value}))}/></div>
                <div className="field"><label className="field-label">Hardware Budget (₱)</label><input className="field-input" type="number" value={budgetForm.hardware} onChange={e=>setBudgetForm(p=>({...p,hardware:e.target.value}))}/></div>
                <div className="field"><label className="field-label">Software License Budget (₱)</label><input className="field-input" type="number" value={budgetForm.softwareLicense} onChange={e=>setBudgetForm(p=>({...p,softwareLicense:e.target.value}))}/></div>
                <div className="field"><label className="field-label">Service Budget (₱)</label><input className="field-input" type="number" value={budgetForm.service} onChange={e=>setBudgetForm(p=>({...p,service:e.target.value}))}/></div>
                <div style={{padding:'10px 14px',background:'rgba(6,182,212,.05)',border:'1px solid rgba(6,182,212,.15)',borderRadius:10,fontSize:13,color:'#0891b2',fontWeight:700}}>
                  Total Budget: {fmt(Number(budgetForm.hardware)+Number(budgetForm.softwareLicense)+Number(budgetForm.service))}
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-primary" onClick={()=>{budgetAPI.setBudgetAllocation({hardware:{allocated:Number(budgetForm.hardware)},softwareLicense:{allocated:Number(budgetForm.softwareLicense)},service:{allocated:Number(budgetForm.service)}});setShowSetBudget(false);alert('Budget allocation updated!')}}>Save Budget</button>
              <button className="btn btn-ghost" onClick={()=>setShowSetBudget(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Dept Budget Modal */}
      {showDeptBudget && isAdmin && (
        <div className="overlay" onClick={()=>setShowDeptBudget(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:480}}>
            <div className="modal-head"><h2 className="modal-title">Set Department Budget</h2><button className="modal-close" onClick={()=>setShowDeptBudget(false)}>&times;</button></div>
            <div className="modal-body">
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                <div className="field"><label className="field-label">Department</label>
                  <select className="field-input field-select" value={deptBudgetForm.dept} onChange={e=>{const db=deptBudgets.find(d=>d.department===e.target.value);setDeptBudgetForm({dept:e.target.value,hardware:db?.hardware.allocated||0,softwareLicense:db?.softwareLicense.allocated||0,service:db?.service.allocated||0})}}>
                    {['IT','Administration','Finance','HR','Marketing','Operations'].map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="field"><label className="field-label">Hardware Budget (₱)</label><input className="field-input" type="number" value={deptBudgetForm.hardware} onChange={e=>setDeptBudgetForm(p=>({...p,hardware:e.target.value}))}/></div>
                <div className="field"><label className="field-label">Software License Budget (₱)</label><input className="field-input" type="number" value={deptBudgetForm.softwareLicense} onChange={e=>setDeptBudgetForm(p=>({...p,softwareLicense:e.target.value}))}/></div>
                <div className="field"><label className="field-label">Service Budget (₱)</label><input className="field-input" type="number" value={deptBudgetForm.service} onChange={e=>setDeptBudgetForm(p=>({...p,service:e.target.value}))}/></div>
                <div style={{padding:'10px 14px',background:'rgba(6,182,212,.05)',border:'1px solid rgba(6,182,212,.15)',borderRadius:10,fontSize:13,color:'#0891b2',fontWeight:700}}>
                  Total: {fmt(Number(deptBudgetForm.hardware||0)+Number(deptBudgetForm.softwareLicense||0)+Number(deptBudgetForm.service||0))}
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-primary" disabled={deptBudgetSaving} onClick={async()=>{
                setDeptBudgetSaving(true)
                await budgetAPI.setDeptBudget(deptBudgetForm.dept,{hardware:Number(deptBudgetForm.hardware),softwareLicense:Number(deptBudgetForm.softwareLicense),service:Number(deptBudgetForm.service)})
                const db=await budgetAPI.getAllDeptBudgets(); setDeptBudgets(db.filter(Boolean))
                setDeptBudgetSaving(false); setShowDeptBudget(false)
              }}>{deptBudgetSaving?'Saving...':'Save Dept Budget'}</button>
              <button className="btn btn-ghost" onClick={()=>setShowDeptBudget(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </PageLayout>
  )
}
