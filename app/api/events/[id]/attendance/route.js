import { route, json } from '@/lib/auth';
import { query, call } from '@/lib/mysql';

export const GET = route(['club_head', 'admin'], async (req, { params }, s, db) => {
  const [e] = await query(db, 'SELECT fn_can_manage_club(?, club_id) AS can FROM EVENT WHERE event_id = ?', [s.uid, params.id]);
  if (!e || !e.can) return json({ message: 'Only the hosting club head can see attendees' }, 403);
  const rows = await query(db, `SELECT u.user_id, u.name, u.srn, rf.registered_at, rf.attendance_status FROM REGISTERS_FOR rf JOIN \`USER\` u ON u.user_id = rf.user_id WHERE rf.event_id = ? ORDER BY rf.registered_at`, [params.id]);
  return json({ data: rows });
});

export const PATCH = route(['club_head', 'admin'], async (req, { params }, s, db) => {
  const { user_id, status } = await req.json();
  await call(db, 'sp_mark_attendance', [s.uid, params.id, user_id, status]);
  return json({ ok: true });
});

// cursor-based finalize: everyone still 'registered' -> 'absent'
export const POST = route(['club_head', 'admin'], async (req, { params }, s, db) => {
  const [r] = await call(db, 'sp_finalize_event', [s.uid, params.id]);
  return json({ marked_absent: Number(r.marked_absent) });
});
export const dynamic = 'force-dynamic';
