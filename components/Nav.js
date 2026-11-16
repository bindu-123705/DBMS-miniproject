'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client';

export default function Nav() {
  const path = usePathname(); const router = useRouter();
  const [me, setMe] = useState(null);
  useEffect(() => { if (path !== '/login') api('/api/auth/me').then(setMe).catch(() => {}); }, [path]);
  if (path === '/login') return null;
  const role = me?.user.role;
  const links = [['/', 'Feed'], ['/clubs', 'Clubs'], ['/events', 'Events'], ['/notifications', 'Notifications']];
  if (role === 'club_head' || role === 'admin') links.push(['/reports', 'Reports']);
  if (role === 'admin') links.push(['/admin', 'Admin']);
  const logout = async () => { await api('/api/auth/logout', { method: 'POST' }); router.push('/login'); router.refresh(); };
  return (
    <nav className="top">
      <span className="logo">EvePort</span>
      {links.map(([h, l]) => (
        <Link key={h} href={h} className={path === h ? 'on' : ''}>{l}{h === '/notifications' && me?.unread > 0 && <span className="badge">{me.unread}</span>}</Link>
      ))}
      <span className="sp" />
      {me && <Link href={`/profile/${me.user.id}`}>{me.user.name} <span className="pill">{role.replace('_', ' ')}</span></Link>}
      <button className="ghost sm" onClick={logout}>Log out</button>
    </nav>
  );
}
