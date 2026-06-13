'use client'

import { useState } from 'react'
import { setFighterLimit } from '@/app/actions/admin'

export default function EditFighterLimit({ squadId, currentLimit, canSetLimit }: { squadId: string, currentLimit: number | null, canSetLimit: boolean }) {
  const [editing, setEditing] = useState(false)
  const [limit, setLimit] = useState(currentLimit !== null ? currentLimit.toString() : '')
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    setLoading(true)
    const formData = new FormData()
    formData.append('squadId', squadId)
    formData.append('fighterLimit', limit)
    
    const res = await setFighterLimit(formData)
    if (res?.error) {
      alert(res.error)
    } else {
      setEditing(false)
    }
    setLoading(false)
  }

  if (!editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)', marginBottom: '1.5rem' }}>
        <div>
          <span style={{ color: 'var(--text-secondary)' }}>Лимит бойцов в отряде: </span>
          <strong style={{ color: currentLimit !== null ? '#60a5fa' : 'var(--text-primary)' }}>
            {currentLimit !== null ? currentLimit : 'Без ограничений'}
          </strong>
        </div>
        {canSetLimit && (
          <button 
            onClick={() => setEditing(true)} 
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '6px 12px', borderRadius: '6px', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            Изменить
          </button>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)', marginBottom: '1.5rem' }}>
      <input 
        type="number" 
        value={limit} 
        onChange={e => setLimit(e.target.value)} 
        placeholder="Без лимита (оставьте пустым)"
        className="input-field"
        style={{ width: '250px' }}
      />
      <button onClick={handleSave} disabled={loading} className="btn-primary" style={{ padding: '8px 16px' }}>
        {loading ? '...' : 'Сохранить'}
      </button>
      <button onClick={() => setEditing(false)} disabled={loading} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
        Отмена
      </button>
    </div>
  )
}
