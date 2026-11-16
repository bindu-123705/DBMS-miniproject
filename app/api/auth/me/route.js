import { route, json } from '@/lib/auth';
import { query } from '@/lib/mysql';
import { mongo } from '@/lib/mongo';

export const GET = route(null, async (req, ctx, s, db) => {
  const clubs = await query(db, `SELECT c.club_id, c.name, (c.head_id = ?) AS is_head FROM MEMBER_OF m JOIN CLUB c ON c.club_id = m.club_id WHERE m.user_id = ?`, [s.uid, s.uid]);
  let unread = 0;
  try {
    const { notifications } = await mongo();
    const r = await notifications.aggregate([{ $match: { user_id: s.uid } }, { $project: { n: { $size: { $filter: { input: '$notifications', cond: { $eq: ['$$this.is_read', false] } } } } } }]).toArray();
    unread = r[0]?.n || 0;
  } catch {}
  return json({ user: { id: s.uid, name: s.name, role: s.role, srn: s.srn }, clubs, unread });
});
export const dynamic = 'force-dynamic';
