'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Calendar, Plus } from 'lucide-react'
import { createEvent } from '@/app/actions/events'

type EventType = { id: string, title: string, description: string, createdAt: Date }

export default function EventsListClient({ events, canCreate }: { events: EventType[], canCreate: boolean }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    const res = await createEvent(formData)
    
    if (res.error) {
      setError(res.error)
      setLoading(false)
    } else {
      setIsModalOpen(false)
      setLoading(false)
    }
  }

  return (
    <div>
      {canCreate && (
        <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ marginBottom: '2rem' }}>
          <Plus size={18} /> Создать мероприятие
        </button>
      )}

      {events.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>Мероприятий пока нет.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {events.map((ev, i) => (
            <motion.div key={ev.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={20} color="var(--accent-color)" /> {ev.title}
                </h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {ev.description.substring(0, 100)}{ev.description.length > 100 ? '...' : ''}
                </p>
              </div>
              <Link href={`/dashboard/events/${ev.id}`} className="btn-primary" style={{ textDecoration: 'none' }}>
                Подробнее
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem', background: 'var(--bg-color)' }}>
              <h2>Новое мероприятие</h2>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input name="title" placeholder="Название мероприятия" className="input-field" required />
                <textarea name="description" placeholder="Описание" className="input-field" rows={3} required />
                <textarea name="requirements" placeholder="Требования к участникам" className="input-field" rows={3} required />
                <input name="chatLink" placeholder="Ссылка на общую беседу ВК (необязательно)" className="input-field" />

                {error && <p style={{ color: 'var(--danger-color)', fontSize: '0.9rem', margin: 0 }}>{error}</p>}
                
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
                    {loading ? 'Создание...' : 'Создать'}
                  </button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                    Отмена
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
