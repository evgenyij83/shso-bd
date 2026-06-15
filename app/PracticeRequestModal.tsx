'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Send } from 'lucide-react'
import { submitPracticeRequest } from '@/app/actions/practice'

export default function PracticeRequestModal({ isOpen, onClose, squads }: { isOpen: boolean, onClose: () => void, squads: any[] }) {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { setMounted(true) }, [])

  if (!mounted || !isOpen) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    
    const formData = new FormData(e.currentTarget)
    const res = await submitPracticeRequest(formData)
    
    if (res.error) {
      setError(res.error)
    } else {
      setSuccess('Успешно! Для получения обратной связи начните диалог с сообществом https://vk.com/club239553821')
      ;(e.target as HTMLFormElement).reset()
    }
    setLoading(false)
  }

  return createPortal(
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 999 }} onClick={onClose} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#1e293b', width: '90%', maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', zIndex: 1000, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#fff', fontWeight: 600 }}>Практика в отряде</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <div style={{ padding: '1.5rem' }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ width: 60, height: 60, background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Send size={30} />
              </div>
              <h3 style={{ color: '#fff', marginBottom: '1rem' }}>Заявка отправлена</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Успешно! Для получения обратной связи начните диалог с сообществом <br/><a href="https://vk.com/club239553821" target="_blank" style={{ color: '#3b82f6', textDecoration: 'underline' }}>https://vk.com/club239553821</a>
              </p>
              <button onClick={onClose} className="btn-primary" style={{ marginTop: '1.5rem', width: '100%' }}>Понятно</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>Тип практики</label>
                <select name="practiceType" className="input-field" defaultValue="">
                  <option value="" disabled>-- Выберите тип практики --</option>
                  <option value="учебная">Учебная практика</option>
                  <option value="геодезическая">Геодезическая практика</option>
                  <option value="производственная">Производственная практика</option>
                  <option value="технологическая">Технологическая практика</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>Отряд</label>
                <select name="squadId" className="input-field" defaultValue="">
                  <option value="" disabled>-- Выберите отряд --</option>
                  {squads.map(sq => (
                    <option key={sq.id} value={sq.id}>{sq.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>ФИО</label>
                <input name="fullName" type="text" className="input-field" placeholder="Иванов Иван Иванович" />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>Факультет</label>
                <input name="faculty" type="text" className="input-field" placeholder="УПП" />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>Курс</label>
                  <input name="course" type="number" min="1" max="6" className="input-field" placeholder="1" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>Группа</label>
                  <input name="studyGroup" type="text" className="input-field" placeholder="УПП-001" />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>Сроки практики</label>
                <input name="period" type="text" className="input-field" placeholder="Июль - Август 2026" />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>Номер телефона</label>
                <input name="phone" type="tel" className="input-field" placeholder="+7 999 000 00 00" />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>Ссылка на ВК <span style={{color: '#ef4444'}}>*</span></label>
                <input name="vkLink" required type="text" className="input-field" placeholder="https://vk.com/id1" />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Обязательно для обратной связи</div>
              </div>

              {error && <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '0.85rem' }}>{error}</div>}

              <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '0.5rem', padding: '0.8rem', fontSize: '1rem', fontWeight: 600 }}>
                {loading ? 'Отправка...' : 'Отправить заявку'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>,
    document.body
  )
}
