import { route, json } from '@/lib/auth';
import { call } from '@/lib/mysql';
import { notify } from '@/lib/mongo';

export const POST = route(['club_head', 'admin'], async (req, { params }, s, db) => {
  const { srn } = await req.json();
  if (!srn) return json({ message: 'SRN required' }, 400);
  const [r] = await call(db, 'sp_add_member', [s.uid, params.id, srn.trim()]);
  await notify(r.user_id, 'You were added to a club. Open Clubs to see it.');
  return json({ ok: true }, 201);
});

export const DELETE = route(['club_head', 'admin'], async (req, { params }, s, db) => {
  const { user_id } = await req.json();
  await call(db, 'sp_remove_member', [s.uid, params.id, user_id]);
  return json({ ok: true });
});
