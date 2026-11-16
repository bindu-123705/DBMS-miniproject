import { route, json } from '@/lib/auth';
import { query } from '@/lib/mysql';

export const GET = route(null, async (req, { params }, s, db) => {
  const id = Number(params.id);
  const [club] = await query(db, `SELECT c.club_id, c.name, c.description, c.head_id, h.name AS head_name, c.created_at
                                  FROM CLUB c JOIN \`USER\` h ON h.user_id = c.head_id WHERE c.club_id = ?`, [id]);
  if (!club) return json({ message: 'Club not found' }, 404);
  const [{ can }] = await query(db, 'SELECT fn_can_manage_club(?, ?) AS can', [s.uid, id]);
  const members = await query(db, `SELECT u.user_id, u.name, u.srn, m.joined_at FROM MEMBER_OF m JOIN \`USER\` u ON u.user_id = m.user_id WHERE m.club_id = ? ORDER BY m.joined_at`, [id]);
  const events = await query(db, `SELECT event_id, title, venue, event_date, capacity, fn_seats_left(event_id) AS seats_left FROM EVENT WHERE club_id = ? ORDER BY event_date DESC`, [id]);
  const pending = can ? await query(db, `SELECT p.post_id, p.title, p.caption, p.created_at, u.name AS author_name FROM POST p JOIN \`USER\` u ON u.user_id = p.author_id WHERE p.club_id = ? AND p.status = 'pending' ORDER BY p.created_at`, [id]) : [];
  return json({ club, members, events, pending, can_manage: !!can, is_member: members.some((m) => m.user_id === s.uid) });
});

export const DELETE = route(['admin'], async (req, { params }, s, db) => {
  await query(db, 'DELETE FROM CLUB WHERE club_id = ?', [params.id]);
  return json({ ok: true });
});
export const dynamic = 'force-dynamic';
