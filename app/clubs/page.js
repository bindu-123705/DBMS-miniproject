'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/client';

export default function Clubs() {
  const [clubs, setClubs] = useState([]); const [err, setErr] = useState('');
  useEffect(() => { api('/api/clubs').then((r) => setClubs(r.data)).catch((e) => setErr(e.message)); }, []);
  return (<>
    <h1>Clubs</h1>{err && <div className="err">{err}</div>}
    <div className="grid">{clubs.map((c) => (
      <div className="card" key={c.club_id}>
        <b><Link href={`/clubs/${c.club_id}`}>{c.name}</Link></b> {c.is_member && <span className="pill ok">member</span>}
        <p className="muted">{c.description}</p>
        <div className="muted">Head: {c.head_name} · {c.members} members</div>
      </div>))}</div>
  </>);
}
