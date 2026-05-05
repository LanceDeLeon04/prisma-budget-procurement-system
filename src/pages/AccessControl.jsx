import { useEffect, useState } from 'react'
import PageLayout from '../components/PageLayout'
import { accessAPI } from '../services/api'

const ROLE_CONFIG = {
  admin:         { label:'Administrator',  color:'#ef4444', bg:'rgba(239,68,68,.1)'   },
  it_staff:      { label:'IT Staff',        color:'#06b6d4', bg:'rgba(6,182,212,.1)'   },
  regular_staff: { label:'Regular Staff',   color:'#10b981', bg:'rgba(16,185,129,.1)'  },
}

const AVATAR_GRADIENTS = {
  admin:         'linear-gradient(135deg,#ef4444,#dc2626)',
  it_staff:      'linear-gradient(135deg,#06b6d4,#3b82f6)',
  regular_staff: 'linear-gradient(135deg,#10b981,#059669)',
}

export default function AccessControl() {
  const [users, setUsers]     = useState([])
  const [roles, setRoles]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [selected, setSelected]     = useState(null)
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUser, setNewUser] = useState({ name:'', username:'', email:'', role:'regular_staff', department:'' })

  useEffect(() => {
    Promise.all([accessAPI.getUsers(), accessAPI.getRoles()]).then(([u,r]) => {
      setUsers(u); setRoles(r); setLoading(false)
    })
  }, [])

  const filtered = users.filter(u =>
    (filterRole==='all' || u.role===filterRole) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) ||
     u.email.toLowerCase().includes(search.toLowerCase()) ||
     u.department.toLowerCase().includes(search.toLowerCase()))
  )

  const handleAddUser = () => {
    if (!newUser.name || !newUser.username) return
    const id = users.length + 10
    setUsers(prev => [...prev, {
      id, ...newUser, avatar: newUser.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2),
      status:'active', lastLogin:'Never', permissions: ROLE_CONFIG[newUser.role]?.label ? ['Submit Requests'] : []
    }])
    setNewUser({ name:'', username:'', email:'', role:'regular_staff', department:'' })
    setShowAddUser(false)
  }

  const handleToggleStatus = (userId) => {
    setUsers(prev => prev.map(u => u.id===userId ? {...u, status: u.status==='active'?'inactive':'active'} : u))
  }

  return (
    <PageLayout
      title="Access Control"
      subtitle="Manage user accounts, roles, and system permissions"
      badge="🔑 Security"
      actions={<button className="btn-primary" onClick={()=>setShowAddUser(true)}>+ Add User</button>}
    >
      {/* Role Overview Cards */}
      <div className="role-cards-row">
        {roles.map(role => {
          const rc = ROLE_CONFIG[role.id] || {}
          const count = users.filter(u=>u.role===role.id).length
          return (
            <div
              key={role.id}
              className={`role-card ${filterRole===role.id?'role-card-active':''}`}
              style={{ '--rc': rc.color }}
              onClick={() => setFilterRole(filterRole===role.id?'all':role.id)}
            >
              <div className="role-card-bar" style={{ background: rc.color }} />
              <div style={{ fontSize: 34, marginBottom: 10 }}>{role.icon}</div>
              <div className="role-card-top">
                <span className="role-card-count" style={{ color: rc.color }}>{count}</span>
                <span className="role-badge" style={{ color: rc.color, background: rc.bg }}>{rc.label}</span>
              </div>
              <div className="role-card-desc" style={{ marginBottom: 14 }}>{role.desc}</div>
              <div style={{ display:'flex', flexDirection:'column', gap: 5 }}>
                {role.permissions.slice(0,3).map(p => (
                  <div key={p} style={{ fontSize: 12, color:'#64748b', display:'flex', alignItems:'center', gap: 6, fontWeight: 500 }}>
                    <span style={{ color: rc.color, fontWeight: 900, fontSize: 11 }}>✓</span> {p}
                  </div>
                ))}
                {role.permissions.length > 3 && (
                  <div style={{ fontSize: 11.5, color:'#94a3b8', fontFamily:'JetBrains Mono,monospace' }}>+{role.permissions.length-3} more</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Filter bar */}
      <div className="page-tabs">
        <button className={`page-tab ${filterRole==='all'?'page-tab-active':''}`} onClick={()=>setFilterRole('all')}>
          All Users <span className="tab-count">{users.length}</span>
        </button>
        <input className="page-search" placeholder="Search users…" value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>

      {/* Users Table */}
      <div className="table-card">
        {loading ? (
          <div style={{padding:24,display:'flex',flexDirection:'column',gap:12}}>
            {[...Array(5)].map((_,i)=><div key={i} className="skeleton-line" style={{height:52,borderRadius:8}}/>)}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>User</th><th>Username</th><th>Department</th><th>Role</th><th>Last Login</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(user => {
                const r = ROLE_CONFIG[user.role] || {}
                return (
                  <tr key={user.id} className="table-row" style={{ cursor:'pointer' }} onClick={()=>setSelected(user)}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar-sm" style={{ background: AVATAR_GRADIENTS[user.role]||'linear-gradient(135deg,#06b6d4,#3b82f6)' }}>
                          {user.avatar}
                        </div>
                        <div>
                          <div className="user-name">{user.name}</div>
                          <div className="user-email">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="mono-tag">{user.username}</span></td>
                    <td>{user.department}</td>
                    <td><span className="status-pill" style={{ color:r.color, background:r.bg }}>{r.label}</span></td>
                    <td><span className="date-cell">{user.lastLogin}</span></td>
                    <td>
                      <span className="status-pill" style={{
                        color:  user.status==='active'?'#10b981':'#94a3b8',
                        background: user.status==='active'?'rgba(16,185,129,.1)':'rgba(148,163,184,.1)'
                      }}>
                        {user.status==='active'?'● Active':'○ Inactive'}
                      </span>
                    </td>
                    <td onClick={e=>e.stopPropagation()}>
                      <div className="action-btns">
                        <button className="btn-action" onClick={()=>setSelected(user)}>👁 View</button>
                        <button className="btn-action" onClick={()=>handleToggleStatus(user.id)}>
                          {user.status==='active'?'⏸ Disable':'▶ Enable'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* User Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={()=>setSelected(null)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div className="user-avatar-lg" style={{ background: AVATAR_GRADIENTS[selected.role]||'linear-gradient(135deg,#06b6d4,#3b82f6)' }}>
                  {selected.avatar}
                </div>
                <div>
                  <h2 className="modal-title">{selected.name}</h2>
                  <span className="status-pill" style={{ color:ROLE_CONFIG[selected.role]?.color, background:ROLE_CONFIG[selected.role]?.bg }}>
                    {ROLE_CONFIG[selected.role]?.label}
                  </span>
                </div>
              </div>
              <button className="modal-close" onClick={()=>setSelected(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-info-grid">
                {[
                  { label:'Username',   value:selected.username },
                  { label:'Email',      value:selected.email },
                  { label:'Department', value:selected.department },
                  { label:'Last Login', value:selected.lastLogin },
                  { label:'Status',     value:selected.status },
                ].map(f=>(
                  <div key={f.label} className="modal-info-item">
                    <span className="modal-info-label">{f.label}</span>
                    <span className="modal-info-value">{f.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:20 }}>
                <span className="modal-info-label">Permissions</span>
                <div className="permissions-list">
                  {(selected.permissions||[]).map(p=>(
                    <span key={p} className="perm-tag">{p}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary">✏️ Edit User</button>
              <button className="btn-danger" onClick={()=>{ handleToggleStatus(selected.id); setSelected(null) }}>
                {selected.status==='active'?'⏸ Disable Account':'▶ Enable Account'}
              </button>
              <button className="btn-ghost" onClick={()=>setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="modal-overlay" onClick={()=>setShowAddUser(false)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add New User</h2>
              <button className="modal-close" onClick={()=>setShowAddUser(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                {[
                  { label:'Full Name',   key:'name',       type:'text', placeholder:'e.g. Juan Dela Cruz' },
                  { label:'Username',    key:'username',   type:'text', placeholder:'e.g. jdelacruz' },
                  { label:'Email',       key:'email',      type:'email',placeholder:'user@prisma.gov.ph' },
                  { label:'Department',  key:'department', type:'text', placeholder:'e.g. IT' },
                ].map(f=>(
                  <div key={f.key} className="form-field">
                    <label className="login-label">{f.label}</label>
                    <input className="login-input" type={f.type} placeholder={f.placeholder}
                      value={newUser[f.key]} onChange={e=>setNewUser(p=>({...p,[f.key]:e.target.value}))}
                      style={{padding:'12px 16px'}}/>
                  </div>
                ))}
                <div className="form-field" style={{ gridColumn:'1/-1' }}>
                  <label className="login-label">Role</label>
                  <select className="login-input" value={newUser.role} onChange={e=>setNewUser(p=>({...p,role:e.target.value}))} style={{padding:'12px 16px'}}>
                    <option value="admin">Administrator</option>
                    <option value="it_staff">IT Staff</option>
                    <option value="regular_staff">Regular Staff</option>
                  </select>
                </div>
                {/* Role description */}
                <div style={{ gridColumn:'1/-1', padding:'12px 16px', background:'rgba(6,182,212,.04)', border:'1px solid rgba(6,182,212,.12)', borderRadius:10, fontSize:13, color:'#475569' }}>
                  {newUser.role==='admin' && '👑 Full system access — manages catalog, budget, users, and all reports.'}
                  {newUser.role==='it_staff' && '🖥️ IT Department — shops catalog, processes requests, provides feedback, receives budget alerts.'}
                  {newUser.role==='regular_staff' && '👤 Submit IT procurement requests and track their status only.'}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={handleAddUser}>Create User</button>
              <button className="btn-ghost" onClick={()=>setShowAddUser(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
