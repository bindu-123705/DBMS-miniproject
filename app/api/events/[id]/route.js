import { route, json } from '@/lib/auth';
import { query } from '@/lib/mysql';
// cancel an event: r_head holds DELETE on EVENT; ownership is checked here
export const DELETE = route(['club_head', 'admin'], async (req, { params }, s, db) => {
  const [e] = await query(db, 'SELECT fn_can_manage_club(?, club_id) AS can FROM EVENT WHERE event_id = ?', [s.uid, params.id]);
  if (!e) return json({ message: 'Event not found' }, 404);
  if (!e.can) return json({ message: 'Only the hosting club head can delete this event' }, 403);
  await query(db, 'DELETE FROM EVENT WHERE event_id = ?', [params.id]);
  return json({ ok: true });
});
