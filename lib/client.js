'use client';
export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(path, {
    method, credentials: 'same-origin',
    headers: body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
  });
  const text = await res.text();
  let data = {}; try { data = text ? JSON.parse(text) : {}; } catch {}
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}
