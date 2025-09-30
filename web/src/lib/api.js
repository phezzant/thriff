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
