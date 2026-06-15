'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { MessageSquare, UserPlus, Send, X, Check, ChevronDown, Award, Calendar, Download, Trash2 } from 'lucide-react'
import { submitAccountRequest } from '@/app/actions/accountRequests'
import { getAvailableRecipients, sendBulkMessage } from '@/app/actions/messaging'
import { getPendingAwardNominations, approveByHQ, approveByUniversity, getUniversityAdmins } from '@/app/actions/awards'
import { getPendingAbsenceLists, clearAbsenceHistory, markAbsenceListDownloaded, deleteAbsenceList } from '@/app/actions/absences'
import { getPendingPracticeRequestsForUni, processPracticeRequest } from '@/app/actions/practice'
import { Briefcase } from 'lucide-react'

type Squad = { id: string, name: string }
type Recipient = { id: string, fullName: string, role: string, squadName: string | null, hasVk: boolean }

export default function InteractionPanel({ squads, hasVkLink, userRole, pendingAwardsCount = 0, pendingAbsencesCount = 0, pendingPracticeCount = 0 }: { squads: Squad[], hasVkLink: boolean, userRole: string, pendingAwardsCount?: number, pendingAbsencesCount?: number, pendingPracticeCount?: number }) {
  const router = useRouter()
  const isHQRole = userRole === 'HQ_COMMANDER' || userRole === 'HQ_COMMISSAR'
  const pendingCount = pendingAwardsCount + pendingAbsencesCount + pendingPracticeCount
  
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'request' | 'message' | 'awards' | 'absences' | 'practice'>('request')

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

  // Awards state
  const [nominations, setNominations] = useState<any[]>([])
  const [awardsLoaded, setAwardsLoaded] = useState(false)
  const [selectedNominees, setSelectedNominees] = useState<Record<string, string[]>>({})
  const [targetAdmin, setTargetAdmin] = useState('')
  const [admins, setAdmins] = useState<any[]>([])
  const [awardLoading, setAwardLoading] = useState(false)
  const [awardError, setAwardError] = useState('')
  const [awardSuccess, setAwardSuccess] = useState('')

  // Absences state (University only)
  const [absenceLists, setAbsenceLists] = useState<any[]>([])
  const [absencesLoaded, setAbsencesLoaded] = useState(false)
  const [clearAbsencesLoading, setClearAbsencesLoading] = useState(false)

  // Practice state (University only)
  const [practices, setPractices] = useState<any[]>([])
  const [practicesLoaded, setPracticesLoaded] = useState(false)
  const [practiceLoadingId, setPracticeLoadingId] = useState('')
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({})

  const showAwardsTab = isHQRole || userRole === 'UNIVERSITY_ADMIN'
  const showAbsencesTab = userRole === 'UNIVERSITY_ADMIN'
  const showPracticeTab = userRole === 'UNIVERSITY_ADMIN'

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (isOpen && activeTab === 'message') {
      loadRecipients()
    }
  }, [isOpen, activeTab])

  async function loadRecipients() {
    if (recipientsLoaded) return
    const data = await getAvailableRecipients()
    setRecipients(data as Recipient[])
    setRecipientsLoaded(true)
  }

  function handleTabChange(tab: 'request' | 'message' | 'awards' | 'absences' | 'practice') {
    setActiveTab(tab)
    if (tab === 'message') loadRecipients()
    if (tab === 'awards') loadAwards()
    if (tab === 'absences') loadAbsences()
    if (tab === 'practice') loadPractices()
  }

  async function loadPractices() {
    if (practicesLoaded) return
    const data = await getPendingPracticeRequestsForUni()
    setPractices(data)
    setPracticesLoaded(true)
  }

  async function handleProcessPractice(id: string, isApproved: boolean) {
    if (!isApproved) {
      if (!rejectReasons[id]?.trim()) {
        alert('Укажите причину отказа')
        return
      }
    }
    setPracticeLoadingId(id)
    const res = await processPracticeRequest(id, isApproved, rejectReasons[id])
    if (!res.error) {
      setPractices(prev => prev.filter(p => p.id !== id))
      router.refresh()
    } else {
      alert(res.error)
    }
    setPracticeLoadingId('')
  }

  async function loadAbsences() {
    if (absencesLoaded) return
    const data = await getPendingAbsenceLists()
    setAbsenceLists(data as any[])
    setAbsencesLoaded(true)
  }

  async function handleClearAbsenceHistory() {
    if (!confirm('Вы уверены, что хотите очистить историю пропусков?')) return
    setClearAbsencesLoading(true)
    const res = await clearAbsenceHistory()
    if (!res.error) {
      setAbsenceLists([])
      router.refresh()
    }
    setClearAbsencesLoading(false)
  }

  async function handleDownloadAbsence(listId: string) {
    window.open(`/api/export/absences?listId=${listId}`, '_blank')
    await markAbsenceListDownloaded(listId)
    // Обновим локальный список или просто страницу, чтобы ушло уведомление
    setAbsenceLists(prev => prev.filter(l => l.id !== listId))
    router.refresh()
  }

  async function handleDeleteAbsenceList(listId: string) {
    if (!confirm('Удалить эту форму?')) return
    await deleteAbsenceList(listId)
    setAbsenceLists(prev => prev.filter(l => l.id !== listId))
    router.refresh()
  }

  async function loadAwards() {
    if (awardsLoaded) return
    const data = await getPendingAwardNominations()
    setNominations(data as any[])
    if (isHQRole) {
      const adminList = await getUniversityAdmins()
      setAdmins(adminList as any[])
    }
    setAwardsLoaded(true)
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
    <button style={{ position: 'relative', color: 'var(--text-primary)', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '8px 16px', borderRadius: '8px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
      <MessageSquare size={16} /> Панель взаимодействия
      {pendingCount > 0 && (
        <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--danger-color)', color: 'white', fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px' }}>
          {pendingCount}
        </span>
      )}
    </button>
  )

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        style={{ position: 'relative', color: 'var(--text-primary)', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '8px 16px', borderRadius: '8px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
      >
        <MessageSquare size={16} /> Панель взаимодействия
        {pendingCount > 0 && (
          <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--danger-color)', color: 'white', fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px' }}>
            {pendingCount}
          </span>
        )}
      </button>

      {isOpen && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem 1rem', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '700px', background: '#0f172a', borderRadius: '16px', border: '1px solid var(--glass-border)', boxShadow: '0 10px 50px rgba(0,0,0,0.8)', marginTop: '2rem', marginBottom: '2rem' }}>
            
            {/* Header */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Панель взаимодействия</h2>
              <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '2rem', lineHeight: 1 }}>&times;</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', flexWrap: 'wrap' }}>
              <button 
                onClick={() => handleTabChange('request')}
                style={{ flex: 1, padding: '0.75rem', background: activeTab === 'request' ? 'rgba(59, 130, 246, 0.15)' : 'transparent', border: 'none', borderBottom: activeTab === 'request' ? '2px solid #3b82f6' : '2px solid transparent', color: activeTab === 'request' ? '#3b82f6' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem', transition: 'all 0.2s' }}
              >
                <UserPlus size={14} /> Заявка
              </button>
              <button 
                onClick={() => handleTabChange('message')}
                style={{ flex: 1, padding: '0.75rem', background: activeTab === 'message' ? 'rgba(59, 130, 246, 0.15)' : 'transparent', border: 'none', borderBottom: activeTab === 'message' ? '2px solid #3b82f6' : '2px solid transparent', color: activeTab === 'message' ? '#3b82f6' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem', transition: 'all 0.2s' }}
              >
                <Send size={14} /> Сообщение
              </button>
              {showAwardsTab && (
                <button 
                  onClick={() => handleTabChange('awards')}
                  style={{ position: 'relative', flex: 1, padding: '0.75rem', background: activeTab === 'awards' ? 'rgba(251, 191, 36, 0.15)' : 'transparent', border: 'none', borderBottom: activeTab === 'awards' ? '2px solid #fbbf24' : '2px solid transparent', color: activeTab === 'awards' ? '#fbbf24' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem', transition: 'all 0.2s' }}
                >
                  <Award size={14} /> Награждения
                  {pendingAwardsCount > 0 && (
                    <span style={{ position: 'absolute', top: '8px', right: '8px', background: 'var(--danger-color)', color: 'white', fontSize: '0.7rem', fontWeight: 'bold', padding: '1px 5px', borderRadius: '10px' }}>
                      {pendingAwardsCount}
                    </span>
                  )}
                </button>
              )}
              {showAbsencesTab && (
                <button 
                  onClick={() => handleTabChange('absences')}
                  style={{ position: 'relative', flex: 1, padding: '0.75rem', background: activeTab === 'absences' ? 'rgba(59, 130, 246, 0.15)' : 'transparent', border: 'none', borderBottom: activeTab === 'absences' ? '2px solid #3b82f6' : '2px solid transparent', color: activeTab === 'absences' ? '#3b82f6' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem', transition: 'all 0.2s' }}
                >
                  <Calendar size={14} /> Пропуски
                  {pendingAbsencesCount > 0 && (
                    <span style={{ position: 'absolute', top: '8px', right: '8px', background: 'var(--danger-color)', color: 'white', fontSize: '0.7rem', fontWeight: 'bold', padding: '1px 5px', borderRadius: '10px' }}>
                      {pendingAbsencesCount}
                    </span>
                  )}
                </button>
              )}
              {showPracticeTab && (
                <button 
                  onClick={() => handleTabChange('practice')}
                  style={{ position: 'relative', flex: 1, padding: '0.75rem', background: activeTab === 'practice' ? 'rgba(168, 85, 247, 0.15)' : 'transparent', border: 'none', borderBottom: activeTab === 'practice' ? '2px solid #a855f7' : '2px solid transparent', color: activeTab === 'practice' ? '#a855f7' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem', transition: 'all 0.2s' }}
                >
                  <Briefcase size={14} /> Практика
                  {pendingPracticeCount > 0 && (
                    <span style={{ position: 'absolute', top: '8px', right: '8px', background: 'var(--danger-color)', color: 'white', fontSize: '0.7rem', fontWeight: 'bold', padding: '1px 5px', borderRadius: '10px' }}>
                      {pendingPracticeCount}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Content */}
            <div style={{ padding: '1.5rem' }}>

              {/* === Tab: Request === */}
              {activeTab === 'request' && (
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
                      {!isHQRole && (
                        <>
                          <option value="HQ_COMMANDER">Командир штаба</option>
                          <option value="HQ_COMMISSAR">Комиссар штаба</option>
                          <option value="UNIVERSITY_ADMIN">Руководство университета</option>
                        </>
                      )}
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
              {/* === Tab: Awards === */}
              {activeTab === 'awards' && showAwardsTab && (
                <div>
                  <h4 style={{ color: '#fbbf24', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    {isHQRole ? 'Списки на согласование' : 'Списки на утверждение'}
                  </h4>

                  {nominations.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      {awardsLoaded ? 'Нет номинаций для рассмотрения' : 'Загрузка...'}
                    </div>
                  )}

                  {nominations.map((nom: any) => (
                    <div key={nom.id} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(251, 191, 36, 0.2)', padding: '1.25rem', marginBottom: '1rem' }}>
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Отряд: {nom.squadName}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>От: {nom.nominatorName}</div>
                      </div>

                      {(nom.nominees || []).map((nominee: any) => (
                        <label key={nominee.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={(selectedNominees[nom.id] || []).includes(nominee.id)}
                            onChange={() => {
                              setSelectedNominees(prev => {
                                const current = prev[nom.id] || []
                                const updated = current.includes(nominee.id)
                                  ? current.filter((id: string) => id !== nominee.id)
                                  : [...current, nominee.id]
                                return { ...prev, [nom.id]: updated }
                              })
                            }}
                            style={{ accentColor: '#fbbf24', marginTop: '4px' }}
                          />
                          <div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>{nominee.fighterName}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{nominee.description}</div>
                          </div>
                        </label>
                      ))}

                      {/* HQ: select admin to forward */}
                      {isHQRole && (
                        <select
                          value={targetAdmin}
                          onChange={e => setTargetAdmin(e.target.value)}
                          className="input-field"
                          style={{ marginTop: '1rem', width: '100%' }}
                        >
                          <option value="">-- Выберите руководителя --</option>
                          {admins.map((a: any) => (
                            <option key={a.id} value={a.id}>{a.fullName || 'Руководитель'}</option>
                          ))}
                        </select>
                      )}

                      {awardError && <div style={{ color: 'var(--danger-color)', fontSize: '0.85rem', marginTop: '0.5rem' }}>{awardError}</div>}
                      {awardSuccess && <div style={{ color: '#34d399', fontSize: '0.85rem', marginTop: '0.5rem' }}>{awardSuccess}</div>}

                      <button
                        onClick={async () => {
                          const ids = selectedNominees[nom.id] || []
                          if (ids.length === 0) { setAwardError('Выберите хотя бы одного кандидата'); return }
                          setAwardLoading(true)
                          setAwardError('')
                          setAwardSuccess('')
                          let res
                          if (isHQRole) {
                            if (!targetAdmin) { setAwardError('Выберите руководителя'); setAwardLoading(false); return }
                            res = await approveByHQ(nom.id, ids, targetAdmin)
                          } else {
                            res = await approveByUniversity(nom.id, ids)
                          }
                          if (res.error) {
                            setAwardError(res.error)
                          } else {
                            setAwardSuccess(isHQRole ? 'Согласовано и отправлено руководителю!' : 'Утверждено!')
                            setNominations(prev => prev.filter((n: any) => n.id !== nom.id))
                            if (!isHQRole && (res as any).nominationId) {
                              window.open(`/api/export/awards?nominationId=${(res as any).nominationId}`, '_blank')
                            }
                          }
                          setAwardLoading(false)
                        }}
                        disabled={awardLoading}
                        style={{ marginTop: '1rem', width: '100%', padding: '10px', background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}
                      >
                        {awardLoading ? 'Обработка...' : isHQRole ? 'Согласовать и отправить' : 'Утвердить и скачать Word'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab: Absences (University only) */}
              {activeTab === 'absences' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h4 style={{ color: '#3b82f6', fontSize: '0.9rem', margin: 0 }}>Полученные списки пропусков</h4>
                    {absenceLists.length > 0 && (
                      <button onClick={handleClearAbsenceHistory} disabled={clearAbsencesLoading} style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}>
                        <Trash2 size={14} /> {clearAbsencesLoading ? 'Очистка...' : 'Очистить историю'}
                      </button>
                    )}
                  </div>
                  {!absencesLoaded && <div style={{ color: 'var(--text-secondary)' }}>Загрузка...</div>}
                  {absencesLoaded && absenceLists.length === 0 && <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>Нет новых списков</div>}
                  {absenceLists.map((list: any) => {
                    const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
                    const senderRole = list.senderRole === 'SQUAD_COMMANDER' || list.senderRole === 'HQ_COMMANDER' ? 'Командир' : 'Комиссар'
                    return (
                      <div key={list.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(59,130,246,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>{list.squadName}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {senderRole} {list.senderName} — {monthNames[(list.month as number) - 1]} {list.year}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button onClick={() => handleDownloadAbsence(list.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'rgba(59,130,246,0.2)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                              <Download size={14} /> Скачать Word
                            </button>
                            <button onClick={() => handleDeleteAbsenceList(list.id)} style={{ padding: '8px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444', cursor: 'pointer' }} title="Удалить форму">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Tab: Practice (University only) */}
              {activeTab === 'practice' && (
                <div>
                  <h4 style={{ color: '#a855f7', fontSize: '0.9rem', marginBottom: '1rem' }}>Заявки на прохождение практики</h4>
                  {!practicesLoaded && <div style={{ color: 'var(--text-secondary)' }}>Загрузка...</div>}
                  {practicesLoaded && practices.length === 0 && <div style={{ color: 'var(--text-secondary)' }}>Нет заявок на практику</div>}
                  {practices.map(p => (
                    <div key={p.id} style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{ color: '#c084fc', fontWeight: 600, fontSize: '1.05rem', marginBottom: '4px' }}>{p.practiceType} практика ({p.squadName})</div>
                        <div style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{p.fullName}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          Факультет: {p.faculty}, Курс: {p.course}, Группа: {p.studyGroup}<br/>
                          Сроки: {p.period}<br/>
                          Телефон: {p.phone}<br/>
                          ВК: <a href={p.vkLink} target="_blank" style={{ color: '#3b82f6' }}>{p.vkLink}</a>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <input 
                          type="text" 
                          placeholder="Причина отказа (обязательно при отклонении)" 
                          className="input-field" 
                          value={rejectReasons[p.id] || ''}
                          onChange={e => setRejectReasons(prev => ({ ...prev, [p.id]: e.target.value }))}
                          style={{ fontSize: '0.85rem' }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            onClick={() => handleProcessPractice(p.id, true)} 
                            disabled={practiceLoadingId === p.id}
                            style={{ flex: 1, padding: '8px', background: 'rgba(52,211,153,0.2)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                          >
                            Одобрить
                          </button>
                          <button 
                            onClick={() => handleProcessPractice(p.id, false)} 
                            disabled={practiceLoadingId === p.id}
                            style={{ flex: 1, padding: '8px', background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                          >
                            Отклонить
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
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
