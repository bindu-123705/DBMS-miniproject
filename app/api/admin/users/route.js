import bcrypt from 'bcryptjs';
import { route, json } from '@/lib/auth';
import { query } from '@/lib/mysql';

export const GET = route(['admin'], async (req, ctx, s, db) =>
  json({ data: await query(db, 'SELECT user_id, name, srn, email, role, created_at FROM `USER` ORDER BY user_id') }));

export const POST = route(['admin'], async (req, ctx, s, db) => {
  const { name, srn, email, password, role = 'student' } = await req.json();
  if (!name || !email || !password || (role !== 'admin' && !srn)) return json({ message: 'name, email, password (and SRN for students) required' }, 400);
  if (!['student', 'club_head', 'admin'].includes(role)) return json({ message: 'Invalid role' }, 400);
  const r = await query(db, 'INSERT INTO `USER` (name, srn, email, password_hash, role) VALUES (?,?,?,?,?)', [name, srn || null, email, await bcrypt.hash(password, 10), role]);
  return json({ user_id: r.insertId }, 201);
});
export const dynamic = 'force-dynamic';
