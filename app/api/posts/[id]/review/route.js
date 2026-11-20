import { route, json } from '@/lib/auth';
import { call } from '@/lib/mysql';
import { notify } from '@/lib/mongo';
// head approves / rejects / archives a post (sp_review_post checks the head)
export const PATCH = route(['club_head', 'admin'], async (req, { params }, s, db) => {
  const { status } = await req.json();
  const [r] = await call(db, 'sp_review_post', [s.uid, params.id, status]);
  if (status !== 'archived') await notify(r.author_id, `Your post '${r.title}' was ${status === 'published' ? 'approved and is now live' : 'rejected'}.`);
  return json({ ok: true, status });
});
