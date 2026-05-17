import { useEffect, useState, useMemo } from 'react'
import PageLayout from '../components/PageLayout'
import { shopAPI, requestsAPI, budgetAPI } from '../services/api'
import { useRole } from '../hooks/useRole'

const fmt = n => '₱' + Number(n ?? 0).toLocaleString()

const CAT_CFG = {
  hardware:        { label:'Hardware',         color:'#3b82f6', bg:'rgba(59,130,246,.1)',  border:'rgba(59,130,246,.2)',  icon:'🖥️' },
  softwareLicense: { label:'Software License', color:'#8b5cf6', bg:'rgba(139,92,246,.1)',  border:'rgba(139,92,246,.2)',  icon:'💾' },
  service:         { label:'Service',          color:'#06b6d4', bg:'rgba(6,182,212,.1)',   border:'rgba(6,182,212,.2)',   icon:'⚙️' },
}
const SUB_CFG = { monthly:{ label:'Monthly', color:'#06b6d4', bg:'rgba(6,182,212,.1)' }, annual:{ label:'Annual', color:'#8b5cf6', bg:'rgba(139,92,246,.1)' } }

const I = ({ d, size=16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d}/>
  </svg>
)
const Icons = {
  Cart:    ()=><I d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/>,
  Plus:    ()=><I d="M12 5v14M5 12h14"/>,
  Minus:   ()=><I d="M5 12h14"/>,
  Trash:   ()=><I d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/>,
  Search:  ()=><I d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>,
  Check:   ()=><I d="M20 6L9 17l-5-5"/>,
  X:       ()=><I d="M18 6L6 18M6 6l12 12"/>,
  Refresh: ()=><I d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>,
  Star:    ()=><I d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>,
  Tag:     ()=><I d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01"/>,
}

const Pill = ({ label, color, bg }) => (
  <span style={{ fontSize:10.5, fontWeight:700, padding:'2px 8px', borderRadius:5, color, background:bg, fontFamily:'JetBrains Mono,monospace', whiteSpace:'nowrap' }}>
    {label}
  </span>
)

const Toast = ({ msg, type='success', onDone }) => {
  useEffect(()=>{ const t=setTimeout(onDone,3000); return ()=>clearTimeout(t) },[msg])
  const bg = type==='success'?'#10b981':type==='error'?'#ef4444':'#3b82f6'
  return (
    <div style={{ position:'fixed',bottom:28,right:28,zIndex:9999,background:bg,color:'#fff',padding:'13px 20px',borderRadius:12,fontWeight:700,fontSize:13.5,boxShadow:'0 8px 32px rgba(0,0,0,.22)',display:'flex',alignItems:'center',gap:10 }}>
      {type==='success'?<Icons.Check/>:<Icons.X/>} {msg}
    </div>
  )
}

export default function Shop() {
  const { user, isAdmin, isITStaff, isStaff } = useRole()
  const [catalog,   setCatalog]   = useState([])
  const [deptBudget,setDeptBudget]= useState(null)
  const [cart,      setCart]      = useState([])
  const [search,    setSearch]    = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [subFilter, setSubFilter] = useState('all') // all | standard | subscription
  const [subcatFilter,setSubcatFilter] = useState('all')
  const [loading,   setLoading]   = useState(true)
  const [showCart,  setShowCart]  = useState(false)
  const [showConfirm,setShowConfirm]=useState(false)
  const [reqForm,   setReqForm]   = useState({ note:'', priority:'medium', lineItem:'LI-H01', department:'' })
  const [toast,     setToast]     = useState(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    Promise.all([shopAPI.getCatalog(), budgetAPI.getDeptBudget(user?.department||'IT')]).then(([c,db]) => {
      setCatalog(c); setDeptBudget(db); setLoading(false)
    })
    setReqForm(f=>({...f, department:user?.department||'Administration'}))
  }, [])

  const allSubcats = useMemo(()=>{
    const src = catFilter==='all' ? catalog : catalog.filter(p=>p.category===catFilter)
    return ['all',...new Set(src.map(p=>p.subcategory))]
  },[catalog,catFilter])

  const filtered = useMemo(()=>catalog.filter(p=>{
    const ms = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()) || p.vendor.toLowerCase().includes(search.toLowerCase()) || p.specs.toLowerCase().includes(search.toLowerCase())
    const mc = catFilter==='all' || p.category===catFilter
    const msc = subcatFilter==='all' || p.subcategory===subcatFilter
    const msub = subFilter==='all' || (subFilter==='subscription'?p.isSubscription:!p.isSubscription)
    return ms && mc && msc && msub
  }),[catalog,search,catFilter,subcatFilter,subFilter])

  const groupedSubcats = useMemo(()=>{
    const groups={}
    filtered.forEach(p=>{ if(!groups[p.subcategory]) groups[p.subcategory]=[]; groups[p.subcategory].push(p) })
    return groups
  },[filtered])

  const cartCount = cart.reduce((a,i)=>a+i.qty,0)
  const cartTotal = cart.reduce((a,i)=>a+i.price*i.qty,0)

  const addToCart = (product, qty=1) => {
    setCart(prev=>{
      const ex=prev.find(i=>i.id===product.id)
      if(ex) return prev.map(i=>i.id===product.id?{...i,qty:i.qty+qty}:i)
      return [...prev,{...product,qty}]
    })
    setToast({msg:`${product.name} added to request`,type:'success'})
  }
  const removeFromCart = id => setCart(prev=>prev.filter(i=>i.id!==id))
  const updateQty = (id,qty) => { if(qty<1){removeFromCart(id);return}; setCart(prev=>prev.map(i=>i.id===id?{...i,qty}:i)) }

  const handleSubmit = async () => {
    if(!cart.length) return
    const firstCat = cart[0].category
    const lineItem = cart[0].lineItem || 'LI-H01'
    const items = cart.map(i=>({ productId:i.id, name:i.name, qty:i.qty, unitPrice:i.price, sku:i.sku, vendor:i.vendor, category:i.category }))
    const title = cart.length===1 ? cart[0].name : `${cart[0].name} + ${cart.length-1} more`
    await requestsAPI.addRequest({
      title, requestedBy:user?.name, requestorRole:user?.role,
      department:reqForm.department||user?.department,
      date:new Date().toISOString().slice(0,10),
      category:firstCat, lineItem, lineItemName:lineItem,
      items, total:cartTotal, priority:reqForm.priority, note:reqForm.note,
    })
    setSubmitted(true); setCart([]); setShowConfirm(false); setShowCart(false)
    setToast({msg:'Purchase request submitted successfully!',type:'success'})
    setTimeout(()=>setSubmitted(false),4000)
  }

  const deptBudgetPct = deptBudget ? Math.round(deptBudget.spent/deptBudget.total*100) : 0

  return (
    <PageLayout title="IT Shop" subtitle="Browse the IT catalog, subscriptions, and submit purchase requests" badge="Shop"
      actions={
        <button onClick={()=>setShowCart(true)} style={{ position:'relative',padding:'9px 18px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#06b6d4,#3b82f6)',color:'#fff',cursor:'pointer',fontWeight:700,fontSize:13,display:'flex',alignItems:'center',gap:8 }}>
          <Icons.Cart/> Request Cart
          {cartCount>0 && <span style={{ position:'absolute',top:-6,right:-6,background:'#ef4444',color:'#fff',borderRadius:'50%',width:20,height:20,fontSize:10,fontWeight:900,display:'flex',alignItems:'center',justifyContent:'center' }}>{cartCount}</span>}
        </button>
      }>

      {/* Dept Budget Banner */}
      {deptBudget && (
        <div style={{ background:'linear-gradient(135deg,#0c1627,#0a2440)',borderRadius:14,padding:'14px 20px',display:'flex',alignItems:'center',gap:20,marginBottom:18,position:'relative',overflow:'hidden',boxShadow:'0 8px 24px rgba(0,0,0,.14)' }}>
          <div style={{ position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px)',backgroundSize:'28px 28px',pointerEvents:'none'}}/>
          <div style={{ flex:1,zIndex:1 }}>
            <div style={{ fontSize:10,color:'rgba(255,255,255,.4)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',fontFamily:'JetBrains Mono,monospace',marginBottom:3 }}>{deptBudget.department} Department Budget</div>
            <div style={{ height:7,background:'rgba(255,255,255,.1)',borderRadius:100,overflow:'hidden',marginBottom:4 }}>
              <div style={{ height:'100%',borderRadius:100,background:deptBudgetPct>=90?'linear-gradient(90deg,#f59e0b,#ef4444)':deptBudgetPct>=70?'#f59e0b':'linear-gradient(90deg,#06b6d4,#3b82f6)',width:`${Math.min(deptBudgetPct,100)}%`,transition:'width 1s ease' }}/>
            </div>
            <div style={{ fontSize:11,color:'rgba(255,255,255,.35)',fontFamily:'JetBrains Mono,monospace' }}>{fmt(deptBudget.spent)} spent of {fmt(deptBudget.total)} — {deptBudgetPct}% utilized</div>
          </div>
          {[
            { label:'Remaining', val:fmt(deptBudget.remaining), color:deptBudget.remaining<0?'#ef4444':'#34d399' },
            { label:'Your Cart', val:fmt(cartTotal), color:'#fbbf24' },
          ].map(s=>(
            <div key={s.label} style={{ textAlign:'center',zIndex:1,minWidth:100 }}>
              <div style={{ fontSize:10,color:'rgba(255,255,255,.38)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',fontFamily:'JetBrains Mono,monospace',marginBottom:3 }}>{s.label}</div>
              <div style={{ fontFamily:'Outfit,sans-serif',fontSize:18,fontWeight:900,color:s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Submitted success */}
      {submitted && (
        <div style={{ display:'flex',alignItems:'center',gap:12,padding:'14px 18px',borderRadius:12,background:'rgba(16,185,129,.08)',border:'1.5px solid rgba(16,185,129,.2)',marginBottom:16,animation:'cardReveal .3s ease both' }}>
          <div style={{ width:36,height:36,borderRadius:10,background:'rgba(16,185,129,.15)',display:'flex',alignItems:'center',justifyContent:'center',color:'#10b981' }}><Icons.Check size={18}/></div>
          <div><div style={{ fontWeight:800,color:'#10b981',fontSize:14 }}>Purchase Request Submitted!</div><div style={{ fontSize:12.5,color:'#64748b' }}>Your IT staff will review and process your request. You can track it in your requests section.</div></div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center' }}>
        <div style={{ position:'relative',flex:1,minWidth:200 }}>
          <span style={{ position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:'#94a3b8' }}><Icons.Search/></span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products, SKU, vendor..."
            style={{ width:'100%',padding:'9px 12px 9px 36px',borderRadius:10,border:'1.5px solid #e2e8f0',fontSize:13,outline:'none',boxSizing:'border-box' }}/>
        </div>
        <div style={{ display:'flex',gap:6 }}>
          {['all','hardware','softwareLicense','service'].map(c=>{
            const cfg = CAT_CFG[c]
            return (
              <button key={c} onClick={()=>{ setCatFilter(c); setSubcatFilter('all') }}
                style={{ padding:'8px 14px',borderRadius:9,border:`1.5px solid ${catFilter===c&&c!=='all'?cfg.color:'#e2e8f0'}`,
                  background:catFilter===c&&c!=='all'?cfg.bg:catFilter===c?'rgba(6,182,212,.08)':'#fff',
                  color:catFilter===c&&c!=='all'?cfg.color:catFilter===c?'#0891b2':'#64748b',
                  cursor:'pointer',fontWeight:700,fontSize:12,whiteSpace:'nowrap',transition:'all .15s' }}>
                {c==='all'?'All Categories':c==='softwareLicense'?'Software':'Hardware'==='Hardware'?'HW':cfg?.label||c}
              </button>
            )
          })}
        </div>
        <div style={{ display:'flex',gap:6 }}>
          {[{v:'all',l:'All Products'},{v:'standard',l:'One-time'},{v:'subscription',l:'Subscriptions'}].map(f=>(
            <button key={f.v} onClick={()=>setSubFilter(f.v)}
              style={{ padding:'8px 14px',borderRadius:9,border:`1.5px solid ${subFilter===f.v?'#8b5cf6':'#e2e8f0'}`,background:subFilter===f.v?'rgba(139,92,246,.1)':'#fff',color:subFilter===f.v?'#7c3aed':'#64748b',cursor:'pointer',fontWeight:700,fontSize:12,transition:'all .15s' }}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Subcategory chips */}
      {allSubcats.length>2 && (
        <div style={{ display:'flex',gap:6,marginBottom:16,flexWrap:'wrap' }}>
          {allSubcats.map(sc=>(
            <button key={sc} onClick={()=>setSubcatFilter(sc)}
              style={{ padding:'5px 12px',borderRadius:20,border:`1.5px solid ${subcatFilter===sc?'#06b6d4':'#e2e8f0'}`,background:subcatFilter===sc?'rgba(6,182,212,.1)':'#f8fafc',color:subcatFilter===sc?'#0891b2':'#64748b',cursor:'pointer',fontWeight:600,fontSize:11.5,transition:'all .15s' }}>
              {sc==='all'?'All Subcategories':sc}
            </button>
          ))}
        </div>
      )}

      {/* Product grid by subcategory */}
      {loading ? (
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:14 }}>
          {[...Array(8)].map((_,i)=><div key={i} style={{ height:260,borderRadius:16,background:'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',backgroundSize:'200% 100%',animation:'shimmer 1.4s infinite' }}/>)}
        </div>
      ) : filtered.length===0 ? (
        <div style={{ textAlign:'center',padding:'60px 20px',color:'#94a3b8' }}>
          <div style={{ fontSize:44,marginBottom:12 }}>🔍</div>
          <div style={{ fontSize:16,fontWeight:700,color:'#64748b',marginBottom:6 }}>No products found</div>
          <div style={{ fontSize:13 }}>Try different search terms or filters.</div>
        </div>
      ) : (
        Object.entries(groupedSubcats).map(([subcat,products])=>(
          <div key={subcat} style={{ marginBottom:28 }}>
            <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:14 }}>
              <div style={{ height:1,flex:1,background:'#f1f5f9' }}/>
              <span style={{ fontSize:11,fontWeight:800,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.08em',fontFamily:'JetBrains Mono,monospace',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:6 }}>
                <Icons.Tag size={12}/> {subcat} <span style={{ color:'#cbd5e1',fontWeight:400 }}>({products.length})</span>
              </span>
              <div style={{ height:1,flex:1,background:'#f1f5f9' }}/>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:14 }}>
              {products.map(product=>{
                const cfg   = CAT_CFG[product.category]||CAT_CFG.hardware
                const inCart = cart.find(i=>i.id===product.id)
                const isSub  = product.isSubscription
                const cycCfg = isSub ? (SUB_CFG[product.billingCycle]||SUB_CFG.monthly) : null
                return (
                  <div key={product.id}
                    style={{ background:'#fff',border:`1.5px solid ${inCart?cfg.border:'#f1f5f9'}`,borderRadius:16,padding:18,
                      boxShadow:inCart?`0 4px 24px ${cfg.color}22`:'0 2px 8px rgba(0,0,0,.05)',
                      display:'flex',flexDirection:'column',gap:10,transition:'all .2s',position:'relative',overflow:'hidden' }}
                    onMouseEnter={e=>{ if(!inCart){ e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,.1)'; e.currentTarget.style.transform='translateY(-2px)' }}}
                    onMouseLeave={e=>{ if(!inCart){ e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,.05)'; e.currentTarget.style.transform='translateY(0)' }}}>
                    <div style={{ position:'absolute',top:0,left:0,right:0,height:3,background:cfg.color,opacity:.6 }}/>

                    {/* Badges */}
                    <div style={{ display:'flex',gap:5,flexWrap:'wrap',paddingTop:2 }}>
                      <Pill label={cfg.label} color={cfg.color} bg={cfg.bg}/>
                      {isSub && <Pill label={`${cycCfg?.label} Sub`} color={cycCfg?.color} bg={cycCfg?.bg}/>}
                      {inCart && <Pill label="In Cart ✓" color="#10b981" bg="rgba(16,185,129,.1)"/>}
                    </div>

                    {/* Name & SKU */}
                    <div>
                      <div style={{ fontSize:13.5,fontWeight:800,color:'#0f172a',lineHeight:1.3,marginBottom:3 }}>{product.name}</div>
                      <div style={{ fontSize:10.5,color:'#94a3b8',fontFamily:'JetBrains Mono,monospace' }}>{product.sku} · {product.vendor}</div>
                    </div>

                    {/* Specs */}
                    <div style={{ fontSize:11.5,color:'#64748b',lineHeight:1.5,flex:1 }}>{product.specs}</div>

                    {/* Price & unit */}
                    <div style={{ display:'flex',alignItems:'flex-end',justifyContent:'space-between' }}>
                      <div>
                        <div style={{ fontFamily:'Outfit,sans-serif',fontSize:20,fontWeight:900,color:cfg.color }}>{fmt(product.price)}</div>
                        <div style={{ fontSize:10.5,color:'#94a3b8',fontFamily:'JetBrains Mono,monospace' }}>/{product.unit}</div>
                        {isSub && (
                          <div style={{ fontSize:10.5,color:'#64748b',fontFamily:'JetBrains Mono,monospace',marginTop:2 }}>
                            Annual: <span style={{ fontWeight:700,color:'#8b5cf6' }}>{fmt(product.billingCycle==='monthly'?product.price*12:product.price)}/yr</span>
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize:10.5,color:'#94a3b8' }}>Stock: {product.stock>100?'∞':product.stock}</div>
                    </div>

                    {/* Add/cart controls */}
                    {inCart ? (
                      <div style={{ display:'flex',alignItems:'center',gap:8,borderRadius:10,border:`1.5px solid ${cfg.border}`,padding:'6px 10px',background:cfg.bg }}>
                        <button onClick={()=>updateQty(product.id,inCart.qty-1)} style={{ width:26,height:26,borderRadius:7,border:`1px solid ${cfg.color}`,background:'#fff',cursor:'pointer',color:cfg.color,display:'flex',alignItems:'center',justifyContent:'center' }}><Icons.Minus/></button>
                        <span style={{ flex:1,textAlign:'center',fontWeight:800,color:cfg.color,fontFamily:'JetBrains Mono,monospace' }}>{inCart.qty}</span>
                        <button onClick={()=>updateQty(product.id,inCart.qty+1)} style={{ width:26,height:26,borderRadius:7,border:`1px solid ${cfg.color}`,background:'#fff',cursor:'pointer',color:cfg.color,display:'flex',alignItems:'center',justifyContent:'center' }}><Icons.Plus/></button>
                        <button onClick={()=>removeFromCart(product.id)} style={{ width:26,height:26,borderRadius:7,border:'1px solid rgba(239,68,68,.3)',background:'rgba(239,68,68,.06)',cursor:'pointer',color:'#ef4444',display:'flex',alignItems:'center',justifyContent:'center' }}><Icons.Trash/></button>
                      </div>
                    ) : (
                      <button onClick={()=>addToCart(product)} disabled={product.stock===0}
                        style={{ width:'100%',padding:'9px',borderRadius:10,border:'none',
                          background:product.stock===0?'#f1f5f9':`linear-gradient(135deg,${cfg.color},${cfg.color}cc)`,
                          color:product.stock===0?'#94a3b8':'#fff',cursor:product.stock===0?'not-allowed':'pointer',
                          fontWeight:700,fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',gap:7,transition:'opacity .15s' }}>
                        <Icons.Plus/>{product.stock===0?'Out of Stock':isSub?'Add Subscription':'Add to Request'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}

      {/* ── Cart Drawer ─────────────────────────────────────────── */}
      {showCart && (
        <div style={{ position:'fixed',inset:0,background:'rgba(15,23,42,.5)',backdropFilter:'blur(4px)',zIndex:1000,display:'flex',justifyContent:'flex-end' }} onClick={()=>setShowCart(false)}>
          <div style={{ width:460,background:'#fff',height:'100%',boxShadow:'-20px 0 60px rgba(0,0,0,.15)',display:'flex',flexDirection:'column',animation:'slideRight .25s ease' }} onClick={e=>e.stopPropagation()}>
            {/* Cart header */}
            <div style={{ padding:'20px 22px',borderBottom:'1.5px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
              <div>
                <div style={{ fontFamily:'Outfit,sans-serif',fontSize:18,fontWeight:900,color:'#0f172a' }}>Request Cart</div>
                <div style={{ fontSize:12,color:'#94a3b8' }}>{cartCount} item{cartCount!==1?'s':''} · {fmt(cartTotal)} total</div>
              </div>
              <button onClick={()=>setShowCart(false)} style={{ padding:8,borderRadius:8,border:'none',background:'#f1f5f9',cursor:'pointer',color:'#64748b',display:'flex',alignItems:'center' }}><Icons.X/></button>
            </div>

            {/* Cart body */}
            <div style={{ flex:1,overflowY:'auto',padding:'14px 22px',display:'flex',flexDirection:'column',gap:10 }}>
              {cart.length===0 ? (
                <div style={{ textAlign:'center',padding:'60px 0',color:'#94a3b8' }}>
                  <div style={{ fontSize:44,marginBottom:12 }}>🛒</div>
                  <div style={{ fontWeight:700,fontSize:15,color:'#64748b',marginBottom:6 }}>Your cart is empty</div>
                  <div style={{ fontSize:13 }}>Browse the catalog and add items to request.</div>
                </div>
              ) : cart.map(item=>{
                const cfg = CAT_CFG[item.category]||CAT_CFG.hardware
                return (
                  <div key={item.id} style={{ background:'#f8fafc',borderRadius:12,padding:'12px 14px',border:'1.5px solid #f1f5f9',display:'flex',gap:12,alignItems:'flex-start' }}>
                    <div style={{ width:36,height:36,borderRadius:9,background:cfg.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0 }}>{cfg.icon}</div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:2 }}>{item.name}</div>
                      <div style={{ fontSize:11,color:'#94a3b8',fontFamily:'JetBrains Mono,monospace',marginBottom:6 }}>{item.sku} · {fmt(item.price)}/{item.unit}</div>
                      <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                        <button onClick={()=>updateQty(item.id,item.qty-1)} style={{ width:24,height:24,borderRadius:6,border:'1.5px solid #e2e8f0',background:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}><Icons.Minus size={12}/></button>
                        <span style={{ fontWeight:800,fontSize:13,fontFamily:'JetBrains Mono,monospace',minWidth:20,textAlign:'center' }}>{item.qty}</span>
                        <button onClick={()=>updateQty(item.id,item.qty+1)} style={{ width:24,height:24,borderRadius:6,border:'1.5px solid #e2e8f0',background:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}><Icons.Plus size={12}/></button>
                      </div>
                    </div>
                    <div style={{ textAlign:'right',flexShrink:0 }}>
                      <div style={{ fontFamily:'Outfit,sans-serif',fontSize:15,fontWeight:900,color:cfg.color }}>{fmt(item.price*item.qty)}</div>
                      <button onClick={()=>removeFromCart(item.id)} style={{ marginTop:6,padding:'3px 8px',borderRadius:6,border:'1px solid rgba(239,68,68,.2)',background:'rgba(239,68,68,.05)',cursor:'pointer',color:'#ef4444',fontSize:10,fontWeight:700 }}>Remove</button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Cart footer */}
            {cart.length>0 && (
              <div style={{ padding:'16px 22px',borderTop:'1.5px solid #f1f5f9' }}>
                <div style={{ display:'flex',justifyContent:'space-between',marginBottom:14,padding:'10px 14px',borderRadius:10,background:'rgba(6,182,212,.05)',border:'1px solid rgba(6,182,212,.15)' }}>
                  <span style={{ fontWeight:700,color:'#0f172a' }}>Total Estimate</span>
                  <span style={{ fontFamily:'Outfit,sans-serif',fontSize:18,fontWeight:900,color:'#06b6d4' }}>{fmt(cartTotal)}</span>
                </div>
                <button onClick={()=>{ setShowCart(false); setShowConfirm(true) }}
                  style={{ width:'100%',padding:'12px',borderRadius:11,border:'none',background:'linear-gradient(135deg,#06b6d4,#3b82f6)',color:'#fff',fontWeight:800,fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
                  <Icons.Check/> Submit Purchase Request
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Confirm Modal ────────────────────────────────────────── */}
      {showConfirm && (
        <div style={{ position:'fixed',inset:0,background:'rgba(15,23,42,.55)',backdropFilter:'blur(4px)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
          <div style={{ background:'#fff',borderRadius:20,padding:28,width:'100%',maxWidth:500,boxShadow:'0 24px 80px rgba(0,0,0,.2)' }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20 }}>
              <h3 style={{ margin:0,fontSize:16,fontWeight:800,color:'#0f172a',fontFamily:'Outfit,sans-serif' }}>Confirm Purchase Request</h3>
              <button onClick={()=>setShowConfirm(false)} style={{ padding:6,borderRadius:8,border:'none',background:'#f1f5f9',cursor:'pointer',color:'#64748b',display:'flex',alignItems:'center' }}><Icons.X/></button>
            </div>

            {/* Summary */}
            <div style={{ background:'#f8fafc',borderRadius:12,padding:'12px 14px',marginBottom:16,maxHeight:180,overflowY:'auto' }}>
              {cart.map(i=>(
                <div key={i.id} style={{ display:'flex',justifyContent:'space-between',fontSize:12.5,marginBottom:5 }}>
                  <span style={{ color:'#334155',fontWeight:600 }}>{i.name} ×{i.qty}</span>
                  <span style={{ fontFamily:'JetBrains Mono,monospace',color:'#0f172a',fontWeight:700 }}>{fmt(i.price*i.qty)}</span>
                </div>
              ))}
              <div style={{ borderTop:'1px solid #e2e8f0',marginTop:8,paddingTop:8,display:'flex',justifyContent:'space-between',fontWeight:900 }}>
                <span>Total</span><span style={{ fontFamily:'Outfit,sans-serif',color:'#06b6d4',fontSize:16 }}>{fmt(cartTotal)}</span>
              </div>
            </div>

            <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
              <div>
                <label style={{ display:'block',fontSize:11.5,fontWeight:700,color:'#64748b',marginBottom:5,textTransform:'uppercase',letterSpacing:'.05em' }}>Priority</label>
                <select value={reqForm.priority} onChange={e=>setReqForm(f=>({...f,priority:e.target.value}))}
                  style={{ width:'100%',padding:'9px 12px',borderRadius:8,border:'1.5px solid #e2e8f0',fontSize:13,outline:'none',fontFamily:'inherit' }}>
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                </select>
              </div>
              {(isAdmin||isITStaff) && (
                <div>
                  <label style={{ display:'block',fontSize:11.5,fontWeight:700,color:'#64748b',marginBottom:5,textTransform:'uppercase',letterSpacing:'.05em' }}>Requesting Department</label>
                  <select value={reqForm.department} onChange={e=>setReqForm(f=>({...f,department:e.target.value}))}
                    style={{ width:'100%',padding:'9px 12px',borderRadius:8,border:'1.5px solid #e2e8f0',fontSize:13,outline:'none',fontFamily:'inherit' }}>
                    {['IT','Administration','Finance','HR','Marketing','Operations'].map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label style={{ display:'block',fontSize:11.5,fontWeight:700,color:'#64748b',marginBottom:5,textTransform:'uppercase',letterSpacing:'.05em' }}>Note / Justification</label>
                <textarea value={reqForm.note} onChange={e=>setReqForm(f=>({...f,note:e.target.value}))} rows={3} placeholder="Briefly explain the business need..."
                  style={{ width:'100%',padding:'9px 12px',borderRadius:8,border:'1.5px solid #e2e8f0',fontSize:13,outline:'none',fontFamily:'inherit',resize:'vertical',boxSizing:'border-box' }}/>
              </div>
            </div>

            <div style={{ display:'flex',gap:10,marginTop:18 }}>
              <button onClick={()=>setShowConfirm(false)} style={{ flex:1,padding:'10px',borderRadius:9,border:'1.5px solid #e2e8f0',background:'#f8fafc',cursor:'pointer',fontWeight:600,fontSize:13 }}>Back</button>
              <button onClick={handleSubmit} style={{ flex:2,padding:'10px',borderRadius:9,border:'none',background:'linear-gradient(135deg,#06b6d4,#3b82f6)',color:'#fff',cursor:'pointer',fontWeight:800,fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',gap:7 }}>
                <Icons.Check/> Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}
    </PageLayout>
  )
}
