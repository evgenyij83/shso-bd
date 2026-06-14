'use client'

import { useState } from 'react'
import { Edit2 } from 'lucide-react'
import { updateSquadDescription } from '@/app/actions/admin'

type SquadDesc = {
  workType: string | null
  workPlace: string | null
  workSchedule: string | null
  workPeriod: string | null
}

export default function EditDescriptionButton({ squadId, initialData }: { squadId: string, initialData: SquadDesc }) {
  const [editing, setEditing] = useState(false)
  const [workType, setWorkType] = useState(initialData.workType || '')
  const [workPlace, setWorkPlace] = useState(initialData.workPlace || '')
  const [workSchedule, setWorkSchedule] = useState(initialData.workSchedule || '')
  const [workPeriod, setWorkPeriod] = useState(initialData.workPeriod || '')
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    setLoading(true)
    const formData = new FormData()
    formData.append('squadId', squadId)
    formData.append('workType', workType.trim())
    formData.append('workPlace', workPlace.trim())
    formData.append('workSchedule', workSchedule.trim())
    formData.append('workPeriod', workPeriod.trim())
    
    const res = await updateSquadDescription(formData)
    if (res?.error) {
      alert(res.error)
    } else {
      setEditing(false)
    }
    setLoading(false)
  }

  const hasData = initialData.workType || initialData.workPlace || initialData.workSchedule || initialData.workPeriod

  const fieldStyle = { display: 'flex', gap: '0.5rem', alignItems: 'flex-start' as const, marginBottom: '0.5rem' }
  const labelStyle = { color: 'var(--text-secondary)', fontSize: '0.85rem', minWidth: '170px', flexShrink: 0 }
  const valueStyle = { color: 'var(--text-primary)', fontSize: '0.95rem' }

  if (editing) {
    return (
      <div style={{ marginTop: '0.5rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.05)', padding: '1.25rem', borderRadius: '8px' }}>
        <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>Описание отряда</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label style={{ ...labelStyle, display: 'block', marginBottom: '4px' }}>Суть работы:</label>
            <input value={workType} onChange={e => setWorkType(e.target.value)} placeholder="Например: Строительство, озеленение..." className="input-field" style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ ...labelStyle, display: 'block', marginBottom: '4px' }}>Место трудоустройства:</label>
            <input value={workPlace} onChange={e => setWorkPlace(e.target.value)} placeholder="Например: г. Санкт-Петербург" className="input-field" style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ ...labelStyle, display: 'block', marginBottom: '4px' }}>График работы:</label>
            <input value={workSchedule} onChange={e => setWorkSchedule(e.target.value)} placeholder="Например: 5/2, 8:00-17:00" className="input-field" style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ ...labelStyle, display: 'block', marginBottom: '4px' }}>Период работы:</label>
            <input value={workPeriod} onChange={e => setWorkPeriod(e.target.value)} placeholder="Например: Июль - Август 2026" className="input-field" style={{ width: '100%' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
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
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>Описание отряда:</div>
          {hasData ? (
            <div>
              {initialData.workType && <div style={fieldStyle}><span style={labelStyle}>Суть работы:</span><span style={valueStyle}>{initialData.workType}</span></div>}
              {initialData.workPlace && <div style={fieldStyle}><span style={labelStyle}>Место трудоустройства:</span><span style={valueStyle}>{initialData.workPlace}</span></div>}
              {initialData.workSchedule && <div style={fieldStyle}><span style={labelStyle}>График работы:</span><span style={valueStyle}>{initialData.workSchedule}</span></div>}
              {initialData.workPeriod && <div style={fieldStyle}><span style={labelStyle}>Период работы:</span><span style={valueStyle}>{initialData.workPeriod}</span></div>}
            </div>
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
