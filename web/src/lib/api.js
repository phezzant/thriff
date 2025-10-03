const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function handle(res) {
  if (!res.ok) {
    try {
      const j = await res.json();
      throw new Error(j.error || 'Request failed');
    } catch {
      throw new Error('Request failed');
    }
  }
  return res.json();
}

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('AUTH_TOKEN') : '';
}
function authHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export async function register(email, password, name) {
  const r = await fetch(`${API}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || 'Register failed');
  if (typeof window !== 'undefined') localStorage.setItem('AUTH_TOKEN', j.token);
  return j;
}

export async function login(email, password) {
  const r = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || 'Login failed');
  if (typeof window !== 'undefined') localStorage.setItem('AUTH_TOKEN', j.token);
  return j;
}

export async function listListings(q) {
  const url = q
    ? `${API}/api/search?q=${encodeURIComponent(q)}`
    : `${API}/api/listings`;
  return handle(await fetch(url));
}

export async function listListingsPaged(page = 1, limit = 20) {
  return handle(await fetch(`${API}/api/listings?page=${page}&limit=${limit}`));
}

export async function getListing(id) {
  return handle(await fetch(`${API}/api/listings/${id}`));
}

export async function createListing(data) {
  const r = await fetch(`${API}/api/listings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || 'Failed to create listing');
  return j;
}

export async function likeListing(id) {
  return handle(await fetch(`${API}/api/listings/${id}/like`, { method: 'POST' }));
}

export async function unlikeListing(id) {
  return handle(await fetch(`${API}/api/listings/${id}/unlike`, { method: 'POST' }));
}

function adminHeaders() {
  const t = typeof window !== 'undefined' ? localStorage.getItem('ADMIN_TOKEN') : '';
  return t ? { 'x-admin-token': t } : {};
}

export async function updateListing(id, patch) {
  return handle(
    await fetch(`${API}/api/listings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...adminHeaders() },
      body: JSON.stringify(patch),
    })
  );
}

export async function deleteListing(id) {
  const res = await fetch(`${API}/api/listings/${id}`, {
    method: 'DELETE',
    headers: { ...adminHeaders() },
  });
  if (res.status === 204) return true;
  return handle(res);
}

