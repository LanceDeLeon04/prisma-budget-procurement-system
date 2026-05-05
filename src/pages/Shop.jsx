import { useEffect, useState } from 'react'
import PageLayout from '../components/PageLayout'
import { procurementAPI } from '../services/api'

const fmt = (n) => '₱' + Number(n).toLocaleString()
const CATEGORIES = ['All','Laptops','Monitors','Desktops','Network','Software','Security','Peripherals','Printers','Storage','Power']

export default function Shop() {
  const [catalog, setCatalog]   = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [cart, setCart]         = useState([])
  const [category, setCategory] = useState('All')
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)
  const [showCart, setShowCart] = useState(false)
  const [addedId, setAddedId]   = useState(null)
  const [activeTab, setActiveTab] = useState('catalog')
  const [showAddItem, setShowAddItem] = useState(false)
  const [newItem, setNewItem]   = useState({ name:'',category:'Laptops',price:'',stock:'',supplier:'',sku:'',image:'💻' })

  useEffect(() => {
    Promise.all([procurementAPI.getCatalog(), procurementAPI.getSuppliers()]).then(([c,s]) => {
      setCatalog(c); setSuppliers(s); setLoading(false)
    })
  }, [])

  const filtered = catalog.filter(p =>
    (category==='All' || p.category===category) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()))
  )

  const addToCart = (p) => {
    setCart(prev => {
      const ex = prev.find(i=>i.id===p.id)
      return ex ? prev.map(i=>i.id===p.id?{...i,qty:i.qty+1}:i) : [...prev,{...p,qty:1}]
    })
    setAddedId(p.id); setTimeout(()=>setAddedId(null),900)
  }
  const removeFromCart = (id) => setCart(prev=>prev.filter(i=>i.id!==id))
  const updateQty = (id,qty) => { if(qty<1) return removeFromCart(id); setCart(prev=>prev.map(i=>i.id===id?{...i,qty}:i)) }
  const cartTotal = cart.reduce((a,i)=>a+i.price*i.qty,0)
  const cartCount = cart.reduce((a,i)=>a+i.qty,0)

  const handleAddItem = () => {
    if (!newItem.name || !newItem.price) return
    const id = `P${String(catalog.length+1).padStart(3,'0')}`
    setCatalog(prev => [...prev, { id, ...newItem, price: Number(newItem.price), stock: Number(newItem.stock)||0, rating: 4.5, unit:'unit' }])
    setNewItem({ name:'',category:'Laptops',price:'',stock:'',supplier:'',sku:'',image:'💻' })
    setShowAddItem(false)
  }

  return (
    <PageLayout
      title="Procurement Shop"
      subtitle="Browse and purchase IT items from the approved catalog"
      badge="🛒 Procurement"
      actions={
        <div style={{display:'flex',gap:10}}>
          <button className="btn-ghost" onClick={()=>setShowAddItem(true)}>+ Add Item</button>
          <button className="btn-cart" onClick={()=>setShowCart(!showCart)}>
            🛒 Cart {cartCount>0 && <span className="cart-count">{cartCount}</span>}
          </button>
        </div>
      }
    >
      {/* Tabs */}
      <div className="page-tabs">
        <button className={`page-tab ${activeTab==='catalog'?'page-tab-active':''}`} onClick={()=>setActiveTab('catalog')}>🛍 Catalog</button>
        <button className={`page-tab ${activeTab==='suppliers'?'page-tab-active':''}`} onClick={()=>setActiveTab('suppliers')}>🏭 Suppliers</button>
      </div>

      {activeTab==='catalog' && (
        <>
          {/* Category filter */}
          <div className="shop-filter-bar">
            <div className="category-chips">
              {CATEGORIES.map(c => (
                <button key={c} className={`cat-chip ${category===c?'cat-chip-active':''}`} onClick={()=>setCategory(c)}>{c}</button>
              ))}
            </div>
            <input className="page-search" placeholder="Search products…" value={search} onChange={e=>setSearch(e.target.value)} />
          </div>

          <div className="shop-layout">
            <div className="product-grid">
              {loading
                ? [...Array(8)].map((_,i)=><ProductSkeleton key={i}/>)
                : filtered.length===0
                  ? <div className="empty-state"><div className="empty-icon">📦</div><p>No products found</p></div>
                  : filtered.map(p => (
                    <div key={p.id} className={`product-card ${addedId===p.id?'product-added':''}`}>
                      <div className="product-img">{p.image}</div>
                      <div className="product-cat">{p.category}</div>
                      <div className="product-name">{p.name}</div>
                      <div className="product-sku">SKU: {p.sku}</div>
                      <div className="product-supplier">📦 {p.supplier}</div>
                      <div className="product-bottom">
                        <div>
                          <div className="product-price">{fmt(p.price)}<span className="product-unit"> / {p.unit}</span></div>
                          <div className="product-stock" style={{color:p.stock<5?'#ef4444':'#10b981'}}>
                            {p.stock<5?`⚠ Only ${p.stock} left`:`✓ ${p.stock} in stock`}
                          </div>
                        </div>
                        <button className={`btn-add-cart ${addedId===p.id?'btn-added':''}`} onClick={()=>addToCart(p)}>
                          {addedId===p.id?'✓':'+'}
                        </button>
                      </div>
                      <div className="product-rating">{'★'.repeat(Math.floor(p.rating))} <span>{p.rating}</span></div>
                    </div>
                  ))
              }
            </div>

            {showCart && (
              <div className="cart-panel">
                <div className="cart-header">
                  <h3 className="cart-title">🛒 Cart ({cartCount})</h3>
                  <button className="cart-close" onClick={()=>setShowCart(false)}>✕</button>
                </div>
                {cart.length===0
                  ? <div className="cart-empty">Your cart is empty</div>
                  : <>
                      <div className="cart-items">
                        {cart.map(item=>(
                          <div key={item.id} className="cart-item">
                            <div className="cart-item-icon">{item.image}</div>
                            <div className="cart-item-info">
                              <div className="cart-item-name">{item.name}</div>
                              <div className="cart-item-price">{fmt(item.price)} each</div>
                            </div>
                            <div className="cart-qty-wrap">
                              <button className="qty-btn" onClick={()=>updateQty(item.id,item.qty-1)}>−</button>
                              <span className="qty-val">{item.qty}</span>
                              <button className="qty-btn" onClick={()=>updateQty(item.id,item.qty+1)}>+</button>
                            </div>
                            <button className="cart-remove" onClick={()=>removeFromCart(item.id)}>🗑</button>
                          </div>
                        ))}
                      </div>
                      <div className="cart-footer">
                        <div className="cart-total-row">
                          <span>Estimated Total</span>
                          <span className="cart-total-val">{fmt(cartTotal)}</span>
                        </div>
                        <button className="btn-primary" style={{width:'100%',marginTop:14,justifyContent:'center'}}
                          onClick={()=>{ alert('Purchase request submitted for approval!'); setCart([]); setShowCart(false) }}>
                          Submit Purchase Request
                        </button>
                        <p className="cart-note">Request will be routed for IT Staff approval</p>
                      </div>
                    </>
                }
              </div>
            )}
          </div>
        </>
      )}

      {activeTab==='suppliers' && (
        <div className="table-card">
          <table className="data-table">
            <thead><tr><th>Supplier ID</th><th>Name</th><th>Category</th><th>Contact</th><th>Email</th><th>Accredited</th></tr></thead>
            <tbody>
              {suppliers.map(s=>(
                <tr key={s.id} className="table-row">
                  <td><span className="mono-tag">{s.id}</span></td>
                  <td><strong>{s.name}</strong></td>
                  <td><span className="cat-badge">{s.category}</span></td>
                  <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'#64748b'}}>{s.contact}</td>
                  <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'#64748b'}}>{s.email}</td>
                  <td><span style={{padding:'3px 10px',borderRadius:6,fontSize:11.5,fontWeight:700,fontFamily:'JetBrains Mono,monospace',
                    background:s.accredited?'rgba(16,185,129,.1)':'rgba(245,158,11,.1)',
                    color:s.accredited?'#10b981':'#f59e0b'}}>
                    {s.accredited?'✓ Accredited':'⏳ Pending'}
                  </span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="modal-overlay" onClick={()=>setShowAddItem(false)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Catalog Item</h2>
              <button className="modal-close" onClick={()=>setShowAddItem(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                {[
                  {label:'Item Name',    key:'name',     type:'text',   placeholder:'e.g. Dell Latitude 5540'},
                  {label:'SKU',          key:'sku',      type:'text',   placeholder:'e.g. DL-LAT-5540'},
                  {label:'Price (₱)',    key:'price',    type:'number', placeholder:'0'},
                  {label:'Stock',        key:'stock',    type:'number', placeholder:'0'},
                  {label:'Supplier',     key:'supplier', type:'text',   placeholder:'e.g. Dell Philippines'},
                  {label:'Emoji Icon',   key:'image',    type:'text',   placeholder:'💻'},
                ].map(f=>(
                  <div key={f.key} className="form-field">
                    <label className="login-label">{f.label}</label>
                    <input className="login-input" type={f.type} placeholder={f.placeholder}
                      value={newItem[f.key]} onChange={e=>setNewItem(p=>({...p,[f.key]:e.target.value}))}
                      style={{padding:'12px 16px'}}/>
                  </div>
                ))}
                <div className="form-field">
                  <label className="login-label">Category</label>
                  <select className="login-input" value={newItem.category} onChange={e=>setNewItem(p=>({...p,category:e.target.value}))} style={{padding:'12px 16px'}}>
                    {['Laptops','Monitors','Desktops','Network','Software','Security','Peripherals','Printers','Storage','Power'].map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={handleAddItem}>Add to Catalog</button>
              <button className="btn-ghost" onClick={()=>setShowAddItem(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
function ProductSkeleton() {
  return (
    <div className="product-card">
      <div className="skeleton-line" style={{height:80,borderRadius:12,marginBottom:12}}/>
      <div className="skeleton-line skeleton-line-sm" style={{marginBottom:8}}/>
      <div className="skeleton-line" style={{height:16,width:'80%',marginBottom:8}}/>
      <div className="skeleton-line skeleton-line-sm" style={{width:'60%'}}/>
    </div>
  )
}
