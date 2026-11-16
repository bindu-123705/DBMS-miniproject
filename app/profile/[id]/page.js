'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/client';

export default function Profile({ params }) {
  const [d, setD] = useState(null); const [err, setErr] = useState(''); const [msg, setMsg] = useState(''); const [edit, setEdit] = useState(false); const [f, setF] = useState({});
  const load = () => api(`/api/profile/${params.id}`).then((r) => { setD(r); setF({ about: r.user.about || '', photo_url: r.user.photo_url || '', resume_url: r.user.resume_url || '', links: Object.entries(r.user.social_links || {}).map(([k, v]) => `${k}=${v}`).join('\n') }); }).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, [params.id]);
  const save = async () => {
    const social_links = Object.fromEntries(f.links.split('\n').map((l) => l.split(/=(.+)/)).filter((x) => x[0] && x[1]).map((x) => [x[0].trim(), x[1].trim()]));
    try { await api(`/api/profile/${params.id}`, { method: 'PATCH', body: { about: f.about, photo_url: f.photo_url, resume_url: f.resume_url, social_links } }); setMsg('Saved'); setEdit(false); load(); } catch (e) { setErr(e.message); }
  };
  if (!d) return err ? <div className="err">{err}</div> : <p className="muted">Loading…</p>;
  const u = d.user;
  return (<>
    {err && <div className="err">{err}</div>}{msg && <div className="okmsg">{msg}</div>}
    <div className="card">
      <div className="row between"><h1 style={{ margin: 0 }}>{u.name}</h1>{d.own && <button className="ghost" onClick={() => setEdit(!edit)}>{edit ? 'Cancel' : 'Edit profile'}</button>}</div>
      <div className="muted">{u.srn || 'Staff'} · {u.email} · <span className="pill">{u.role.replace('_', ' ')}</span></div>
      {edit ? (<>
        <label>About</label><textarea value={f.about} onChange={(e) => setF({ ...f, about: e.target.value })} />
        <label>Photo URL</label><input value={f.photo_url} onChange={(e) => setF({ ...f, photo_url: e.target.value })} />
        <label>Resume URL</label><input value={f.resume_url} onChange={(e) => setF({ ...f, resume_url: e.target.value })} />
        <label>Social links (one per line: name=url)</label><textarea value={f.links} onChange={(e) => setF({ ...f, links: e.target.value })} />
        <p><button onClick={save}>Save</button></p></>) : (<>
        {u.photo_url && <p><img src={u.photo_url} alt="" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover' }} /></p>}
        <p>{u.about || <span className="muted">No bio yet.</span>}</p>
        {u.resume_url && <p><a href={u.resume_url} target="_blank" rel="noreferrer">Resume</a></p>}
        <div className="row">{Object.entries(u.social_links || {}).map(([k, v]) => <a key={k} className="pill" href={v} target="_blank" rel="noreferrer">{k}</a>)}</div></>)}
    </div>
    <h2>Clubs</h2><div className="row">{d.clubs.map((c) => <Link key={c.club_id} className="pill" href={`/clubs/${c.club_id}`}>{c.name}</Link>)}{!d.clubs.length && <span className="muted">None</span>}</div>
    <h2>Recent events</h2><div className="card"><table><tbody>{d.events.map((e, i) => <tr key={i}><td>{e.title}</td><td>{e.event_date.slice(0, 10)}</td><td>{e.attendance_status}</td></tr>)}{!d.events.length && <tr><td className="muted">None</td></tr>}</tbody></table></div>
  </>);
}
