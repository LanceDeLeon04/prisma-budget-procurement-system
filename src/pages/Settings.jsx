import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import PageLayout from '../components/PageLayout'
import { settingsAPI } from '../services/api'

export default function Settings() {
  const user = useSelector(s => s.auth.user)
  const [profile,  setProfile]  = useState(null)
  const [sys,      setSys]      = useState(null)
  const [activeTab,setActiveTab]= useState('profile')
  const [saved,    setSaved]    = useState(false)

  useEffect(() => {
    settingsAPI.getProfile().then(setProfile)
    settingsAPI.getSystemSettings().then(setSys)
  }, [])

  const handleSave = () => { setSaved(true); setTimeout(()=>setSaved(false), 2500) }
  const toggle = (key) => setSys(prev => ({ ...prev, [key]: !prev[key] }))

  const TABS = [
    { key:'profile',       label:'👤 Profile'       },
    { key:'system',        label:'⚙️ System'        },
    { key:'notifications', label:'🔔 Notifications' },
    { key:'security',      label:'🔐 Security'      },
  ]

  return (
    <PageLayout
      title="Settings"
      subtitle="Configure your profile, system preferences, and security"
      badge="⚙️ Admin"
      actions={
        <button className="btn-primary" onClick={handleSave}
          style={{ background: saved ? 'linear-gradient(135deg,#10b981,#059669)' : undefined }}>
          {saved ? '✓ Saved!' : '💾 Save Changes'}
        </button>
      }
    >
      <div className="settings-layout">
        {/* Sidebar */}
        <aside className="settings-sidebar">
          {TABS.map(t => (
            <button key={t.key}
              className={`settings-nav-item ${activeTab===t.key?'settings-nav-active':''}`}
              onClick={()=>setActiveTab(t.key)}>
              {t.label}
            </button>
          ))}
          <div className="settings-divider"/>
          <div className="settings-version">
            <div className="settings-version-label">PRISMA System</div>
            <div className="settings-version-val">v1.0.0 · Build 2025.05</div>
          </div>
        </aside>

        {/* Content */}
        <div className="settings-content">

          {/* Profile */}
          {activeTab==='profile' && profile && (
            <div className="settings-panel">
              <div className="settings-panel-header">
                <h2 className="settings-panel-title">Profile Information</h2>
                <p className="settings-panel-desc">Update your personal details and account info</p>
              </div>
              <div className="profile-avatar-block">
                <div className="profile-avatar-lg">{user?.name?.charAt(0)||'A'}</div>
                <div>
                  <div className="profile-avatar-name">{profile.name}</div>
                  <div className="profile-avatar-role">{profile.role}</div>
                  <button className="btn-ghost" style={{ marginTop:8, fontSize:12, padding:'6px 14px' }}>Change Photo</button>
                </div>
              </div>
              <div className="settings-form-grid">
                {[
                  { label:'Full Name',     value:profile.name,       type:'text'  },
                  { label:'Username',      value:profile.username,   type:'text'  },
                  { label:'Email Address', value:profile.email,      type:'email' },
                  { label:'Phone Number',  value:profile.phone,      type:'tel'   },
                  { label:'Department',    value:profile.department, type:'text'  },
                  { label:'Join Date',     value:profile.joinDate,   type:'text',  readOnly:true },
                ].map(f => (
                  <div key={f.label} className="settings-form-field">
                    <label className="login-label">{f.label}</label>
                    <input className="login-input" type={f.type} defaultValue={f.value} readOnly={f.readOnly}
                      style={{ padding:'12px 16px', background: f.readOnly?'#f8fafc':'#fff', cursor: f.readOnly?'default':'text' }}/>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System */}
          {activeTab==='system' && sys && (
            <div className="settings-panel">
              <div className="settings-panel-header">
                <h2 className="settings-panel-title">System Configuration</h2>
                <p className="settings-panel-desc">Fiscal year, currency, and approval thresholds</p>
              </div>
              <div className="settings-form-grid">
                {[
                  { label:'Fiscal Year',             value:sys.fiscalYear },
                  { label:'Currency',                value:sys.currency   },
                  { label:'Timezone',                value:sys.timezone   },
                  { label:'Date Format',             value:sys.dateFormat },
                  { label:'Approval Threshold (₱)', value:sys.approvalThreshold },
                  { label:'Budget Warning (%)',      value:sys.budgetWarningPct  },
                ].map(f => (
                  <div key={f.label} className="settings-form-field">
                    <label className="login-label">{f.label}</label>
                    <input className="login-input" defaultValue={f.value} style={{ padding:'12px 16px' }}/>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:24 }}>
                <ToggleRow
                  label="Auto-Approve Small Requests"
                  desc="Automatically approve requests under ₱5,000"
                  value={sys.autoApprove}
                  onChange={()=>toggle('autoApprove')}
                />
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab==='notifications' && sys && (
            <div className="settings-panel">
              <div className="settings-panel-header">
                <h2 className="settings-panel-title">Notification Preferences</h2>
                <p className="settings-panel-desc">Control how and when you receive alerts</p>
              </div>
              <div className="toggle-list">
                <ToggleRow label="Email Notifications"        desc="Receive updates and approvals via email"                    value={sys.emailNotifications} onChange={()=>toggle('emailNotifications')}/>
                <ToggleRow label="SMS Alerts"                 desc="Get critical alerts via SMS"                               value={sys.smsAlerts}          onChange={()=>toggle('smsAlerts')}/>
                <ToggleRow label="Budget Warning Alerts"      desc={`Alert when department reaches ${sys.budgetWarningPct}% utilization`} value={true} onChange={()=>{}}/>
                <ToggleRow label="Pending Approval Reminders" desc="Daily digest of requests awaiting your action"             value={true}                   onChange={()=>{}}/>
                <ToggleRow label="Report Generation Alerts"   desc="Notify when monthly reports are ready"                    value={false}                  onChange={()=>{}}/>
              </div>
            </div>
          )}

          {/* Security */}
          {activeTab==='security' && sys && (
            <div className="settings-panel">
              <div className="settings-panel-header">
                <h2 className="settings-panel-title">Security Settings</h2>
                <p className="settings-panel-desc">Manage authentication and access policies</p>
              </div>
              <div className="toggle-list">
                <ToggleRow label="Two-Factor Authentication" desc="Add extra verification on login"                      value={sys.twoFactorAuth}  onChange={()=>toggle('twoFactorAuth')}/>
                <ToggleRow label="Session Timeout (30 min)"  desc="Auto-logout after 30 minutes of inactivity"          value={true}               onChange={()=>{}}/>
                <ToggleRow label="Login Audit Log"           desc="Record all login attempts and actions"                value={true}               onChange={()=>{}}/>
              </div>
              <div style={{ height:1, background:'#f1f5f9', margin:'24px 0' }}/>
              <h3 style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:800, color:'#0f172a', marginBottom:4 }}>Change Password</h3>
              <p style={{ fontSize:13.5, color:'#94a3b8', marginBottom:16 }}>Leave blank to keep current password</p>
              <div className="settings-form-grid">
                {['Current Password','New Password','Confirm New Password'].map(label => (
                  <div key={label} className="settings-form-field">
                    <label className="login-label">{label}</label>
                    <input className="login-input" type="password" placeholder="••••••••" style={{ padding:'12px 16px' }}/>
                  </div>
                ))}
              </div>
              <button className="btn-primary" style={{ marginTop:16 }}>Update Password</button>

              <div className="danger-zone">
                <h3 className="danger-zone-title">⚠ Danger Zone</h3>
                <p className="danger-zone-desc">These actions are irreversible. Proceed with extreme caution.</p>
                <div style={{ display:'flex', gap:12 }}>
                  <button className="btn-danger" onClick={()=>alert('Settings reset!')}>Reset All Settings</button>
                  <button className="btn-danger" onClick={()=>alert('Sessions revoked!')}>Revoke All Sessions</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </PageLayout>
  )
}

function ToggleRow({ label, desc, value, onChange }) {
  return (
    <div className="toggle-row" onClick={onChange}>
      <div className="toggle-info">
        <div className="toggle-label">{label}</div>
        <div className="toggle-desc">{desc}</div>
      </div>
      <div className={`toggle-switch ${value?'toggle-on':''}`}>
        <div className="toggle-knob"/>
      </div>
    </div>
  )
}
