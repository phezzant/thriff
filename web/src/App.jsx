import { Outlet, Link, useNavigate, useSearchParams } from 'react-router-dom'
import './App.css'

export default function App() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const q = params.get('q') || ''

  return (
    <>
      <header className="container header">
        <h1><Link to="/">Thriff Lite</Link></h1>
        <nav>
          <input
            defaultValue={q}
            placeholder="Search..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigate(`/?q=${encodeURIComponent(e.currentTarget.value)}`)
            }}
          />
          <Link to="/new" className="button">Post item</Link>
        </nav>
      </header>
      <main className="container"><Outlet /></main>
      <footer className="container small">© {new Date().getFullYear()} Thriff</footer>
    </>
  )
}
