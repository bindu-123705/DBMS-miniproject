import bcrypt from 'bcryptjs';
import { route, json } from '@/lib/auth';
import { query } from '@/lib/mysql';
import { mongo } from '@/lib/mongo';

export const PATCH = route(['admin'], async (req, { params }, s, db) => {
  const { password, role } = await req.json();
  if (password) await query(db, 'UPDATE `USER` SET password_hash = ? WHERE user_id = ?', [await bcrypt.hash(password, 10), params.id]);
  if (role) {
    if (!['student', 'club_head', 'admin'].includes(role)) return json({ message: 'Invalid role' }, 400);
    await query(db, 'UPDATE `USER` SET role = ? WHERE user_id = ?', [role, params.id]);
  }
  return json({ ok: true });
});

export const DELETE = route(['admin'], async (req, { params }, s, db) => {
  if (Number(params.id) === s.uid) return json({ message: 'You cannot delete yourself' }, 400);
  await query(db, 'DELETE FROM `USER` WHERE user_id = ?', [params.id]);   // FK RESTRICT blocks heads / authors
  const { notifications } = await mongo();
  await notifications.deleteOne({ user_id: Number(params.id) });
  return json({ ok: true });
});
