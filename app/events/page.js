'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/client';

export default function Events() {
  const [events, setEvents] = useState([]); const [now, setNow] = useState(''); const [err, setErr] = useState(''); const [msg, setMsg] = useState('');
  const [open, setOpen] = useState(null); const [att, setAtt] = useState([]);
  const load = useCallback(() => api('/api/events').then((r) => { setEvents(r.data); setNow(r.now); }).catch((e) => setErr(e.message)), []);
  useEffect(() => { load(); }, [load]);
  const run = async (fn, ok) => { setErr(''); setMsg(''); try { await fn(); if (ok) setMsg(ok); load(); } catch (e) { setErr(e.message); } };
  const loadAtt = async (id) => { setOpen(id); setAtt((await api(`/api/events/${id}/attendance`)).data); };
  const mark = (id, uid, status) => run(async () => { await api(`/api/events/${id}/attendance`, { method: 'PATCH', body: { user_id: uid, status } }); await loadAtt(id); });
  const upcoming = events.filter((e) => e.event_date >= now), past = events.filter((e) => e.event_date < now);
  const Card = ({ e, isPast }) => (
    <div className="card">
      <div className="row between"><div><b>{e.title}</b> <span className="muted">· {e.club_name}</span><div className="muted">{e.venue} · {e.event_date.slice(0, 16)}</div></div>
        <span className={`pill ${e.seats_left <= 0 ? 'bad' : ''}`}>{e.seats_left} / {e.capacity} seats</span></div>
      <p>{e.description}</p>
      <div className="row">
        {e.my_status && <span className={`pill ${e.my_status === 'attended' ? 'ok' : e.my_status === 'cancelled' || e.my_status === 'absent' ? 'bad' : ''}`}>{e.my_status}</span>}
        {!isPast && (!e.my_status || e.my_status === 'cancelled') && <button disabled={e.seats_left <= 0} onClick={() => run(() => api(`/api/events/${e.event_id}/register`, { method: 'POST' }), 'Registered!')}>{e.seats_left <= 0 ? 'Full' : 'Register'}</button>}
        {!isPast && e.my_status === 'registered' && <button className="ghost" onClick={() => run(() => api(`/api/events/${e.event_id}/register`, { method: 'DELETE' }), 'Registration cancelled')}>Cancel registration</button>}
        {e.can_manage && <button className="ghost" onClick={() => (open === e.event_id ? setOpen(null) : loadAtt(e.event_id))}>Attendees</button>}
        {e.can_manage && isPast && <button className="ghost" onClick={() => run(async () => { const r = await api(`/api/events/${e.event_id}/attendance`, { method: 'POST' }); setMsg(`${r.marked_absent} no-shows marked absent`); })}>Finalize</button>}
        {e.can_manage && <button className="sm danger" onClick={() => confirm('Delete this event?') && run(() => api(`/api/events/${e.event_id}`, { method: 'DELETE' }), 'Event deleted')}>Delete</button>}
      </div>
      {open === e.event_id && (<table style={{ marginTop: 10 }}><thead><tr><th>Name</th><th>SRN</th><th>Status</th><th></th></tr></thead><tbody>
        {att.map((a) => <tr key={a.user_id}><td>{a.name}</td><td>{a.srn}</td><td>{a.attendance_status}</td><td>{a.attendance_status !== 'cancelled' && <>
          <button className="sm" onClick={() => mark(e.event_id, a.user_id, 'attended')}>Present</button>{' '}<button className="sm ghost" onClick={() => mark(e.event_id, a.user_id, 'absent')}>Absent</button></>}</td></tr>)}
        {!att.length && <tr><td colSpan="4" className="muted">No registrations yet</td></tr>}</tbody></table>)}
    </div>);
  return (<>
    <h1>Events</h1>{err && <div className="err">{err}</div>}{msg && <div className="okmsg">{msg}</div>}
    <h2>Upcoming</h2>{upcoming.map((e) => <Card key={e.event_id} e={e} />)}{!upcoming.length && <p className="muted">Nothing scheduled.</p>}
    <h2>Past</h2>{past.map((e) => <Card key={e.event_id} e={e} isPast />)}
  </>);
}
