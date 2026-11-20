import { route, json } from '@/lib/auth';
import { mongo } from '@/lib/mongo';

// READ
export const GET = route(null, async (req, ctx, s) => {
  const { notifications } = await mongo();
  const doc = await notifications.findOne({ user_id: s.uid });
  const list = [...(doc?.notifications || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return json({ data: list, unread: list.filter((n) => !n.is_read).length });
});

// UPDATE : { id } marks one read, { all: true } marks all read
export const PATCH = route(null, async (req, ctx, s) => {
  const { id, all } = await req.json();
  const { notifications } = await mongo();
  if (all) await notifications.updateOne({ user_id: s.uid }, { $set: { 'notifications.$[].is_read': true } });
  else await notifications.updateOne({ user_id: s.uid }, { $set: { 'notifications.$[n].is_read': true } }, { arrayFilters: [{ 'n.notification_id': id }] });
  return json({ ok: true });
});

// DELETE : { id } removes one, { all: true } clears everything
export const DELETE = route(null, async (req, ctx, s) => {
  const { id, all } = await req.json();
  const { notifications } = await mongo();
  if (all) await notifications.updateOne({ user_id: s.uid }, { $set: { notifications: [] } });
  else await notifications.updateOne({ user_id: s.uid }, { $pull: { notifications: { notification_id: id } } });
  return json({ ok: true });
});
export const dynamic = 'force-dynamic';
