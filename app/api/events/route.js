import { route, json } from '@/lib/auth';
import { query, call } from '@/lib/mysql';

export const GET = route(null, async (req, ctx, s, db) => {
  const rows = await query(db, `
    SELECT e.event_id, e.club_id, c.name AS club_name, e.title, e.description, e.venue, e.event_date, e.capacity,
           fn_seats_left(e.event_id) AS seats_left, rf.attendance_status AS my_status,
           fn_can_manage_club(?, e.club_id) AS can_manage
    FROM EVENT e JOIN CLUB c ON c.club_id = e.club_id
    LEFT JOIN REGISTERS_FOR rf ON rf.event_id = e.event_id AND rf.user_id = ?
    ORDER BY e.event_date`, [s.uid, s.uid]);
  return json({ data: rows.map((r) => ({ ...r, can_manage: !!r.can_manage })), now: new Date().toISOString().slice(0, 19).replace('T', ' ') });
});

export const POST = route(['club_head', 'admin'], async (req, ctx, s, db) => {
  const b = await req.json();
  if (!b.club_id || !b.title?.trim() || !b.venue?.trim() || !b.event_date || !b.capacity) return json({ message: 'club, title, venue, date and capacity required' }, 400);
  const date = String(b.event_date).replace('T', ' ').slice(0, 19).padEnd(19, ':00').slice(0, 19);
  const [r] = await call(db, 'sp_create_event', [s.uid, b.club_id, b.title.trim(), b.description || '', b.venue.trim(), date, Number(b.capacity)]);
  return json({ event_id: r.event_id }, 201);
});
export const dynamic = 'force-dynamic';
