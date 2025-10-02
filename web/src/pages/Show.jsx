import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getListing, updateListing, deleteListing } from '../lib/api.js'

const price = (c) => `€${((Number(c) || 0) / 100).toFixed(2)}`

function AdminBar({ id, onDeleted, onUpdated }) {
  const [token, setToken] = useState(
    typeof window !== 'undefined' ? localStorage.getItem('ADMIN_TOKEN') || '' : ''
  )

  const save = (t) => {
    setToken(t)
    if (typeof window !== 'undefined') localStorage.setItem('ADMIN_TOKEN', t)
  }

  return (
    <div style={{
      display:'flex', gap:8, alignItems:'center', margin:'12px 0',
      padding:'8px', border:'1px solid #e5e7eb', borderRadius:8, background:'#fff'
    }}>
      {!token && <span style={{fontSize:12, color:'#666'}}>Enter your admin token to enable actions</span>}
      <input
        placeholder="Admin token"
        value={token}
        onChange={e => save(e.target.value)}
        style={{flex:1, padding:'8px', border:'1px solid #e5e7eb', borderRadius:8}}
      />
      <button
        className="button"
        onClick={async () => {
          await updateListing(id, { status: 'sold' })
          onUpdated?.()
        }}
        disabled={!token}
      >
        Mark sold
      </button>
      <button
        className="button"
        onClick={async () => {
          if (confirm('Delete this listing?')) {
            await deleteListing(id)
            onDeleted?.()
          }
        }}
        disabled={!token}
      >
        Delete
      </button>
    </div>
  )
}

export default function Show() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    setError(null)
    getListing(id).then(setData).catch(e => setError(e.message || 'Not found'))
  }, [id])

  if (error) return <p className="error">{error}</p>
  if (!data) return <p>Loading…</p>

  return (
    <div style={{maxWidth: 800, margin: "0 auto"}}>
      {data.image_url && <img src={data.image_url} alt="" style={{width: '100%', borderRadius: 8}} />}
      <h2>{data.title}</h2>
      <p><strong>{price(data.price_cents)}</strong> — {data.city || '—'} {data.status ? `• ${data.status}` : null}</p>
      <p>{data.description}</p>

      {/* Admin actions */}
      <AdminBar
        id={id}
        onDeleted={() => navigate('/')}
        onUpdated={() => location.reload()}
      />

      <button className="button" onClick={() => navigate(-1)} style={{marginTop:8}}>Back</button>
    </div>
  )
}

