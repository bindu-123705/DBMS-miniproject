import bcrypt from 'bcryptjs';
import { json, signToken, handleError } from '@/lib/auth';
import { call } from '@/lib/mysql';

export async function POST(req) {
  try {
    const { identifier, password } = await req.json();
    if (!identifier || !password) return json({ message: 'Email/SRN and password required' }, 400);
    const [u] = await call('auth', 'sp_login', [identifier.trim()]);
    if (!u || !(await bcrypt.compare(password, u.password_hash))) return json({ message: 'Invalid credentials' }, 401);
    const token = await signToken({ uid: u.user_id, name: u.name, role: u.role, srn: u.srn });
    const res = json({ user: { id: u.user_id, name: u.name, role: u.role, srn: u.srn } });
    res.cookies.set('token', token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 7 * 86400 });
    return res;
  } catch (e) { return handleError(e); }
}
