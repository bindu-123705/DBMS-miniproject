'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/client';
import PostCard from '@/components/PostCard';

export default function Feed() {
  const [me, setMe] = useState(null); const [posts, setPosts] = useState([]); const [err, setErr] = useState(''); const [msg, setMsg] = useState('');
  const [f, setF] = useState({ club_id: '', title: '', caption: '' }); const [files, setFiles] = useState([]); const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try { const [m, p] = await Promise.all([api('/api/auth/me'), api('/api/feed')]); setMe(m); setPosts(p.data); setF((x) => ({ ...x, club_id: x.club_id || m.clubs[0]?.club_id || '' })); }
    catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const canModerate = (clubId) => me?.user.role === 'admin' || me?.clubs.some((c) => c.club_id === clubId && c.is_head);
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setMsg(''); setBusy(true);
    try {
      let media = [];
      if (files.length) { const fd = new FormData(); files.forEach((x) => fd.append('files', x)); media = (await api('/api/upload', { method: 'POST', body: fd })).files; }
      const r = await api('/api/posts', { method: 'POST', body: { ...f, media } });
      setMsg(r.status === 'published' ? 'Posted!' : 'Sent to the club head for approval.'); setF({ ...f, title: '', caption: '' }); setFiles([]); e.target.reset(); load();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  return (<>
    <h1>Feed</h1>
    {err && <div className="err">{err}</div>}{msg && <div className="okmsg">{msg}</div>}
    {me?.clubs.length > 0 && (
      <form className="card" onSubmit={submit}>
        <b>New post</b>
        <label>Club</label><select value={f.club_id} onChange={(e) => setF({ ...f, club_id: e.target.value })}>{me.clubs.map((c) => <option key={c.club_id} value={c.club_id}>{c.name}</option>)}</select>
        <label>Title</label><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required />
        <label>Caption</label><textarea value={f.caption} onChange={(e) => setF({ ...f, caption: e.target.value })} />
        <label>Media (images, video, audio, pdf)</label><input type="file" multiple onChange={(e) => setFiles([...e.target.files])} />
        <p><button disabled={busy}>{busy ? 'Posting…' : 'Post'}</button> <span className="muted">Heads publish instantly; members' posts wait for approval.</span></p>
      </form>)}
    {posts.map((p) => <PostCard key={p.post_id} post={p} me={me?.user.id} canModerate={canModerate} onChanged={load} />)}
    {!posts.length && <p className="muted">No posts yet.</p>}
  </>);
}
