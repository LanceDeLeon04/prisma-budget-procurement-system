import { useEffect, useState } from 'react'
import PageLayout from '../components/PageLayout'
import { requestsAPI } from '../services/api'
import { useRole } from '../hooks/useRole'

const fmt = n => '₱' + Number(n).toLocaleString()
const STATUS = {
  approved:   { label:'Approved',   color:'#10b981', bg:'rgba(16,185,129,.1)' },
  pending:    { label:'Pending',     color:'#f59e0b', bg:'rgba(245,158,11,.1)' },
  for_review: { label:'For Review',  color:'#3b82f6', bg:'rgba(59,130,246,.1)' },
  rejected:   { label:'Rejected',    color:'#ef4444', bg:'rgba(239,68,68,.1)'  },
  po_issued:  { label:'PO Issued',   color:'#8b5cf6', bg:'rgba(139,92,246,.1)' },
  received:   { label:'Received',    color:'#06b6d4', bg:'rgba(6,182,212,.1)'  },
}
const PRI = { high:{label:'High',color:'#ef4444'}, medium:{label:'Medium',color:'#f59e0b'}, low:{label:'Low',color:'#10b981'} }

const FileIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
const PlusIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const ChevRIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,18 15,12 9,6"/></svg>
const AlertIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>

export default function RequestItems() {
  const { user, isAdmin, isITStaff, isStaff } = useRole()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [showChange, setShowChange] = useState(false)
  const [changeJust, setChangeJust] = useState('')
  const [changeNote, setChangeNote] = useState('')
  const [newReq, setNewReq] = useState({ title:'', department:'', category:'IT Equipment', expType:'capex', amount:'', items:'1', priority:'medium', note:'' })

  useEffect(() => { requestsAPI.getAll().then(d => { setRequests(d); setLoading(false) }) }, [])

  // Filter by role
  const visible = requests.filter(r => {
    if (isStaff) return r.requestedBy === user?.name
    return true
  })
  const filtered = visible.filter(r => {
    const mf = filter === 'all' || r.status === filter
    const ms = r.title.toLowerCase().includes(search.toLowerCase()) ||
               r.department.toLowerCase().includes(search.toLowerCase()) ||
               r.id.toLowerCase().includes(search.toLowerCase())
    return mf && ms
  })
  const counts = { all:visible.length, pending:visible.filter(r=>r.status==='pending').length, for_review:visible.filter(r=>r.status==='for_review').length, approved:visible.filter(r=>r.status==='approved').length, po_issued:visible.filter(r=>r.status==='po_issued').length, received:visible.filter(r=>r.status==='received').length, rejected:visible.filter(r=>r.status==='rejected').length }

  const handleApprove = async req => {
    await requestsAPI.approveRequest(req.id, user?.name)
    setRequests(prev => prev.map(r => r.id===req.id ? {...r,status:'approved',approvedBy:user?.name,feedback:feedback||'Approved.'} : r))
    setSelected(null); setFeedback('')
  }
  const handleReject = async req => {
    await requestsAPI.rejectRequest(req.id, feedback||'Rejected by approver.', user?.name)
    setRequests(prev => prev.map(r => r.id===req.id ? {...r,status:'rejected',approvedBy:user?.name,feedback:feedback||'Rejected.'} : r))
    setSelected(null); setFeedback('')
  }
  const handleIssuePO = async req => {
    await requestsAPI.updateStatus(req.id,'po_issued',{approvedBy:user?.name,feedback:'Purchase Order issued.'})
    setRequests(prev => prev.map(r => r.id===req.id ? {...r,status:'po_issued'} : r))
    setSelected(prev => prev ? {...prev,status:'po_issued'} : null)
  }
  const handleReceive = async req => {
    await requestsAPI.updateStatus(req.id,'received',{approvedBy:user?.name,feedback:'Items received. Budget deducted from department.'})
    setRequests(prev => prev.map(r => r.id===req.id ? {...r,status:'received'} : r))
    setSelected(prev => prev ? {...prev,status:'received'} : null)
  }
  const handleChangeOrder = req => {
    if (!changeJust.trim()) return
    setRequests(prev => prev.map(r => r.id===req.id ? {...r,status:'for_review',feedback:`Order changed by IT Staff. Justification: ${changeJust}. Notes: ${changeNote}`,changeJustification:changeJust} : r))
    setShowChange(false); setChangeJust(''); setChangeNote(''); setSelected(null)
  }
  const handleSubmitNew = () => {
    if (!newReq.title||!newReq.department) return
    const id = `REQ-2025-0${200+requests.length+1}`
    setRequests(prev => [{
      id, title:newReq.title, requestedBy:user?.name, requestorRole:user?.role,
      department:newReq.department, date:new Date().toISOString().slice(0,10),
      expType:newReq.expType, lineItem:'LI-C01', lineItemName:'',
      items:[{name:'(Custom Request)',qty:Number(newReq.items)||1,unitPrice:Number(newReq.amount)||0}],
      total:Number(newReq.amount)||0, status:'pending', priority:newReq.priority,
      note:newReq.note, feedback:'', changeJustification:'', changedItems:null,
    },...prev])
    setNewReq({title:'',department:'',category:'IT Equipment',expType:'capex',amount:'',items:'1',priority:'medium',note:''})
    setShowForm(false)
  }

  return (
    <PageLayout title="Purchase Requests" subtitle={isStaff ? 'Track your submitted IT procurement requests' : 'Review and process IT procurement requests'} badge="Requests"
      actions={<button className="btn btn-primary btn-sm" onClick={()=>setShowForm(true)}><PlusIcon/> New Request</button>}
    >
      {/* Status tabs */}
      <div className="tabs">
        {Object.entries(counts).map(([key,cnt]) => (
          <button key={key} className={`tab${filter===key?' active':''}`} onClick={()=>setFilter(key)}>
            {key==='all'?'All':(STATUS[key]?.label||key)} <span className="tab-count">{cnt}</span>
          </button>
        ))}
        <input className="search-input" placeholder="Search requests..." value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>

      {loading ? (
        <div style={{display:'flex',flexDirection:'column',gap:11}}>
          {[...Array(3)].map((_,i)=><div key={i} className="sk-line" style={{height:100,borderRadius:16}}/>)}
        </div>
      ) : filtered.length===0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FileIcon/></div>
          <div className="empty-state-title">No requests found</div>
          <div className="empty-state-sub">{isStaff?'Click "New Request" to submit your first IT procurement request':'No requests match your current filter'}</div>
        </div>
      ) : (
        <div className="req-list">
          {filtered.map(req => {
            const s = STATUS[req.status]||STATUS.pending
            const p = PRI[req.priority]||PRI.medium
            return (
              <div key={req.id} className="req-card" onClick={()=>setSelected(req)}>
                <div className="req-card-left">
                  <div className="req-card-top">
                    <span className="mono">{req.id}</span>
                    <span className={req.expType==='capex'?'badge-capex':'badge-opex'}>{req.expType==='capex'?'CapEx':'OpEx'}</span>
                    <span style={{fontSize:11.5,fontWeight:700,color:p.color,fontFamily:'JetBrains Mono,monospace'}}>● {p.label}</span>
                  </div>
                  <div className="req-title">{req.title}</div>
                  <div className="req-meta">
                    <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>{req.date}</span>
                    <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>{req.requestedBy}</span>
                    <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>{req.department}</span>
                    <span>{req.items.length} line{req.items.length>1?'s':''}</span>
                  </div>
                  {req.feedback && (
                    <div className="feedback-box" style={{marginTop:8}}>
                      <div className="feedback-label">IT Feedback</div>
                      <div className="feedback-text">{req.feedback}</div>
                    </div>
                  )}
                </div>
                <div className="req-card-right">
                  <div className="req-amount">{fmt(req.total)}</div>
                  <span className="pill" style={{color:s.color,background:s.bg}}>{s.label}</span>
                  <span style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:'#94a3b8'}}><ChevRIcon/> View</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="overlay" onClick={()=>{setSelected(null);setFeedback('')}}>
          <div className="modal modal-lg" onClick={e=>e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div style={{display:'flex',gap:8,marginBottom:6,flexWrap:'wrap'}}>
                  <span className="mono">{selected.id}</span>
                  <span className={selected.expType==='capex'?'badge-capex':'badge-opex'}>{selected.expType==='capex'?'CapEx':'OpEx'}</span>
                  <span className="pill" style={{color:STATUS[selected.status]?.color,background:STATUS[selected.status]?.bg}}>{STATUS[selected.status]?.label}</span>
                </div>
                <h2 className="modal-title">{selected.title}</h2>
              </div>
              <button className="modal-close" onClick={()=>{setSelected(null);setFeedback('')}}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="info-grid">
                {[{l:'Department',v:selected.department},{l:'Requested By',v:selected.requestedBy},{l:'Date Filed',v:selected.date},{l:'Priority',v:PRI[selected.priority]?.label||'—'},{l:'Line Item',v:selected.lineItemName||'—'},{l:'Expense Type',v:selected.expType==='capex'?'CapEx — Hardware':'OpEx — Software/Service'}].map(f=>(
                  <div key={f.l} className="info-item"><span className="info-label">{f.l}</span><span className="info-value">{f.v}</span></div>
                ))}
              </div>

              {/* Items table */}
              <div style={{marginTop:18,borderRadius:10,overflow:'hidden',border:'1.5px solid #f1f5f9'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead><tr style={{background:'#f8fafc'}}><th style={{padding:'9px 14px',textAlign:'left',fontSize:10.5,fontWeight:800,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.08em'}}>Item</th><th style={{padding:'9px 14px',textAlign:'right',fontSize:10.5,fontWeight:800,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.08em'}}>Qty</th><th style={{padding:'9px 14px',textAlign:'right',fontSize:10.5,fontWeight:800,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.08em'}}>Unit Price</th><th style={{padding:'9px 14px',textAlign:'right',fontSize:10.5,fontWeight:800,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.08em'}}>Subtotal</th></tr></thead>
                  <tbody>
                    {selected.items.map((item,i)=>(
                      <tr key={i} style={{borderTop:'1px solid #f1f5f9'}}>
                        <td style={{padding:'10px 14px',fontSize:13,fontWeight:600,color:'#334155'}}>{item.name}<div style={{fontSize:11,color:'#94a3b8',fontFamily:'JetBrains Mono,monospace',marginTop:2}}>SKU: {item.sku||'—'}</div></td>
                        <td style={{padding:'10px 14px',textAlign:'right',fontSize:13,color:'#64748b'}}>{item.qty}</td>
                        <td style={{padding:'10px 14px',textAlign:'right',fontFamily:'Outfit,sans-serif',fontSize:13,fontWeight:700,color:'#475569'}}>{fmt(item.unitPrice)}</td>
                        <td style={{padding:'10px 14px',textAlign:'right',fontFamily:'Outfit,sans-serif',fontSize:14,fontWeight:800,color:'#1e293b'}}>{fmt(item.qty*item.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="amount-block">
                <span className="amount-label">Total Request Amount</span>
                <span className="amount-val">{fmt(selected.total)}</span>
              </div>

              {selected.note && (
                <div style={{marginTop:14,padding:'11px 14px',background:'#f8fafc',borderRadius:10,border:'1px solid #e2e8f0'}}>
                  <div style={{fontSize:10,fontWeight:800,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.07em',fontFamily:'JetBrains Mono,monospace',marginBottom:4}}>Justification / Notes</div>
                  <div style={{fontSize:13,color:'#475569',lineHeight:1.55}}>{selected.note}</div>
                </div>
              )}

              {selected.feedback && (
                <div className="feedback-box" style={{marginTop:14}}>
                  <div className="feedback-label">IT Staff Feedback</div>
                  <div className="feedback-text">{selected.feedback}</div>
                </div>
              )}

              {/* Feedback + change order — IT Staff & Admin only */}
              {(isITStaff||isAdmin) && (selected.status==='pending'||selected.status==='for_review') && (
                <div style={{marginTop:16}}>
                  <label className="field-label" style={{display:'block',marginBottom:6}}>Feedback / Decision Notes</label>
                  <textarea className="field-textarea" rows={3} placeholder="Add feedback before approving or rejecting..." value={feedback} onChange={e=>setFeedback(e.target.value)}/>
                </div>
              )}
            </div>
            <div className="modal-foot">
              {(isITStaff||isAdmin) && (selected.status==='pending'||selected.status==='for_review') && (
                <>
                  <button className="btn btn-success" onClick={()=>handleApprove(selected)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg> Approve
                  </button>
                  <button className="btn btn-danger" onClick={()=>handleReject(selected)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Reject
                  </button>
                  {(selected.status==='approved'||selected.status==='for_review') && (isAdmin||isITStaff) && (
                    <button className="btn btn-secondary" style={{background:'rgba(139,92,246,.1)',color:'#8b5cf6',border:'1.5px solid rgba(139,92,246,.2)'}} onClick={()=>handleIssuePO(selected)}>
                      Issue PO
                    </button>
                  )}
                  {selected.status==='po_issued' && (isAdmin||isITStaff) && (
                    <button className="btn btn-primary" style={{background:'linear-gradient(135deg,#06b6d4,#0891b2)'}} onClick={()=>handleReceive(selected)}>
                      ✓ Mark as Received
                    </button>
                  )}
                  {selected.status==='received' && (
                    <div style={{fontSize:12.5,color:'#10b981',fontWeight:700,padding:'8px 14px',borderRadius:8,background:'rgba(16,185,129,.08)',border:'1px solid rgba(16,185,129,.2)'}}>
                      ✓ Items received — dept budget deducted
                    </div>
                  )}
                  {isITStaff && (
                    <button className="btn btn-secondary" onClick={()=>setShowChange(true)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Change Order
                    </button>
                  )}
                </>
              )}
              <button className="btn btn-ghost" onClick={()=>{setSelected(null);setFeedback('')}}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Change Order Modal — IT Staff only */}
      {showChange && selected && (
        <div className="overlay" onClick={()=>setShowChange(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:480}}>
            <div className="modal-head"><h2 className="modal-title">Change Order</h2><button className="modal-close" onClick={()=>setShowChange(false)}>&times;</button></div>
            <div className="modal-body">
              <div style={{background:'rgba(245,158,11,.07)',border:'1.5px solid rgba(245,158,11,.2)',borderRadius:10,padding:'11px 14px',marginBottom:16,display:'flex',gap:9,alignItems:'flex-start'}}>
                <div style={{color:'#f59e0b',marginTop:1}}><AlertIcon/></div>
                <div style={{fontSize:12.5,color:'#78350f',fontWeight:500}}>Changing an order requires a written justification. The request will return to <strong>For Review</strong> status for admin approval.</div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                <div className="field">
                  <label className="field-label">Justification (required)</label>
                  <textarea className="field-textarea" rows={3} placeholder="Explain why the order needs to be changed..." value={changeJust} onChange={e=>setChangeJust(e.target.value)}/>
                </div>
                <div className="field">
                  <label className="field-label">Proposed Changes / Notes</label>
                  <textarea className="field-textarea" rows={3} placeholder="Describe the specific changes to items, quantities, or specifications..." value={changeNote} onChange={e=>setChangeNote(e.target.value)}/>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-primary" onClick={()=>handleChangeOrder(selected)} disabled={!changeJust.trim()}>Submit Change Order</button>
              <button className="btn btn-ghost" onClick={()=>setShowChange(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* New Request Modal */}
      {showForm && (
        <div className="overlay" onClick={()=>setShowForm(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-head"><h2 className="modal-title">New IT Purchase Request</h2><button className="modal-close" onClick={()=>setShowForm(false)}>&times;</button></div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="field form-full">
                  <label className="field-label">Request Title</label>
                  <input className="field-input" placeholder="e.g. Laptops for New IT Hires" value={newReq.title} onChange={e=>setNewReq(p=>({...p,title:e.target.value}))}/>
                </div>
                <div className="field">
                  <label className="field-label">Department</label>
                  <input className="field-input" placeholder="e.g. Administration" value={newReq.department} onChange={e=>setNewReq(p=>({...p,department:e.target.value}))}/>
                </div>
                <div className="field">
                  <label className="field-label">Expense Type</label>
                  <select className="field-input field-select" value={newReq.expType} onChange={e=>setNewReq(p=>({...p,expType:e.target.value}))}>
                    <option value="capex">CapEx — Hardware / Equipment</option>
                    <option value="opex">OpEx — Software / Services</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Estimated Amount (₱)</label>
                  <input className="field-input" type="number" placeholder="0" value={newReq.amount} onChange={e=>setNewReq(p=>({...p,amount:e.target.value}))}/>
                </div>
                <div className="field">
                  <label className="field-label">Number of Items</label>
                  <input className="field-input" type="number" placeholder="1" value={newReq.items} onChange={e=>setNewReq(p=>({...p,items:e.target.value}))}/>
                </div>
                <div className="field">
                  <label className="field-label">Priority</label>
                  <select className="field-input field-select" value={newReq.priority} onChange={e=>setNewReq(p=>({...p,priority:e.target.value}))}>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="field form-full">
                  <label className="field-label">Justification / Notes</label>
                  <textarea className="field-textarea" rows={3} placeholder="Explain why this IT purchase is needed..." value={newReq.note} onChange={e=>setNewReq(p=>({...p,note:e.target.value}))}/>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-primary" onClick={handleSubmitNew}>Submit Request</button>
              <button className="btn btn-ghost" onClick={()=>setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
