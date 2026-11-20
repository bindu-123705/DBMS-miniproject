import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { route, json } from '@/lib/auth';

const TYPES = { image: 'image', video: 'video', audio: 'audio' };
export const POST = route(null, async (req) => {
  const form = await req.formData();
  const dir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(dir, { recursive: true });
  const out = [];
  for (const f of form.getAll('files').slice(0, 6)) {
    if (typeof f === 'string' || f.size > 50 * 1024 * 1024) continue;
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(f.name).toLowerCase().replace(/[^.a-z0-9]/g, '')}`;
    await writeFile(path.join(dir, name), Buffer.from(await f.arrayBuffer()));
    out.push({ url: `/uploads/${name}`, media_type: TYPES[f.type.split('/')[0]] || 'document' });
  }
  return json({ files: out });
});
