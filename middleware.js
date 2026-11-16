import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Front-end gate: no valid token -> /login ; wrong role -> /
export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('token')?.value;
  let role = null;
  if (token) {
    try { role = (await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me'))).payload.role; } catch {}
  }
  if (pathname === '/login') return role ? NextResponse.redirect(new URL('/', req.url)) : NextResponse.next();
  if (!role) return NextResponse.redirect(new URL('/login', req.url));
  if (pathname.startsWith('/admin') && role !== 'admin') return NextResponse.redirect(new URL('/', req.url));
  if (pathname.startsWith('/reports') && role === 'student') return NextResponse.redirect(new URL('/', req.url));
  return NextResponse.next();
}
export const config = { matcher: ['/((?!api|_next|uploads|favicon.ico).*)'] };
