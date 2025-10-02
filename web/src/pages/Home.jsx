import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { listListings, listListingsPaged, likeListing } from '../lib/api.js'

const price = (c) => `€${((Number(c) || 0) / 100).toFixed(2)}`

function Pagination({ page, pageCount, onJump }) {
  if (!pageCount || pageCount <= 1) return null

  // Compact list: 1, (page-1), page, (page+1), last, with ellipses
  const pages = useMemo(() => {
    const s = new Set([1, page - 1, page, page + 1, pageCount].filter(n => n >= 1 && n <= pageCount))
    return [...s].sort((a, b) => a - b)
  }, [page, pageCount])

  return (
    <div style={{display:'flex', gap:8, alignItems:'center', justifyContent:'center', margin:'16px 0'}}>
      <button className="button" onClick={() => onJump(page - 1)} disabled={page <= 1}>Prev</button>
      {pages.map((n, i) => {
        const prev = pages[i - 1]
        const showDots = i > 0 && n - prev > 1
        return (
          <span key={n} style={{display:'inline-flex', gap:8}}>
            {showDots && <span className="muted">…</span>}
            <button
              onClick={() => onJump(n)}
              className="button"
              style={{
                background: n === page ? '#111' : '#fff',
                color: n === page ? '#fff' : '#111',
                border: '1px solid #e5e7eb'
              }}
            >
              {n}
            </button>
          </span>
        )
      })}
      <button className="button" onClick={() => onJump(page + 1)} disabled={page >= pageCount}>Next</button>
    </div>
  )
}

export default function Home() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const page = Math.max(parseInt(params.get('page') || '1', 10), 1)
  const limit = 12

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pageMeta, setPageMeta] = useState({ page: 1, pageCount: 1, total: 0, limit })

  useEffect(() => {
    let cancelled = false
    setLoading(true); setError(null)

    const run = async () => {
      try {
        if (q) {
          // Search path (non-paged API). You can paginate this later if you want.
          const data = await listListings(q)
          const arr = Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : []
          if (!cancelled) {
            setItems(arr)
            setPageMeta({ page: 1, pageCount: 1, total: arr.length, limit: arr.length || limit })
          }
        } else {
          // Paged home feed
          const data = await listListingsPaged(page, limit)
          if (!cancelled) {
            setItems(Array.isArray(data.items) ? data.items : [])
            setPageMeta({ page: data.page || 1, pageCount: data.pageCount || 1, total: data.total || 0, limit: data.limit || limit })
          }
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => { cancelled = true }
  }, [q, page])

  function jump(to) {
    const next = Math.max(1, Math.min(to, pageMeta.pageCount || 1))
    const nextParams = new URLSearchParams(params)
    if (next <= 1) nextParams.delete('page'); else nextParams.set('page', String(next))
    setParams(nextParams, { replace: false })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) return <p>Loading…</p>
  if (error)   return <p className="error">{error}</p>

  return (
    <>
      {!q && (
        <div className="muted" style={{textAlign:'right', marginBottom:8}}>
          Page {pageMeta.page} of {pageMeta.pageCount} • {pageMeta.total} items
        </div>
      )}

      <div className="grid">
        {items.map((row) => (
          <Link key={row.id} to={`/listing/${row.id}`} className="card">
            {row.image_url ? <img src={row.image_url} alt="" /> : <div className="placeholder">No image</div>}
            <div className="card-body">
              <h3>{row.title}</h3>
              <p className="muted">{row.city || '—'}</p>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <strong>{price(row.price_cents)}</strong>
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

      {!q && (
        <Pagination
          page={pageMeta.page}
          pageCount={pageMeta.pageCount}
          onJump={jump}
        />
      )}
    </>
  )
}
