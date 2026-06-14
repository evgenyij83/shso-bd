'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Award, AlertTriangle, Check, X } from 'lucide-react'
import { submitAwardNomination } from '@/app/actions/awards'
import { submitIncidentReport } from '@/app/actions/incidents'

type Fighter = { id: string, fullName: string, position: string }

export default function CommanderCorner({ squadId, fighters, userRole }: { squadId: string, fighters: Fighter[], userRole: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'award' | 'incident'>('award')
  const [mounted, setMounted] = useState(false)

  // Award state
  const [selectedFighters, setSelectedFighters] = useState<Record<string, string>>({}) // fighterId -> description
  const [awardLoading, setAwardLoading] = useState(false)
  const [awardError, setAwardError] = useState('')
  const [awardSuccess, setAwardSuccess] = useState('')

  // Incident state
  const [incidentFighters, setIncidentFighters] = useState<string[]>([]) // fighter names
  const [incidentDesc, setIncidentDesc] = useState('')
  const [incidentLoading, setIncidentLoading] = useState(false)
  const [incidentError, setIncidentError] = useState('')
  const [incidentSuccess, setIncidentSuccess] = useState('')

  useState(() => { setMounted(true) })

  const cornerLabel = userRole === 'SQUAD_COMMANDER' ? 'Уголок командира' : 'Уголок комиссара'

  function toggleFighterAward(fighterId: string) {
    setSelectedFighters(prev => {
      const copy = { ...prev }
      if (copy[fighterId] !== undefined) {
        delete copy[fighterId]
      } else {
        copy[fighterId] = ''
      }
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

    if (nominees.length === 0) {
      setAwardError('Выберите хотя бы одного бойца')
      return
    }

    for (const n of nominees) {
      if (!n.description.trim()) {
        setAwardError(`Укажите заслуги для ${n.fighterName}`)
        return
      }
    }

    setAwardLoading(true)
    setAwardError('')
    setAwardSuccess('')

    const res = await submitAwardNomination(squadId, nominees)
    if (res.error) {
      setAwardError(res.error)
    } else {
      setAwardSuccess('Список на награждение отправлен штабу на согласование!')
      setSelectedFighters({})
    }
    setAwardLoading(false)
  }

  function toggleIncidentFighter(name: string) {
    setIncidentFighters(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
  }

  async function handleSubmitIncident() {
    if (incidentFighters.length === 0) {
      setIncidentError('Выберите хотя бы одного человека')
      return
    }
    if (!incidentDesc.trim()) {
      setIncidentError('Опишите ситуацию')
      return
    }

    setIncidentLoading(true)
    setIncidentError('')
    setIncidentSuccess('')

    const res = await submitIncidentReport(squadId, incidentFighters, incidentDesc)
    if (res.error) {
      setIncidentError(res.error)
    } else {
      setIncidentSuccess('Доклад о происшествии отправлен всем ключевым лицам!')
      setIncidentFighters([])
      setIncidentDesc('')
    }
    setIncidentLoading(false)
  }

  if (!mounted) return null

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          color: '#fbbf24', background: 'rgba(251, 191, 36, 0.15)',
          border: '1px solid rgba(251, 191, 36, 0.3)', padding: '8px 16px',
          borderRadius: '8px', fontSize: '0.9rem', display: 'flex',
          alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s',
          marginBottom: '1.5rem'
        }}
      >
        <Award size={16} /> {cornerLabel}
      </button>

      {isOpen && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem 1rem', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '750px', background: '#0f172a', borderRadius: '16px', border: '1px solid var(--glass-border)', boxShadow: '0 10px 50px rgba(0,0,0,0.8)', marginTop: '2rem', marginBottom: '2rem' }}>

            {/* Header */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#fbbf24' }}>{cornerLabel}</h2>
              <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '2rem', lineHeight: 1 }}>&times;</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                onClick={() => setActiveTab('award')}
                style={{ flex: 1, padding: '1rem', background: activeTab === 'award' ? 'rgba(251, 191, 36, 0.15)' : 'transparent', border: 'none', borderBottom: activeTab === 'award' ? '2px solid #fbbf24' : '2px solid transparent', color: activeTab === 'award' ? '#fbbf24' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.95rem', transition: 'all 0.2s' }}
              >
                <Award size={16} /> Представить к награждению
              </button>
              <button
                onClick={() => setActiveTab('incident')}
                style={{ flex: 1, padding: '1rem', background: activeTab === 'incident' ? 'rgba(239, 68, 68, 0.15)' : 'transparent', border: 'none', borderBottom: activeTab === 'incident' ? '2px solid #ef4444' : '2px solid transparent', color: activeTab === 'incident' ? '#ef4444' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.95rem', transition: 'all 0.2s' }}
              >
                <AlertTriangle size={16} /> Сообщить о происшествии
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '1.5rem' }}>

              {/* Award Tab */}
              {activeTab === 'award' && (
                <div>
                  <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>Выберите бойцов для награждения и опишите заслуги:</h4>

                  <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', marginBottom: '1rem' }}>
                    {fighters.map(f => {
                      const isSelected = selectedFighters[f.id] !== undefined
                      return (
                        <div key={f.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '10px 12px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleFighterAward(f.id)}
                              style={{ accentColor: '#fbbf24' }}
                            />
                            <div>
                              <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{f.fullName}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{f.position}</div>
                            </div>
                          </label>
                          {isSelected && (
                            <textarea
                              value={selectedFighters[f.id]}
                              onChange={e => updateAwardDesc(f.id, e.target.value)}
                              placeholder={`Заслуги и достижения ${f.fullName}...`}
                              className="input-field"
                              style={{ width: '100%', minHeight: '60px', resize: 'vertical', marginTop: '8px', fontSize: '0.85rem' }}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {awardError && <div style={{ color: 'var(--danger-color)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{awardError}</div>}
                  {awardSuccess && <div style={{ color: '#34d399', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{awardSuccess}</div>}

                  <button
                    onClick={handleSubmitAward}
                    disabled={awardLoading || Object.keys(selectedFighters).length === 0}
                    style={{
                      width: '100%', padding: '12px', background: 'rgba(251, 191, 36, 0.2)',
                      color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.3)',
                      borderRadius: '8px', cursor: 'pointer', fontSize: '0.95rem',
                      opacity: Object.keys(selectedFighters).length === 0 ? 0.5 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    {awardLoading ? 'Отправка...' : 'Отправить на согласование штабу'}
                  </button>
                </div>
              )}

              {/* Incident Tab */}
              {activeTab === 'incident' && (
                <div>
                  <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>Выберите участников и опишите ситуацию:</h4>

                  <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', marginBottom: '1rem' }}>
                    {fighters.map(f => (
                      <label
                        key={f.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                          borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer',
                          background: incidentFighters.includes(f.fullName) ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                          transition: 'background 0.2s'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={incidentFighters.includes(f.fullName)}
                          onChange={() => toggleIncidentFighter(f.fullName)}
                          style={{ accentColor: '#ef4444' }}
                        />
                        <div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{f.fullName}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{f.position}</div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {incidentFighters.length > 0 && (
                    <div style={{ fontSize: '0.85rem', color: '#ef4444', marginBottom: '0.75rem' }}>
                      Выбрано: {incidentFighters.length}
                    </div>
                  )}

                  <textarea
                    value={incidentDesc}
                    onChange={e => setIncidentDesc(e.target.value)}
                    placeholder="Опишите ситуацию подробно..."
                    className="input-field"
                    style={{ width: '100%', minHeight: '120px', resize: 'vertical', marginBottom: '1rem' }}
                  />

                  {incidentError && <div style={{ color: 'var(--danger-color)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{incidentError}</div>}
                  {incidentSuccess && <div style={{ color: '#34d399', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{incidentSuccess}</div>}

                  <button
                    onClick={handleSubmitIncident}
                    disabled={incidentLoading}
                    className="btn-danger"
                    style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <AlertTriangle size={16} />
                    {incidentLoading ? 'Отправка...' : 'Отправить доклад'}
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
