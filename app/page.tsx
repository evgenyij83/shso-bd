'use client'
import { useState } from 'react'
import { login } from './actions/auth'
import { submitIdentifierRequest } from './actions/identifierRequests'
import { KeyRound, LogIn, HelpCircle, X } from 'lucide-react'

export default function LoginPage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Forgot ID state
  const [showForgot, setShowForgot] = useState(false)
  const [forgotName, setForgotName] = useState('')
  const [forgotVk, setForgotVk] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')
  const [forgotSuccess, setForgotSuccess] = useState('')

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

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault()
    setForgotLoading(true)
    setForgotError('')
    setForgotSuccess('')

    const res = await submitIdentifierRequest(forgotName, forgotVk)
    if (res.error) {
      setForgotError(res.error)
    } else {
      setForgotSuccess('Заявка на смену идентификатора отправлена! Ожидайте уведомления в ВК.')
      setForgotName('')
      setForgotVk('')
    }
    setForgotLoading(false)
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

        {/* Forgot Identifier Button */}
        <button
          onClick={() => setShowForgot(true)}
          style={{
            width: '100%', marginTop: '1rem', padding: '10px',
            background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24',
            border: '1px solid rgba(251, 191, 36, 0.25)', borderRadius: '8px',
            cursor: 'pointer', fontSize: '0.9rem', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <HelpCircle size={16} /> Забыл свой идентификатор
        </button>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
          <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Студент ПГУПС?</p>
          <a href="/apply" style={{ display: 'inline-block', padding: '10px 20px', background: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)', textDecoration: 'none', borderRadius: '8px', fontSize: '0.95rem', transition: 'all 0.2s' }}>
            Хочу вступить в отряд
          </a>
        </div>
      </div>

      {/* Forgot ID Modal */}
      {showForgot && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '2rem', background: '#0f172a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#fbbf24' }}>Восстановление идентификатора</h2>
              <button onClick={() => { setShowForgot(false); setForgotError(''); setForgotSuccess('') }} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>&times;</button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Введите ваше ФИО и ссылку на профиль ВКонтакте, которая была указана при регистрации. Система сравнит данные и отправит заявку разработчику.
            </p>

            <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="text"
                value={forgotName}
                onChange={e => setForgotName(e.target.value)}
                placeholder="Ваше ФИО"
                className="input-field"
                required
              />
              <input
                type="text"
                value={forgotVk}
                onChange={e => setForgotVk(e.target.value)}
                placeholder="Ссылка на ВК (как при регистрации)"
                className="input-field"
                required
              />

              {forgotError && <div style={{ color: 'var(--danger-color)', fontSize: '0.85rem', textAlign: 'center', padding: '8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{forgotError}</div>}
              {forgotSuccess && <div style={{ color: '#34d399', fontSize: '0.85rem', textAlign: 'center', padding: '8px', background: 'rgba(52, 211, 153, 0.1)', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>{forgotSuccess}</div>}

              <button type="submit" className="btn-primary" disabled={forgotLoading} style={{ opacity: forgotLoading ? 0.7 : 1 }}>
                {forgotLoading ? 'Проверка...' : 'Отправить заявку'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
