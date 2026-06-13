'use client'

import { useState, useEffect } from 'react'
import { BookOpen } from 'lucide-react'

export default function ReadStatuteButton({ statute }: { statute: string }) {
  const [show, setShow] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      <button 
        onClick={() => setShow(true)} 
        style={{ 
          color: 'var(--text-primary)', 
          background: 'rgba(255, 255, 255, 0.1)', 
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '8px 16px', 
          borderRadius: '8px', 
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer'
        }}
      >
        <BookOpen size={16} /> Читать Устав
      </button>

      {show && mounted && require('react-dom').createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.85)', zIndex: 9999,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem 1rem',
          overflowY: 'auto'
        }}>
          <div style={{
            width: '100%', maxWidth: '800px',
            display: 'flex', flexDirection: 'column',
            background: '#0f172a', padding: 0,
            borderRadius: '16px', border: '1px solid var(--glass-border)',
            boxShadow: '0 10px 50px rgba(0,0,0,0.8)',
            marginBottom: '2rem', marginTop: '2rem'
          }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Устав ШСО ПГУПС</h2>
              <button onClick={() => setShow(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '2rem', lineHeight: 1 }}>&times;</button>
            </div>
            
            <div style={{ padding: '2rem', whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'var(--text-primary)', fontSize: '1rem' }}>
              {statute || 'Устав еще не добавлен.'}
            </div>
            
            <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center' }}>
              <button 
                onClick={() => setShow(false)}
                className="btn-primary" 
                style={{ width: '100%', maxWidth: '250px' }}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
