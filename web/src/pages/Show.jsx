import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getListing } from '../lib/api.js'

const price = c => `€${(c/100).toFixed(2)}`

export default function Show() {
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getListing(id).then(setItem).catch(e => setError(e.message))
  }, [id])

  if (error) return <p className="error">{error}</p>
  if (!item) return <p>Loading…</p>

  return (
    <div style={{maxWidth: 800, margin: "0 auto"}}>
      {item.image_url && <img src={item.image_url} alt="" style={{width: '100%', borderRadius: 8}} />}
      <h2>{item.title}</h2>
      <p><strong>{price(item.price_cents)}</strong> — {item.city || '—'}</p>
      <p>{item.description}</p>
    </div>
  )
}

