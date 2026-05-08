import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import PageLayout from '../components/PageLayout'
import { budgetAPI } from '../services/api'
import { useRole } from '../hooks/useRole'

const fmt = n => '₱' + Number(n).toLocaleString()
const PlusIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>

export default function Budget() {
  const { isAdmin } = useRole()
  const [summary, setSummary] = useState(null)
  const [lineItems, setLI] = useState([])
  const [txns, setTxns] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showAddLI, setShowAddLI] = useState(false)
  const [newLI, setNewLI] = useState({ name:'', type:'capex', category:'Hardware', allocated:'' })
  const [showSetBudget, setShowSetBudget] = useState(false)
  const [budgetForm, setBudgetForm] = useState({ opex:'1800000', capex:'3200000', fy:'2025' })

  useEffect(() => {
    Promise.all([budgetAPI.getSummary(), budgetAPI.getLineItems(), budgetAPI.getTransactions()]).then(([s,li,t]) => {
      setSummary(s); setLI(li); setTxns(t); setLoading(false)
    })
  }, [])

  const handleAddLI = () => {
    if (!newLI.name||!newLI.allocated) return
    const id = `LI-${newLI.type==='capex'?'C':'O'}${String(lineItems.filter(l=>l.type===newLI.type).length+10).padStart(2,'0')}`
    setLI(prev=>[...prev,{id,name:newLI.name,type:newLI.type,category:newLI.category,allocated:Number(newLI.allocated),spent:0,remaining:Number(newLI.allocated),utilization:0,warningPct:80}])
    setNewLI({name:'',type:'capex',category:'Hardware',allocated:''}); setShowAddLI(false)
  }

  const capexItems = lineItems.filter(l=>l.type==='capex')
  const opexItems  = lineItems.filter(l=>l.type==='opex')

  const LICard = ({ li }) => {
    const pctColor = li.utilization>=90?'#ef4444':li.utilization>=80?'#f59e0b':li.type==='capex'?'#3b82f6':'#8b5cf6'
    return (
      <div className="li-card">
        <div>
          <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:pctColor,opacity:.75}}/>
          <div className="li-header">
            <span className="li-id">{li.id}</span>
            <span className={li.type==='capex'?'badge-capex':'badge-opex'}>{li.type==='capex'?'CapEx':'OpEx'}</span>
          </div>
          <div className="li-name">{li.name}</div>
          <div style={{fontSize:11,color:'#94a3b8',fontFamily:'JetBrains Mono,monospace',marginBottom:12}}>{li.category}</div>
          <div className="li-amounts">
            <div><div className="li-a-label">Allocated</div><div className="li-a-val">{fmt(li.allocated)}</div></div>
            <div style={{textAlign:'right'}}><div className="li-a-label">Remaining</div><div className="li-a-val" style={{color:li.utilization>=80?'#ef4444':'#10b981'}}>{fmt(li.remaining)}</div></div>
          </div>
          <div className="li-track"><div className="li-fill" style={{width:`${Math.min(li.utilization,100)}%`,background:pctColor}}/></div>
          <div className="li-pct">{li.utilization}% utilized — ₱{li.spent.toLocaleString()} spent</div>
        </div>
      </div>
    )
  }

  return (
    <PageLayout title="Budget Ledger" subtitle="IT Procurement fiscal year budget — OpEx and CapEx allocation" badge="Budget"
      actions={
        isAdmin ? (
          <div style={{display:'flex',gap:10}}>
            <button className="btn btn-secondary btn-sm" onClick={()=>setShowSetBudget(true)}>Set FY Budget</button>
            <button className="btn btn-primary btn-sm" onClick={()=>setShowAddLI(true)}><PlusIcon/> Add Line Item</button>
          </div>
        ) : null
      }
    >
      {/* Summary */}
      {summary && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:22,animation:'cardReveal .35s ease both'}}>
          {[
            {label:'Total IT Budget',  val:fmt(summary.totalBudget),    sub:'FY '+summary.fiscalYear,   color:'#06b6d4'},
            {label:'Total Spent',      val:fmt(summary.totalSpent),     sub:`${Math.round(summary.totalSpent/summary.totalBudget*100)}% utilized`,color:'#3b82f6'},
            {label:'Total Remaining',  val:fmt(summary.totalRemaining), sub:'Available budget',          color:'#10b981'},
          ].map(s=>(
            <div key={s.label} style={{background:'#fff',border:'1.5px solid #f1f5f9',borderRadius:18,padding:'18px 20px',boxShadow:'0 2px 10px rgba(0,0,0,.07)',position:'relative',overflow:'hidden',transition:'all .2s'}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:s.color,opacity:.7}}/>
              <div style={{fontSize:11,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',fontFamily:'JetBrains Mono,monospace',marginBottom:6}}>{s.label}</div>
              <div style={{fontFamily:'Outfit,sans-serif',fontSize:24,fontWeight:900,color:'#0f172a',letterSpacing:'-.6px',marginBottom:3}}>{s.val}</div>
              <div style={{fontSize:11.5,color:'#94a3b8',fontFamily:'JetBrains Mono,monospace'}}>{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* OpEx vs CapEx summary */}
      {summary && (
        <div className="dual-budget-grid" style={{marginBottom:22}}>
          {[{key:'capex',label:'CapEx — Hardware & Equipment',color:'#3b82f6'},{key:'opex',label:'OpEx — Software, Cloud & Services',color:'#8b5cf6'}].map(b=>{
            const d=summary[b.key]
            return (
              <div key={b.key} className="dual-budget-card">
                <div className="dbc-header"><span className="dbc-title">{b.label}</span><span className="dbc-pct" style={{background:`${b.color}15`,color:b.color}}>{d.pct}% used</span></div>
                <div className="dbc-amounts">
                  <div><div className="dbc-sub">Spent</div><div className="dbc-val" style={{color:b.color}}>{fmt(d.spent)}</div></div>
                  <div style={{textAlign:'right'}}><div className="dbc-sub">Remaining</div><div className="dbc-val">{fmt(d.remaining)}</div></div>
                </div>
                <div className="dbc-track"><div className="dbc-fill" style={{width:`${d.pct}%`,background:d.pct>=80?'linear-gradient(90deg,#f59e0b,#ef4444)':`linear-gradient(90deg,${b.color},${b.color}aa)`}}/></div>
                <div className="dbc-meta">of {fmt(d.total)} total allocation</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {['overview','capex','opex','transactions','chart'].map(t=>(
          <button key={t} className={`tab${activeTab===t?' active':''}`} onClick={()=>setActiveTab(t)}>
            {t==='overview'?'Overview':t==='capex'?'CapEx Items':t==='opex'?'OpEx Items':t==='transactions'?'Transactions':'Chart'}
          </button>
        ))}
      </div>

      {activeTab==='overview' && (
        <div className="li-grid">
          {loading?[...Array(6)].map((_,i)=><div key={i} className="sk-line" style={{height:180,borderRadius:16}}/>)
          :lineItems.map(li=><LICard key={li.id} li={li}/>)}
        </div>
      )}
      {activeTab==='capex' && <div className="li-grid">{capexItems.map(li=><LICard key={li.id} li={li}/>)}</div>}
      {activeTab==='opex'  && <div className="li-grid">{opexItems.map(li=><LICard key={li.id} li={li}/>)}</div>}

      {activeTab==='transactions' && (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Txn ID</th><th>Date</th><th>Type</th><th>Line Item</th><th>Description</th><th>Ref</th><th>Amount</th><th>By</th></tr></thead>
            <tbody>
              {txns.map(t=>(
                <tr key={t.id} className="tr">
                  <td><span className="mono">{t.id}</span></td>
                  <td><span className="dt">{t.date}</span></td>
                  <td>{t.expType && <span className={t.expType==='capex'?'badge-capex':'badge-opex'}>{t.expType==='capex'?'CapEx':'OpEx'}</span>}</td>
                  <td style={{fontSize:12.5,color:'#475569'}}>{t.lineItemName}</td>
                  <td style={{maxWidth:240}}>{t.description}</td>
                  <td><span className="mono">{t.ref}</span></td>
                  <td><span className="amt" style={{color:t.type==='credit'?'#10b981':'#1e293b'}}>{t.type==='credit'?'+':'-'}{fmt(t.amount)}</span></td>
                  <td><span className="dt">{t.by}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab==='chart' && !loading && (
        <div className="glass-card" style={{padding:28}}>
          <div className="card-header"><h3 className="card-title">Budget vs Spent by Line Item</h3><span className="card-badge">FY 2025</span></div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={lineItems} margin={{left:20,right:20,bottom:40}}>
              <XAxis dataKey="name" tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false} angle={-25} textAnchor="end" interval={0}/>
              <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={v=>'₱'+v/1000+'k'}/>
              <Tooltip formatter={v=>fmt(v)} contentStyle={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:12}}/>
              <Bar dataKey="allocated" fill="#e2e8f0" radius={[5,5,0,0]} name="Allocated"/>
              <Bar dataKey="spent" radius={[5,5,0,0]} name="Spent">
                {lineItems.map((li,i)=><Cell key={i} fill={li.utilization>=90?'#ef4444':li.utilization>=80?'#f59e0b':li.type==='capex'?'#3b82f6':'#8b5cf6'}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Add Line Item Modal */}
      {showAddLI && isAdmin && (
        <div className="overlay" onClick={()=>setShowAddLI(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:460}}>
            <div className="modal-head"><h2 className="modal-title">Add Line Item</h2><button className="modal-close" onClick={()=>setShowAddLI(false)}>&times;</button></div>
            <div className="modal-body">
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                <div className="field"><label className="field-label">Line Item Name</label><input className="field-input" placeholder="e.g. Cloud Services & Hosting" value={newLI.name} onChange={e=>setNewLI(p=>({...p,name:e.target.value}))}/></div>
                <div className="field"><label className="field-label">Expense Type</label>
                  <select className="field-input field-select" value={newLI.type} onChange={e=>setNewLI(p=>({...p,type:e.target.value}))}>
                    <option value="capex">CapEx — Hardware / Equipment</option>
                    <option value="opex">OpEx — Software / Services</option>
                  </select>
                </div>
                <div className="field"><label className="field-label">Category</label><input className="field-input" placeholder="e.g. Cloud & SaaS" value={newLI.category} onChange={e=>setNewLI(p=>({...p,category:e.target.value}))}/></div>
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

      {/* Set Budget Modal */}
      {showSetBudget && isAdmin && (
        <div className="overlay" onClick={()=>setShowSetBudget(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:420}}>
            <div className="modal-head"><h2 className="modal-title">Set Fiscal Year Budget</h2><button className="modal-close" onClick={()=>setShowSetBudget(false)}>&times;</button></div>
            <div className="modal-body">
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                <div className="field"><label className="field-label">Fiscal Year</label><input className="field-input" value={budgetForm.fy} onChange={e=>setBudgetForm(p=>({...p,fy:e.target.value}))}/></div>
                <div className="field"><label className="field-label">OpEx Budget (₱)</label><input className="field-input" type="number" value={budgetForm.opex} onChange={e=>setBudgetForm(p=>({...p,opex:e.target.value}))}/></div>
                <div className="field"><label className="field-label">CapEx Budget (₱)</label><input className="field-input" type="number" value={budgetForm.capex} onChange={e=>setBudgetForm(p=>({...p,capex:e.target.value}))}/></div>
                <div style={{padding:'10px 14px',background:'rgba(6,182,212,.05)',border:'1px solid rgba(6,182,212,.15)',borderRadius:10,fontSize:13,color:'#0891b2',fontWeight:600}}>
                  Total Budget: {fmt(Number(budgetForm.opex)+Number(budgetForm.capex))}
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-primary" onClick={()=>{alert('Fiscal year budget updated!');setShowSetBudget(false)}}>Save Budget</button>
              <button className="btn btn-ghost" onClick={()=>setShowSetBudget(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
