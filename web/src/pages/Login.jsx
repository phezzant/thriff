import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register } from '../lib/api.js'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  async function onSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      if (mode === 'login') await login(email, password)
      else await register(email, password, name)
      navigate('/') // done
    } catch (e) {
      setError(e.message || 'Auth failed')
    }
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <h2>{mode === 'login' ? 'Sign in' : 'Create account'}</h2>
      {error && <p className="error">{error}</p>}

      {mode === 'register' && (
        <label>Name
          <input value={name} onChange={e=> setName(e.target.value)} />
        </label>
      )}

      <label>Email
        <input required type="email" value={email} onChange={e=> setEmail(e.target.value)} />
      </label>

      <label>Password
        <input required type="password" value={password} onChange={e=> setPassword(e.target.value)} />
      </label>

      <div style={{display:'flex', gap:8}}>
        <button className="button" type="submit">
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
        <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Need an account? Register' : 'Have an account? Sign in'}
        </button>
      </div>
    </form>
  )
}

