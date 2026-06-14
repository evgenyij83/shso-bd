'use client'

import { useState } from 'react'
import { acceptAccountRequest, rejectAccountRequest } from '@/app/actions/accountRequests'
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react'

type AccountRequest = {
  id: string
  requestedRole: string
  squadName?: string
  fullName: string
  faculty?: string
  studyGroup?: string
  course?: number
  educationForm?: string
  phone?: string
  vkLink?: string
  requesterName?: string
  createdAt: string
}

const roleLabels: Record<string, string> = {
  'UNIVERSITY_ADMIN': 'Руководство Университета',
  'HQ_COMMANDER': 'Командир Штаба',
  'HQ_COMMISSAR': 'Комиссар Штаба',
  'SQUAD_COMMANDER': 'Командир Отряда',
  'SQUAD_COMMISSAR': 'Комиссар Отряда'
}

export default function AccountRequests({ requests }: { requests: AccountRequest[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [uniqueCode, setUniqueCode] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (requests.length === 0) return null

  async function handleAccept(requestId: string) {
    if (!uniqueCode.trim()) {
      setError('Укажите уникальный код')
      return
    }
    setLoadingId(requestId)
    setError('')
    const res = await acceptAccountRequest(requestId, uniqueCode.trim())
    if (res.error) {
      setError(res.error)
    } else {
      setAcceptingId(null)
      setUniqueCode('')
    }
    setLoadingId(null)
  }

  async function handleReject(requestId: string) {
    if (!rejectReason.trim()) {
      setError('Укажите причину отклонения')
      return
    }
    setLoadingId(requestId)
    setError('')
    const res = await rejectAccountRequest(requestId, rejectReason.trim())
    if (res.error) {
      setError(res.error)
    } else {
      setRejectingId(null)
      setRejectReason('')
    }
    setLoadingId(null)
  }

  return (
    <div className="glass-panel" style={{ padding: '2rem', marginTop: '1rem', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
      <h3 style={{ marginBottom: '1.5rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#fbbf24' }}></span>
        Заявки на создание аккаунтов ({requests.length})
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {requests.map(req => (
          <div key={req.id} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            {/* Header */}
            <div 
              style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
            >
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {req.fullName}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {roleLabels[req.requestedRole] || req.requestedRole}
                  {req.squadName && ` — ${req.squadName}`}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  От: {req.requesterName || 'Руководитель'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {expandedId === req.id ? <ChevronUp size={18} color="var(--text-secondary)" /> : <ChevronDown size={18} color="var(--text-secondary)" />}
              </div>
            </div>

            {/* Expanded Details */}
            {expandedId === req.id && (
              <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem', marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {req.faculty && <div><strong>Факультет:</strong> {req.faculty}</div>}
                  {req.studyGroup && <div><strong>Группа:</strong> {req.studyGroup}</div>}
                  {req.course && <div><strong>Курс:</strong> {req.course}</div>}
                  {req.educationForm && <div><strong>Форма:</strong> {req.educationForm}</div>}
                  {req.phone && <div><strong>Телефон:</strong> {req.phone}</div>}
                  {req.vkLink && <div><strong>ВК:</strong> <a href={req.vkLink.startsWith('http') ? req.vkLink : `https://vk.com/${req.vkLink}`} target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}>Перейти</a></div>}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  {acceptingId !== req.id && rejectingId !== req.id && (
                    <>
                      <button 
                        onClick={() => { setAcceptingId(req.id); setRejectingId(null); setError('') }}
                        style={{ flex: 1, padding: '8px 16px', background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <Check size={16} /> Принять
                      </button>
                      <button 
                        onClick={() => { setRejectingId(req.id); setAcceptingId(null); setError('') }}
                        className="btn-danger"
                        style={{ flex: 1, padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <X size={16} /> Отклонить
                      </button>
                    </>
                  )}
                </div>

                {/* Accept Form */}
                {acceptingId === req.id && (
                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <input
                      type="text"
                      value={uniqueCode}
                      onChange={e => setUniqueCode(e.target.value)}
                      placeholder="Введите уникальный код (идентификатор)"
                      className="input-field"
                      autoFocus
                    />
                    {error && <div style={{ color: 'var(--danger-color)', fontSize: '0.85rem' }}>{error}</div>}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => { setAcceptingId(null); setError('') }} style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                        Отмена
                      </button>
                      <button onClick={() => handleAccept(req.id)} className="btn-primary" style={{ flex: 1, padding: '8px' }} disabled={loadingId === req.id}>
                        {loadingId === req.id ? 'Создание...' : 'Создать аккаунт'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Reject Form */}
                {rejectingId === req.id && (
                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <textarea
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="Укажите причину отклонения (будет отправлена в ВК руководителю)"
                      className="input-field"
                      style={{ minHeight: '80px', resize: 'vertical' }}
                      autoFocus
                    />
                    {error && <div style={{ color: 'var(--danger-color)', fontSize: '0.85rem' }}>{error}</div>}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => { setRejectingId(null); setError('') }} style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                        Отмена
                      </button>
                      <button onClick={() => handleReject(req.id)} className="btn-danger" style={{ flex: 1, padding: '8px' }} disabled={loadingId === req.id}>
                        {loadingId === req.id ? 'Отклонение...' : 'Отклонить заявку'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
