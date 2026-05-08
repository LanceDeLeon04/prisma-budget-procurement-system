import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import PageLayout from '../components/PageLayout'
import { settingsAPI } from '../services/api'
import { useRole } from '../hooks/useRole'

export default function Settings() {
  const { user } = useRole()
  const [profile, setProfile] = useState(null)
  const [sys, setSys] = useState(null)
  const [tab, setTab] = useState('profile')
  const [saved, setSaved] = useState(false)

  useEffect(() => { settingsAPI.getProfile().then(setProfile); settingsAPI.getSystemSettings().then(setSys) }, [])

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2200) }
  const toggle = k => setSys(p => ({ ...p, [k]: !p[k] }))

  const TABS = [{ key:'profile',label:'Profile' },{ key:'system',label:'System' },{ key:'notifications',label:'Notifications' },{ key:'security',label:'Security' }]

  return (
    <PageLayout title="Settings" subtitle="Configure your profile, system preferences and security" badge="Settings"
      actions={<button className="btn btn-primary btn-sm" onClick={save} style={saved?{background:'linear-gradient(135deg,#10b981,#059669)'}:{}}>{saved?'Saved!':'Save Changes'}</button>}
    >
      <div className="settings-layout">
        <aside className="settings-sidebar">
          {TABS.map(t => (
            <button key={t.key} className={`settings-nav-item${tab===t.key?' active':''}`} onClick={()=>setTab(t.key)}>{t.label}</button>
          ))}
          <div className="settings-divider"/>
          <div className="settings-ver"><div className="settings-ver-lbl">PRISMA System</div><div className="settings-ver-val">v1.0.0 · Build 2025.05</div></div>
        </aside>

        <div className="settings-content">
          {tab==='profile' && profile && (
            <div className="settings-panel">
              <div className="settings-panel-title">Profile Information</div>
              <div className="settings-panel-desc">Update your personal details and account information</div>
              <div className="profile-av-block">
                <div className="profile-av">{user?.name?.charAt(0)||'A'}</div>
                <div><div className="profile-av-name">{profile.name}</div><div className="profile-av-role">{profile.role}</div>
                  <button className="btn btn-ghost btn-sm" style={{marginTop:8}}>Change Photo</button>
                </div>
              </div>
              <div className="settings-form-grid">
                {[{l:'Full Name',v:profile.name,t:'text'},{l:'Username',v:profile.username,t:'text'},{l:'Email Address',v:profile.email,t:'email'},{l:'Phone Number',v:profile.phone,t:'tel'},{l:'Department',v:profile.department,t:'text'},{l:'Join Date',v:profile.joinDate,t:'text',ro:true}].map(f=>(
                  <div key={f.l} className="settings-form-field">
                    <label className="field-label">{f.l}</label>
                    <input className="field-input" type={f.t} defaultValue={f.v} readOnly={f.ro} style={f.ro?{background:'#f8fafc',cursor:'default'}:{}}/>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==='system' && sys && (
            <div className="settings-panel">
              <div className="settings-panel-title">System Configuration</div>
              <div className="settings-panel-desc">Fiscal year, currency, and approval settings</div>
              <div className="settings-form-grid">
                {[{l:'Fiscal Year',v:sys.fiscalYear},{l:'Currency',v:sys.currency},{l:'Timezone',v:sys.timezone},{l:'Date Format',v:sys.dateFormat},{l:'Approval Threshold (₱)',v:sys.approvalThreshold},{l:'Budget Warning (%)',v:sys.budgetWarningPct}].map(f=>(
                  <div key={f.l} className="settings-form-field">
                    <label className="field-label">{f.l}</label>
                    <input className="field-input" defaultValue={f.v}/>
                  </div>
                ))}
              </div>
              <div style={{marginTop:20}}>
                <Toggle label="Auto-Approve Small Requests" desc="Automatically approve requests under ₱5,000" val={sys.autoApprove} onChange={()=>toggle('autoApprove')}/>
              </div>
            </div>
          )}

          {tab==='notifications' && sys && (
            <div className="settings-panel">
              <div className="settings-panel-title">Notification Preferences</div>
              <div className="settings-panel-desc">Control how and when you receive alerts</div>
              <div className="toggle-list">
                <Toggle label="Email Notifications" desc="Receive updates and approvals via email" val={sys.emailNotifications} onChange={()=>toggle('emailNotifications')}/>
                <Toggle label="SMS Alerts" desc="Get critical alerts via SMS" val={sys.smsAlerts} onChange={()=>toggle('smsAlerts')}/>
                <Toggle label="Budget Warning Alerts" desc={`Alert when budget reaches ${sys.budgetWarningPct}% utilization`} val={true} onChange={()=>{}}/>
                <Toggle label="OpEx Overspend Alerts" desc="Immediate alert when OpEx budget is exceeded" val={true} onChange={()=>{}}/>
                <Toggle label="CapEx Overspend Alerts" desc="Immediate alert when CapEx budget is exceeded" val={true} onChange={()=>{}}/>
                <Toggle label="Pending Approval Reminders" desc="Daily digest of requests awaiting your action" val={true} onChange={()=>{}}/>
              </div>
            </div>
          )}

          {tab==='security' && sys && (
            <div className="settings-panel">
              <div className="settings-panel-title">Security Settings</div>
              <div className="settings-panel-desc">Manage authentication and access policies</div>
              <div className="toggle-list">
                <Toggle label="Two-Factor Authentication" desc="Add extra verification on login" val={sys.twoFactorAuth} onChange={()=>toggle('twoFactorAuth')}/>
                <Toggle label="Session Timeout (30 min)" desc="Auto-logout after 30 minutes of inactivity" val={true} onChange={()=>{}}/>
                <Toggle label="Login Audit Log" desc="Record all login attempts and user actions" val={true} onChange={()=>{}}/>
              </div>
              <div style={{height:1,background:'#f1f5f9',margin:'24px 0'}}/>
              <div className="settings-panel-title" style={{fontSize:15,marginBottom:3}}>Change Password</div>
              <div className="settings-panel-desc">Leave blank to keep current password</div>
              <div className="settings-form-grid" style={{marginTop:16}}>
                {['Current Password','New Password','Confirm New Password'].map(l=>(
                  <div key={l} className="settings-form-field">
                    <label className="field-label">{l}</label>
                    <input className="field-input" type="password" placeholder="••••••••"/>
                  </div>
                ))}
              </div>
              <button className="btn btn-primary" style={{marginTop:16}}>Update Password</button>
              <div className="danger-zone">
                <div className="danger-zone-title">Danger Zone</div>
                <div className="danger-zone-desc">These actions are irreversible. Proceed with extreme caution.</div>
                <div style={{display:'flex',gap:10}}>
                  <button className="btn btn-danger" onClick={()=>alert('Settings reset!')}>Reset All Settings</button>
                  <button className="btn btn-danger" onClick={()=>alert('Sessions revoked!')}>Revoke All Sessions</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}

function Toggle({ label, desc, val, onChange }) {
  return (
    <div className="toggle-row" onClick={onChange}>
      <div className="toggle-info"><div className="toggle-label">{label}</div><div className="toggle-desc">{desc}</div></div>
      <div className={`toggle-sw${val?' on':''}`}><div className="toggle-knob"/></div>
    </div>
  )
}
