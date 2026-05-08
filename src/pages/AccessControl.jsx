import { useEffect, useState } from 'react'
import PageLayout from '../components/PageLayout'
import { accessAPI } from '../services/api'
import { useRole } from '../hooks/useRole'

const ROLE_CFG = {
  admin:         { label:'Administrator', color:'#ef4444', bg:'rgba(239,68,68,.1)',  grad:'linear-gradient(135deg,#ef4444,#dc2626)' },
  it_staff:      { label:'IT Staff',       color:'#06b6d4', bg:'rgba(6,182,212,.1)',  grad:'linear-gradient(135deg,#06b6d4,#3b82f6)' },
  regular_staff: { label:'Regular Staff',  color:'#10b981', bg:'rgba(16,185,129,.1)', grad:'linear-gradient(135deg,#10b981,#059669)' },
}
const PlusIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const CheckIcon = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12"/></svg>
const ShieldIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const MonitorIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
const UserIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>

const ROLE_ICONS = { admin: <ShieldIcon/>, it_staff: <MonitorIcon/>, regular_staff: <UserIcon/> }

export default function AccessControl() {
  const { isAdmin } = useRole()
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newUser, setNewUser] = useState({ name:'', username:'', email:'', role:'regular_staff', department:'' })

  useEffect(() => {
    Promise.all([accessAPI.getUsers(), accessAPI.getRoles()]).then(([u, r]) => {
      setUsers(u); setRoles(r); setLoading(false)
    })
  }, [])

  const filtered = users.filter(u =>
    (filterRole === 'all' || u.role === filterRole) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) ||
     u.email.toLowerCase().includes(search.toLowerCase()) ||
     u.department.toLowerCase().includes(search.toLowerCase()))
  )

  const handleAdd = () => {
    if (!newUser.name || !newUser.username) return
    setUsers(prev => [...prev, {
      id: prev.length + 10, ...newUser,
      avatar: newUser.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2),
      status: 'active', lastLogin: 'Never',
      permissions: ROLE_CFG[newUser.role] ? [ROLE_CFG[newUser.role].label + ' permissions'] : []
    }])
    setNewUser({ name:'', username:'', email:'', role:'regular_staff', department:'' })
    setShowAdd(false)
  }

  const toggleStatus = id => setUsers(prev => prev.map(u => u.id===id ? {...u, status: u.status==='active'?'inactive':'active'} : u))

  return (
    <PageLayout title="Access Control" subtitle="Manage user accounts, roles, and system permissions" badge="Access"
      actions={isAdmin && <button className="btn btn-primary btn-sm" onClick={()=>setShowAdd(true)}><PlusIcon/> Add User</button>}
    >
      {/* Role Hero Cards */}
      <div className="role-hero-row">
        {roles.map(role => {
          const rc = ROLE_CFG[role.id] || {}
          const count = users.filter(u => u.role === role.id).length
          return (
            <div key={role.id} className={`role-hero-card${filterRole===role.id?' selected':''}`}
              style={{'--rhc': rc.color}} onClick={() => setFilterRole(filterRole===role.id?'all':role.id)}>
              <div className="rh-icon" style={{ background:`${rc.color}15`, color: rc.color }}>
                {ROLE_ICONS[role.id]}
              </div>
              <div className="rh-title">{rc.label}</div>
              <div className="rh-count">{count} user{count!==1?'s':''}</div>
              <div className="rh-desc">{role.desc||''}</div>
              <div className="rh-perms">
                {(role.permissions||[]).slice(0,4).map(p => (
                  <div key={p} className="rh-perm">
                    <span className="perm-check"><CheckIcon/></span>{p}
                  </div>
                ))}
                {(role.permissions||[]).length > 4 && (
                  <div style={{fontSize:11,color:'#94a3b8',fontFamily:'JetBrains Mono,monospace',marginTop:2}}>+{role.permissions.length-4} more permissions</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Filter bar */}
      <div className="tabs">
        <button className={`tab${filterRole==='all'?' active':''}`} onClick={() => setFilterRole('all')}>
          All Users <span className="tab-count">{users.length}</span>
        </button>
        <input className="search-input" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)}/>
      </div>

      {/* Users table */}
      <div className="table-wrap">
        {loading ? (
          <div style={{padding:24,display:'flex',flexDirection:'column',gap:10}}>
            {[...Array(5)].map((_,i)=><div key={i} className="sk-line" style={{height:50,borderRadius:8}}/>)}
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>User</th><th>Username</th><th>Department</th><th>Role</th><th>Last Login</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(u => {
                const rc = ROLE_CFG[u.role] || {}
                return (
                  <tr key={u.id} className="tr clickable" onClick={() => setSelected(u)}>
                    <td>
                      <div className="user-cell">
                        <div className="user-av" style={{background: rc.grad||'linear-gradient(135deg,#06b6d4,#3b82f6)'}}>{u.avatar}</div>
                        <div><div className="user-name">{u.name}</div><div className="user-email">{u.email}</div></div>
                      </div>
                    </td>
                    <td><span className="mono">{u.username}</span></td>
                    <td style={{fontSize:13,color:'#475569'}}>{u.department}</td>
                    <td><span className="pill" style={{color:rc.color,background:rc.bg}}>{rc.label}</span></td>
                    <td><span className="dt">{u.lastLogin}</span></td>
                    <td>
                      <span className="pill" style={{color:u.status==='active'?'#10b981':'#94a3b8',background:u.status==='active'?'rgba(16,185,129,.1)':'rgba(148,163,184,.1)'}}>
                        {u.status==='active'?'Active':'Inactive'}
                      </span>
                    </td>
                    <td onClick={e=>e.stopPropagation()}>
                      <div className="action-row">
                        <button className="btn btn-ghost btn-sm" onClick={()=>setSelected(u)}>View</button>
                        <button className="btn btn-ghost btn-sm" onClick={()=>toggleStatus(u.id)}>{u.status==='active'?'Disable':'Enable'}</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* User detail modal */}
      {selected && (
        <div className="overlay" onClick={()=>setSelected(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-head">
              <div style={{display:'flex',alignItems:'center',gap:14}}>
                <div className="user-av user-av-lg" style={{background:ROLE_CFG[selected.role]?.grad||'linear-gradient(135deg,#06b6d4,#3b82f6)'}}>{selected.avatar}</div>
                <div>
                  <h2 className="modal-title">{selected.name}</h2>
                  <span className="pill" style={{color:ROLE_CFG[selected.role]?.color,background:ROLE_CFG[selected.role]?.bg}}>{ROLE_CFG[selected.role]?.label}</span>
                </div>
              </div>
              <button className="modal-close" onClick={()=>setSelected(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="info-grid">
                {[{l:'Username',v:selected.username},{l:'Email',v:selected.email},{l:'Department',v:selected.department},{l:'Last Login',v:selected.lastLogin},{l:'Status',v:selected.status}].map(f=>(
                  <div key={f.l} className="info-item"><span className="info-label">{f.l}</span><span className="info-value">{f.v}</span></div>
                ))}
              </div>
              <div style={{marginTop:18}}>
                <div className="info-label" style={{marginBottom:8}}>Permissions</div>
                <div className="perm-list">
                  {(selected.permissions||[]).map(p=><span key={p} className="perm-tag">{p}</span>)}
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-primary">Edit User</button>
              <button className="btn btn-danger" onClick={()=>{toggleStatus(selected.id);setSelected(null)}}>{selected.status==='active'?'Disable':'Enable'}</button>
              <button className="btn btn-ghost" onClick={()=>setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add user modal */}
      {showAdd && (
        <div className="overlay" onClick={()=>setShowAdd(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-head"><h2 className="modal-title">Add New User</h2><button className="modal-close" onClick={()=>setShowAdd(false)}>&times;</button></div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="field"><label className="field-label">Full Name</label><input className="field-input" placeholder="e.g. Juan Dela Cruz" value={newUser.name} onChange={e=>setNewUser(p=>({...p,name:e.target.value}))}/></div>
                <div className="field"><label className="field-label">Username</label><input className="field-input" placeholder="e.g. jdelacruz" value={newUser.username} onChange={e=>setNewUser(p=>({...p,username:e.target.value}))}/></div>
                <div className="field"><label className="field-label">Email</label><input className="field-input" type="email" placeholder="user@prisma.gov.ph" value={newUser.email} onChange={e=>setNewUser(p=>({...p,email:e.target.value}))}/></div>
                <div className="field"><label className="field-label">Department</label><input className="field-input" placeholder="e.g. Administration" value={newUser.department} onChange={e=>setNewUser(p=>({...p,department:e.target.value}))}/></div>
                <div className="field form-full"><label className="field-label">Role</label>
                  <select className="field-input field-select" value={newUser.role} onChange={e=>setNewUser(p=>({...p,role:e.target.value}))}>
                    <option value="admin">Administrator — Full access</option>
                    <option value="it_staff">IT Staff — Approve requests, shop, budget alerts</option>
                    <option value="regular_staff">Regular Staff — Submit requests only</option>
                  </select>
                </div>
                <div className="field form-full" style={{padding:'10px 14px',background:`${ROLE_CFG[newUser.role]?.color}0d`,border:`1px solid ${ROLE_CFG[newUser.role]?.color}22`,borderRadius:10,fontSize:13,color:'#475569',fontWeight:500}}>
                  {newUser.role==='admin'&&'Full system access — manages catalog, budget, users, and all reports.'}
                  {newUser.role==='it_staff'&&'IT Department — shops catalog, processes requests, provides feedback, receives budget alerts.'}
                  {newUser.role==='regular_staff'&&'Any department — submits IT procurement requests and tracks their status only.'}
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-primary" onClick={handleAdd}>Create User</button>
              <button className="btn btn-ghost" onClick={()=>setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
