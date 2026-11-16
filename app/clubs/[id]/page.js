'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/client';

export default function ClubPage({ params }) {
  const id = params.id;
  const [d, setD] = useState(null); const [err, setErr] = useState(''); const [msg, setMsg] = useState(''); const [srn, setSrn] = useState('');
  const [ev, setEv] = useState({ title: '', venue: '', event_date: '', capacity: 50, description: '' });
  const load = useCallback(() => api(`/api/clubs/${id}`).then(setD).catch((e) => setErr(e.message)), [id]);
  useEffect(() => { load(); }, [load]);
  const run = async (fn, ok) => { setErr(''); setMsg(''); try { await fn(); setMsg(ok); load(); } catch (e) { setErr(e.message); } };
  if (!d) return <>{err ? <div className="err">{err}</div> : <p className="muted">Loading…</p>}</>;
  const { club, members, events, pending, can_manage } = d;
  return (<>
    <h1>{club.name}</h1><p>{club.description}</p><p className="muted">Head: <Link href={`/profile/${club.head_id}`}>{club.head_name}</Link> · {members.length} members</p>
    {err && <div className="err">{err}</div>}{msg && <div className="okmsg">{msg}</div>}

    {can_manage && pending.length > 0 && (<><h2>Posts waiting for approval</h2>
      {pending.map((p) => (<div className="card" key={p.post_id}><b>{p.title}</b> <span className="muted">by {p.author_name}</span><p>{p.caption}</p>
        <button className="sm" onClick={() => run(() => api(`/api/posts/${p.post_id}/review`, { method: 'PATCH', body: { status: 'published' } }), 'Post approved')}>Approve</button>{' '}
        <button className="sm danger" onClick={() => run(() => api(`/api/posts/${p.post_id}/review`, { method: 'PATCH', body: { status: 'rejected' } }), 'Post rejected')}>Reject</button></div>))}</>)}

    <h2>Events</h2>
    {events.map((e) => <div className="card row between" key={e.event_id}><div><b>{e.title}</b><div className="muted">{e.venue} · {e.event_date}</div></div><span className="pill">{e.seats_left} / {e.capacity} seats left</span></div>)}
    {!events.length && <p className="muted">No events yet.</p>}
    {can_manage && (<form className="card" onSubmit={(e) => { e.preventDefault(); run(() => api('/api/events', { method: 'POST', body: { ...ev, club_id: Number(id) } }), 'Event created'); }}>
      <b>Create event</b>
      <label>Title</label><input value={ev.title} onChange={(e) => setEv({ ...ev, title: e.target.value })} required />
      <label>Venue</label><input value={ev.venue} onChange={(e) => setEv({ ...ev, venue: e.target.value })} required />
      <div className="row"><div className="grow"><label>Date & time</label><input type="datetime-local" value={ev.event_date} onChange={(e) => setEv({ ...ev, event_date: e.target.value })} required /></div>
        <div><label>Capacity</label><input type="number" min="1" value={ev.capacity} onChange={(e) => setEv({ ...ev, capacity: e.target.value })} /></div></div>
      <label>Description</label><textarea value={ev.description} onChange={(e) => setEv({ ...ev, description: e.target.value })} />
      <p><button>Create</button></p></form>)}

    <h2>Members</h2>
    <div className="card"><table><thead><tr><th>Name</th><th>SRN</th><th>Joined</th><th></th></tr></thead><tbody>
      {members.map((m) => (<tr key={m.user_id}><td><Link href={`/profile/${m.user_id}`}>{m.name}</Link>{m.user_id === club.head_id && <> <span className="pill">head</span></>}</td><td>{m.srn}</td><td>{m.joined_at.slice(0, 10)}</td>
        <td>{can_manage && m.user_id !== club.head_id && <button className="sm danger" onClick={() => run(() => api(`/api/clubs/${id}/members`, { method: 'DELETE', body: { user_id: m.user_id } }), 'Member removed')}>Remove</button>}</td></tr>))}</tbody></table>
      {can_manage && (<div className="row" style={{ marginTop: 10 }}><input className="grow" placeholder="Add member by SRN e.g. PES1UG24CS101" value={srn} onChange={(e) => setSrn(e.target.value)} />
        <button onClick={() => run(async () => { await api(`/api/clubs/${id}/members`, { method: 'POST', body: { srn } }); setSrn(''); }, 'Member added')}>Add</button></div>)}
    </div>
  </>);
}
