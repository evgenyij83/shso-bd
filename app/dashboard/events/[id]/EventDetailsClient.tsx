'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Trash2, CheckCircle } from 'lucide-react'
import { submitFightersToEvent, removeFighterFromEvent, approveEvent } from '@/app/actions/events'

type Fighter = { id: string, fullName: string, position: string }
type Participant = { id: string, fighterName: string, squadName: string, createdAt: Date }

export default function EventDetailsClient({ 
  eventId, 
  fighters, 
  status, 
  maxParticipants, 
  currentParticipantsCount,
  participants,
  isCreatorOrDev
}: { 
  eventId: string, 
  fighters: Fighter[], 
  status: string, 
  maxParticipants: number | null, 
  currentParticipantsCount: number,
  participants: Participant[],
  isCreatorOrDev: boolean
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const remainingSpots = maxParticipants !== null ? Math.max(0, maxParticipants - currentParticipantsCount) : null
  const isOpen = status === 'OPEN'

  const toggleFighter = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      if (remainingSpots !== null && next.size >= remainingSpots) {
        setError(`Достигнут лимит свободных мест (${remainingSpots}).`)
        return
      }
      next.add(id)
      setError('')
    }
    setSelectedIds(next)
  }

  async function handleSubmit() {
    if (selectedIds.size === 0) {
      setError('Выберите хотя бы одного бойца')
      return
    }
    
    if (remainingSpots !== null && selectedIds.size > remainingSpots) {
      setError(`Вы выбрали слишком много бойцов. Свободных мест: ${remainingSpots}`)
      return
    }

    setLoading(true)
    setError('')
    
    const res = await submitFightersToEvent(eventId, Array.from(selectedIds))
    
    if (res.error) {
      setError(res.error)
      setLoading(false)
    } else {
      setIsModalOpen(false)
      setLoading(false)
      setSelectedIds(new Set())
    }
  }

  async function handleRemove(participantId: string) {
    if (!confirm('Удалить бойца из списка участников?')) return
    await removeFighterFromEvent(eventId, participantId)
  }

  async function handleApprove() {
    if (!confirm('Вы уверены? После утверждения списка прием заявок закроется, и всем участникам будет разослано сообщение в ВК со ссылкой на чат.')) return
    setLoading(true)
    const res = await approveEvent(eventId)
    if (res.error) {
      alert(res.error)
    }
    setLoading(false)
  }

  return (
    <>
      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {fighters.length > 0 && isOpen && (
          <button onClick={() => setIsModalOpen(true)} className="btn-primary" disabled={remainingSpots === 0}>
            <Users size={18} /> {remainingSpots === 0 ? 'Мест нет' : 'Предоставить бойцов'}
          </button>
        )}

        {isCreatorOrDev && isOpen && participants.length > 0 && (
          <button onClick={handleApprove} className="btn-primary" disabled={loading} style={{ background: '#10b981' }}>
            <CheckCircle size={18} /> {loading ? 'Утверждаем...' : 'Утвердить список и разослать приглашения'}
          </button>
        )}
      </div>

      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ margin: '0 0 1.5rem 0' }}>Участники ({participants.length})</h2>
        {participants.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>Пока никто не записан.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
                  <th style={{ padding: '1rem' }}>ФИО</th>
                  <th style={{ padding: '1rem' }}>Отряд</th>
                  <th style={{ padding: '1rem' }}>Дата подачи</th>
                  {isCreatorOrDev && isOpen && <th style={{ padding: '1rem', width: '50px' }}></th>}
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '1rem' }}>{p.fighterName}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{p.squadName}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{new Date(p.createdAt).toLocaleDateString('ru-RU')}</td>
                    {isCreatorOrDev && isOpen && (
                      <td style={{ padding: '1rem' }}>
                        <button onClick={() => handleRemove(p.id)} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: '0.5rem' }} title="Удалить">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass-panel" style={{ width: '100%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: '2rem', background: 'var(--bg-color)' }}>
              <h2>Выберите бойцов для участия</h2>
              
              {maxParticipants !== null && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px', color: 'var(--text-primary)' }}>
                  Всего мест: {maxParticipants} <br/>
                  Уже занято: {currentParticipantsCount} <br/>
                  <strong style={{ color: remainingSpots === 0 ? 'var(--danger-color)' : 'var(--accent-color)' }}>Свободно: {remainingSpots}</strong>
                </div>
              )}

              <div style={{ flex: 1, overflowY: 'auto', margin: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.5rem' }}>
                {fighters.map(f => (
                  <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'pointer', opacity: (remainingSpots !== null && selectedIds.size >= remainingSpots && !selectedIds.has(f.id)) ? 0.5 : 1 }}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(f.id)} 
                      onChange={() => toggleFighter(f.id)}
                      disabled={remainingSpots !== null && selectedIds.size >= remainingSpots && !selectedIds.has(f.id)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 500 }}>{f.fullName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{f.position}</div>
                    </div>
                  </label>
                ))}
                {fighters.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>В вашем отряде пока нет бойцов (или все уже добавлены).</p>}
              </div>

              {error && <p style={{ color: 'var(--danger-color)', fontSize: '0.9rem', margin: '0 0 1rem 0' }}>{error}</p>}
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={handleSubmit} className="btn-primary" disabled={loading || selectedIds.size === 0 || (remainingSpots !== null && selectedIds.size > remainingSpots)} style={{ flex: 1, justifyContent: 'center' }}>
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
    </>
  )
}
