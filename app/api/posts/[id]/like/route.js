import { route, json } from '@/lib/auth';
import { call } from '@/lib/mysql';
export const POST = route(null, async (req, { params }, s, db) => {
  const [r] = await call(db, 'sp_toggle_like', [s.uid, params.id]);
  return json({ liked: !!r.liked, likes: Number(r.likes) });
});
