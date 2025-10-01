import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { listListings, likeListing } from '../lib/api.js'

const fmt = (c) => `€${((Number(c) || 0) / 100).toFixed(2)}`

export default function Home() {
  const [params] = useSearchParams()
  const q = params.get('q') || ''
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true); setError(null)
    listListings(q)
      .then((data) => {
        const arr = Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : []
        if (!cancelled) setItems(arr)
      })
      .catch((e) => { if (!cancelled) setError(e.message || 'Failed to load') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [q])

  if (loading) return <p>Loading…</p>
  if (error)   return <p className="error">{error}</p>

  return (
    <div className="grid">
      {items.map((row) => (
        <Link key={row.id} to={`/listing/${row.id}`} className="card">
          {row.image_url ? <img src={row.image_url} alt="" /> : <div className="placeholder">No image</div>}
          <div className="card-body">
            <h3>{row.title}</h3>
            <p className="muted">{row.city || '—'}</p>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <strong>{fmt(row.price_cents)}</strong>
              <button
                className="button"
                onClick={async (e) => {
                  e.preventDefault()
                  const old = row.likes ?? 0
                  row.likes = old + 1; setItems([...items])
                  try {
                    const { likes } = await likeListing(row.id)
                    row.likes = likes; setItems([...items])
                  } catch {
                    row.likes = old; setItems([...items])
                  }
                }}
              >
                ❤ {row.likes ?? 0}
              </button>
            </div>
          </div>
        </Link>
      ))}
      {items.length === 0 && <p>No results.</p>}
    </div>
  )
}

