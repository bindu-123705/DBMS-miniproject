'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client';

export default function Login() {
  const router = useRouter();
  const [f, setF] = useState({ identifier: '', password: '' });
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    try { await api('/api/auth/login', { method: 'POST', body: f }); router.push('/'); router.refresh(); }
    catch (e) { setErr(e.message); }
  };
  return (
    <div className="login card">
      <h1>EvePort</h1><p className="muted">Sign in with your PES email or SRN</p>
      {err && <div className="err">{err}</div>}
      <form onSubmit={submit}>
        <label>Email or SRN</label><input value={f.identifier} onChange={(e) => setF({ ...f, identifier: e.target.value })} autoFocus />
        <label>Password</label><input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        <p><button style={{ width: '100%' }}>Sign in</button></p>
      </form>
      <p className="muted">Demo: lakshmi.rao@pes.edu (admin) · aarav.sharma@pes.edu (club head) · vikram.patil@pes.edu (student)<br />Password: Password@123</p>
    </div>
  );
}
