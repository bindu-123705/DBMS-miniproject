import { route, json } from '@/lib/auth';
import { query, call } from '@/lib/mysql';

export const GET = route(null, async (req, ctx, s, db) => {
  const rows = await query(db, `
    SELECT c.club_id, c.name, c.description, c.head_id, h.name AS head_name, fn_club_member_count(c.club_id) AS members,
           EXISTS (SELECT 1 FROM MEMBER_OF m WHERE m.club_id = c.club_id AND m.user_id = ?) AS is_member
    FROM CLUB c JOIN \`USER\` h ON h.user_id = c.head_id ORDER BY c.name`, [s.uid]);
  return json({ data: rows.map((r) => ({ ...r, is_member: !!r.is_member })) });
});

export const POST = route(['admin'], async (req, ctx, s, db) => {
  const { name, description = '', head_srn } = await req.json();
  if (!name?.trim() || !head_srn?.trim()) return json({ message: 'name and head SRN required' }, 400);
  const [r] = await call(db, 'sp_create_club', [s.uid, name.trim(), description, head_srn.trim()]);
  return json({ club_id: r.club_id }, 201);
});
export const dynamic = 'force-dynamic';
