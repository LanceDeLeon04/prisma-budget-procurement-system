/**
 * PRISMA – Shop / Procurement Module
 * ====================================
 * Industry-standard IT Procurement flow:
 *   Staff   → Browse Catalog → Add to Cart → Submit Purchase Request (PR)
 *   IT Staff → Review PR → Approve/Reject → Convert to Purchase Order (PO)
 *   Admin   → Full oversight: all PRs, POs, budget impact, vendor management
 *
 * Real-time sync: uses a shared event bus (shopStore) so all role views
 * update instantly when any state change occurs (PR submitted, approved,
 * rejected, PO created). No page refresh needed.
 *
 * Data flow (ITIL-aligned):
 *   Purchase Request (PR) – raised by staff / IT staff
 *     ↓  IT Staff / Admin approval
 *   Purchase Order (PO) – issued to vendor
 *     ↓  Receiving / confirmation
 *   Expense logged → Budget decremented (real-time)
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import PageLayout from '../components/PageLayout'
import { shopAPI, requestsAPI, budgetAPI, expenseAPI } from '../services/api'
import { useRole } from '../hooks/useRole'

// ─── Formatters ──────────────────────────────────────────────────────────────
const fmt  = n => '₱' + Number(n ?? 0).toLocaleString()
const fmtK = n => n >= 1_000_000 ? '₱' + (n / 1_000_000).toFixed(2) + 'M' : '₱' + Number(n ?? 0).toLocaleString()
const today = () => new Date().toISOString().slice(0, 10)

// ─── Shared In-Memory Store (real-time event bus) ────────────────────────────
// All role-views subscribe to this store; any mutation triggers re-renders
// across every mounted instance of Shop — simulating WebSocket/SSE push.
const shopStore = (() => {
  let _cart        = []                // Current user's cart
  let _requests    = []                // All PRs
  let _pos         = []                // All POs
  let _catalog     = []                // Product catalog (loaded once)
  let _budgetSnap  = null              // Latest budget snapshot
  let _listeners   = new Set()

  const notify = () => _listeners.forEach(fn => fn())

  return {
    // Subscribe / unsubscribe
    subscribe:   fn => { _listeners.add(fn);    return () => _listeners.delete(fn) },

    // Getters
    getCart:     ()  => _cart,
    getRequests: ()  => _requests,
    getPOs:      ()  => _pos,
    getCatalog:  ()  => _catalog,
    getBudget:   ()  => _budgetSnap,

    // Cart mutations
    addToCart: (product, qty = 1) => {
      const existing = _cart.find(i => i.productId === product.id)
      if (existing) {
        existing.qty = Math.min(existing.qty + qty, product.stock)
      } else {
        _cart = [..._cart, { productId: product.id, name: product.name, sku: product.sku,
          unitPrice: product.price, qty, stock: product.stock, category: product.category,
          subcategory: product.subcategory, vendor: product.vendor, lineItem: product.lineItem,
          specs: product.specs }]
      }
      notify()
    },
    updateCartQty: (productId, qty) => {
      if (qty <= 0) {
        _cart = _cart.filter(i => i.productId !== productId)
      } else {
        _cart = _cart.map(i => i.productId === productId ? { ...i, qty } : i)
      }
      notify()
    },
    removeFromCart: productId => {
      _cart = _cart.filter(i => i.productId !== productId)
      notify()
    },
    clearCart: () => { _cart = []; notify() },

    // Request mutations
    loadRequests: async () => {
      const existing = await requestsAPI.getAll()
      _requests = existing
      notify()
    },
    submitRequest: (req) => {
      _requests = [req, ..._requests]
      notify()
    },
    updateRequest: (id, patch) => {
      _requests = _requests.map(r => r.id === id ? { ...r, ...patch } : r)
      notify()
    },

    // PO mutations
    createPO: (po) => {
      _pos = [po, ..._pos]
      notify()
    },
    updatePO: (id, patch) => {
      _pos = _pos.map(p => p.id === id ? { ...p, ...patch } : p)
      notify()
    },

    // Catalog / budget
    setCatalog: c => { _catalog = c; notify() },
    setBudget:  b => { _budgetSnap = b; notify() },
  }
})()

// ─── Category config ─────────────────────────────────────────────────────────
const CAT = {
  hardware:        { label: 'Hardware',         color: '#3b82f6', bg: 'rgba(59,130,246,.1)',  border: 'rgba(59,130,246,.25)'  },
  softwareLicense: { label: 'Software License', color: '#8b5cf6', bg: 'rgba(139,92,246,.1)',  border: 'rgba(139,92,246,.25)'  },
  service:         { label: 'Service',          color: '#06b6d4', bg: 'rgba(6,182,212,.1)',   border: 'rgba(6,182,212,.25)'   },
}
const STATUS = {
  pending:    { label: 'Pending Review', color: '#f59e0b', bg: 'rgba(245,158,11,.1)' },
  for_review: { label: 'For Review',     color: '#3b82f6', bg: 'rgba(59,130,246,.1)' },
  approved:   { label: 'Approved',       color: '#10b981', bg: 'rgba(16,185,129,.1)' },
  rejected:   { label: 'Rejected',       color: '#ef4444', bg: 'rgba(239,68,68,.1)'  },
  po_issued:  { label: 'PO Issued',      color: '#8b5cf6', bg: 'rgba(139,92,246,.1)' },
  received:   { label: 'Received',       color: '#06b6d4', bg: 'rgba(6,182,212,.1)'  },
}
const PO_STATUS = {
  draft:    { label: 'Draft',    color: '#94a3b8', bg: 'rgba(148,163,184,.1)' },
  issued:   { label: 'Issued',   color: '#3b82f6', bg: 'rgba(59,130,246,.1)' },
  received: { label: 'Received', color: '#10b981', bg: 'rgba(16,185,129,.1)' },
  partial:  { label: 'Partial',  color: '#f59e0b', bg: 'rgba(245,158,11,.1)' },
  cancelled:{ label: 'Cancelled',color: '#ef4444', bg: 'rgba(239,68,68,.1)'  },
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d={d}/>
  </svg>
)
const Icons = {
  Cart:      () => <Icon d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z M3 6h18 M16 10a4 4 0 01-8 0"/>,
  Plus:      () => <Icon d="M12 5v14 M5 12h14" strokeWidth={2.5}/>,
  Minus:     () => <Icon d="M5 12h14" strokeWidth={2.5}/>,
  Trash:     () => <Icon d="M3 6h18 M8 6V4h8v2 M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/>,
  Check:     () => <Icon d="M20 6L9 17l-5-5" strokeWidth={2.5}/>,
  X:         () => <Icon d="M18 6L6 18 M6 6l12 12" strokeWidth={2.5}/>,
  Search:    () => <Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>,
  Filter:    () => <Icon d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>,
  Package:   () => <Icon d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>,
  Vendor:    () => <Icon d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75"/>,
  Alert:     () => <Icon d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01"/>,
  FileText:  () => <Icon d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8"/>,
  PO:        () => <Icon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2 M9 14l2 2 4-4"/>,
  Budget:    () => <Icon d="M12 1v22 M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>,
  Eye:       () => <Icon d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z"/>,
  Star:      () => <svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
}

// ─── Pill badge ───────────────────────────────────────────────────────────────
const Pill = ({ label, color, bg }) => (
  <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 9px', borderRadius: 6,
    fontFamily: 'JetBrains Mono,monospace', color, background: bg, whiteSpace: 'nowrap' }}>
    {label}
  </span>
)

// ─── Skeleton loader ──────────────────────────────────────────────────────────
const Skel = ({ h = 140, r = 16 }) => (
  <div style={{ height: h, borderRadius: r, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
    backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }}/>
)

// ─── Toast ────────────────────────────────────────────────────────────────────
let _toastTimer
const Toast = ({ msg, type = 'success', onDone }) => {
  useEffect(() => {
    clearTimeout(_toastTimer)
    _toastTimer = setTimeout(onDone, 3200)
    return () => clearTimeout(_toastTimer)
  }, [msg])
  const bg = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'
  return (
    <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
      background: bg, color: '#fff', padding: '13px 20px', borderRadius: 12,
      fontWeight: 700, fontSize: 13.5, boxShadow: '0 8px 32px rgba(0,0,0,.22)',
      display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Outfit,sans-serif',
      animation: 'slideUp .3s ease' }}>
      {type === 'success' ? <Icons.Check/> : type === 'error' ? <Icons.X/> : <Icons.Alert/>}
      {msg}
    </div>
  )
}

// ─── Budget guard banner ──────────────────────────────────────────────────────
const BudgetBanner = ({ cartTotal, budget }) => {
  if (!budget || cartTotal === 0) return null
  const cats = budget.categories ?? {}
  const warnings = []
  // Check if any category would be impacted — real apps would check per-lineItem
  const totalRemaining = budget.totalRemaining ?? 0
  if (cartTotal > totalRemaining) {
    warnings.push(`Cart total ${fmt(cartTotal)} exceeds remaining IT budget ${fmt(totalRemaining)}`)
  } else if (cartTotal > totalRemaining * 0.5) {
    warnings.push(`Cart uses ${Math.round(cartTotal / totalRemaining * 100)}% of remaining budget`)
  }
  if (!warnings.length) return null
  return (
    <div style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.3)',
      borderRadius: 12, padding: '11px 16px', display: 'flex', gap: 10, alignItems: 'flex-start',
      marginBottom: 16 }}>
      <span style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }}><Icons.Alert/></span>
      <div>
        {warnings.map((w, i) => (
          <div key={i} style={{ fontSize: 12.5, color: '#92400e', fontWeight: 600 }}>{w}</div>
        ))}
      </div>
    </div>
  )
}

// ─── Product Card ─────────────────────────────────────────────────────────────
const ProductCard = ({ product, onAddToCart, cartQty, role }) => {
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const cat = CAT[product.category] ?? CAT.hardware
  const outOfStock = product.stock === 0
  const inCart = cartQty > 0

  const handleAdd = () => {
    if (outOfStock) return
    onAddToCart(product, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <div style={{ background: '#fff', border: `1.5px solid ${inCart ? cat.color : 'var(--n100,#e2e8f0)'}`,
      borderRadius: 18, padding: '20px 20px 16px', position: 'relative', overflow: 'hidden',
      boxShadow: inCart ? `0 4px 20px ${cat.color}28` : '0 2px 10px rgba(0,0,0,.06)',
      transition: 'all .2s', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Top stripe */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: cat.color, opacity: .75 }}/>

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9.5, fontWeight: 800, color: cat.color, textTransform: 'uppercase',
            letterSpacing: '.06em', fontFamily: 'JetBrains Mono,monospace', marginBottom: 4 }}>
            {product.subcategory}
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', lineHeight: 1.35 }}>
            {product.name}
          </div>
        </div>
        <Pill label={cat.label} color={cat.color} bg={cat.bg}/>
      </div>

      {/* SKU & Vendor */}
      <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'JetBrains Mono,monospace' }}>
        {product.sku} · {product.vendor}
      </div>

      {/* Specs */}
      <div style={{ fontSize: 11.5, color: '#64748b', background: '#f8fafc', borderRadius: 8,
        padding: '7px 10px', lineHeight: 1.5 }}>
        {product.specs}
      </div>

      {/* Price & stock */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'Outfit,sans-serif', fontSize: 22, fontWeight: 900, color: cat.color }}>
          {fmt(product.price)}
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400, marginLeft: 4 }}>
            /{product.unit}
          </span>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'JetBrains Mono,monospace',
          color: outOfStock ? '#ef4444' : product.stock <= 3 ? '#f59e0b' : '#10b981' }}>
          {outOfStock ? '✕ Out of stock' : product.stock <= 3 ? `⚠ ${product.stock} left` : `✓ ${product.stock} in stock`}
        </div>
      </div>

      {/* Qty + Add */}
      {(role === 'regular_staff' || role === 'it_staff' || role === 'admin') && !outOfStock && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e2e8f0',
            borderRadius: 9, overflow: 'hidden', flexShrink: 0 }}>
            <button onClick={() => setQty(q => Math.max(1, q - 1))}
              style={{ width: 32, height: 32, background: 'none', border: 'none', cursor: 'pointer',
                color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icons.Minus/>
            </button>
            <span style={{ width: 32, textAlign: 'center', fontSize: 13, fontWeight: 700,
              fontFamily: 'JetBrains Mono,monospace' }}>{qty}</span>
            <button onClick={() => setQty(q => Math.min(product.stock, q + 1))}
              style={{ width: 32, height: 32, background: 'none', border: 'none', cursor: 'pointer',
                color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icons.Plus/>
            </button>
          </div>
          <button onClick={handleAdd}
            style={{ flex: 1, height: 36, borderRadius: 9, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 12.5, fontFamily: 'Outfit,sans-serif',
              background: added ? '#10b981' : cat.color, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all .2s' }}>
            {added ? <><Icons.Check/> Added!</> : <><Icons.Cart/> Add to Cart</>}
          </button>
        </div>
      )}

      {/* In-cart badge */}
      {inCart && (
        <div style={{ fontSize: 11, color: cat.color, fontWeight: 700,
          fontFamily: 'JetBrains Mono,monospace', textAlign: 'center' }}>
          ↳ {cartQty} in cart · {fmt(cartQty * product.price)}
        </div>
      )}
    </div>
  )
}

// ─── Cart Panel ───────────────────────────────────────────────────────────────
const CartPanel = ({ cart, catalog, budget, onSubmit, onClose, userName }) => {
  const [title, setTitle]   = useState('')
  const [note, setNote]     = useState('')
  const [priority, setPri]  = useState('medium')
  const [submitting, setSub] = useState(false)

  const total = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0)
  const canSubmit = cart.length > 0 && title.trim()

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSub(true)
    await onSubmit({ title, note, priority, total })
    setSub(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 900,
      display: 'flex', justifyContent: 'flex-end' }} onClick={onClose}>
      <div style={{ width: 480, background: '#fff', height: '100%', overflowY: 'auto',
        padding: 28, display: 'flex', flexDirection: 'column', gap: 20,
        boxShadow: '-8px 0 40px rgba(0,0,0,.15)' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'Outfit,sans-serif', fontSize: 22, fontWeight: 900, color: '#1e293b' }}>
              Purchase Request
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'JetBrains Mono,monospace' }}>
              {cart.length} item{cart.length !== 1 ? 's' : ''} · {fmt(total)}
            </div>
          </div>
          <button onClick={onClose}
            style={{ width: 36, height: 36, borderRadius: 10, border: '1.5px solid #e2e8f0',
              background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#64748b' }}>
            <Icons.X/>
          </button>
        </div>

        <BudgetBanner cartTotal={total} budget={budget}/>

        {/* Cart items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cart.map(item => {
            const cat = CAT[item.category] ?? CAT.hardware
            return (
              <div key={item.productId}
                style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12,
                  padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 3 }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'JetBrains Mono,monospace' }}>
                    {item.sku} · {item.vendor}
                  </div>
                  <div style={{ fontSize: 11.5, color: cat.color, fontWeight: 700, marginTop: 4 }}>
                    {fmt(item.unitPrice)} × {item.qty} = {fmt(item.unitPrice * item.qty)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => shopStore.updateCartQty(item.productId, item.qty - 1)}
                    style={{ width: 26, height: 26, borderRadius: 6, border: '1.5px solid #e2e8f0',
                      background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: '#64748b' }}>
                    <Icons.Minus/>
                  </button>
                  <span style={{ minWidth: 20, textAlign: 'center', fontSize: 13, fontWeight: 700,
                    fontFamily: 'JetBrains Mono,monospace' }}>{item.qty}</span>
                  <button onClick={() => shopStore.updateCartQty(item.productId, item.qty + 1)}
                    style={{ width: 26, height: 26, borderRadius: 6, border: '1.5px solid #e2e8f0',
                      background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: '#64748b' }}>
                    <Icons.Plus/>
                  </button>
                  <button onClick={() => shopStore.removeFromCart(item.productId)}
                    style={{ width: 26, height: 26, borderRadius: 6, border: '1.5px solid rgba(239,68,68,.2)',
                      background: 'rgba(239,68,68,.05)', cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                    <Icons.Trash/>
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* PR Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '20px',
          background: '#f8fafc', borderRadius: 14, border: '1.5px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#334155', textTransform: 'uppercase',
            letterSpacing: '.06em', fontFamily: 'JetBrains Mono,monospace' }}>
            Request Details
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 5 }}>
              Request Title *
            </label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. New Laptops for Q3 Hires"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e2e8f0',
                fontSize: 13, fontFamily: 'Outfit,sans-serif', outline: 'none', boxSizing: 'border-box',
                background: '#fff' }}/>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 5 }}>
              Priority
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['low', 'medium', 'high'].map(p => (
                <button key={p} onClick={() => setPri(p)}
                  style={{ flex: 1, padding: '8px 4px', borderRadius: 9, border: '1.5px solid',
                    borderColor: priority === p
                      ? (p === 'high' ? '#ef4444' : p === 'medium' ? '#f59e0b' : '#10b981')
                      : '#e2e8f0',
                    background: priority === p
                      ? (p === 'high' ? 'rgba(239,68,68,.08)' : p === 'medium' ? 'rgba(245,158,11,.08)' : 'rgba(16,185,129,.08)')
                      : '#fff',
                    color: priority === p
                      ? (p === 'high' ? '#ef4444' : p === 'medium' ? '#f59e0b' : '#10b981')
                      : '#94a3b8',
                    cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    fontFamily: 'JetBrains Mono,monospace', textTransform: 'capitalize' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 5 }}>
              Justification / Notes
            </label>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="Why is this needed? Any urgency or context?"
              rows={3}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #e2e8f0',
                fontSize: 12.5, fontFamily: 'Outfit,sans-serif', outline: 'none', resize: 'vertical',
                boxSizing: 'border-box', background: '#fff' }}/>
          </div>
        </div>

        {/* Total + Submit */}
        <div style={{ borderTop: '1.5px solid #e2e8f0', paddingTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontWeight: 700, color: '#64748b' }}>Request Total</span>
            <span style={{ fontFamily: 'Outfit,sans-serif', fontSize: 22, fontWeight: 900, color: '#1e293b' }}>
              {fmt(total)}
            </span>
          </div>
          <button onClick={handleSubmit} disabled={!canSubmit || submitting}
            style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none',
              background: canSubmit ? 'linear-gradient(135deg,#3b82f6,#06b6d4)' : '#e2e8f0',
              color: canSubmit ? '#fff' : '#94a3b8', cursor: canSubmit ? 'pointer' : 'not-allowed',
              fontWeight: 800, fontSize: 15, fontFamily: 'Outfit,sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {submitting ? 'Submitting…' : <><Icons.FileText/> Submit Purchase Request</>}
          </button>
          {!title.trim() && cart.length > 0 && (
            <div style={{ fontSize: 11, color: '#f59e0b', textAlign: 'center', marginTop: 8,
              fontFamily: 'JetBrains Mono,monospace' }}>
              * Request title is required
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Request Row (IT Staff / Admin approval view) ─────────────────────────────
const RequestRow = ({ req, onApprove, onReject, onIssuePO, isAdmin, isITStaff }) => {
  const [expanded, setExpanded] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading]   = useState(false)
  const s  = STATUS[req.status] ?? STATUS.pending
  const catKey = req.items?.[0]?.category ?? req.category ?? 'hardware'
  const cat = CAT[catKey] ?? CAT.hardware

  const doApprove = async () => {
    setLoading(true)
    await onApprove(req.id)
    setLoading(false)
  }
  const doReject = async () => {
    setLoading(true)
    await onReject(req.id, feedback)
    setLoading(false)
  }

  return (
    <div style={{ border: '1.5px solid', borderColor: expanded ? cat.color : '#e2e8f0',
      borderRadius: 14, overflow: 'hidden', transition: 'all .2s',
      boxShadow: expanded ? `0 4px 20px ${cat.color}18` : '0 1px 4px rgba(0,0,0,.05)' }}>
      {/* Summary row */}
      <div onClick={() => setExpanded(e => !e)}
        style={{ padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'center',
          cursor: 'pointer', background: expanded ? `${cat.color}08` : '#fff' }}>
        <div style={{ width: 6, height: 40, borderRadius: 3, background: cat.color, flexShrink: 0 }}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'JetBrains Mono,monospace' }}>{req.id}</span>
            <Pill label={s.label} color={s.color} bg={s.bg}/>
            <Pill label={req.priority?.toUpperCase() ?? 'MEDIUM'}
              color={req.priority === 'high' ? '#ef4444' : req.priority === 'low' ? '#10b981' : '#f59e0b'}
              bg={req.priority === 'high' ? 'rgba(239,68,68,.1)' : req.priority === 'low' ? 'rgba(16,185,129,.1)' : 'rgba(245,158,11,.1)'}/>
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', marginBottom: 2, whiteSpace: 'nowrap',
            overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {req.title}
          </div>
          <div style={{ fontSize: 11.5, color: '#64748b' }}>
            {req.requestedBy} · {req.department} · {req.date}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'Outfit,sans-serif', fontSize: 19, fontWeight: 900, color: cat.color }}>
            {fmt(req.total)}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'JetBrains Mono,monospace' }}>
            {req.items?.length ?? 0} line{req.items?.length !== 1 ? 's' : ''}
          </div>
        </div>
        <span style={{ color: '#94a3b8', transform: expanded ? 'rotate(90deg)' : 'none',
          transition: 'transform .2s', flexShrink: 0 }}>▶</span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: '0 18px 18px', background: '#fafbfc',
          borderTop: `1px solid ${cat.color}30` }}>
          {/* Items table */}
          <div style={{ overflowX: 'auto', marginBottom: 14, marginTop: 14 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  {['Item', 'SKU', 'Vendor', 'Qty', 'Unit Price', 'Total'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: 10.5,
                      color: '#64748b', fontWeight: 700, fontFamily: 'JetBrains Mono,monospace',
                      borderRadius: h === 'Item' ? '8px 0 0 8px' : h === 'Total' ? '0 8px 8px 0' : '' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(req.items ?? []).map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1e293b' }}>{item.name}</td>
                    <td style={{ padding: '8px 10px', fontFamily: 'JetBrains Mono,monospace', color: '#94a3b8', fontSize: 11 }}>{item.sku}</td>
                    <td style={{ padding: '8px 10px', color: '#64748b' }}>{item.vendor ?? '—'}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 700, fontFamily: 'JetBrains Mono,monospace' }}>{item.qty}</td>
                    <td style={{ padding: '8px 10px', color: cat.color, fontWeight: 700 }}>{fmt(item.unitPrice)}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 800 }}>{fmt(item.unitPrice * item.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Notes */}
          {req.note && (
            <div style={{ fontSize: 12.5, color: '#64748b', background: '#f1f5f9', borderRadius: 8,
              padding: '9px 12px', marginBottom: 12 }}>
              <strong>Note:</strong> {req.note}
            </div>
          )}
          {req.feedback && (
            <div style={{ fontSize: 12.5, color: req.status === 'rejected' ? '#ef4444' : '#10b981',
              background: req.status === 'rejected' ? 'rgba(239,68,68,.06)' : 'rgba(16,185,129,.06)',
              border: `1px solid ${req.status === 'rejected' ? 'rgba(239,68,68,.15)' : 'rgba(16,185,129,.15)'}`,
              borderRadius: 8, padding: '9px 12px', marginBottom: 12 }}>
              <strong>Feedback:</strong> {req.feedback}
            </div>
          )}

          {/* Actions for IT Staff / Admin */}
          {(isAdmin || isITStaff) && (req.status === 'pending' || req.status === 'for_review') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <textarea value={feedback} onChange={e => setFeedback(e.target.value)}
                placeholder="Optional feedback for requestor…"
                rows={2}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 9,
                  border: '1.5px solid #e2e8f0', fontSize: 12.5, resize: 'vertical',
                  fontFamily: 'Outfit,sans-serif', outline: 'none', boxSizing: 'border-box' }}/>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={doApprove} disabled={loading}
                  style={{ flex: 1, padding: '10px', borderRadius: 9, border: 'none',
                    background: '#10b981', color: '#fff', fontWeight: 700, cursor: 'pointer',
                    fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Icons.Check/> Approve Request
                </button>
                <button onClick={doReject} disabled={loading}
                  style={{ flex: 1, padding: '10px', borderRadius: 9, border: 'none',
                    background: '#ef4444', color: '#fff', fontWeight: 700, cursor: 'pointer',
                    fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Icons.X/> Reject
                </button>
              </div>
            </div>
          )}

          {/* Issue PO button — admin / IT staff, only when approved */}
          {(isAdmin || isITStaff) && req.status === 'approved' && (
            <button onClick={() => onIssuePO(req)}
              style={{ width: '100%', padding: '10px', borderRadius: 9, border: 'none',
                background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', color: '#fff',
                fontWeight: 700, cursor: 'pointer', fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Icons.PO/> Issue Purchase Order (PO)
            </button>
          )}

          {req.status === 'po_issued' && (
            <div style={{ fontSize: 12, color: '#8b5cf6', fontFamily: 'JetBrains Mono,monospace',
              fontWeight: 700, textAlign: 'center' }}>
              ✓ Purchase Order issued — awaiting vendor delivery
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── PO Card ──────────────────────────────────────────────────────────────────
const POCard = ({ po, onMarkReceived }) => {
  const s = PO_STATUS[po.status] ?? PO_STATUS.issued
  const cat = CAT[po.category] ?? CAT.hardware

  return (
    <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14,
      padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: cat.color }}/>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 10.5, color: '#94a3b8', fontFamily: 'JetBrains Mono,monospace', marginBottom: 4 }}>
            {po.id}
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>{po.title}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexDirection: 'column', alignItems: 'flex-end' }}>
          <Pill label={s.label} color={s.color} bg={s.bg}/>
          <div style={{ fontFamily: 'Outfit,sans-serif', fontSize: 18, fontWeight: 900, color: cat.color }}>
            {fmt(po.total)}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
        <span style={{ marginRight: 12 }}>📦 Vendor: <strong>{po.vendor}</strong></span>
        <span>📅 Issued: <strong>{po.issuedDate}</strong></span>
      </div>
      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
        {(po.items ?? []).map((item, i) => (
          <div key={i} style={{ fontSize: 12, color: '#475569', display: 'flex',
            justifyContent: 'space-between' }}>
            <span>{item.name} × {item.qty}</span>
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontWeight: 700, color: cat.color }}>
              {fmt(item.unitPrice * item.qty)}
            </span>
          </div>
        ))}
      </div>
      {po.status === 'issued' && (
        <button onClick={() => onMarkReceived(po.id)}
          style={{ width: '100%', padding: '9px', borderRadius: 9, border: 'none',
            background: '#10b981', color: '#fff', fontWeight: 700, cursor: 'pointer',
            fontSize: 12.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Icons.Check/> Mark as Received → Log Expense
        </button>
      )}
      {po.status === 'received' && (
        <div style={{ fontSize: 12, color: '#10b981', fontWeight: 700, textAlign: 'center',
          fontFamily: 'JetBrains Mono,monospace' }}>
          ✓ Received & expense logged
        </div>
      )}
    </div>
  )
}

// ─── Main Shop Component ──────────────────────────────────────────────────────
export default function Shop() {
  const { user, role, isAdmin, isITStaff, isStaff } = useRole()

  // Subscribe to store — force re-render on any store change
  const [tick, setTick] = useState(0)
  useEffect(() => shopStore.subscribe(() => setTick(t => t + 1)), [])

  // Derived from store
  const cart     = shopStore.getCart()
  const requests = shopStore.getRequests()
  const pos      = shopStore.getPOs()
  const catalog  = shopStore.getCatalog()
  const budget   = shopStore.getBudget()

  const [loading, setLoading]       = useState(true)
  const [tab, setTab]               = useState('catalog')   // catalog | requests | orders | vendors
  const [showCart, setShowCart]     = useState(false)
  const [search, setSearch]         = useState('')
  const [catFilter, setCatFilter]   = useState('all')
  const [subFilter, setSubFilter]   = useState('all')
  const [toast, setToast]           = useState(null)

  const showToast = (msg, type = 'success') => setToast({ msg, type })

  // Initial load
  useEffect(() => {
    const load = async () => {
      const [cat, req, sum] = await Promise.all([
        shopAPI.getCatalog(),
        requestsAPI.getAll(),
        budgetAPI.getSummary(),
      ])
      shopStore.setCatalog(cat)
      shopStore.loadRequests().then(() => {})  // also populates from API
      shopStore.setBudget(sum)
      setLoading(false)
    }
    load()
  }, [])

  // Filter catalog
  const subcategories = [...new Set(catalog.map(p => p.subcategory))].sort()
  const filtered = catalog.filter(p => {
    const matchCat = catFilter === 'all' || p.category === catFilter
    const matchSub = subFilter === 'all' || p.subcategory === subFilter
    const matchSearch = !search || [p.name, p.sku, p.vendor, p.subcategory, p.specs]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))
    return matchCat && matchSub && matchSearch
  })

  const cartTotal = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0)
  const cartQtyMap = Object.fromEntries(cart.map(i => [i.productId, i.qty]))

  // Generate next ID
  const nextReqId = () => `REQ-2025-${String(requests.length + 100).padStart(4, '0')}`
  const nextPOId  = () => `PO-2025-${String(pos.length + 1).padStart(4, '0')}`

  // ── Submit Purchase Request ─────────────────────────────────────────────────
  const handleSubmitPR = async ({ title, note, priority, total }) => {
    const items = cart.map(i => ({
      productId: i.productId, name: i.name, qty: i.qty, unitPrice: i.unitPrice,
      sku: i.sku, vendor: i.vendor, category: i.category,
    }))
    const category = cart[0]?.category ?? 'hardware'
    const lineItem  = cart[0]?.lineItem ?? 'LI-H01'

    const newReq = {
      id: nextReqId(),
      title,
      requestedBy: user?.name ?? 'Unknown',
      requestorRole: role,
      department: user?.department ?? '—',
      date: today(),
      category,
      lineItem,
      lineItemName: catalog.find(p => p.lineItem === lineItem)?.name ?? '',
      items,
      total,
      status: 'pending',
      priority,
      note,
      feedback: '',
    }

    shopStore.submitRequest(newReq)
    shopStore.clearCart()

    // Refresh budget
    const newBudget = await budgetAPI.getSummary()
    shopStore.setBudget(newBudget)

    showToast(`Purchase Request ${newReq.id} submitted successfully!`)
    setTab('requests')
  }

  // ── Approve PR ──────────────────────────────────────────────────────────────
  const handleApprove = async (id) => {
    shopStore.updateRequest(id, { status: 'approved', approvedBy: user?.name, feedback: 'Approved.' })
    // In production: call expenseAPI or create a PO draft
    const newBudget = await budgetAPI.getSummary()
    shopStore.setBudget(newBudget)
    showToast(`Request ${id} approved`)
  }

  // ── Reject PR ───────────────────────────────────────────────────────────────
  const handleReject = async (id, feedback) => {
    shopStore.updateRequest(id, { status: 'rejected', feedback: feedback || 'Rejected by approver.' })
    showToast(`Request ${id} rejected`, 'error')
  }

  // ── Issue PO ────────────────────────────────────────────────────────────────
  const handleIssuePO = async (req) => {
    const po = {
      id: nextPOId(),
      reqId: req.id,
      title: req.title,
      vendor: req.items?.[0]?.vendor ?? '—',
      category: req.category,
      items: req.items,
      total: req.total,
      status: 'issued',
      issuedBy: user?.name,
      issuedDate: today(),
    }
    shopStore.createPO(po)
    shopStore.updateRequest(req.id, { status: 'po_issued' })
    showToast(`PO ${po.id} issued to ${po.vendor}`)
    setTab('orders')
  }

  // ── Mark PO Received → log expense ─────────────────────────────────────────
  const handleReceived = async (poId) => {
    const po = pos.find(p => p.id === poId)
    if (!po) return
    shopStore.updatePO(poId, { status: 'received' })

    // Log expense for each item
    for (const item of (po.items ?? [])) {
      await expenseAPI.addExpense({
        date: today(),
        category: item.category ?? po.category,
        subcategory: item.name,
        description: `${item.name} x${item.qty} — PO: ${poId}`,
        vendor: po.vendor,
        amount: item.unitPrice * item.qty,
        lineItem: 'LI-H01',
      })
    }

    // Refresh budget to reflect new spend
    const newBudget = await budgetAPI.getSummary()
    shopStore.setBudget(newBudget)
    showToast(`PO ${poId} received — expense logged & budget updated`)
  }

  // ── My requests (staff) vs all (admin/IT) ──────────────────────────────────
  const visibleRequests = isStaff
    ? requests.filter(r => r.requestedBy === user?.name || r.requestorRole === 'regular_staff')
    : requests

  const pendingCount = requests.filter(r =>
    r.status === 'pending' || r.status === 'for_review'
  ).length

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <PageLayout
      title="IT Shop & Procurement"
      subtitle="Browse catalog, raise purchase requests, and track orders"
      badge="Shop"
    >
      <style>{`
        @keyframes shimmer { from{background-position:200% 0} to{background-position:-200% 0} }
        @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
        .shop-tab { padding:9px 18px; border-radius:9px; border:none; cursor:pointer; font-size:13px;
          font-weight:700; font-family:Outfit,sans-serif; transition:all .15s; }
        .shop-tab.active { background:#1e293b; color:#fff; }
        .shop-tab:not(.active) { background:transparent; color:#64748b; }
        .shop-tab:not(.active):hover { background:#f1f5f9; }
        .chip { padding:5px 12px; border-radius:20px; font-size:12px; font-weight:700;
          cursor:pointer; border:1.5px solid; transition:all .15s; font-family:JetBrains Mono,monospace; }
        .chip.active { background:#1e293b; color:#fff; border-color:#1e293b; }
        .chip:not(.active) { background:#fff; color:#64748b; border-color:#e2e8f0; }
        .chip:not(.active):hover { border-color:#94a3b8; }
      `}</style>

      {/* ── Budget Snapshot Bar ─────────────────────────────────────────── */}
      {budget && (isAdmin || isITStaff) && (
        <div style={{ background: 'linear-gradient(135deg,#0c1627,#0a2440)', borderRadius: 14,
          padding: '14px 22px', display: 'flex', gap: 24, marginBottom: 18,
          position: 'relative', overflow: 'hidden', boxShadow: '0 6px 24px rgba(0,0,0,.15)' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage:
            'linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px)',
            backgroundSize: '28px 28px', pointerEvents: 'none' }}/>
          {[
            { label: 'Total Budget', val: fmtK(budget.totalBudget), color: '#22d3ee' },
            { label: 'Spent', val: fmtK(budget.totalSpent), color: '#60a5fa' },
            { label: 'Available', val: fmtK(budget.totalRemaining), color: '#34d399' },
            { label: 'Pending PRs', val: pendingCount, color: '#fbbf24' },
            { label: 'Cart Value', val: fmtK(cartTotal), color: cartTotal > 0 ? '#f472b6' : '#475569' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,.38)', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'JetBrains Mono,monospace',
                marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: 'Outfit,sans-serif', fontSize: 18, fontWeight: 900, color: s.color }}>
                {s.val}
              </div>
            </div>
          ))}
          <div style={{ flex: 1.5, position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,.38)', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'JetBrains Mono,monospace',
              marginBottom: 6 }}>Budget Utilization</div>
            <div style={{ height: 7, background: 'rgba(255,255,255,.08)', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 100,
                background: 'linear-gradient(90deg,#06b6d4,#3b82f6)',
                width: `${Math.min(Math.round(budget.totalSpent / budget.totalBudget * 100), 100)}%`,
                transition: 'width 1s ease' }}/>
            </div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,.35)', fontFamily: 'JetBrains Mono,monospace', marginTop: 4 }}>
              {Math.round(budget.totalSpent / budget.totalBudget * 100)}% of {fmtK(budget.totalBudget)}
            </div>
          </div>
        </div>
      )}

      {/* ── Tabs + Cart button ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 4, background: '#f8fafc',
          borderRadius: 12, padding: 5, border: '1.5px solid #e2e8f0' }}>
          {[
            { id: 'catalog',  label: 'Catalog' },
            { id: 'requests', label: `Requests${pendingCount > 0 && (isAdmin || isITStaff) ? ` (${pendingCount})` : ''}` },
            ...(isAdmin || isITStaff ? [{ id: 'orders', label: `Orders${pos.length > 0 ? ` (${pos.length})` : ''}` }] : []),
            ...(isAdmin ? [{ id: 'vendors', label: 'Vendors' }] : []),
          ].map(t => (
            <button key={t.id} className={`shop-tab${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        <button onClick={() => setShowCart(true)}
          style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', borderRadius: 12, border: 'none',
            background: cart.length > 0 ? 'linear-gradient(135deg,#3b82f6,#06b6d4)' : '#f1f5f9',
            color: cart.length > 0 ? '#fff' : '#94a3b8',
            cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'Outfit,sans-serif',
            boxShadow: cart.length > 0 ? '0 4px 14px rgba(59,130,246,.3)' : 'none',
            transition: 'all .2s' }}>
          <Icons.Cart/>
          {cart.length > 0 ? `View Cart · ${fmt(cartTotal)}` : 'Cart Empty'}
          {cart.length > 0 && (
            <span style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20,
              borderRadius: '50%', background: '#ef4444', color: '#fff', fontSize: 11,
              fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(239,68,68,.5)' }}>
              {cart.reduce((s, i) => s + i.qty, 0)}
            </span>
          )}
        </button>
      </div>

      {/* ══ TAB: CATALOG ═══════════════════════════════════════════════════ */}
      {tab === 'catalog' && (
        <>
          {/* Search + filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 240px' }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                color: '#94a3b8', pointerEvents: 'none' }}><Icons.Search/></div>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search products, SKU, vendor…"
                style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 12,
                  border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: 'Outfit,sans-serif',
                  outline: 'none', boxSizing: 'border-box', background: '#fff' }}/>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['all', 'hardware', 'softwareLicense', 'service'].map(c => (
                <button key={c} className={`chip${catFilter === c ? ' active' : ''}`}
                  onClick={() => { setCatFilter(c); setSubFilter('all') }}
                  style={catFilter === c && c !== 'all' ? {
                    background: CAT[c]?.color, borderColor: 'transparent', color: '#fff' } : {}}>
                  {c === 'all' ? 'All' : c === 'softwareLicense' ? 'Software' :
                    c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Subcategory chips */}
          {catFilter !== 'all' && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              <button className={`chip${subFilter === 'all' ? ' active' : ''}`}
                onClick={() => setSubFilter('all')}>All</button>
              {subcategories
                .filter(s => catalog.filter(p => p.category === catFilter)
                  .some(p => p.subcategory === s))
                .map(s => (
                  <button key={s} className={`chip${subFilter === s ? ' active' : ''}`}
                    onClick={() => setSubFilter(s)}>{s}</button>
                ))}
            </div>
          )}

          {/* Results count */}
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14,
            fontFamily: 'JetBrains Mono,monospace' }}>
            {filtered.length} product{filtered.length !== 1 ? 's' : ''} found
            {search && ` for "${search}"`}
          </div>

          {/* Product grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))',
            gap: 16 }}>
            {loading
              ? [...Array(6)].map((_, i) => <Skel key={i} h={280}/>)
              : filtered.map(p => (
                <ProductCard key={p.id} product={p} onAddToCart={(prod, qty) => {
                  shopStore.addToCart(prod, qty)
                  showToast(`${prod.name} added to cart`)
                }} cartQty={cartQtyMap[p.id] ?? 0} role={role}/>
              ))
            }
          </div>

          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No products found</div>
              <div style={{ fontSize: 13 }}>Try a different search or filter</div>
            </div>
          )}
        </>
      )}

      {/* ══ TAB: REQUESTS ══════════════════════════════════════════════════ */}
      {tab === 'requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Summary chips */}
          {(isAdmin || isITStaff) && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              {Object.entries(STATUS).map(([k, v]) => {
                const count = requests.filter(r => r.status === k).length
                if (!count) return null
                return (
                  <div key={k} style={{ padding: '5px 12px', borderRadius: 8, background: v.bg,
                    fontSize: 12, fontWeight: 700, color: v.color,
                    fontFamily: 'JetBrains Mono,monospace' }}>
                    {v.label}: {count}
                  </div>
                )
              })}
            </div>
          )}

          {loading
            ? [...Array(4)].map((_, i) => <Skel key={i} h={72} r={14}/>)
            : visibleRequests.length === 0
              ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No purchase requests yet</div>
                  <div style={{ fontSize: 13 }}>
                    {isStaff ? 'Browse the catalog and add items to your cart to raise a request.'
                      : 'Purchase requests from staff will appear here.'}
                  </div>
                </div>
              )
              : visibleRequests.map(req => (
                <RequestRow key={req.id} req={req}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onIssuePO={handleIssuePO}
                  isAdmin={isAdmin}
                  isITStaff={isITStaff}/>
              ))
          }
        </div>
      )}

      {/* ══ TAB: PURCHASE ORDERS ═══════════════════════════════════════════ */}
      {tab === 'orders' && (isAdmin || isITStaff) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 13, color: '#64748b', fontFamily: 'JetBrains Mono,monospace',
            marginBottom: 4 }}>
            {pos.length} purchase order{pos.length !== 1 ? 's' : ''} · Click "Mark as Received" to log expense & update budget
          </div>
          {pos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No purchase orders yet</div>
              <div style={{ fontSize: 13 }}>Approve requests and issue POs from the Requests tab.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 16 }}>
              {pos.map(po => (
                <POCard key={po.id} po={po} onMarkReceived={handleReceived}/>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: VENDORS (Admin only) ═══════════════════════════════════════ */}
      {tab === 'vendors' && isAdmin && <VendorTab/>}

      {/* ── Cart Drawer ───────────────────────────────────────────────────── */}
      {showCart && (
        <CartPanel
          cart={cart}
          catalog={catalog}
          budget={budget}
          onSubmit={handleSubmitPR}
          onClose={() => setShowCart(false)}
          userName={user?.name}/>
      )}

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)}/>}
    </PageLayout>
  )
}

// ─── Vendor Tab ───────────────────────────────────────────────────────────────
function VendorTab() {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    shopAPI.getVendors().then(v => { setVendors(v); setLoading(false) })
  }, [])

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
      {[...Array(6)].map((_, i) => <Skel key={i} h={130}/>)}
    </div>
  )

  return (
    <div>
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14,
        fontFamily: 'JetBrains Mono,monospace' }}>
        {vendors.length} accredited vendors on record
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
        {vendors.map(v => (
          <div key={v.id} style={{ background: '#fff', border: `1.5px solid ${v.accredited ? 'rgba(16,185,129,.25)' : '#e2e8f0'}`,
            borderRadius: 14, padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
            {v.accredited && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#10b981' }}/>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>{v.name}</div>
              <Pill label={v.accredited ? '✓ Accredited' : 'Pending'}
                color={v.accredited ? '#10b981' : '#f59e0b'}
                bg={v.accredited ? 'rgba(16,185,129,.1)' : 'rgba(245,158,11,.1)'}/>
            </div>
            <div style={{ fontSize: 11.5, color: '#94a3b8', marginBottom: 6,
              fontFamily: 'JetBrains Mono,monospace' }}>{v.id} · {v.category}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>📞 {v.contact}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>✉ {v.email}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
