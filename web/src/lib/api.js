const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function listListings(q) {
  const url = q ? `${API}/api/search?q=${encodeURIComponent(q)}` : `${API}/api/listings`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch listings');
  return res.json();
}

export async function getListing(id) {
  const res = await fetch(`${API}/api/listings/${id}`);
  if (!res.ok) throw new Error('Listing not found');
  return res.json();
}

export async function createListing(data) {
  const res = await fetch(`${API}/api/listings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create listing');
  return res.json();
}

export async function listListingsPaged(page = 1, limit = 20) {
  const r = await fetch(`${API}/api/listings?page=${page}&limit=${limit}`);
  if (!r.ok) throw new Error('Failed to fetch listings');
  return r.json(); // { items, page, limit, total, pageCount }
}

export async function likeListing(id) {
  const r = await fetch(`${API}/api/listings/${id}/like`, { method: 'POST' });
  if (!r.ok) throw new Error('Failed to like');
  return r.json(); // { id, likes }
}

export async function unlikeListing(id) {
  const r = await fetch(`${API}/api/listings/${id}/unlike`, { method: 'POST' });
  if (!r.ok) throw new Error('Failed to unlike');
  return r.json();
}

// admin
function adminHeaders() {
  const t = localStorage.getItem('ADMIN_TOKEN');
  return t ? { 'x-admin-token': t } : {};
}

export async function deleteListing(id) {
  const r = await fetch(`${API}/api/listings/${id}`, { method: 'DELETE', headers: { ...adminHeaders() } });
  if (r.status === 204) return true;
  const j = await r.json(); throw new Error(j.error || 'Delete failed');
}

export async function updateListing(id, patch) {
  const r = await fetch(`${API}/api/listings/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...adminHeaders() },
    body: JSON.stringify(patch),
  });
  if (!r.ok) { const j = await r.json(); throw new Error(j.error || 'Update failed'); }
  return r.json();
}

