'use client'

import { useState } from 'react'
import { processIdentifierRequest } from '@/app/actions/identifierRequests'
import { Key, ChevronDown, ChevronUp } from 'lucide-react'

type IdRequest = {
  id: string
  fullName: string
  vkLink: string
  currentCode: string
  role: string
  createdAt: string
}

export default function IdentifierRequests({ requests }: { requests: IdRequest[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [newCode, setNewCode] = useState('')
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (requests.length === 0) return null

  async function handleProcess(requestId: string) {
    if (!newCode.trim()) {
      setError('Укажите новый идентификатор')
      return
    }
    setLoadingId(requestId)
    setError('')
    const res = await processIdentifierRequest(requestId, newCode.trim())
    if (res.error) {
      setError(res.error)
    } else {
      setProcessingId(null)
      setNewCode('')
    }
    setLoadingId(null)
  }

  return (
    <div className="glass-panel" style={{ padding: '2rem', marginTop: '1rem', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
      <h3 style={{ marginBottom: '1.5rem', color: '#a855f7', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Key size={18} />
        Заявки на смену идентификатора ({requests.length})
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {requests.map(req => (
          <div key={req.id} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div
              style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
            >
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{req.fullName}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Текущий код: <span style={{ color: '#a855f7' }}>{req.currentCode}</span>
                </div>
              </div>
              {expandedId === req.id ? <ChevronUp size={18} color="var(--text-secondary)" /> : <ChevronDown size={18} color="var(--text-secondary)" />}
            </div>

            {expandedId === req.id && (
              <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <div><strong>ВК:</strong> <a href={req.vkLink.startsWith('http') ? req.vkLink : `https://vk.com/${req.vkLink}`} target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}>Перейти</a></div>
                </div>

                {processingId !== req.id ? (
                  <button
                    onClick={() => { setProcessingId(req.id); setError('') }}
                    style={{ marginTop: '1rem', padding: '8px 16px', background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', width: '100%', justifyContent: 'center' }}
                  >
                    <Key size={16} /> Назначить новый идентификатор
                  </button>
                ) : (
                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <input
                      type="text"
                      value={newCode}
                      onChange={e => setNewCode(e.target.value)}
                      placeholder="Введите новый идентификатор"
                      className="input-field"
                      autoFocus
                    />
                    {error && <div style={{ color: 'var(--danger-color)', fontSize: '0.85rem' }}>{error}</div>}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => { setProcessingId(null); setError('') }} style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                        Отмена
                      </button>
                      <button onClick={() => handleProcess(req.id)} className="btn-primary" style={{ flex: 1, padding: '8px' }} disabled={loadingId === req.id}>
                        {loadingId === req.id ? 'Обработка...' : 'Сохранить'}
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
