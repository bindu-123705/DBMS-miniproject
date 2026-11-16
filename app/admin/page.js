'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/client';

export default function Admin() {
  const [users, setUsers] = useState([]); const [err, setErr] = useState(''); const [msg, setMsg] = useState('');
  const [u, setU] = useState({ name: '', srn: '', email: '', password: '', role: 'student' }); const [c, setC] = useState({ name: '', description: '', head_srn: '' });
  const load = useCallback(() => api('/api/admin/users').then((r) => setUsers(r.data)).catch((e) => setErr(e.message)), []);
  useEffect(() => { load(); }, [load]);
  const run = async (fn, ok) => { setErr(''); setMsg(''); try { await fn(); setMsg(ok); load(); } catch (e) { setErr(e.message); } };
  return (<>
    <h1>Admin</h1>{err && <div className="err">{err}</div>}{msg && <div className="okmsg">{msg}</div>}
    <div className="grid">
      <form className="card" onSubmit={(e) => { e.preventDefault(); run(() => api('/api/admin/users', { method: 'POST', body: u }), 'User created'); }}>
        <b>Create user</b>
        <label>Name</label><input value={u.name} onChange={(e) => setU({ ...u, name: e.target.value })} required />
        <label>SRN</label><input value={u.srn} onChange={(e) => setU({ ...u, srn: e.target.value })} placeholder="PES1UG24CS123" />
        <label>Email</label><input type="email" value={u.email} onChange={(e) => setU({ ...u, email: e.target.value })} required />
        <label>Password</label><input type="password" value={u.password} onChange={(e) => setU({ ...u, password: e.target.value })} required />
        <label>Role</label><select value={u.role} onChange={(e) => setU({ ...u, role: e.target.value })}><option value="student">student</option><option value="club_head">club_head</option><option value="admin">admin</option></select>
        <p><button>Create</button></p></form>
      <form className="card" onSubmit={(e) => { e.preventDefault(); run(() => api('/api/clubs', { method: 'POST', body: c }), 'Club created'); }}>
        <b>Create club</b>
        <label>Name</label><input value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} required />
        <label>Description</label><textarea value={c.description} onChange={(e) => setC({ ...c, description: e.target.value })} />
        <label>Head's SRN</label><input value={c.head_srn} onChange={(e) => setC({ ...c, head_srn: e.target.value })} required />
        <p><button>Create</button></p><p className="muted">A database trigger makes the head a member and promotes their role.</p></form>
    </div>
    <h2>All users</h2>
    <div className="card" style={{ overflowX: 'auto' }}><table><thead><tr><th>Name</th><th>SRN</th><th>Email</th><th>Role</th><th></th></tr></thead><tbody>
      {users.map((x) => (<tr key={x.user_id}><td>{x.name}</td><td>{x.srn}</td><td>{x.email}</td><td>{x.role}</td><td className="row">
        <button className="sm ghost" onClick={() => { const p = prompt(`New password for ${x.name}`); if (p) run(() => api(`/api/admin/users/${x.user_id}`, { method: 'PATCH', body: { password: p } }), 'Password updated'); }}>Reset password</button>
        <button className="sm danger" onClick={() => confirm(`Delete ${x.name}?`) && run(() => api(`/api/admin/users/${x.user_id}`, { method: 'DELETE' }), 'User deleted')}>Delete</button></td></tr>))}</tbody></table></div>
  </>);
}
