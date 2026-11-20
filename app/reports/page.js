'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client';

const Table = ({ title, note, rows, cols }) => (
  <div className="card"><b>{title}</b><div className="muted">{note}</div>
    <div style={{ overflowX: 'auto' }}><table><thead><tr>{cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{cols.map((c) => <td key={c}>{String(r[c] ?? '')}</td>)}</tr>)}{!rows.length && <tr><td className="muted">No rows</td></tr>}</tbody></table></div></div>);

export default function Reports() {
  const [d, setD] = useState(null); const [err, setErr] = useState('');
  useEffect(() => { api('/api/reports').then(setD).catch((e) => setErr(e.message)); }, []);
  if (!d) return err ? <div className="err">{err}</div> : <p className="muted">Loading…</p>;
  return (<>
    <h1>Reports</h1>
    <Table title="Club activity ranking" note="MySQL · CTE + LEFT JOIN + RANK() window function" rows={d.clubActivity} cols={['activity_rank', 'name', 'members', 'events', 'posts', 'likes']} />
    <Table title="Event fill rate" note="MySQL · view v_event_stats" rows={d.eventFill} cols={['title', 'club', 'capacity', 'active_regs', 'attended', 'fill_pct']} />
    <Table title="Events beating their club's average registrations" note="MySQL · correlated subquery" rows={d.aboveAvg} cols={['title', 'club', 'regs']} />
    <Table title="Upcoming calendar (next 30 days)" note="MySQL · recursive CTE generates the days" rows={d.calendar} cols={['day', 'events', 'titles']} />
    <Table title="Users who never registered for an event" note="MySQL · NOT EXISTS (nested query)" rows={d.inactive} cols={['name', 'srn']} />
    <Table title="Top commenters" note="MongoDB · $unwind + $group" rows={d.topCommenters} cols={['name', 'total']} />
    <Table title="Most discussed posts (post id)" note="MongoDB · $project + $size" rows={d.mostDiscussed} cols={['post_id', 'comments']} />
  </>);
}
