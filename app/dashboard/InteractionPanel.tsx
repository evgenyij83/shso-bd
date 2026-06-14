'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { MessageSquare, UserPlus, Send, X, Check, ChevronDown } from 'lucide-react'
import { submitAccountRequest } from '@/app/actions/accountRequests'
import { getAvailableRecipients, sendBulkMessage } from '@/app/actions/messaging'

type Squad = { id: string, name: string }
type Recipient = { id: string, fullName: string, role: string, squadName: string | null, hasVk: boolean }

export default function InteractionPanel({ squads, hasVkLink, userRole }: { squads: Squad[], hasVkLink: boolean, userRole: string }) {
  const isHQRole = userRole === 'HQ_COMMANDER' || userRole === 'HQ_COMMISSAR'
  
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'request' | 'message'>(isHQRole ? 'message' : 'request')

  // Request form state
  const [reqLoading, setReqLoading] = useState(false)
  const [reqError, setReqError] = useState('')
  const [reqSuccess, setReqSuccess] = useState('')
  const [selectedRole, setSelectedRole] = useState('SQUAD_COMMANDER')

  // Message form state
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])
  const [messageText, setMessageText] = useState('')
  const [msgLoading, setMsgLoading] = useState(false)
  const [msgError, setMsgError] = useState('')
  const [msgSuccess, setMsgSuccess] = useState('')
  const [recipientsLoaded, setRecipientsLoaded] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  async function loadRecipients() {
    if (recipientsLoaded) return
    const data = await getAvailableRecipients()
    setRecipients(data as Recipient[])
    setRecipientsLoaded(true)
  }

  function handleTabChange(tab: 'request' | 'message') {
    setActiveTab(tab)
    if (tab === 'message') loadRecipients()
  }

  async function handleSubmitRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!hasVkLink) {
      setReqError('Сначала укажите ссылку на ваш профиль ВКонтакте (в шапке сайта рядом с вашим именем).')
      return
    }
    setReqLoading(true)
    setReqError('')
    setReqSuccess('')

    const res = await submitAccountRequest(new FormData(e.currentTarget))
    if (res.error) {
      setReqError(res.error)
    } else {
      setReqSuccess('Заявка отправлена! Разработчик получит уведомление.')
      ;(e.target as HTMLFormElement).reset()
      setSelectedRole('SQUAD_COMMANDER')
    }
    setReqLoading(false)
  }

  function toggleRecipient(id: string) {
    setSelectedRecipients(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    )
  }

  async function handleSendMessage() {
    if (selectedRecipients.length === 0) {
      setMsgError('Выберите хотя бы одного получателя')
      return
    }
    if (!messageText.trim()) {
      setMsgError('Введите текст сообщения')
      return
    }
    setMsgLoading(true)
    setMsgError('')
    setMsgSuccess('')

    const res = await sendBulkMessage(selectedRecipients, messageText)
    if (res.error) {
      setMsgError(res.error)
    } else {
      setMsgSuccess(res.message || 'Сообщения отправлены!')
      setMessageText('')
      setSelectedRecipients([])
    }
    setMsgLoading(false)
  }

  const isSquadRole = selectedRole === 'SQUAD_COMMANDER' || selectedRole === 'SQUAD_COMMISSAR'
  const isHQ = selectedRole === 'HQ_COMMANDER' || selectedRole === 'HQ_COMMISSAR'
  const isFormRole = isSquadRole || isHQ

  if (!mounted) return (
    <button style={{ color: 'var(--text-primary)', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '8px 16px', borderRadius: '8px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
      <MessageSquare size={16} /> Панель взаимодействия
    </button>
  )

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        style={{ color: 'var(--text-primary)', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '8px 16px', borderRadius: '8px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
      >
        <MessageSquare size={16} /> Панель взаимодействия
      </button>

      {isOpen && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem 1rem', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '700px', background: '#0f172a', borderRadius: '16px', border: '1px solid var(--glass-border)', boxShadow: '0 10px 50px rgba(0,0,0,0.8)', marginTop: '2rem', marginBottom: '2rem' }}>
            
            {/* Header */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Панель взаимодействия</h2>
              <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '2rem', lineHeight: 1 }}>&times;</button>
            </div>

            {/* Tabs (Hidden for HQ roles as they only have messaging) */}
            {!isHQRole && (
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <button 
                  onClick={() => handleTabChange('request')}
                  style={{ flex: 1, padding: '1rem', background: activeTab === 'request' ? 'rgba(59, 130, 246, 0.15)' : 'transparent', border: 'none', borderBottom: activeTab === 'request' ? '2px solid #3b82f6' : '2px solid transparent', color: activeTab === 'request' ? '#3b82f6' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.95rem', transition: 'all 0.2s' }}
                >
                  <UserPlus size={16} /> Заявка на аккаунт
                </button>
                <button 
                  onClick={() => handleTabChange('message')}
                  style={{ flex: 1, padding: '1rem', background: activeTab === 'message' ? 'rgba(59, 130, 246, 0.15)' : 'transparent', border: 'none', borderBottom: activeTab === 'message' ? '2px solid #3b82f6' : '2px solid transparent', color: activeTab === 'message' ? '#3b82f6' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.95rem', transition: 'all 0.2s' }}
                >
                  <Send size={16} /> Оставить сообщение
                </button>
              </div>
            )}

            {/* Content */}
            <div style={{ padding: '1.5rem' }}>

              {/* === Tab: Request === */}
              {activeTab === 'request' && !isHQRole && (
                <div>
                  {!hasVkLink && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', color: '#fca5a5', fontSize: '0.9rem' }}>
                      ⚠️ Для отправки заявок необходимо сначала указать ссылку на ваш профиль ВКонтакте (в шапке сайта рядом с вашим именем).
                    </div>
                  )}

                  <form onSubmit={handleSubmitRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <select 
                      name="role" 
                      className="input-field" 
                      value={selectedRole}
                      onChange={e => setSelectedRole(e.target.value)}
                      required
                    >
                      <option value="SQUAD_COMMANDER">Командир отряда</option>
                      <option value="SQUAD_COMMISSAR">Комиссар отряда</option>
                      <option value="HQ_COMMANDER">Командир штаба</option>
                      <option value="HQ_COMMISSAR">Комиссар штаба</option>
                      <option value="UNIVERSITY_ADMIN">Руководство университета</option>
                    </select>

                    {isFormRole && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                        <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '-0.5rem' }}>Данные для анкеты:</h4>
                        
                        {isSquadRole && (
                          <select name="squadId" className="input-field" required>
                            <option value="">-- Выберите отряд --</option>
                            {squads.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        )}

                        {isHQ && (
                          <select name="squadId" className="input-field">
                            <option value="">-- Выберите отряд (опционально) --</option>
                            {squads.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        )}

                        <input name="fullName" placeholder="ФИО (обязательно)" className="input-field" required />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <input name="faculty" placeholder="Факультет" className="input-field" required />
                          <input name="studyGroup" placeholder="Группа" className="input-field" required />
                          <input name="course" type="number" min="1" max="6" placeholder="Курс" className="input-field" required />
                          <select name="educationForm" className="input-field" required>
                            <option value="" disabled selected>Форма обучения</option>
                            <option value="Бюджет">Бюджетная основа</option>
                            <option value="Целевое">Целевое обучение</option>
                            <option value="Коммерческое">Коммерческая основа</option>
                          </select>
                        </div>
                        <input name="phone" placeholder="Телефон" className="input-field" required />
                        <input name="vkLink" placeholder="Ссылка на ВК (обязательно)" className="input-field" required />
                      </div>
                    )}

                    {selectedRole === 'UNIVERSITY_ADMIN' && (
                      <input name="fullName" placeholder="ФИО руководителя" className="input-field" required />
                    )}

                    {reqError && <div style={{ color: 'var(--danger-color)', fontSize: '0.9rem' }}>{reqError}</div>}
                    {reqSuccess && <div style={{ color: '#34d399', fontSize: '0.9rem' }}>{reqSuccess}</div>}
                    
                    <button 
                      type="submit" 
                      className="btn-primary" 
                      disabled={reqLoading || !hasVkLink}
                      style={{ opacity: hasVkLink ? 1 : 0.5 }}
                    >
                      {reqLoading ? 'Отправка...' : 'Отправить заявку'}
                    </button>
                  </form>
                </div>
              )}

              {/* === Tab: Message === */}
              {activeTab === 'message' && (
                <div>
                  <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>Выберите получателей:</h4>
                  
                  <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', marginBottom: '1rem' }}>
                    {recipients.length === 0 && (
                      <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        {recipientsLoaded ? 'Нет доступных получателей' : 'Загрузка...'}
                      </div>
                    )}
                    {recipients.map(r => (
                      <label 
                        key={r.id} 
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', 
                          borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: r.hasVk ? 'pointer' : 'not-allowed',
                          opacity: r.hasVk ? 1 : 0.5, background: selectedRecipients.includes(r.id) ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                          transition: 'background 0.2s'
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={selectedRecipients.includes(r.id)}
                          onChange={() => r.hasVk && toggleRecipient(r.id)}
                          disabled={!r.hasVk}
                          style={{ accentColor: '#3b82f6' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{r.fullName}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {r.role}{r.squadName ? ` — ${r.squadName}` : ''}
                            {!r.hasVk && <span style={{ color: '#ef4444', marginLeft: '6px' }}>(ВК не указан)</span>}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {selectedRecipients.length > 0 && (
                    <div style={{ fontSize: '0.85rem', color: '#3b82f6', marginBottom: '0.75rem' }}>
                      Выбрано: {selectedRecipients.length}
                    </div>
                  )}

                  <textarea
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    placeholder="Введите текст сообщения..."
                    className="input-field"
                    style={{ minHeight: '100px', resize: 'vertical', width: '100%' }}
                  />

                  {msgError && <div style={{ color: 'var(--danger-color)', fontSize: '0.9rem', marginTop: '0.5rem' }}>{msgError}</div>}
                  {msgSuccess && <div style={{ color: '#34d399', fontSize: '0.9rem', marginTop: '0.5rem' }}>{msgSuccess}</div>}

                  <button 
                    onClick={handleSendMessage}
                    className="btn-primary" 
                    disabled={msgLoading}
                    style={{ marginTop: '1rem', width: '100%' }}
                  >
                    {msgLoading ? 'Отправка...' : 'Отправить сообщение'}
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
