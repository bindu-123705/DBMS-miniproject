'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/client';

export default function Notifications() {
  const [list, setList] = useState([]); const [err, setErr] = useState('');
  const load = useCallback(() => api('/api/notifications').then((r) => setList(r.data)).catch((e) => setErr(e.message)), []);
  useEffect(() => { load(); }, [load]);
  const act = async (method, body) => { await api('/api/notifications', { method, body }); load(); };
  return (<>
    <div className="row between"><h1>Notifications</h1>
      <div className="row"><button className="ghost sm" onClick={() => act('PATCH', { all: true })}>Mark all read</button><button className="ghost sm" onClick={() => confirm('Clear all?') && act('DELETE', { all: true })}>Clear all</button></div></div>
    {err && <div className="err">{err}</div>}
    {list.map((n) => (<div key={n.notification_id} className={`card row between ${n.is_read ? '' : 'unread'}`}>
      <div><div>{n.message}</div><div className="muted">{new Date(n.created_at).toLocaleString()}</div></div>
      <div className="row">{!n.is_read && <button className="sm" onClick={() => act('PATCH', { id: n.notification_id })}>Mark read</button>}<button className="sm ghost" onClick={() => act('DELETE', { id: n.notification_id })}>Delete</button></div></div>))}
    {!list.length && <p className="muted">You're all caught up.</p>}
  </>);
}
