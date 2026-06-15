'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Check } from 'lucide-react'
import { submitFightersToEvent } from '@/app/actions/events'

type Fighter = { id: string, fullName: string, position: string }

export default function EventDetailsClient({ eventId, fighters, hasSubmitted }: { eventId: string, fighters: Fighter[], hasSubmitted: boolean }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (hasSubmitted) {
    return (
      <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Check size={20} />
        Ваш отряд уже подал заявку на это мероприятие.
      </div>
    )
  }

  const toggleFighter = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  async function handleSubmit() {
    if (selectedIds.size === 0) {
      setError('Выберите хотя бы одного бойца')
      return
    }
    
    if (!confirm('Вы уверены? После подачи заявки вы не сможете изменить список участников от вашего отряда.')) return

    setLoading(true)
    setError('')
    
    const res = await submitFightersToEvent(eventId, Array.from(selectedIds))
    
    if (res.error) {
      setError(res.error)
      setLoading(false)
    } else {
      setIsModalOpen(false)
      // reloading will happen via revalidatePath
    }
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <button onClick={() => setIsModalOpen(true)} className="btn-primary">
        <Users size={18} /> Предоставить бойцов
      </button>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass-panel" style={{ width: '100%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: '2rem', background: 'var(--bg-color)' }}>
              <h2>Выберите бойцов для участия</h2>
              
              <div style={{ flex: 1, overflowY: 'auto', margin: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.5rem' }}>
                {fighters.map(f => (
                  <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(f.id)} 
                      onChange={() => toggleFighter(f.id)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 500 }}>{f.fullName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{f.position}</div>
                    </div>
                  </label>
                ))}
                {fighters.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>В вашем отряде пока нет бойцов.</p>}
              </div>

              {error && <p style={{ color: 'var(--danger-color)', fontSize: '0.9rem', margin: '0 0 1rem 0' }}>{error}</p>}
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={handleSubmit} className="btn-primary" disabled={loading || selectedIds.size === 0} style={{ flex: 1, justifyContent: 'center' }}>
                  {loading ? 'Отправка...' : `Отправить (${selectedIds.size})`}
                </button>
                <button onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                  Отмена
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
