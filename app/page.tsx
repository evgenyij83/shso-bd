'use client'
import { useState } from 'react'
import { login } from './actions/auth'
import { KeyRound, LogIn } from 'lucide-react'

export default function LoginPage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await login(code)
      if (res?.error) { 
        setError(res.error)
        setLoading(false) 
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка подключения к серверу БД')
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
      <div className="glass-panel animate-in" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', background: 'rgba(59, 130, 246, 0.2)', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
            <KeyRound size={32} color="#3b82f6" />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Единая База ШСО</h1>
          <p style={{ fontSize: '0.9rem' }}>Войдите с помощью уникального кода</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <input type="text" placeholder="Ваш уникальный код..." value={code} onChange={e => setCode(e.target.value)} className="input-field" required />
          {error && <div style={{ color: 'var(--danger-color)', fontSize: '0.875rem', textAlign: 'center' }}>{error}</div>}
          <button type="submit" className="btn-primary" disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Вход...' : <><LogIn size={18} />Войти в систему</>}
          </button>
        </form>
        <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
          <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Студент ПГУПС?</p>
          <a href="/apply" style={{ display: 'inline-block', padding: '10px 20px', background: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)', textDecoration: 'none', borderRadius: '8px', fontSize: '0.95rem', transition: 'all 0.2s' }}>
            Хочу вступить в отряд
          </a>
        </div>
      </div>
    </div>
  )
}
