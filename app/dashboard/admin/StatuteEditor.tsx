'use client'

import { useState } from 'react'
import { updateStatute } from '@/app/actions/settings'

export default function StatuteEditor({ initialStatute }: { initialStatute: string }) {
  const [statute, setStatute] = useState(initialStatute)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setSuccess('')
    setError('')
    
    const formData = new FormData()
    formData.append('statute', statute)
    
    const res = await updateStatute(formData)
    if (res?.error) {
      setError(res.error)
    } else {
      setSuccess('Устав успешно сохранен!')
    }
    setLoading(false)
  }

  return (
    <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
      <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Редактор Устава</h3>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <textarea
          value={statute}
          onChange={(e) => setStatute(e.target.value)}
          placeholder="Введите текст устава..."
          className="input-field"
          style={{ width: '100%', minHeight: '300px', resize: 'vertical' }}
          required
        />
        
        {error && <div style={{ color: 'var(--danger-color)', fontSize: '0.9rem' }}>{error}</div>}
        {success && <div style={{ color: '#34d399', fontSize: '0.9rem' }}>{success}</div>}
        
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Сохранение...' : 'Сохранить устав'}
        </button>
      </form>
    </div>
  )
}
