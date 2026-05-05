import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import PageLayout from '../components/PageLayout'
import { budgetAPI } from '../services/api'

const fmt = (n) => '₱' + Number(n).toLocaleString()

const STATUS = {
  on_track:       { label:'On Track',       color:'#10b981', bg:'rgba(16,185,129,.1)' },
  warning:        { label:'Warning',        color:'#f59e0b', bg:'rgba(245,158,11,.1)' },
  critical:       { label:'Critical',       color:'#ef4444', bg:'rgba(239,68,68,.1)'  },
  under_utilized: { label:'Under-utilized', color:'#94a3b8', bg:'rgba(148,163,184,.1)'},
}

const LI_COLORS = ['#06b6d4','#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#f43f5e','#64748b']

export default function BudgetLedger() {
  const [ledger, setLedger]   = useState([])
  const [txns, setTxns]       = useState([])
  const [lineItems, setLI]    = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('departments')
  const [search, setSearch]   = useState('')
  const [showAddLI, setShowAddLI] = useState(false)
  const [newLI, setNewLI]     = useState({ name:'', category:'Hardware', allocated:'' })

  useEffect(() => {
    Promise.all([budgetAPI.getLedger(), budgetAPI.getTransactions(), budgetAPI.getLineItems()]).then(([l,t,li]) => {
      setLedger(l); setTxns(t); setLI(li); setLoading(false)
    })
  }, [])

  const filtered = ledger.filter(r =>
    r.department.toLowerCase().includes(search.toLowerCase()) ||
    r.id.toLowerCase().includes(search.toLowerCase())
  )
  const total = ledger.reduce((a,r) => ({ alloc: a.alloc + r.allocated, spent: a.spent + r.spent }), { alloc:0, spent:0 })

  const handleAddLI = () => {
    if (!newLI.name || !newLI.allocated) return
    const id = `LI-00${lineItems.length + 1}`
    setLI(prev => [...prev, { id, name: newLI.name, category: newLI.category, allocated: Number(newLI.allocated), spent: 0, remaining: Number(newLI.allocated), utilization: 0 }])
    setNewLI({ name:'', category:'Hardware', allocated:'' })
    setShowAddLI(false)
  }

  return (
    <PageLayout
      title="Budget Ledger"
      subtitle="FY 2025 departmental budget allocation and utilization"
      badge="💰 Finance"
      actions={<button className="btn-primary" onClick={() => setActiveTab('lineItems')}>+ Add Line Item</button>}
    >
      {/* Summary */}
      <div className="ledger-summary-row">
        {[
          { label:'Total Allocated', value:fmt(5000000),              icon:'🏦', accent:'#06b6d4' },
          { label:'Total Spent',     value:fmt(total.spent),           icon:'📤', accent:'#3b82f6' },
          { label:'Total Remaining', value:fmt(5000000 - total.spent), icon:'💚', accent:'#10b981' },
          { label:'Departments',     value:ledger.length,              icon:'🏢', accent:'#8b5cf6' },
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

      {/* Tabs */}
      <div className="page-tabs">
        {['departments','lineItems','transactions','chart'].map(t => (
          <button key={t} className={`page-tab ${activeTab===t ? 'page-tab-active':''}`} onClick={()=>setActiveTab(t)}>
            {t==='departments'?'📋 Departments':t==='lineItems'?'📌 Line Items':t==='transactions'?'🔄 Transactions':'📊 Chart'}
          </button>
        ))}
        {activeTab==='departments' && (
          <input className="page-search" placeholder="Search department…" value={search} onChange={e=>setSearch(e.target.value)} />
        )}
      </div>

      {/* Departments */}
      {activeTab==='departments' && (
        <div className="table-card">
          {loading ? <Skel/> : (
            <table className="data-table">
              <thead><tr><th>Ref ID</th><th>Department</th><th>Allocated</th><th>Spent</th><th>Remaining</th><th>Utilization</th><th>Budget Officer</th><th>Status</th></tr></thead>
              <tbody>
                {filtered.map(row => {
                  const s = STATUS[row.status] || STATUS.on_track
                  return (
                    <tr key={row.id} className="table-row">
                      <td><span className="mono-tag">{row.id}</span></td>
                      <td><span className="dept-name-cell">{row.department}</span></td>
                      <td><span className="amount-cell">{fmt(row.allocated)}</span></td>
                      <td><span className="amount-cell">{fmt(row.spent)}</span></td>
                      <td><span className="amount-cell" style={{color: row.remaining<50000?'#ef4444':'#10b981'}}>{fmt(row.remaining)}</span></td>
                      <td>
                        <div className="util-cell">
                          <div className="mini-bar-track">
                            <div className="mini-bar-fill" style={{width:`${row.utilization}%`, background:row.utilization>85?'#ef4444':row.utilization>70?'#f59e0b':'#10b981'}}/>
                          </div>
                          <span className="util-pct">{row.utilization}%</span>
                        </div>
                      </td>
                      <td><span className="officer-cell">{row.officer}</span></td>
                      <td><span className="status-pill" style={{color:s.color,background:s.bg}}>{s.label}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Line Items */}
      {activeTab==='lineItems' && (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <button className="btn-primary" onClick={()=>setShowAddLI(true)}>+ Add Line Item</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16}}>
            {lineItems.map((li,i) => (
              <div key={li.id} style={{background:'#fff',borderRadius:18,border:'1.5px solid #f1f5f9',padding:'20px 22px',boxShadow:'0 2px 10px rgba(0,0,0,.07)',position:'relative',overflow:'hidden',transition:'all .22s',cursor:'default'}}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow='0 8px 32px rgba(0,0,0,.11)'}}
                onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 2px 10px rgba(0,0,0,.07)'}}>
                <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:LI_COLORS[i%LI_COLORS.length],opacity:.75}}/>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                  <span className="mono-tag">{li.id}</span>
                  <span className="dept-chip">{li.category}</span>
                </div>
                <div style={{fontSize:14,fontWeight:800,color:'#1e293b',marginBottom:12,lineHeight:1.3}}>{li.name}</div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
                  <div><div style={{fontSize:10,color:'#94a3b8',fontFamily:'JetBrains Mono,monospace',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:2}}>Allocated</div><div style={{fontFamily:'Outfit,sans-serif',fontSize:16,fontWeight:900,color:'#0f172a'}}>₱{li.allocated.toLocaleString()}</div></div>
                  <div style={{textAlign:'right'}}><div style={{fontSize:10,color:'#94a3b8',fontFamily:'JetBrains Mono,monospace',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:2}}>Remaining</div><div style={{fontFamily:'Outfit,sans-serif',fontSize:16,fontWeight:900,color:li.utilization>85?'#ef4444':'#10b981'}}>₱{li.remaining.toLocaleString()}</div></div>
                </div>
                <div style={{height:7,background:'#f1f5f9',borderRadius:100,overflow:'hidden',marginBottom:5}}>
                  <div style={{height:'100%',borderRadius:100,background:li.utilization>85?'#ef4444':li.utilization>70?'#f59e0b':LI_COLORS[i%LI_COLORS.length],width:`${li.utilization}%`,transition:'width .9s cubic-bezier(.4,0,.2,1)'}}/>
                </div>
                <div style={{fontSize:11,color:'#94a3b8',fontFamily:'JetBrains Mono,monospace',textAlign:'right'}}>{li.utilization}% utilized</div>
              </div>
            ))}
          </div>

          {/* Add Line Item Modal */}
          {showAddLI && (
            <div className="modal-overlay" onClick={()=>setShowAddLI(false)}>
              <div className="modal-box" onClick={e=>e.stopPropagation()} style={{maxWidth:480}}>
                <div className="modal-header">
                  <h2 className="modal-title">Add New Line Item</h2>
                  <button className="modal-close" onClick={()=>setShowAddLI(false)}>✕</button>
                </div>
                <div className="modal-body">
                  <div style={{display:'flex',flexDirection:'column',gap:16}}>
                    {[
                      {label:'Line Item Name',    key:'name',      type:'text',   placeholder:'e.g. Cloud Services & Hosting'},
                      {label:'Allocated Budget (₱)',key:'allocated',type:'number', placeholder:'0'},
                    ].map(f => (
                      <div key={f.key} className="form-field">
                        <label className="login-label">{f.label}</label>
                        <input className="login-input" type={f.type} placeholder={f.placeholder}
                          value={newLI[f.key]} onChange={e=>setNewLI(p=>({...p,[f.key]:e.target.value}))}
                          style={{padding:'12px 16px'}}/>
                      </div>
                    ))}
                    <div className="form-field">
                      <label className="login-label">Category</label>
                      <select className="login-input" value={newLI.category} onChange={e=>setNewLI(p=>({...p,category:e.target.value}))} style={{padding:'12px 16px'}}>
                        {['Hardware','Software','Services','Security','Network'].map(c=><option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn-primary" onClick={handleAddLI}>Add Line Item</button>
                  <button className="btn-ghost" onClick={()=>setShowAddLI(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transactions */}
      {activeTab==='transactions' && (
        <div className="table-card">
          <table className="data-table">
            <thead><tr><th>Txn ID</th><th>Date</th><th>Department</th><th>Description</th><th>Reference</th><th>Amount</th><th>Type</th></tr></thead>
            <tbody>
              {txns.map(t => (
                <tr key={t.id} className="table-row">
                  <td><span className="mono-tag">{t.id}</span></td>
                  <td><span className="date-cell">{t.date}</span></td>
                  <td><span className="dept-chip">{t.department||'—'}</span></td>
                  <td>{t.description}</td>
                  <td><span className="mono-tag">{t.ref}</span></td>
                  <td><span className="amount-cell" style={{color:t.type==='credit'?'#10b981':'#1e293b'}}>{t.type==='credit'?'+':'-'}{fmt(t.amount)}</span></td>
                  <td><span className="status-pill" style={{color:t.type==='credit'?'#10b981':'#3b82f6',background:t.type==='credit'?'rgba(16,185,129,.1)':'rgba(59,130,246,.1)'}}>{t.type.toUpperCase()}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Chart */}
      {activeTab==='chart' && (
        <div className="chart-card" style={{padding:28}}>
          <div className="chart-card-header">
            <h3 className="chart-title">Budget vs Spent by Department</h3>
            <span className="chart-badge">FY 2025</span>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={ledger} margin={{left:20,right:20,bottom:20}}>
              <XAxis dataKey="department" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false} angle={-15} textAnchor="end"/>
              <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={v=>'₱'+v/1000+'k'}/>
              <Tooltip formatter={v=>fmt(v)} contentStyle={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:12}}/>
              <Bar dataKey="allocated" fill="#e2e8f0" radius={[6,6,0,0]} name="Allocated"/>
              <Bar dataKey="spent" radius={[6,6,0,0]} name="Spent">
                {ledger.map((r,i)=><Cell key={i} fill={r.utilization>85?'#ef4444':r.utilization>70?'#f59e0b':'#06b6d4'}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </PageLayout>
  )
}
function Skel() {
  return <div style={{padding:'20px 24px',display:'flex',flexDirection:'column',gap:12}}>{[...Array(6)].map((_,i)=><div key={i} className="skeleton-line" style={{height:44,borderRadius:8}}/>)}</div>
}
