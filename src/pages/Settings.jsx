import { useEffect, useState } from 'react'
import PageLayout from '../components/PageLayout'
import { settingsAPI, budgetAPI } from '../services/api'
import { useRole } from '../hooks/useRole'

const NAV = [
  { key: 'profile',   label: 'Profile',          icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
  { key: 'system',    label: 'System',            icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' },
  { key: 'budget',    label: 'Budget Settings',  icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
  { key: 'notif',     label: 'Notifications',     icon: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0' },
]

const Icon = ({ d }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d}/>
  </svg>
)

const Toggle = ({ on, onChange, label, desc }) => (
  <div className="toggle-row" onClick={() => onChange(!on)}>
    <div className="toggle-info">
      <div className="toggle-label">{label}</div>
      {desc && <div className="toggle-desc">{desc}</div>}
    </div>
    <div className={`toggle-sw${on ? ' on' : ''}`}>
      <div className="toggle-knob"/>
    </div>
  </div>
)

export default function Settings() {
  const { user, isAdmin } = useRole()
  const [activeSection, setActiveSection] = useState('profile')
  const [profile,  setProfile]  = useState(null)
  const [sysSet,   setSysSet]   = useState(null)
  const [summary,  setSummary]  = useState(null)
  const [saved,    setSaved]    = useState(false)
  const [notifs,   setNotifs]   = useState({ email: true, sms: false, budget: true, approval: true })

  useEffect(() => {
    settingsAPI.getProfile().then(setProfile)
    settingsAPI.getSystemSettings().then(setSysSet)
    budgetAPI.getSummary().then(setSummary)
  }, [])

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2400)
  }

  const fmt = n => '₱' + Number(n ?? 0).toLocaleString()

  return (
    <PageLayout title="Settings" subtitle="System configuration, profile, and budget preferences" badge="Settings">
      <div className="settings-layout">
        {/* ── Settings sidebar ──────────────────────────────── */}
        <div className="settings-sidebar">
          {NAV.filter(n => isAdmin || n.key === 'profile' || n.key === 'notif').map(n => (
            <button key={n.key} className={`settings-nav-item${activeSection === n.key ? ' active' : ''}`}
              onClick={() => setActiveSection(n.key)}>
              <Icon d={n.icon}/> {n.label}
            </button>
          ))}
          <div className="settings-divider"/>
          <div className="settings-ver">
            <div className="settings-ver-lbl">PRISMA</div>
            <div className="settings-ver-val">v2.0.0 · ITIL Aligned</div>
          </div>
        </div>

        {/* ── Settings content ──────────────────────────────── */}
        <div className="settings-content">

          {/* PROFILE */}
          {activeSection === 'profile' && (
            <div className="settings-panel">
              <div className="settings-panel-title">Profile Information</div>
              <div className="settings-panel-desc">Your personal account details and contact information.</div>
              <div className="profile-av-block">
                <div className="profile-av">{user?.avatar ?? 'U'}</div>
                <div>
                  <div className="profile-av-name">{profile?.name ?? user?.name ?? '—'}</div>
                  <div className="profile-av-role">{profile?.role ?? user?.role ?? '—'} · {profile?.department ?? user?.department}</div>
                </div>
              </div>
              <div className="settings-form-grid">
                {[
                  { label: 'Full Name',   val: profile?.name },
                  { label: 'Username',    val: profile?.username },
                  { label: 'Email',       val: profile?.email },
                  { label: 'Department',  val: profile?.department },
                  { label: 'Phone',       val: profile?.phone },
                  { label: 'Date Joined', val: profile?.joinDate },
                ].map(f => (
                  <div key={f.label} className="settings-form-field">
                    <label className="field-label">{f.label}</label>
                    <input className="field-input" defaultValue={f.val ?? ''} readOnly={f.label === 'Date Joined' || f.label === 'Username'}
                      style={{ opacity: (f.label === 'Date Joined' || f.label === 'Username') ? .6 : 1 }}/>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                <button className="btn btn-primary" onClick={handleSave}>{saved ? '✓ Saved' : 'Save Changes'}</button>
                <button className="btn btn-ghost">Change Password</button>
              </div>
            </div>
          )}

          {/* SYSTEM (admin only) */}
          {activeSection === 'system' && isAdmin && (
            <div className="settings-panel">
              <div className="settings-panel-title">System Settings</div>
              <div className="settings-panel-desc">Fiscal year, currency, approval thresholds, and regional preferences.</div>
              <div className="settings-form-grid">
                {[
                  { label: 'Fiscal Year',         val: sysSet?.fiscalYear,          type: 'text' },
                  { label: 'Currency',             val: sysSet?.currency,            type: 'text' },
                  { label: 'Timezone',             val: sysSet?.timezone,            type: 'text' },
                  { label: 'Date Format',          val: sysSet?.dateFormat,          type: 'text' },
                  { label: 'Approval Threshold (₱)', val: sysSet?.approvalThreshold, type: 'number' },
                  { label: 'Budget Warning (%)',   val: sysSet?.budgetWarningPct,    type: 'number' },
                ].map(f => (
                  <div key={f.label} className="settings-form-field">
                    <label className="field-label">{f.label}</label>
                    <input className="field-input" type={f.type} defaultValue={f.val ?? ''}/>
                  </div>
                ))}
              </div>
              <div className="toggle-list" style={{ marginTop: 20 }}>
                <Toggle on={sysSet?.autoApprove ?? false} onChange={() => {}}
                  label="Auto-approve low-value requests"
                  desc={`Automatically approve requests below ₱${(sysSet?.approvalThreshold ?? 0).toLocaleString()}`}/>
                <Toggle on={sysSet?.twoFactorAuth ?? false} onChange={() => {}}
                  label="Two-Factor Authentication"
                  desc="Require 2FA for all admin logins"/>
              </div>
              <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                <button className="btn btn-primary" onClick={handleSave}>{saved ? '✓ Saved' : 'Save Settings'}</button>
              </div>
              <div className="danger-zone">
                <div className="danger-zone-title">⚠ Danger Zone</div>
                <div className="danger-zone-desc">These actions are irreversible. Proceed with caution.</div>
                <button className="btn btn-danger btn-sm">Reset All Budget Data</button>
              </div>
            </div>
          )}

          {/* BUDGET SETTINGS (admin only) */}
          {activeSection === 'budget' && isAdmin && (
            <div className="settings-panel">
              <div className="settings-panel-title">Budget Configuration</div>
              <div className="settings-panel-desc">FY 2025 allocation per ITIL category. Changes take effect immediately.</div>
              {summary && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
                  {[
                    { key: 'hardware',        label: 'Hardware (CapEx)',        color: '#3b82f6', cat: summary.categories?.hardware },
                    { key: 'softwareLicense', label: 'SW License (OpEx)',       color: '#8b5cf6', cat: summary.categories?.softwareLicense },
                    { key: 'service',         label: 'Service (OpEx)',          color: '#06b6d4', cat: summary.categories?.service },
                  ].map(c => (
                    <div key={c.key} style={{ background: '#f8fafc', border: `1.5px solid ${c.color}30`, borderRadius: 14, padding: '16px 18px' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: c.color, fontFamily: 'JetBrains Mono,monospace', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>{c.label}</div>
                      <div className="settings-form-field">
                        <label className="field-label">Allocated (₱)</label>
                        <input className="field-input" type="number" defaultValue={c.cat?.allocated ?? 0} style={{ borderColor: `${c.color}40` }}/>
                      </div>
                      <div style={{ marginTop: 10, fontSize: 12, color: '#64748b', fontFamily: 'JetBrains Mono,monospace' }}>
                        Spent: {fmt(c.cat?.spent)} · {c.cat?.pct ?? 0}%
                      </div>
                      <div style={{ height: 5, background: '#e2e8f0', borderRadius: 100, overflow: 'hidden', marginTop: 6 }}>
                        <div style={{ height: '100%', width: `${Math.min(c.cat?.pct ?? 0, 100)}%`, background: c.color, borderRadius: 100 }}/>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button className="btn btn-primary" onClick={handleSave}>{saved ? '✓ Saved' : 'Update Budget Allocations'}</button>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeSection === 'notif' && (
            <div className="settings-panel">
              <div className="settings-panel-title">Notification Preferences</div>
              <div className="settings-panel-desc">Control how and when you receive alerts and updates.</div>
              <div className="toggle-list">
                <Toggle on={notifs.email}    onChange={v => setNotifs(n => ({ ...n, email: v }))}
                  label="Email Notifications" desc="Receive notifications via email"/>
                <Toggle on={notifs.sms}      onChange={v => setNotifs(n => ({ ...n, sms: v }))}
                  label="SMS Alerts" desc="Receive critical alerts via SMS"/>
                <Toggle on={notifs.budget}   onChange={v => setNotifs(n => ({ ...n, budget: v }))}
                  label="Budget Threshold Alerts" desc="Alert when any category exceeds 80% utilization"/>
                <Toggle on={notifs.approval} onChange={v => setNotifs(n => ({ ...n, approval: v }))}
                  label="Approval Requests" desc="Notify when a purchase request needs your review"/>
              </div>
              <div style={{ marginTop: 20 }}>
                <button className="btn btn-primary" onClick={handleSave}>{saved ? '✓ Saved' : 'Save Preferences'}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
