import { useState, useEffect } from 'react'

const slides = [
  {
    id: 1,
    headline: 'IT Procurement Made Intelligent',
    subtext: 'Track every peso, every request, every approval — all in one unified platform built for your IT department.',
    accent: '#06b6d4',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #0c4a6e 50%, #164e63 100%)',
    tag: '📊 Budget Intelligence',
  },
  {
    id: 2,
    headline: 'Real-Time Spending Insights',
    subtext: 'Live dashboards give your team instant visibility into IT resource allocation and procurement status.',
    accent: '#3b82f6',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)',
    tag: '⚡ Live Analytics',
  },
  {
    id: 3,
    headline: 'Streamlined IT Approvals',
    subtext: 'Multi-level approval workflows that keep IT procurement moving fast — without losing control.',
    accent: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #2e1065 50%, #4c1d95 100%)',
    tag: '✅ Workflow Engine',
  },
  {
    id: 4,
    headline: 'Role-Based Access Control',
    subtext: 'Admin, IT Staff, and Regular Staff each see exactly what they need — nothing more, nothing less.',
    accent: '#10b981',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #064e3b 50%, #065f46 100%)',
    tag: '🔐 Access Control',
  },
]

export default function Slideshow() {
  const [current, setCurrent]       = useState(0)
  const [transitioning, setTransitioning] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setTransitioning(true)
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % slides.length)
        setTransitioning(false)
      }, 380)
    }, 4200)
    return () => clearInterval(timer)
  }, [])

  const slide = slides[current]

  return (
    <div className="slideshow-panel" style={{ background: slide.gradient }}>
      <div className="slide-orb slide-orb-1" style={{ background: slide.accent }} />
      <div className="slide-orb slide-orb-2" style={{ background: slide.accent }} />
      <div className="slide-grid-overlay" />

      {/* Brand */}
      <div className="slide-brand">
        <div className="slide-logo">
          <span className="slide-logo-icon">◈</span>
          <span className="slide-logo-text">PRISMA</span>
        </div>
        <span className="slide-logo-tagline">Procurement & Resource Integrated Spending Management Application</span>
      </div>

      {/* Content */}
      <div className={`slide-content ${transitioning ? 'slide-fade-out' : 'slide-fade-in'}`}>
        <span className="slide-tag" style={{ color: slide.accent, borderColor: slide.accent }}>
          {slide.tag}
        </span>
        <h2 className="slide-headline">{slide.headline}</h2>
        <p className="slide-subtext">{slide.subtext}</p>
        <div className="slide-features">
          {['IT-Focused', 'Role-Based', 'Audit-Ready', 'Real-Time'].map((f) => (
            <span key={f} className="slide-pill" style={{ borderColor: `${slide.accent}55`, color: slide.accent }}>
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div className="slide-dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`slide-dot ${i === current ? 'slide-dot-active' : ''}`}
            style={i === current ? { background: slide.accent, width: '28px' } : {}}
            onClick={() => setCurrent(i)}
          />
        ))}
      </div>

      {/* Stats */}
      <div className="slide-stats">
        {[
          { label: 'IT Items',        value: '200+' },
          { label: 'Transactions/mo', value: '500+' },
          { label: 'Uptime',          value: '99.9%' },
        ].map((s) => (
          <div key={s.label} className="slide-stat">
            <span className="slide-stat-value" style={{ color: slide.accent }}>{s.value}</span>
            <span className="slide-stat-label">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
