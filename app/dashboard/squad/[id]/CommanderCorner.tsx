'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Award, AlertTriangle, Calendar, Plus, Trash2, Send } from 'lucide-react'
import { submitAwardNomination } from '@/app/actions/awards'
import { submitIncidentReport } from '@/app/actions/incidents'
import { getDraftAbsenceList, createDraftAbsenceList, addAbsenceEntry, removeAbsenceEntry, deleteDraftAbsenceList, submitAbsenceList, getUniversityAdminsForAbsences } from '@/app/actions/absences'

type Fighter = { id: string, fullName: string, position: string }

const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']

function daysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate()
}

export default function CommanderCorner({ squadId, fighters, userRole }: { squadId: string, fighters: Fighter[], userRole: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'award' | 'incident' | 'absence'>('award')
  const [mounted, setMounted] = useState(false)

  // Award state
  const [selectedFighters, setSelectedFighters] = useState<Record<string, string>>({})
  const [awardLoading, setAwardLoading] = useState(false)
  const [awardError, setAwardError] = useState('')
  const [awardSuccess, setAwardSuccess] = useState('')

  // Incident state
  const [incidentFighters, setIncidentFighters] = useState<string[]>([])
  const [incidentDesc, setIncidentDesc] = useState('')
  const [incidentLoading, setIncidentLoading] = useState(false)
  const [incidentError, setIncidentError] = useState('')
  const [incidentSuccess, setIncidentSuccess] = useState('')

  // Absence state
  const [absenceDraft, setAbsenceDraft] = useState<any>(null)
  const [absenceLoaded, setAbsenceLoaded] = useState(false)
  const [absMonth, setAbsMonth] = useState(new Date().getMonth() + 1)
  const [absYear, setAbsYear] = useState(new Date().getFullYear())
  const [absLoading, setAbsLoading] = useState(false)
  const [absError, setAbsError] = useState('')
  const [absSuccess, setAbsSuccess] = useState('')
  const [admins, setAdmins] = useState<any[]>([])
  const [targetAdmin, setTargetAdmin] = useState('')

  // New entry form state
  const [newEntryFighter, setNewEntryFighter] = useState('')
  const [newTimeFrom, setNewTimeFrom] = useState('')
  const [newDateFrom, setNewDateFrom] = useState('')
  const [newTimeTo, setNewTimeTo] = useState('')
  const [newDateTo, setNewDateTo] = useState('')

  useEffect(() => { setMounted(true) }, [])

  const cornerLabel = userRole === 'SQUAD_COMMANDER' || userRole === 'HQ_COMMANDER' ? 'Уголок командира' : 'Уголок комиссара'

  // Load draft when tab opens
  async function loadDraft() {
    const draft = await getDraftAbsenceList(squadId)
    setAbsenceDraft(draft)
    if (draft) {
      setAbsMonth(draft.month)
      setAbsYear(draft.year)
    }
    const adminList = await getUniversityAdminsForAbsences()
    setAdmins(adminList as any[])
    setAbsenceLoaded(true)
  }

  function handleTabChange(tab: 'award' | 'incident' | 'absence') {
    setActiveTab(tab)
    if (tab === 'absence' && !absenceLoaded) loadDraft()
  }

  // Award handlers
  function toggleFighterAward(fighterId: string) {
    setSelectedFighters(prev => {
      const copy = { ...prev }
      if (copy[fighterId] !== undefined) delete copy[fighterId]
      else copy[fighterId] = ''
      return copy
    })
  }

  function updateAwardDesc(fighterId: string, desc: string) {
    setSelectedFighters(prev => ({ ...prev, [fighterId]: desc }))
  }

  async function handleSubmitAward() {
    const nominees = Object.entries(selectedFighters).map(([fighterId, description]) => {
      const fighter = fighters.find(f => f.id === fighterId)
      return { fighterId, fighterName: fighter?.fullName || '', description }
    })
    if (nominees.length === 0) { setAwardError('Выберите хотя бы одного бойца'); return }
    for (const n of nominees) { if (!n.description.trim()) { setAwardError(`Укажите заслуги для ${n.fighterName}`); return } }
    setAwardLoading(true); setAwardError(''); setAwardSuccess('')
    const res = await submitAwardNomination(squadId, nominees)
    if (res.error) setAwardError(res.error)
    else { setAwardSuccess('Список на награждение отправлен штабу на согласование!'); setSelectedFighters({}) }
    setAwardLoading(false)
  }

  // Incident handlers
  function toggleIncidentFighter(name: string) {
    setIncidentFighters(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])
  }

  async function handleSubmitIncident() {
    if (incidentFighters.length === 0) { setIncidentError('Выберите хотя бы одного человека'); return }
    if (!incidentDesc.trim()) { setIncidentError('Опишите ситуацию'); return }
    setIncidentLoading(true); setIncidentError(''); setIncidentSuccess('')
    const res = await submitIncidentReport(squadId, incidentFighters, incidentDesc)
    if (res.error) setIncidentError(res.error)
    else { setIncidentSuccess('Доклад о происшествии отправлен!'); setIncidentFighters([]); setIncidentDesc('') }
    setIncidentLoading(false)
  }

  // Absence handlers
  async function handleCreateDraft() {
    setAbsLoading(true); setAbsError('')
    const res = await createDraftAbsenceList(squadId, absMonth, absYear)
    if (res.error) setAbsError(res.error)
    else await loadDraft()
    setAbsLoading(false)
  }

  async function handleAddEntry() {
    if (!absenceDraft) return
    if (!newEntryFighter) { setAbsError('Выберите бойца'); return }
    if (!newTimeFrom) { setAbsError('Укажите время «С»'); return }
    if (!newDateFrom) { setAbsError('Выберите дату «С»'); return }
    if (!newTimeTo) { setAbsError('Укажите время «По»'); return }
    if (!newDateTo) { setAbsError('Выберите дату «По»'); return }
    
    const [yearF, monthF, dayF] = newDateFrom.split('-').map(Number)
    const [yearT, monthT, dayT] = newDateTo.split('-').map(Number)

    const fighter = fighters.find(f => f.id === newEntryFighter)
    if (!fighter) return
    setAbsLoading(true); setAbsError('')
    const res = await addAbsenceEntry(absenceDraft.id, newEntryFighter, fighter.fullName, newTimeFrom, dayF, monthF, newTimeTo, dayT, monthT)
    if (res.error) setAbsError(res.error)
    else {
      setNewTimeFrom(''); setNewDateFrom(''); setNewTimeTo(''); setNewDateTo('')
      await loadDraft()
    }
    setAbsLoading(false)
  }

  async function handleRemoveEntry(entryId: string) {
    setAbsLoading(true)
    await removeAbsenceEntry(entryId)
    await loadDraft()
    setAbsLoading(false)
  }

  async function handleDeleteDraft() {
    if (!absenceDraft) return
    if (!confirm('Удалить черновик? Все записи будут потеряны.')) return
    setAbsLoading(true)
    await deleteDraftAbsenceList(absenceDraft.id)
    setAbsenceDraft(null)
    setAbsLoading(false)
  }

  async function handleSubmitAbsences() {
    if (!absenceDraft) return
    if (!targetAdmin) { setAbsError('Выберите руководителя'); return }
    setAbsLoading(true); setAbsError(''); setAbsSuccess('')
    const res = await submitAbsenceList(absenceDraft.id, targetAdmin)
    if (res.error) setAbsError(res.error)
    else {
      setAbsSuccess('Список отправлен на согласование!')
      setAbsenceDraft(null)
      setTargetAdmin('')
    }
    setAbsLoading(false)
  }

  function formatTimeInput(val: string): string {
    const digits = val.replace(/\D/g, '').slice(0, 4)
    if (digits.length <= 2) return digits
    return digits.slice(0, 2) + ':' + digits.slice(2)
  }

  const maxDays = absenceDraft ? daysInMonth(absenceDraft.month, absenceDraft.year) : 31

  if (!mounted) return null

  return (
    <>
      <button onClick={() => setIsOpen(true)}
        style={{ color: '#fbbf24', background: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(251, 191, 36, 0.3)', padding: '8px 16px', borderRadius: '8px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '1.5rem' }}>
        <Award size={16} /> {cornerLabel}
      </button>

      {isOpen && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem 1rem', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '800px', background: '#0f172a', borderRadius: '16px', border: '1px solid var(--glass-border)', boxShadow: '0 10px 50px rgba(0,0,0,0.8)', marginTop: '2rem', marginBottom: '2rem' }}>
            {/* Header */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#fbbf24' }}>{cornerLabel}</h2>
              <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '2rem', lineHeight: 1 }}>&times;</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', flexWrap: 'wrap' }}>
              <button onClick={() => handleTabChange('award')}
                style={{ flex: 1, padding: '0.75rem', background: activeTab === 'award' ? 'rgba(251, 191, 36, 0.15)' : 'transparent', border: 'none', borderBottom: activeTab === 'award' ? '2px solid #fbbf24' : '2px solid transparent', color: activeTab === 'award' ? '#fbbf24' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem', transition: 'all 0.2s' }}>
                <Award size={14} /> Награждение
              </button>
              <button onClick={() => handleTabChange('incident')}
                style={{ flex: 1, padding: '0.75rem', background: activeTab === 'incident' ? 'rgba(239, 68, 68, 0.15)' : 'transparent', border: 'none', borderBottom: activeTab === 'incident' ? '2px solid #ef4444' : '2px solid transparent', color: activeTab === 'incident' ? '#ef4444' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem', transition: 'all 0.2s' }}>
                <AlertTriangle size={14} /> Происшествие
              </button>
              <button onClick={() => handleTabChange('absence')}
                style={{ flex: 1, padding: '0.75rem', background: activeTab === 'absence' ? 'rgba(59, 130, 246, 0.15)' : 'transparent', border: 'none', borderBottom: activeTab === 'absence' ? '2px solid #3b82f6' : '2px solid transparent', color: activeTab === 'absence' ? '#3b82f6' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem', transition: 'all 0.2s' }}>
                <Calendar size={14} /> Пропуски
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '1.5rem' }}>

              {/* === Tab: Award === */}
              {activeTab === 'award' && (
                <div>
                  <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>Выберите бойцов для награждения и опишите заслуги:</h4>
                  <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', marginBottom: '1rem' }}>
                    {fighters.map(f => {
                      const isSelected = selectedFighters[f.id] !== undefined
                      return (
                        <div key={f.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '10px 12px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={isSelected} onChange={() => toggleFighterAward(f.id)} style={{ accentColor: '#fbbf24' }} />
                            <div>
                              <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{f.fullName}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{f.position}</div>
                            </div>
                          </label>
                          {isSelected && (
                            <textarea value={selectedFighters[f.id]} onChange={e => updateAwardDesc(f.id, e.target.value)} placeholder={`Заслуги ${f.fullName}...`} className="input-field" style={{ width: '100%', minHeight: '60px', resize: 'vertical', marginTop: '8px', fontSize: '0.85rem' }} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                  {awardError && <div style={{ color: 'var(--danger-color)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{awardError}</div>}
                  {awardSuccess && <div style={{ color: '#34d399', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{awardSuccess}</div>}
                  <button onClick={handleSubmitAward} disabled={awardLoading || Object.keys(selectedFighters).length === 0}
                    style={{ width: '100%', padding: '12px', background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.95rem', opacity: Object.keys(selectedFighters).length === 0 ? 0.5 : 1 }}>
                    {awardLoading ? 'Отправка...' : 'Отправить на согласование штабу'}
                  </button>
                </div>
              )}

              {/* === Tab: Incident === */}
              {activeTab === 'incident' && (
                <div>
                  <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>Выберите участников и опишите ситуацию:</h4>
                  <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', marginBottom: '1rem' }}>
                    {fighters.map(f => (
                      <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', background: incidentFighters.includes(f.fullName) ? 'rgba(239, 68, 68, 0.1)' : 'transparent' }}>
                        <input type="checkbox" checked={incidentFighters.includes(f.fullName)} onChange={() => toggleIncidentFighter(f.fullName)} style={{ accentColor: '#ef4444' }} />
                        <div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{f.fullName}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{f.position}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <textarea value={incidentDesc} onChange={e => setIncidentDesc(e.target.value)} placeholder="Опишите ситуацию подробно..." className="input-field" style={{ width: '100%', minHeight: '120px', resize: 'vertical', marginBottom: '1rem' }} />
                  {incidentError && <div style={{ color: 'var(--danger-color)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{incidentError}</div>}
                  {incidentSuccess && <div style={{ color: '#34d399', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{incidentSuccess}</div>}
                  <button onClick={handleSubmitIncident} disabled={incidentLoading} className="btn-danger" style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <AlertTriangle size={16} /> {incidentLoading ? 'Отправка...' : 'Отправить доклад'}
                  </button>
                </div>
              )}

              {/* === Tab: Absence === */}
              {activeTab === 'absence' && (
                <div>
                  {!absenceLoaded ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Загрузка...</div>
                  ) : !absenceDraft ? (
                    /* No draft yet — create one */
                    <div>
                      <h4 style={{ color: '#3b82f6', fontSize: '0.9rem', marginBottom: '1rem' }}>Создать новый список пропусков</h4>
                      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        <select value={absMonth} onChange={e => setAbsMonth(Number(e.target.value))} className="input-field" style={{ flex: 1, minWidth: '150px' }}>
                          {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                        </select>
                        <input type="number" value={absYear} onChange={e => setAbsYear(Number(e.target.value))} className="input-field" style={{ width: '100px' }} min={2020} max={2030} />
                      </div>
                      {absError && <div style={{ color: 'var(--danger-color)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{absError}</div>}
                      <button onClick={handleCreateDraft} disabled={absLoading} className="btn-primary" style={{ width: '100%' }}>
                        {absLoading ? 'Создание...' : 'Создать черновик'}
                      </button>
                    </div>
                  ) : (
                    /* Draft exists — show entries + add form */
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h4 style={{ color: '#3b82f6', margin: 0, fontSize: '0.9rem' }}>
                          Пропуски: {monthNames[absenceDraft.month - 1]} {absenceDraft.year}
                        </h4>
                        <button onClick={handleDeleteDraft} style={{ padding: '4px 10px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Trash2 size={12} /> Удалить черновик
                        </button>
                      </div>

                      {/* Existing entries table */}
                      {(absenceDraft.entries || []).length > 0 && (
                        <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', marginBottom: '1rem', overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                                <th style={{ padding: '8px', textAlign: 'left', color: 'var(--text-secondary)' }}>ФИО</th>
                                <th style={{ padding: '8px', textAlign: 'center', color: 'var(--text-secondary)' }}>С</th>
                                <th style={{ padding: '8px', textAlign: 'center', color: 'var(--text-secondary)' }}>По</th>
                                <th style={{ padding: '8px', width: '40px' }}></th>
                              </tr>
                            </thead>
                            <tbody>
                              {(absenceDraft.entries as any[]).map((e: any) => (
                                <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                  <td style={{ padding: '8px', color: 'var(--text-primary)' }}>{e.fighterName}</td>
                                  <td style={{ padding: '8px', textAlign: 'center', color: 'var(--text-primary)' }}>{String(e.dayFrom).padStart(2,'0')}.{String(e.monthFrom || absenceDraft.month).padStart(2,'0')} {e.timeFrom}</td>
                                  <td style={{ padding: '8px', textAlign: 'center', color: 'var(--text-primary)' }}>{String(e.dayTo).padStart(2,'0')}.{String(e.monthTo || absenceDraft.month).padStart(2,'0')} {e.timeTo}</td>
                                  <td style={{ padding: '8px' }}>
                                    <button onClick={() => handleRemoveEntry(e.id)} style={{ background: 'rgba(239,68,68,0.2)', border: 'none', borderRadius: '4px', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                                      <Trash2 size={12} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Add new entry form */}
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                        <h5 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>Добавить запись:</h5>
                        <select value={newEntryFighter} onChange={e => setNewEntryFighter(e.target.value)} className="input-field" style={{ width: '100%', marginBottom: '0.5rem' }}>
                          <option value="">-- Выберите бойца --</option>
                          {fighters.map(f => <option key={f.id} value={f.id}>{f.fullName} ({f.position})</option>)}
                        </select>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <div>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>С — Время:</label>
                            <input type="time" value={newTimeFrom} onChange={e => setNewTimeFrom(e.target.value)} className="input-field" />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>С — Дата:</label>
                            <input type="date" value={newDateFrom} onChange={e => setNewDateFrom(e.target.value)} className="input-field" />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>По — Время:</label>
                            <input type="time" value={newTimeTo} onChange={e => setNewTimeTo(e.target.value)} className="input-field" />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>По — Дата:</label>
                            <input type="date" value={newDateTo} onChange={e => setNewDateTo(e.target.value)} className="input-field" />
                          </div>
                        </div>
                        <button onClick={handleAddEntry} disabled={absLoading} style={{ width: '100%', padding: '8px', background: 'rgba(59,130,246,0.2)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem' }}>
                          <Plus size={14} /> {absLoading ? 'Добавление...' : 'Добавить запись'}
                        </button>
                      </div>

                      {/* Submit section */}
                      {(absenceDraft.entries || []).length > 0 && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                          <select value={targetAdmin} onChange={e => setTargetAdmin(e.target.value)} className="input-field" style={{ width: '100%', marginBottom: '0.75rem' }}>
                            <option value="">-- Выберите руководителя --</option>
                            {admins.map((a: any) => <option key={a.id} value={a.id}>{a.fullName || 'Руководитель'}</option>)}
                          </select>
                          {absError && <div style={{ color: 'var(--danger-color)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{absError}</div>}
                          {absSuccess && <div style={{ color: '#34d399', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{absSuccess}</div>}
                          <button onClick={handleSubmitAbsences} disabled={absLoading} style={{ width: '100%', padding: '12px', background: 'rgba(59,130,246,0.2)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <Send size={16} /> {absLoading ? 'Отправка...' : 'Отправить на согласование'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
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
