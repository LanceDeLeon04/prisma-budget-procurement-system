import { useState, useEffect } from 'react'

const slides = [
  {
    id: 1,
    headline: 'Procurement Made Intelligent',
    subtext: 'Track every peso, every request, every approval — all in one unified platform.',
    accent: '#06b6d4',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #0c4a6e 50%, #164e63 100%)',
    icon: '📊',
    tag: 'Budget Intelligence',
  },
  {
    id: 2,
    headline: 'Real-Time Spending Insights',
    subtext: 'Live dashboards give your team instant visibility into resource allocation across all departments.',
    accent: '#3b82f6',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)',
    icon: '⚡',
    tag: 'Live Analytics',
  },
  {
    id: 3,
    headline: 'Streamlined Approvals',
    subtext: 'Multi-level approval workflows that keep procurement moving fast — without losing control.',
    accent: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #2e1065 50%, #4c1d95 100%)',
    icon: '✅',
    tag: 'Workflow Engine',
  },
  {
    id: 4,
    headline: 'Enterprise-Grade Security',
    subtext: 'Role-based access control ensures the right people see the right data — always.',
    accent: '#10b981',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #064e3b 50%, #065f46 100%)',
    icon: '🔐',
    tag: 'Access Control',
  },
]

export default function Slideshow() {
  const [current, setCurrent] = useState(0)
  const [transitioning, setTransitioning] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setTransitioning(true)
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % slides.length)
        setTransitioning(false)
      }, 400)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const slide = slides[current]

  return (
    <div className="slideshow-panel" style={{ background: slide.gradient }}>
      {/* Animated background orbs */}
      <div className="slide-orb slide-orb-1" style={{ background: slide.accent }} />
      <div className="slide-orb slide-orb-2" style={{ background: slide.accent }} />
      <div className="slide-grid-overlay" />

      {/* PRISMA Branding */}
      <div className="slide-brand">
        <div className="slide-logo">
          <span className="slide-logo-icon">◈</span>
          <span className="slide-logo-text">PRISMA</span>
        </div>
        <span className="slide-logo-tagline">Procurement & Resource Integrated Spending Management Application</span>
      </div>

      {/* Slide Content */}
      <div className={`slide-content ${transitioning ? 'slide-fade-out' : 'slide-fade-in'}`}>
        <span className="slide-tag" style={{ color: slide.accent, borderColor: slide.accent }}>
          {slide.icon} {slide.tag}
        </span>
        <h2 className="slide-headline">{slide.headline}</h2>
        <p className="slide-subtext">{slide.subtext}</p>

        {/* Feature pills */}
        <div className="slide-features">
          {['Multi-Department', 'Real-Time', 'Audit-Ready', 'Cloud-Based'].map((f) => (
            <span key={f} className="slide-pill" style={{ borderColor: `${slide.accent}40`, color: `${slide.accent}` }}>
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
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

      {/* Bottom stat strip */}
      <div className="slide-stats">
        {[
          { label: 'Departments', value: '20+' },
          { label: 'Transactions/mo', value: '500+' },
          { label: 'Uptime', value: '99.9%' },
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