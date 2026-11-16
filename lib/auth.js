import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { dbRole } from './mysql';

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me');

export const signToken = (payload) =>
  new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('7d').sign(secret());

export async function getSession() {
  const token = cookies().get('token')?.value;
  if (!token) return null;
  try { return (await jwtVerify(token, secret())).payload; } catch { return null; }
}

export const json = (data, status = 200) => NextResponse.json(data, { status });

// translate MySQL / Mongo errors into HTTP responses
export function handleError(e) {
  if (e?.sqlState === '45000') return json({ message: e.sqlMessage }, 400);   // business rule raised by a procedure/trigger
  if (e?.sqlState === '42000' && e.errno === 1644) return json({ message: e.sqlMessage }, 403); // authorization raised by a procedure
  if (e?.errno === 1142 || e?.errno === 1370 || e?.errno === 1143) return json({ message: 'Your role is not allowed to do this (database permission)' }, 403);
  if (e?.errno === 1062) return json({ message: 'Already exists (duplicate value)' }, 409);
  if (e?.errno === 1451) return json({ message: 'Cannot delete: other records depend on this one' }, 409);
  if (e?.errno === 3819 || e?.errno === 4025) return json({ message: 'A value broke a database constraint' }, 400);
  console.error(e);
  return json({ message: 'Server error' }, 500);
}

// route(['admin','club_head'], async (req, ctx, session, db) => ...)
export function route(roles, fn) {
  return async (req, ctx) => {
    try {
      const s = await getSession();
      if (!s) return json({ message: 'Not logged in' }, 401);
      if (roles && !roles.includes(s.role)) return json({ message: 'Forbidden for your role' }, 403);
      return await fn(req, ctx, { ...s, uid: Number(s.uid) }, dbRole(s.role));
    } catch (e) { return handleError(e); }
  };
}
