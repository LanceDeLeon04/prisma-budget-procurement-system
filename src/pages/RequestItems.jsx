import { useEffect, useState } from 'react'
import PageLayout from '../components/PageLayout'
import { requestsAPI } from '../services/api'

const fmt = (n) => '₱' + Number(n).toLocaleString()
const STATUS = {
  approved:   { label:'Approved',   color:'#10b981', bg:'rgba(16,185,129,.1)' },
  pending:    { label:'Pending',     color:'#f59e0b', bg:'rgba(245,158,11,.1)' },
  for_review: { label:'For Review',  color:'#3b82f6', bg:'rgba(59,130,246,.1)' },
  rejected:   { label:'Rejected',    color:'#ef4444', bg:'rgba(239,68,68,.1)'  },
}
const PRIORITY = {
  high:   { label:'High',   color:'#ef4444' },
  medium: { label:'Medium', color:'#f59e0b' },
  low:    { label:'Low',    color:'#10b981' },
}

export default function RequestItems() {
  const [requests, setRequests]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('all')
  const [search, setSearch]       = useState('')
  const [selected, setSelected]   = useState(null)
  const [showForm, setShowForm]   = useState(false)
  const [feedback, setFeedback]   = useState('')
  const [newReq, setNewReq]       = useState({ title:'', department:'', category:'IT Equipment', amount:'', items:'1', priority:'medium', note:'' })

  useEffect(() => { requestsAPI.getAll().then(d=>{ setRequests(d); setLoading(false) }) }, [])

  const filtered = requests.filter(r => {
    const ms = filter==='all' || r.status===filter
    const mq = r.title.toLowerCase().includes(search.toLowerCase()) ||
               r.department.toLowerCase().includes(search.toLowerCase()) ||
               r.id.toLowerCase().includes(search.toLowerCase())
    return ms && mq
  })

  const counts = {
    all:        requests.length,
    pending:    requests.filter(r=>r.status==='pending').length,
    for_review: requests.filter(r=>r.status==='for_review').length,
    approved:   requests.filter(r=>r.status==='approved').length,
    rejected:   requests.filter(r=>r.status==='rejected').length,
  }

  const handleApprove = (req) => {
    setRequests(prev => prev.map(r => r.id===req.id ? {...r, status:'approved', feedback: feedback || 'Approved by IT Staff.'} : r))
    setSelected(null); setFeedback('')
  }
  const handleReject = (req) => {
    setRequests(prev => prev.map(r => r.id===req.id ? {...r, status:'rejected', feedback: feedback || 'Rejected by IT Staff.'} : r))
    setSelected(null); setFeedback('')
  }

  const handleSubmitNew = () => {
    if (!newReq.title || !newReq.department) return
    const id = `REQ-2025-0${200 + requests.length + 1}`
    setRequests(prev => [{
      id, title:newReq.title, department:newReq.department, requestedBy:'Maria Santos',
      date: new Date().toISOString().slice(0,10), amount: Number(newReq.amount)||0,
      status:'pending', priority:newReq.priority, items:Number(newReq.items)||1,
      category:newReq.category, note:newReq.note, feedback:''
    }, ...prev])
    setNewReq({ title:'', department:'', category:'IT Equipment', amount:'', items:'1', priority:'medium', note:'' })
    setShowForm(false)
  }

  return (
    <PageLayout
      title="Request Items"
      subtitle="Submit and track IT procurement requests"
      badge="📋 Requests"
      actions={<button className="btn-primary" onClick={()=>setShowForm(true)}>+ New Request</button>}
    >
      {/* Filter tabs */}
      <div className="page-tabs">
        {Object.entries(counts).map(([key,cnt]) => (
          <button key={key} className={`page-tab ${filter===key?'page-tab-active':''}`} onClick={()=>setFilter(key)}>
            {key==='all'?'All':STATUS[key]?.label||key}
            <span className="tab-count">{cnt}</span>
          </button>
        ))}
        <input className="page-search" placeholder="Search requests…" value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>

      {/* Request list */}
      {loading
        ? <div style={{display:'flex',flexDirection:'column',gap:12}}>{[...Array(3)].map((_,i)=><div key={i} className="skeleton-line" style={{height:100,borderRadius:18}}/>)}</div>
        : filtered.length===0
          ? <div className="empty-state"><div className="empty-icon">📭</div><p>No requests found</p></div>
          : (
            <div className="req-list">
              {filtered.map(req => {
                const s = STATUS[req.status] || STATUS.pending
                const p = PRIORITY[req.priority] || PRIORITY.medium
                return (
                  <div key={req.id} className="req-card" onClick={()=>setSelected(req)}>
                    <div className="req-card-left">
                      <div className="req-card-top">
                        <span className="mono-tag">{req.id}</span>
                        <span className="priority-dot" style={{color:p.color}}>● {p.label} Priority</span>
                      </div>
                      <div className="req-card-title">{req.title}</div>
                      <div className="req-card-meta">
                        <span>🏢 {req.department}</span>
                        <span>👤 {req.requestedBy}</span>
                        <span>📅 {req.date}</span>
                        <span>📦 {req.items} item{req.items>1?'s':''}</span>
                        <span className="cat-badge">{req.category}</span>
                      </div>
                      {req.feedback && (
                        <div style={{marginTop:8,padding:'8px 12px',background:'rgba(6,182,212,.06)',border:'1px solid rgba(6,182,212,.15)',borderRadius:8,fontSize:12.5,color:'#0891b2',fontWeight:600}}>
                          💬 {req.feedback}
                        </div>
                      )}
                    </div>
                    <div className="req-card-right">
                      <div className="req-amount">{fmt(req.amount)}</div>
                      <span className="status-pill" style={{color:s.color,background:s.bg}}>{s.label}</span>
                      <button className="btn-ghost" style={{fontSize:12,padding:'6px 14px'}}>View →</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
      }

      {/* Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={()=>setSelected(null)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="mono-tag" style={{marginBottom:6,display:'block'}}>{selected.id}</span>
                <h2 className="modal-title">{selected.title}</h2>
              </div>
              <button className="modal-close" onClick={()=>setSelected(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-info-grid">
                {[
                  {label:'Department',   value:selected.department},
                  {label:'Requested By', value:selected.requestedBy},
                  {label:'Date Filed',   value:selected.date},
                  {label:'Category',     value:selected.category},
                  {label:'Items Count',  value:`${selected.items} item(s)`},
                  {label:'Priority',     value:PRIORITY[selected.priority]?.label||'—'},
                ].map(f=>(
                  <div key={f.label} className="modal-info-item">
                    <span className="modal-info-label">{f.label}</span>
                    <span className="modal-info-value">{f.value}</span>
                  </div>
                ))}
              </div>
              {selected.note && (
                <div style={{marginTop:16,padding:'12px 16px',background:'#f8fafc',borderRadius:10,border:'1px solid #e2e8f0'}}>
                  <div style={{fontSize:11,fontWeight:800,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.07em',fontFamily:'JetBrains Mono,monospace',marginBottom:4}}>Notes</div>
                  <div style={{fontSize:13.5,color:'#475569'}}>{selected.note}</div>
                </div>
              )}
              <div className="modal-amount-block">
                <span className="modal-amount-label">Total Requested Amount</span>
                <span className="modal-amount-value">{fmt(selected.amount)}</span>
              </div>
              <div className="modal-status-block">
                <span className="modal-info-label">Current Status</span>
                <span className="status-pill" style={{color:STATUS[selected.status]?.color,background:STATUS[selected.status]?.bg,fontSize:13,padding:'6px 16px'}}>
                  {STATUS[selected.status]?.label}
                </span>
              </div>
              {selected.feedback && (
                <div style={{marginTop:12,padding:'12px 16px',background:'rgba(6,182,212,.05)',border:'1px solid rgba(6,182,212,.18)',borderRadius:10}}>
                  <div style={{fontSize:11,fontWeight:800,color:'#0891b2',textTransform:'uppercase',letterSpacing:'.07em',fontFamily:'JetBrains Mono,monospace',marginBottom:4}}>IT Staff Feedback</div>
                  <div style={{fontSize:13.5,color:'#334155',fontWeight:600}}>{selected.feedback}</div>
                </div>
              )}
              {/* Feedback input for pending/for_review */}
              {(selected.status==='pending'||selected.status==='for_review') && (
                <div style={{marginTop:16}}>
                  <label className="login-label">IT Staff Feedback</label>
                  <textarea className="form-textarea" placeholder="Add feedback or notes before approving/rejecting…"
                    rows={3} value={feedback} onChange={e=>setFeedback(e.target.value)} style={{marginTop:6}}/>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {(selected.status==='pending'||selected.status==='for_review') && (
                <>
                  <button className="btn-success" onClick={()=>handleApprove(selected)}>✓ Approve</button>
                  <button className="btn-danger"  onClick={()=>handleReject(selected)}>✕ Reject</button>
                </>
              )}
              <button className="btn-ghost" onClick={()=>setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* New Request Form */}
      {showForm && (
        <div className="modal-overlay" onClick={()=>setShowForm(false)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">New IT Purchase Request</h2>
              <button className="modal-close" onClick={()=>setShowForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-field" style={{gridColumn:'1/-1'}}>
                  <label className="login-label">Request Title</label>
                  <input className="login-input" type="text" placeholder="e.g. Laptops for New IT Hires"
                    value={newReq.title} onChange={e=>setNewReq(p=>({...p,title:e.target.value}))} style={{padding:'12px 16px'}}/>
                </div>
                {[
                  {label:'Department',      key:'department', type:'text',   placeholder:'e.g. Administration'},
                  {label:'Estimated Amount (₱)', key:'amount', type:'number', placeholder:'0'},
                  {label:'Number of Items', key:'items',      type:'number', placeholder:'1'},
                ].map(f=>(
                  <div key={f.key} className="form-field">
                    <label className="login-label">{f.label}</label>
                    <input className="login-input" type={f.type} placeholder={f.placeholder}
                      value={newReq[f.key]} onChange={e=>setNewReq(p=>({...p,[f.key]:e.target.value}))} style={{padding:'12px 16px'}}/>
                  </div>
                ))}
                <div className="form-field">
                  <label className="login-label">Category</label>
                  <select className="login-input" value={newReq.category} onChange={e=>setNewReq(p=>({...p,category:e.target.value}))} style={{padding:'12px 16px'}}>
                    {['IT Equipment','Laptops','Software','Network','Peripherals','Security','Storage','Printers'].map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label className="login-label">Priority</label>
                  <select className="login-input" value={newReq.priority} onChange={e=>setNewReq(p=>({...p,priority:e.target.value}))} style={{padding:'12px 16px'}}>
                    {['high','medium','low'].map(v=><option key={v} value={v}>{v.charAt(0).toUpperCase()+v.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-field" style={{gridColumn:'1/-1'}}>
                  <label className="login-label">Justification / Notes</label>
                  <textarea className="form-textarea" placeholder="Explain why this purchase is needed…" rows={3}
                    value={newReq.note} onChange={e=>setNewReq(p=>({...p,note:e.target.value}))}/>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={handleSubmitNew}>Submit Request</button>
              <button className="btn-ghost" onClick={()=>setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
