import { route, json } from '@/lib/auth';
import { call, query } from '@/lib/mysql';
import { mongo, notify } from '@/lib/mongo';

// member -> pending, head/admin -> published (decided by sp_create_post)
export const POST = route(null, async (req, ctx, s, db) => {
  const { club_id, title, caption = '', media = [] } = await req.json();
  if (!club_id || !title?.trim()) return json({ message: 'club and title required' }, 400);
  const [r] = await call(db, 'sp_create_post', [s.uid, club_id, title.trim(), caption]);
  const { content } = await mongo();
  await content.insertOne({ post_id: r.post_id, media: media.map((m, i) => ({ media_id: i + 1, url: m.url, media_type: m.media_type })), comments: [] });
  if (r.status === 'pending') {
    const [club] = await query(db, 'SELECT head_id, name FROM CLUB WHERE club_id = ?', [club_id]);
    await notify(club.head_id, `${s.name} requested approval for the post '${title.trim()}' in ${club.name}.`);
  }
  return json({ post_id: r.post_id, status: r.status }, 201);
});
