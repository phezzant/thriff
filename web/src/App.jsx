import { Outlet, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './App.css'

export default function App() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const [authed, setAuthed] = useState(!!(typeof window !== 'undefined' && localStorage.getItem('AUTH_TOKEN')))

  useEffect(() => {
    const i = setInterval(() => {
      if (typeof window !== 'undefined') {
        setAuthed(!!localStorage.getItem('AUTH_TOKEN'))
      }
    }, 800)
    return () => clearInterval(i)
  }, [])

  return (
    <>
      <header className="container header">
        <h1><Link to="/">Thriff Lite</Link></h1>
        <nav>
          <input
            defaultValue={q}
            placeholder="Search..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const next = new URLSearchParams(params)
                const val = e.currentTarget.value
                if (!val) next.delete('q'); else next.set('q', val)
                next.delete('page')
                setParams(next, { replace: false })
              }
            }}
            style={{ padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 10 }}
          />
          <Link to="/new" className="button">Post item</Link>
          {authed ? (
            <button
              className="button"
              onClick={() => { if (typeof window !== 'undefined') { localStorage.removeItem('AUTH_TOKEN'); } setAuthed(false); navigate('/') }}
            >
              Logout
            </button>
          ) : (
            <Link to="/login" className="button">Login</Link>
          )}
        </nav>
      </header>
      <main className="container"><Outlet /></main>
      <footer className="container small">© {new Date().getFullYear()} Thriff</footer>
    </>
  )
}

