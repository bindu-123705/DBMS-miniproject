'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/client';

function Media({ items }) {
  if (!items?.length) return null;
  return (
    <div className="media">
      {items.map((m) => m.media_type === 'image' ? <img key={m.media_id} src={m.url} alt="" />
        : m.media_type === 'video' ? <video key={m.media_id} src={m.url} controls />
        : m.media_type === 'audio' ? <audio key={m.media_id} src={m.url} controls />
        : <a key={m.media_id} href={m.url} target="_blank" rel="noreferrer">📎 {m.url.split('/').pop()}</a>)}
    </div>
  );
}

function Comment({ c, all, me, canModerate, reload, depth = 0 }) {
  const [editing, setEditing] = useState(false); const [text, setText] = useState(c.text);
  const [replying, setReplying] = useState(false); const [reply, setReply] = useState('');
  const kids = all.filter((x) => x.parent_comment_id === c.comment_id);
  const base = `/api/posts/${c.post_id}/comments`;
  const save = async () => { await api(`${base}/${c.comment_id}`, { method: 'PATCH', body: { text } }); setEditing(false); reload(); };
  const del = async () => { if (confirm('Delete this comment and its replies?')) { await api(`${base}/${c.comment_id}`, { method: 'DELETE' }); reload(); } };
  const send = async () => { if (!reply.trim()) return; await api(base, { method: 'POST', body: { text: reply, parent_comment_id: c.comment_id } }); setReply(''); setReplying(false); reload(); };
  return (
    <div className="comment" style={{ marginLeft: Math.min(depth, 3) * 12 }}>
      <b><Link href={`/profile/${c.user_id}`}>{c.user_name}</Link></b> <span className="muted">{new Date(c.created_at).toLocaleString()}{c.edited_at && ' (edited)'}</span>
      {editing ? (<div className="row"><input className="grow" value={text} onChange={(e) => setText(e.target.value)} /><button className="sm" onClick={save}>Save</button><button className="sm ghost" onClick={() => setEditing(false)}>Cancel</button></div>) : <div>{c.text}</div>}
      <div className="row muted">
        <a href="#" onClick={(e) => { e.preventDefault(); setReplying(!replying); }}>Reply</a>
        {c.user_id === me && <a href="#" onClick={(e) => { e.preventDefault(); setEditing(true); }}>Edit</a>}
        {(c.user_id === me || canModerate) && <a href="#" onClick={(e) => { e.preventDefault(); del(); }}>Delete</a>}
      </div>
      {replying && <div className="row"><input className="grow" placeholder="Write a reply…" value={reply} onChange={(e) => setReply(e.target.value)} /><button className="sm" onClick={send}>Send</button></div>}
      {kids.map((k) => <Comment key={k.comment_id} c={k} all={all} me={me} canModerate={canModerate} reload={reload} depth={depth + 1} />)}
    </div>
  );
}

export default function PostCard({ post, me, canModerate, onChanged }) {
  const [liked, setLiked] = useState(post.liked); const [likes, setLikes] = useState(post.likes);
  const [open, setOpen] = useState(false); const [comments, setComments] = useState([]); const [text, setText] = useState('');
  const [count, setCount] = useState(post.comment_count);
  const loadComments = async () => { const r = await api(`/api/posts/${post.post_id}/comments`); setComments(r.data.map((c) => ({ ...c, post_id: post.post_id }))); setCount(r.data.length); };
  const like = async () => { const r = await api(`/api/posts/${post.post_id}/like`, { method: 'POST' }); setLiked(r.liked); setLikes(r.likes); };
  const toggle = async () => { if (!open) await loadComments(); setOpen(!open); };
  const add = async () => { if (!text.trim()) return; await api(`/api/posts/${post.post_id}/comments`, { method: 'POST', body: { text } }); setText(''); loadComments(); };
  const archive = async () => { if (confirm('Archive this post?')) { await api(`/api/posts/${post.post_id}/review`, { method: 'PATCH', body: { status: 'archived' } }); onChanged?.(); } };
  return (
    <div className="card">
      <div className="row between"><div><b>{post.title}</b><div className="muted"><Link href={`/clubs/${post.club_id}`}>{post.club_name}</Link> · by <Link href={`/profile/${post.author_id}`}>{post.author_name}</Link> · {new Date(post.created_at).toLocaleDateString()}</div></div>
        {canModerate?.(post.club_id) && <button className="sm ghost" onClick={archive}>Archive</button>}</div>
      <p>{post.caption}</p><Media items={post.media} />
      <div className="row"><button className={liked ? '' : 'ghost'} onClick={like}>{liked ? '♥' : '♡'} {likes}</button><button className="ghost" onClick={toggle}>💬 {count}</button></div>
      {open && (<div style={{ marginTop: 10 }}>
        {comments.filter((c) => !c.parent_comment_id).map((c) => <Comment key={c.comment_id} c={c} all={comments} me={me} canModerate={canModerate?.(post.club_id)} reload={loadComments} />)}
        <div className="row" style={{ marginTop: 8 }}><input className="grow" placeholder="Add a comment…" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} /><button onClick={add}>Post</button></div>
      </div>)}
    </div>
  );
}
