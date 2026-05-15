import { useEffect, useState } from 'react'
import PageLayout from '../components/PageLayout'
import { accessAPI } from '../services/api'
import { useRole } from '../hooks/useRole'

const ROLE_COLORS = { admin: '#ef4444', it_staff: '#06b6d4', regular_staff: '#10b981' }
const ROLE_LABELS = { admin: 'Administrator', it_staff: 'IT Staff', regular_staff: 'Regular Staff' }

const ShieldIcon  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const UserIcon    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const CheckIcon   = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>

export default function Access() {
  const { isAdmin } = useRole()
  const [users,     setUsers]     = useState([])
  const [roles,     setRoles]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState('roles')
  const [selected,  setSelected]  = useState(null)

  useEffect(() => {
    Promise.all([accessAPI.getUsers(), accessAPI.getRoles()]).then(([u, r]) => {
      setUsers(u); setRoles(r); setSelected(r[0]?.id ?? null); setLoading(false)
    })
  }, [])

  return (
    <PageLayout title="Access Control" subtitle="Role-based permissions and user management" badge="Access">
      <div className="tabs">
        {[
          { key: 'roles', label: 'Roles & Permissions' },
          { key: 'users', label: 'User Accounts' },
        ].map(t => (
          <button key={t.key} className={`tab${activeTab === t.key ? ' active' : ''}`}
            onClick={() => setActiveTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {/* ── ROLES TAB ─────────────────────────────────────────────── */}
      {activeTab === 'roles' && (
        <div>
          {loading
            ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                {[1, 2, 3].map(i => <div key={i} className="sk-line" style={{ height: 280, borderRadius: 18 }}/>)}
              </div>
            : (
              <>
                <div className="role-hero-row">
                  {roles.map(r => (
                    <div key={r.id} className={`role-hero-card${selected === r.id ? ' selected' : ''}`}
                      style={{ '--rhc': r.color }} onClick={() => setSelected(r.id)}>
                      <div className="rh-icon" style={{ background: `${r.color}18`, color: r.color }}>
                        <ShieldIcon/>
                      </div>
                      <div className="rh-title">{r.label}</div>
                      <div className="rh-count">{users.filter(u => u.role === r.id).length} user{users.filter(u => u.role === r.id).length !== 1 ? 's' : ''} assigned</div>
                      <div className="rh-desc">{r.desc}</div>
                      <div className="rh-perms">
                        {r.permissions.slice(0, 4).map(p => (
                          <div key={p} className="rh-perm">
                            <span className="perm-check"><CheckIcon/></span> {p}
                          </div>
                        ))}
                        {r.permissions.length > 4 && (
                          <div className="rh-perm" style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                            +{r.permissions.length - 4} more permissions
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Full permission list for selected role */}
                {selected && (() => {
                  const r = roles.find(r => r.id === selected)
                  if (!r) return null
                  return (
                    <div className="glass-card" style={{ padding: 24 }}>
                      <div className="card-header">
                        <h3 className="card-title" style={{ color: r.color }}>{r.label} — Full Permission Set</h3>
                        <span className="card-badge">{r.permissions.length} permissions</span>
                      </div>
                      <div className="perm-list">
                        {r.permissions.map(p => (
                          <span key={p} className="perm-tag" style={{ background: `${r.color}10`, color: r.color, borderColor: `${r.color}30` }}>
                            ✓ {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </>
            )
          }
        </div>
      )}

      {/* ── USERS TAB ─────────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Username</th>
                <th>Department</th>
                <th>Role</th>
                <th>Last Login</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(3)].map((_, i) => (
                    <tr key={i} className="tr">
                      {[...Array(6)].map((_, j) => (
                        <td key={j}><div className="sk-line" style={{ height: 14, width: '80%' }}/></td>
                      ))}
                    </tr>
                  ))
                : users.map(u => {
                    const roleColor = ROLE_COLORS[u.role] ?? '#94a3b8'
                    const roleLabel = ROLE_LABELS[u.role] ?? u.role
                    return (
                      <tr key={u.id} className="tr">
                        <td>
                          <div className="user-cell">
                            <div className="user-av" style={{ background: `linear-gradient(135deg,${roleColor},${roleColor}99)` }}>
                              {u.avatar}
                            </div>
                            <div>
                              <div className="user-name">{u.name}</div>
                              <div className="user-email">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className="mono">{u.username}</span></td>
                        <td style={{ fontSize: 13, color: '#475569' }}>{u.department}</td>
                        <td>
                          <span className="pill" style={{ color: roleColor, background: `${roleColor}15` }}>
                            {roleLabel}
                          </span>
                        </td>
                        <td><span className="dt">{u.lastLogin}</span></td>
                        <td>
                          <span className="pill" style={{ color: '#10b981', background: 'rgba(16,185,129,.1)' }}>
                            ● Active
                          </span>
                        </td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>
      )}
    </PageLayout>
  )
}
