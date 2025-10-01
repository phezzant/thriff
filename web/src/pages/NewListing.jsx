import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createListing } from '../lib/api.js'

export default function NewListing() {
  const [form, setForm] = useState({ title:'', description:'', price:'', imageUrl:'', city:'' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      const created = await createListing(form)
      navigate(`/listing/${created.id}`)
    } catch (e) {
      setError(e.message || 'Failed to create')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <h2>Post a new item</h2>
      {error && <p className="error">{error}</p>}

      <label>Title
        <input required value={form.title} onChange={e=> setForm(f=>({...f, title:e.target.value}))}/>
      </label>

      <label>Description
        <textarea required rows={5} value={form.description} onChange={e=> setForm(f=>({...f, description:e.target.value}))}/>
      </label>

      <label>Price (EUR)
        <input required type="number" min="0" step="0.01" value={form.price} onChange={e=> setForm(f=>({...f, price:e.target.value}))}/>
      </label>

      <label>Image URL
        <input placeholder="https://…" value={form.imageUrl} onChange={e=> setForm(f=>({...f, imageUrl:e.target.value}))}/>
      </label>

      <label>City
        <input value={form.city} onChange={e=> setForm(f=>({...f, city:e.target.value}))}/>
      </label>

      <button className="button" disabled={busy}>{busy ? 'Posting…' : 'Post item'}</button>
    </form>
  )
}
