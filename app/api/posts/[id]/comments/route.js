import { route, json } from '@/lib/auth';
import { query } from '@/lib/mysql';
import { mongo, notify } from '@/lib/mongo';

async function withNames(db, comments) {
  const ids = [...new Set(comments.map((c) => c.user_id))];
  const users = ids.length ? await query(db, 'SELECT user_id, name FROM `USER` WHERE user_id IN (?)', [ids]) : [];
  const names = Object.fromEntries(users.map((u) => [u.user_id, u.name]));
  return comments.map((c) => ({ ...c, user_name: names[c.user_id] || 'Unknown' }));
}

// READ comments of a post (MongoDB)
export const GET = route(null, async (req, { params }, s, db) => {
  const { content } = await mongo();
  const doc = await content.findOne({ post_id: Number(params.id) });
  return json({ data: await withNames(db, doc?.comments || []) });
});

// CREATE a comment or a reply (MongoDB)
export const POST = route(null, async (req, { params }, s, db) => {
  const postId = Number(params.id);
  const { text, parent_comment_id = null } = await req.json();
  if (!text?.trim()) return json({ message: 'text required' }, 400);
  const [post] = await query(db, "SELECT author_id, title FROM POST WHERE post_id = ? AND status = 'published'", [postId]);
  if (!post) return json({ message: 'Post not found' }, 404);
  const { content } = await mongo();
  const doc = await content.findOne({ post_id: postId });
  const comments = doc?.comments || [];
  if (parent_comment_id && !comments.some((c) => c.comment_id === parent_comment_id)) return json({ message: 'Parent comment not found' }, 404);
  const comment = { comment_id: comments.reduce((m, c) => Math.max(m, c.comment_id), 0) + 1, user_id: s.uid, parent_comment_id, text: text.trim(), created_at: new Date() };
  await content.updateOne({ post_id: postId }, { $push: { comments: comment }, $setOnInsert: { media: [] } }, { upsert: true });
  if (post.author_id !== s.uid) await notify(post.author_id, `${s.name} commented on your post '${post.title}'.`);
  return json({ comment: { ...comment, user_name: s.name } }, 201);
});
export const dynamic = 'force-dynamic';
