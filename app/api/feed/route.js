import { route, json } from '@/lib/auth';
import { query } from '@/lib/mysql';
import { mongo } from '@/lib/mongo';

export const GET = route(null, async (req, ctx, s, db) => {
  const club = new URL(req.url).searchParams.get('club');
  const posts = await query(db, `
    SELECT p.post_id, p.club_id, c.name AS club_name, p.author_id, u.name AS author_name, p.title, p.caption,
           p.created_at, fn_like_count(p.post_id) AS likes,
           EXISTS (SELECT 1 FROM LIKES l WHERE l.post_id = p.post_id AND l.user_id = ?) AS liked
    FROM POST p JOIN CLUB c ON c.club_id = p.club_id JOIN \`USER\` u ON u.user_id = p.author_id
    WHERE p.status = 'published' ${club ? 'AND p.club_id = ?' : ''}
    ORDER BY p.created_at DESC LIMIT 50`, club ? [s.uid, club] : [s.uid]);
  const { content } = await mongo();
  const docs = await content.find({ post_id: { $in: posts.map((p) => p.post_id) } }).toArray();
  const byId = Object.fromEntries(docs.map((d) => [d.post_id, d]));
  return json({ data: posts.map((p) => ({ ...p, liked: !!p.liked, media: byId[p.post_id]?.media || [], comment_count: byId[p.post_id]?.comments?.length || 0 })) });
});
export const dynamic = 'force-dynamic';
