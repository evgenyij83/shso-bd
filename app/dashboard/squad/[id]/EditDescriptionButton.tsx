'use client'

import { useState } from 'react'
import { Edit2 } from 'lucide-react'
import { updateSquadDescription } from '@/app/actions/admin'

export default function EditDescriptionButton({ squadId, initialDescription }: { squadId: string, initialDescription: string | null }) {
  const [editing, setEditing] = useState(false)
  const [desc, setDesc] = useState(initialDescription || '')
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    setLoading(true)
    const formData = new FormData()
    formData.append('squadId', squadId)
    formData.append('description', desc.trim())
    
    const res = await updateSquadDescription(formData)
    if (res?.error) {
      alert(res.error)
    } else {
      setEditing(false)
    }
    setLoading(false)
  }

  if (editing) {
    return (
      <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
        <textarea 
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Введите описание отряда..."
          className="input-field"
          style={{ width: '100%', minHeight: '100px', resize: 'vertical', marginBottom: '1rem' }}
        />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleSave} disabled={loading} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.9rem' }}>
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button onClick={() => setEditing(false)} disabled={loading} style={{ padding: '6px 12px', fontSize: '0.9rem', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', cursor: 'pointer' }}>
            Отмена
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginTop: '0.5rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ flexGrow: 1 }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Описание отряда:</div>
          {initialDescription ? (
            <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', margin: 0 }}>
              {initialDescription}
            </p>
          ) : (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.95rem', fontStyle: 'italic', margin: 0 }}>
              Описание не задано
            </p>
          )}
        </div>
        <button 
          onClick={() => setEditing(true)}
          style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Редактировать описание"
        >
          <Edit2 size={16} />
        </button>
      </div>
    </div>
  )
}
