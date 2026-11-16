import { route, json } from '@/lib/auth';
import { call, query } from '@/lib/mysql';
import { notify } from '@/lib/mongo';

export const POST = route(null, async (req, { params }, s, db) => {
  const [r] = await call(db, 'sp_register_for_event', [s.uid, params.id]);
  const [e] = await query(db, 'SELECT e.title, c.head_id FROM EVENT e JOIN CLUB c ON c.club_id = e.club_id WHERE e.event_id = ?', [params.id]);
  await notify(s.uid, `Your registration for ${e.title} is confirmed.`);
  if (e.head_id !== s.uid) await notify(e.head_id, `${s.name} registered for ${e.title}. ${r.seats_left} seats left.`);
  return json({ ok: true, seats_left: Number(r.seats_left) });
});

export const DELETE = route(null, async (req, { params }, s, db) => {
  await call(db, 'sp_cancel_registration', [s.uid, params.id]);
  const [e] = await query(db, 'SELECT title FROM EVENT WHERE event_id = ?', [params.id]);
  await notify(s.uid, `Your cancellation for ${e.title} has been recorded.`);
  return json({ ok: true });
});
