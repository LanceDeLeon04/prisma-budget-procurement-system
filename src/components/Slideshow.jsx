import { useState, useEffect } from 'react'
const SLIDES = [
  { headline:'IT Procurement Intelligence', sub:'Track every peso across OpEx and CapEx — one unified platform for your entire IT department.', accent:'#06b6d4', grad:'linear-gradient(135deg,#0f172a 0%,#0c4a6e 50%,#164e63 100%)', tag:'Budget Intelligence' },
  { headline:'Real-Time Spend Visibility', sub:'Live dashboards give your team instant visibility into software licenses, hardware, and cloud services.', accent:'#3b82f6', grad:'linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#1e40af 100%)', tag:'Live Analytics' },
  { headline:'Streamlined IT Approvals', sub:'Multi-level approval workflows keep IT procurement moving fast without losing accountability.', accent:'#8b5cf6', grad:'linear-gradient(135deg,#0f172a 0%,#2e1065 50%,#4c1d95 100%)', tag:'Workflow Engine' },
  { headline:'Role-Based Access Control', sub:'Admin, IT Staff, and Regular Staff each see exactly what they need — no more, no less.', accent:'#10b981', grad:'linear-gradient(135deg,#0f172a 0%,#064e3b 50%,#065f46 100%)', tag:'Access Control' },
]
export default function Slideshow() {
  const [cur, setCur] = useState(0)
  const [fading, setFading] = useState(false)
  useEffect(() => {
    const t = setInterval(() => {
      setFading(true)
      setTimeout(() => { setCur(p => (p + 1) % SLIDES.length); setFading(false) }, 380)
    }, 4200)
    return () => clearInterval(t)
  }, [])
  const s = SLIDES[cur]
  return (
    <div className="slideshow-panel" style={{ background: s.grad }}>
      <div className="slide-orb slide-orb-1" style={{ background: s.accent }} />
      <div className="slide-orb slide-orb-2" style={{ background: s.accent }} />
      <div className="slide-grid-overlay" />
      <div className="slide-brand">
        <div className="slide-logo">
          <div className="slide-logo-mark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5"/><line x1="12" y1="2" x2="12" y2="22"/><polyline points="2,8.5 12,14 22,8.5"/></svg>
          </div>
          <span className="slide-logo-text">PRISMA</span>
        </div>
        <span className="slide-logo-tagline">Procurement &amp; Resource Integrated Spending Management</span>
      </div>
      <div className={`slide-content ${fading ? 'slide-fade-out' : 'slide-fade-in'}`}>
        <span className="slide-tag" style={{ color: s.accent, borderColor: s.accent }}>{s.tag}</span>
        <h2 className="slide-headline">{s.headline}</h2>
        <p className="slide-subtext">{s.sub}</p>
        <div className="slide-features">
          {['IT-Focused','OpEx & CapEx','Role-Based','Audit-Ready'].map(f => (
            <span key={f} className="slide-pill" style={{ borderColor:`${s.accent}55`, color: s.accent }}>{f}</span>
          ))}
        </div>
      </div>
      <div className="slide-dots">
        {SLIDES.map((_, i) => (
          <button key={i} className={`slide-dot${i === cur ? ' slide-dot-active' : ''}`}
            style={i === cur ? { background: s.accent, width: 28 } : {}} onClick={() => setCur(i)} />
        ))}
      </div>
      <div className="slide-stats">
        {[{ label:'IT Items', value:'200+' }, { label:'Transactions/mo', value:'500+' }, { label:'Uptime', value:'99.9%' }].map(st => (
          <div key={st.label} className="slide-stat">
            <span className="slide-stat-value" style={{ color: s.accent }}>{st.value}</span>
            <span className="slide-stat-label">{st.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
