import { useEffect, useState } from 'react'
import PageLayout from '../components/PageLayout'
import { shopAPI } from '../services/api'
import { useRole } from '../hooks/useRole'

const fmt = n => '₱' + Number(n).toLocaleString()
const ALL_CATS = ['All','Laptops','Desktops','Monitors','Switches','Access Points','Security Hardware','Servers','Storage','Power','Keyboards','Mice','Accessories','Printers','Productivity','Design Software','Cloud Compute','Cloud SaaS','Antivirus','ITSM','Maintenance','Managed Services']
const CartIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
const TrashIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
const PlusIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const CheckIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>
const ServerIcon = () => <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>

export default function Shop() {
  const { isAdmin, isITStaff, isStaff, user } = useRole()
  const [catalog, setCatalog] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [cart, setCart] = useState([])
  const [expFilter, setExpFilter] = useState('all')
  const [catFilter, setCatFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCart, setShowCart] = useState(false)
  const [addedId, setAddedId] = useState(null)
  const [activeTab, setActiveTab] = useState('catalog')
  const [showAddItem, setShowAddItem] = useState(false)
  const [newItem, setNewItem] = useState({ name:'',category:'Laptops',expType:'capex',price:'',stock:'',supplier:'',sku:'',specs:'' })
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    Promise.all([shopAPI.getCatalog(), shopAPI.getSuppliers()]).then(([c,s]) => {
      setCatalog(c); setSuppliers(s); setLoading(false)
    })
  }, [])

  const filtered = catalog.filter(p =>
    (expFilter === 'all' || p.expType === expFilter) &&
    (catFilter === 'All' || p.category === catFilter) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
  )

  const addToCart = p => {
    setCart(prev => { const ex = prev.find(i => i.id === p.id); return ex ? prev.map(i => i.id===p.id?{...i,qty:i.qty+1}:i) : [...prev,{...p,qty:1}] })
    setAddedId(p.id); setTimeout(() => setAddedId(null), 900)
    if (!showCart) setShowCart(true)
  }
  const removeFromCart = id => setCart(prev => prev.filter(i => i.id !== id))
  const updateQty = (id, qty) => { if (qty < 1) return removeFromCart(id); setCart(prev => prev.map(i => i.id===id?{...i,qty}:i)) }
  const cartTotal = cart.reduce((a,i) => a+i.price*i.qty, 0)
  const cartCount = cart.reduce((a,i) => a+i.qty, 0)
  const cartOpex = cart.filter(i=>i.expType==='opex').reduce((a,i)=>a+i.price*i.qty,0)
  const cartCapex = cart.filter(i=>i.expType==='capex').reduce((a,i)=>a+i.price*i.qty,0)

  const handleAddItem = () => {
    if (!newItem.name||!newItem.price) return
    const id = 'P' + String(catalog.length+1).padStart(3,'0')
    setCatalog(prev=>[...prev,{id,...newItem,price:Number(newItem.price),stock:Number(newItem.stock)||0,unit:'unit',lineItem:'LI-C01'}])
    setShowAddItem(false); setNewItem({name:'',category:'Laptops',expType:'capex',price:'',stock:'',supplier:'',sku:'',specs:''})
  }

  const handleSubmitRequest = () => {
    setShowConfirm(false); setCart([]); setShowCart(false)
    alert('Purchase request submitted successfully. IT Staff will review and process your request.')
  }

  return (
    <PageLayout title="Procurement Shop" subtitle="Browse IT equipment and software from the approved catalog" badge="Shop"
      actions={
        <div style={{ display:'flex',gap:10 }}>
          {isAdmin && <button className="btn btn-secondary btn-sm" onClick={()=>setShowAddItem(true)}><PlusIcon/> Add Item</button>}
          <button className="btn btn-primary btn-sm" style={{ gap:7 }} onClick={()=>setShowCart(!showCart)}>
            <CartIcon/> Cart {cartCount>0&&<span style={{ background:'rgba(255,255,255,.25)',borderRadius:100,padding:'1px 7px',fontSize:11,fontWeight:800 }}>{cartCount}</span>}
          </button>
        </div>
      }
    >
      {/* Tabs — admin sees suppliers tab */}
      <div className="tabs">
        <button className={`tab${activeTab==='catalog'?' active':''}`} onClick={()=>setActiveTab('catalog')}>Catalog</button>
        {(isAdmin||isITStaff) && <button className={`tab${activeTab==='suppliers'?' active':''}`} onClick={()=>setActiveTab('suppliers')}>Suppliers</button>}
      </div>

      {activeTab==='catalog' && (
        <>
          {/* OpEx / CapEx filter */}
          <div style={{ display:'flex',gap:8,marginBottom:14,flexWrap:'wrap',alignItems:'center' }}>
            {[{v:'all',l:'All Types'},{v:'capex',l:'CapEx — Hardware'},{v:'opex',l:'OpEx — Software & Services'}].map(f=>(
              <button key={f.v} onClick={()=>setExpFilter(f.v)} className={`cat-chip${expFilter===f.v?' active':''}`}>{f.l}</button>
            ))}
            <input className="search-input" style={{ marginLeft:'auto' }} placeholder="Search catalog..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          {/* Category chips */}
          <div className="cat-filter-bar">
            {ALL_CATS.map(c => <button key={c} className={`cat-chip${catFilter===c?' active':''}`} onClick={()=>setCatFilter(c)}>{c}</button>)}
          </div>

          <div className="shop-layout">
            <div className="product-grid">
              {loading ? [...Array(8)].map((_,i)=>(
                <div key={i} className="product-card"><div className="sk-line" style={{height:68,borderRadius:11,marginBottom:11}}/><div className="sk-line sk-sm"/><div className="sk-line sk-lg" style={{marginTop:6}}/></div>
              )) : filtered.length===0 ? (
                <div className="empty-state" style={{ gridColumn:'1/-1' }}>
                  <div className="empty-state-icon"><ServerIcon/></div>
                  <div className="empty-state-title">No items found</div>
                  <div className="empty-state-sub">Try adjusting your filters</div>
                </div>
              ) : filtered.map(p=>(
                <div key={p.id} className={`product-card${addedId===p.id?' added':''}`}>
                  <div className="product-img"><ServerIcon/></div>
                  <div style={{ display:'flex',gap:5,marginBottom:5,flexWrap:'wrap' }}>
                    <span className={p.expType==='capex'?'badge-capex':'badge-opex'}>{p.expType==='capex'?'CapEx':'OpEx'}</span>
                    <span style={{ fontSize:10.5,fontWeight:700,color:'#94a3b8',fontFamily:'JetBrains Mono,monospace',background:'#f8fafc',border:'1px solid #f1f5f9',padding:'2px 7px',borderRadius:5 }}>{p.category}</span>
                  </div>
                  <div className="product-name">{p.name}</div>
                  <div className="product-sku">SKU: {p.sku}</div>
                  <div className="product-specs">{p.specs}</div>
                  <div className="product-supplier">{p.supplier}</div>
                  <div className="product-bottom">
                    <div>
                      <div className="product-price">{fmt(p.price)}<span className="product-unit"> / {p.unit}</span></div>
                      <div className="product-stock" style={{ color:p.stock<5&&p.stock>0?'#f59e0b':p.stock===0?'#ef4444':'#10b981' }}>
                        {p.stock===999?'In stock':p.stock===0?'Out of stock':p.stock<5?`Only ${p.stock} left`:`${p.stock} in stock`}
                      </div>
                    </div>
                    <button className={`btn-add${addedId===p.id?' added':''}`} onClick={()=>p.stock!==0&&addToCart(p)} disabled={p.stock===0} title={p.stock===0?'Out of stock':'Add to cart'}>
                      {addedId===p.id?<CheckIcon/>:<PlusIcon/>}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {showCart && (
              <div className="cart-panel">
                <div className="cart-header">
                  <span className="cart-title">Purchase Cart ({cartCount})</span>
                  <button className="cart-close" onClick={()=>setShowCart(false)}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                {cart.length===0 ? <div className="cart-empty">Your cart is empty</div> : (
                  <>
                    <div className="cart-items">
                      {cart.map(item=>(
                        <div key={item.id} className="cart-item">
                          <div className="cart-item-img"><ServerIcon/></div>
                          <div className="cart-item-info">
                            <div className="cart-item-name">{item.name}</div>
                            <div className="cart-item-price">{fmt(item.price)} / {item.unit}</div>
                            <span className={item.expType==='capex'?'badge-capex':'badge-opex'} style={{ fontSize:9,padding:'1px 6px' }}>{item.expType==='capex'?'CapEx':'OpEx'}</span>
                          </div>
                          <div className="qty-wrap">
                            <button className="qty-btn" onClick={()=>updateQty(item.id,item.qty-1)}>−</button>
                            <span className="qty-val">{item.qty}</span>
                            <button className="qty-btn" onClick={()=>updateQty(item.id,item.qty+1)}>+</button>
                          </div>
                          <button className="cart-remove" onClick={()=>removeFromCart(item.id)}><TrashIcon/></button>
                        </div>
                      ))}
                    </div>
                    <div className="cart-footer">
                      <div className="cart-type-row">
                        {cartCapex>0&&<span className="badge-capex">CapEx: {fmt(cartCapex)}</span>}
                        {cartOpex>0&&<span className="badge-opex">OpEx: {fmt(cartOpex)}</span>}
                      </div>
                      <div className="cart-total-row"><span className="cart-total-label">Total</span><span className="cart-total-val">{fmt(cartTotal)}</span></div>
                      <button className="btn btn-primary" style={{ width:'100%',marginTop:12,justifyContent:'center' }} onClick={()=>setShowConfirm(true)}>Submit Purchase Request</button>
                      <div className="cart-note">{isStaff?'Request routes to IT Staff for review':'Request routes to admin for approval'}</div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab==='suppliers' && (isAdmin||isITStaff) && (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>ID</th><th>Supplier</th><th>Category</th><th>Contact</th><th>Email</th><th>Accredited</th></tr></thead>
            <tbody>
              {suppliers.map(s=>(
                <tr key={s.id} className="tr">
                  <td><span className="mono">{s.id}</span></td>
                  <td><strong>{s.name}</strong></td>
                  <td><span style={{ fontSize:11.5,fontWeight:700,padding:'2px 9px',borderRadius:6,background:'rgba(6,182,212,.08)',color:'#0891b2',fontFamily:'JetBrains Mono,monospace' }}>{s.category}</span></td>
                  <td><span className="dt">{s.contact}</span></td>
                  <td><span className="dt">{s.email}</span></td>
                  <td><span className="pill" style={{ color:s.accredited?'#10b981':'#f59e0b',background:s.accredited?'rgba(16,185,129,.1)':'rgba(245,158,11,.1)' }}>{s.accredited?'Accredited':'Pending'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Item Modal (admin only) */}
      {showAddItem && isAdmin && (
        <div className="overlay" onClick={()=>setShowAddItem(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-head"><h2 className="modal-title">Add Catalog Item</h2><button className="modal-close" onClick={()=>setShowAddItem(false)}>&times;</button></div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="field form-full"><label className="field-label">Item Name</label><input className="field-input" placeholder="e.g. Dell Latitude 5540 Laptop" value={newItem.name} onChange={e=>setNewItem(p=>({...p,name:e.target.value}))}/></div>
                <div className="field"><label className="field-label">SKU</label><input className="field-input" placeholder="e.g. DL-LAT-5540" value={newItem.sku} onChange={e=>setNewItem(p=>({...p,sku:e.target.value}))}/></div>
                <div className="field"><label className="field-label">Supplier</label><input className="field-input" placeholder="e.g. Dell Philippines" value={newItem.supplier} onChange={e=>setNewItem(p=>({...p,supplier:e.target.value}))}/></div>
                <div className="field"><label className="field-label">Price (₱)</label><input className="field-input" type="number" placeholder="0" value={newItem.price} onChange={e=>setNewItem(p=>({...p,price:e.target.value}))}/></div>
                <div className="field"><label className="field-label">Stock</label><input className="field-input" type="number" placeholder="0" value={newItem.stock} onChange={e=>setNewItem(p=>({...p,stock:e.target.value}))}/></div>
                <div className="field"><label className="field-label">Category</label>
                  <select className="field-input field-select" value={newItem.category} onChange={e=>setNewItem(p=>({...p,category:e.target.value}))}>
                    {['Laptops','Desktops','Monitors','Switches','Servers','Storage','Keyboards','Mice','Printers','Antivirus','Productivity','Cloud Compute'].map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field"><label className="field-label">Expense Type</label>
                  <select className="field-input field-select" value={newItem.expType} onChange={e=>setNewItem(p=>({...p,expType:e.target.value}))}>
                    <option value="capex">CapEx — Hardware / Equipment</option>
                    <option value="opex">OpEx — Software / Services</option>
                  </select>
                </div>
                <div className="field form-full"><label className="field-label">Specifications</label><input className="field-input" placeholder="e.g. Intel i5-13th Gen, 16GB RAM, 512GB SSD" value={newItem.specs} onChange={e=>setNewItem(p=>({...p,specs:e.target.value}))}/></div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-primary" onClick={handleAddItem}>Add to Catalog</button>
              <button className="btn btn-ghost" onClick={()=>setShowAddItem(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Request Modal */}
      {showConfirm && (
        <div className="overlay" onClick={()=>setShowConfirm(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{ maxWidth:460 }}>
            <div className="modal-head"><h2 className="modal-title">Confirm Purchase Request</h2><button className="modal-close" onClick={()=>setShowConfirm(false)}>&times;</button></div>
            <div className="modal-body">
              <div style={{ marginBottom:16 }}>
                {cart.map(item=>(
                  <div key={item.id} style={{ display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #f1f5f9',fontSize:13 }}>
                    <span style={{ fontWeight:600,color:'#334155' }}>{item.name} ×{item.qty}</span>
                    <span style={{ fontFamily:'JetBrains Mono,monospace',color:'#475569' }}>{fmt(item.price*item.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="amount-block">
                <span className="amount-label">Total Request Amount</span>
                <span className="amount-val">{fmt(cartTotal)}</span>
              </div>
              <div style={{ marginTop:12,display:'flex',gap:8 }}>
                {cartCapex>0&&<span className="badge-capex">CapEx: {fmt(cartCapex)}</span>}
                {cartOpex>0&&<span className="badge-opex">OpEx: {fmt(cartOpex)}</span>}
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-primary" onClick={handleSubmitRequest}>Confirm &amp; Submit</button>
              <button className="btn btn-ghost" onClick={()=>setShowConfirm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
