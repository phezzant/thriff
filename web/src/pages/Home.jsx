import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { listListings } from '../lib/api.js'
//import './Home.css'

// inside map(it => ...):
<div className="card-body">
  <h3>{it.title}</h3>
  <p className="muted">{it.city || '—'}</p>
  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
    <strong>€{(it.price_cents/100).toFixed(2)}</strong>
    <button
      className="button"
      onClick={async (e) => {
        e.preventDefault(); // keep Link from navigating
        const old = it.likes ?? 0;
        it.likes = old + 1; setItems([...items]); // optimistic
        try { const { likes } = await likeListing(it.id); it.likes = likes; setItems([...items]); }
        catch { it.likes = old; setItems([...items]); }
      }}
    >
      ❤ {it.likes ?? 0}
    </button>
  </div>
</div>

const price = c => `€${(c/100).toFixed(2)}`

export default function Home() {
  const [params] = useSearchParams()
  const q = params.get('q') || ''
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true); setError(null)
    listListings(q).then(setItems).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [q])

  if (loading) return <p>Loading…</p>
  if (error) return <p className="error">{error}</p>

  return (
    <div className="grid">
      {items.map(it => (
        <Link key={it.id} to={`/listing/${it.id}`} className="card">
          {it.image_url ? <img src={it.image_url} alt="" /> : <div className="placeholder">No image</div>}
          <div className="card-body">
            <h3>{it.title}</h3>
            <p className="muted">{it.city || '—'}</p>
            <strong>{price(it.price_cents)}</strong>
          </div>
        </Link>
      ))}
      {items.length === 0 && <p>No results.</p>}
    </div>
  )
}
