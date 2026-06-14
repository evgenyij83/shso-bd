'use client'

import { useState } from 'react'
import { Info } from 'lucide-react'
import { createPortal } from 'react-dom'
import Link from 'next/link'

type Squad = {
  id: string
  name: string
  workType: string | null
  workPlace: string | null
  workSchedule: string | null
  workPeriod: string | null
}

export default function SquadCard({ squad }: { squad: Squad }) {
  const [showModal, setShowModal] = useState(false)

  const hasInfo = squad.workType || squad.workPlace || squad.workSchedule || squad.workPeriod

  const fieldStyle = { display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'flex-start' as const }
  const labelStyle = { color: 'var(--text-secondary)', fontSize: '0.9rem', minWidth: '180px', flexShrink: 0, fontWeight: 600 as const }
  const valueStyle = { color: 'var(--text-primary)', fontSize: '0.95rem' }

  return (
    <>
      <div className="glass-panel hover-effect" style={{ padding: '2rem', textAlign: 'center', transition: 'all 0.2s', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>{squad.name}</h3>
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {hasInfo && (
            <button
              onClick={() => setShowModal(true)}
              style={{
                padding: '8px 16px', background: 'rgba(59, 130, 246, 0.15)',
                color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <Info size={16} /> Об этом отряде
            </button>
          )}
          <Link href={`/apply/${squad.id}`} style={{ textDecoration: 'none' }}>
            <div style={{ padding: '8px 16px', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-color)', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
              Подать заявку &rarr;
            </div>
          </Link>
        </div>
      </div>

      {showModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
          <div style={{ width: '100%', maxWidth: '550px', background: '#0f172a', borderRadius: '16px', border: '1px solid var(--glass-border)', boxShadow: '0 10px 50px rgba(0,0,0,0.8)', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>{squad.name}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '2rem', lineHeight: 1 }}>&times;</button>
            </div>

            {squad.workType && (
              <div style={fieldStyle}>
                <span style={labelStyle}>Суть работы:</span>
                <span style={valueStyle}>{squad.workType}</span>
              </div>
            )}
            {squad.workPlace && (
              <div style={fieldStyle}>
                <span style={labelStyle}>Место трудоустройства:</span>
                <span style={valueStyle}>{squad.workPlace}</span>
              </div>
            )}
            {squad.workSchedule && (
              <div style={fieldStyle}>
                <span style={labelStyle}>График работы:</span>
                <span style={valueStyle}>{squad.workSchedule}</span>
              </div>
            )}
            {squad.workPeriod && (
              <div style={fieldStyle}>
                <span style={labelStyle}>Период работы:</span>
                <span style={valueStyle}>{squad.workPeriod}</span>
              </div>
            )}

            {!hasInfo && (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Информация об отряде ещё не заполнена.</p>
            )}

            <button
              onClick={() => setShowModal(false)}
              className="btn-primary"
              style={{ width: '100%', marginTop: '1rem' }}
            >
              Закрыть
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
