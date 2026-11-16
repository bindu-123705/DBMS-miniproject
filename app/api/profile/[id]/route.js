import { route, json } from '@/lib/auth';
import { query } from '@/lib/mysql';

export const GET = route(null, async (req, { params }, s, db) => {
  const [u] = await query(db, `SELECT u.user_id, u.name, u.srn, u.email, u.role, u.created_at, p.photo_url, p.about, p.resume_url, p.social_links
                               FROM \`USER\` u LEFT JOIN PROFILE p ON p.user_id = u.user_id WHERE u.user_id = ?`, [params.id]);
  if (!u) return json({ message: 'User not found' }, 404);
  const clubs = await query(db, 'SELECT c.club_id, c.name FROM MEMBER_OF m JOIN CLUB c ON c.club_id = m.club_id WHERE m.user_id = ?', [params.id]);
  const events = await query(db, `SELECT e.title, e.event_date, rf.attendance_status FROM REGISTERS_FOR rf JOIN EVENT e ON e.event_id = rf.event_id WHERE rf.user_id = ? ORDER BY e.event_date DESC LIMIT 10`, [params.id]);
  if (typeof u.social_links === 'string') { try { u.social_links = JSON.parse(u.social_links); } catch { u.social_links = {}; } }
  return json({ user: u, clubs, events, own: Number(params.id) === s.uid });
});

export const PATCH = route(null, async (req, { params }, s, db) => {
  if (Number(params.id) !== s.uid) return json({ message: 'You can only edit your own profile' }, 403);
  const { about = null, photo_url = null, resume_url = null, social_links = {} } = await req.json();
  await query(db, 'UPDATE PROFILE SET about = ?, photo_url = ?, resume_url = ?, social_links = ? WHERE user_id = ?',
    [about, photo_url || null, resume_url || null, JSON.stringify(social_links || {}), s.uid]);
  return json({ ok: true });
});
export const dynamic = 'force-dynamic';
