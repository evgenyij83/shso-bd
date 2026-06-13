'use client'

import { useState, useRef } from 'react'
import { submitApplication } from '@/app/actions/apply'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export default function ApplicationForm({ squadId, squadName, statute }: { squadId: string, squadName: string, statute: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showStatute, setShowStatute] = useState(false)
  const [hasAcceptedStatute, setHasAcceptedStatute] = useState(false)
  const [canAcceptStatute, setCanAcceptStatute] = useState(false)

  const contentRef = useRef<HTMLDivElement>(null)

  function handleScroll() {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        setCanAcceptStatute(true)
      }
    }
  }

  // If the statute is very short, they might not need to scroll
  function handleModalOpen() {
    setShowStatute(true)
    setTimeout(() => {
      if (contentRef.current) {
        if (contentRef.current.scrollHeight <= contentRef.current.clientHeight + 10) {
          setCanAcceptStatute(true)
        }
      }
    }, 100)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!hasAcceptedStatute) return
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
    <>
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
          <input name="vkLink" placeholder="Ссылка на ВКонтакте (обязательно)" className="input-field" required />

          <div style={{ background: 'rgba(59, 130, 246, 0.1)', borderLeft: '4px solid #3b82f6', padding: '1rem', borderRadius: '4px', marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>Уведомления о статусе заявки</strong>
            Чтобы мы могли присылать вам уведомления о статусе вашей заявки (одобрение, отклонение), пожалуйста, разрешите сообщения от нашего <a href="https://vk.com/club239553821" target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>официального сообщества ВКонтакте</a> или напишите туда любое сообщение.
          </div>

          {error && <div style={{ color: 'var(--danger-color)', fontSize: '0.9rem' }}>{error}</div>}
          
          <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: hasAcceptedStatute ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', paddingRight: '1rem' }}>
                Отправляя заявку вы соглашаетесь с действующим уставом Штаба Студенческих Отрядов ПГУПСа
              </div>
              <button 
                type="button"
                onClick={handleModalOpen}
                style={{ background: 'transparent', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}
              >
                {hasAcceptedStatute ? <span style={{ color: '#34d399' }}>Принято</span> : 'Прочитать'} <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading || !hasAcceptedStatute} style={{ marginTop: '0.5rem', opacity: hasAcceptedStatute ? 1 : 0.5 }}>
            {loading ? 'Отправка...' : 'Отправить заявку'}
          </button>
        </form>
      </div>

      {showStatute && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.8)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            width: '100%', maxWidth: '800px', maxHeight: '90vh',
            display: 'flex', flexDirection: 'column',
            background: '#0f172a', padding: 0,
            borderRadius: '16px', border: '1px solid var(--glass-border)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
          }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Устав ШСО ПГУПС</h2>
              <button onClick={() => setShowStatute(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
            </div>
            
            <div 
              ref={contentRef}
              onScroll={handleScroll}
              style={{ padding: '1.5rem', overflowY: 'auto', flexGrow: 1, whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'var(--text-primary)', fontSize: '0.95rem' }}
            >
              {statute}
            </div>
            
            <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center' }}>
              <button 
                type="button" 
                className="btn-primary" 
                disabled={!canAcceptStatute}
                onClick={() => {
                  setHasAcceptedStatute(true)
                  setShowStatute(false)
                }}
                style={{ width: '100%', maxWidth: '300px', opacity: canAcceptStatute ? 1 : 0.5 }}
              >
                {canAcceptStatute ? 'Принять' : 'Пролистайте до конца, чтобы принять'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
