'use client'

import { useState } from 'react'
import { submitApplication } from '@/app/actions/apply'
import Link from 'next/link'

export default function ApplicationForm({ squadId, squadName }: { squadId: string, squadName: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const res = await submitApplication(new FormData(e.currentTarget))
    if (res.error) {
      setError(res.error)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <h3 style={{ fontSize: '1.5rem', color: '#34d399', marginBottom: '1rem' }}>Заявка успешно отправлена!</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Командир отряда рассмотрит вашу анкету в ближайшее время.</p>
        <Link href="/" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
          Вернуться на главную
        </Link>
      </div>
    )
  }

  return (
    <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Анкета кандидата в {squadName}</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input type="hidden" name="squadId" value={squadId} />
        
        <input name="fullName" placeholder="ФИО (полностью)" className="input-field" required />
        <input name="faculty" placeholder="Факультет" className="input-field" required />
        <input name="studyGroup" placeholder="Учебная группа" className="input-field" required />
        
        <select name="course" className="input-field" required defaultValue="">
          <option value="" disabled>Выберите курс</option>
          {[1, 2, 3, 4, 5, 6].map(c => <option key={c} value={c}>{c} курс</option>)}
        </select>
        
        <select name="educationForm" className="input-field" required defaultValue="">
          <option value="" disabled>Форма обучения</option>
          <option value="Бюджет">Бюджет</option>
          <option value="Целевое">Целевое</option>
          <option value="Коммерция">Коммерция</option>
        </select>

        <input name="phone" placeholder="Номер телефона" className="input-field" required />
        <input name="vkLink" placeholder="Ссылка на ВКонтакте (необязательно)" className="input-field" />

        {error && <div style={{ color: 'var(--danger-color)', fontSize: '0.9rem' }}>{error}</div>}
        
        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
          {loading ? 'Отправка...' : 'Отправить заявку'}
        </button>
      </form>
    </div>
  )
}
