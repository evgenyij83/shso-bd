'use client'

import { useState } from 'react'
import { toggleMaintenanceMode } from '@/app/actions/maintenance'

export default function MaintenanceToggle({ initialStatus }: { initialStatus: boolean }) {
  const [enabled, setEnabled] = useState(initialStatus)
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    if (!enabled) {
      const confirm = window.confirm('ВНИМАНИЕ! Выключение платформы отправит сообщение ВСЕМ пользователям в ВК. Это может занять несколько секунд. Продолжить?')
      if (!confirm) return
    }
    
    setLoading(true)
    const res = await toggleMaintenanceMode(!enabled)
    if (res.error) {
      alert(res.error)
    } else {
      setEnabled(!enabled)
      alert(enabled ? 'Платформа открыта' : 'Платформа закрыта на тех. работы')
    }
    setLoading(false)
  }

  return (
    <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid var(--border)' }}>
      <h3 style={{ marginBottom: '1rem', color: '#ff4d4d' }}>Управление платформой</h3>
      <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
        При включении технических работ платформа будет недоступна для всех, кроме роли Разработчик. Все пользователи получат уведомление ВКонтакте.
      </p>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          onClick={handleToggle}
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            background: enabled ? 'var(--bg-tertiary)' : '#ff4d4d',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            fontWeight: '600'
          }}
        >
          {loading ? 'Отправка сообщений...' : enabled ? 'Открыть платформу' : 'Закрыть на тех. работы'}
        </button>
        {enabled && <span style={{ color: '#ff4d4d', fontWeight: 'bold' }}>⚠️ Режим тех. работ ВКЛЮЧЕН</span>}
      </div>
    </div>
  )
}
