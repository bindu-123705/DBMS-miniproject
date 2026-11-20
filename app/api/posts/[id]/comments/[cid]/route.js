import { route, json } from '@/lib/auth';
import { query } from '@/lib/mysql';
import { mongo } from '@/lib/mongo';

// UPDATE : only the author can edit their comment
export const PATCH = route(null, async (req, { params }, s) => {
  const { text } = await req.json();
  if (!text?.trim()) return json({ message: 'text required' }, 400);
  const { content } = await mongo();
  const r = await content.updateOne(
    { post_id: Number(params.id), comments: { $elemMatch: { comment_id: Number(params.cid), user_id: s.uid } } },
    { $set: { 'comments.$.text': text.trim(), 'comments.$.edited_at': new Date() } });
  if (!r.matchedCount) return json({ message: 'You can only edit your own comments' }, 403);
  return json({ ok: true });
});

// DELETE : author, the club head, or an admin. Replies are removed with the comment.
export const DELETE = route(null, async (req, { params }, s, db) => {
  const postId = Number(params.id), cid = Number(params.cid);
  const { content } = await mongo();
  const doc = await content.findOne({ post_id: postId });
  const target = doc?.comments?.find((c) => c.comment_id === cid);
  if (!target) return json({ message: 'Comment not found' }, 404);
  const [m] = await query(db, 'SELECT fn_can_manage_club(?, club_id) AS can FROM POST WHERE post_id = ?', [s.uid, postId]);
  if (target.user_id !== s.uid && !(m && m.can)) return json({ message: 'Not allowed to delete this comment' }, 403);
  const ids = new Set([cid]);
  let grew = true;
  while (grew) { grew = false; for (const c of doc.comments) if (c.parent_comment_id && ids.has(c.parent_comment_id) && !ids.has(c.comment_id)) { ids.add(c.comment_id); grew = true; } }
  await content.updateOne({ post_id: postId }, { $pull: { comments: { comment_id: { $in: [...ids] } } } });
  return json({ ok: true, removed: ids.size });
});
