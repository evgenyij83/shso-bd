'use client'

import { useState } from 'react'
import { acceptApplication, rejectApplication } from '@/app/actions/applications'
import { Check, X } from 'lucide-react'

type Application = {
  id: string
  fullName: string
  faculty: string
  studyGroup: string
  course: number
  educationForm: string
  phone: string
  vkLink: string | null
  createdAt: Date
}

export default function ApplicationsList({ applications, squadId, canEdit }: { applications: Application[], squadId: string, canEdit: boolean }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  if (!canEdit || applications.length === 0) return null

  return (
    <div style={{ marginBottom: '3rem' }}>
      <h3 style={{ fontSize: '1.25rem', color: '#fbbf24', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#fbbf24' }}></span>
        Новые заявки кандидатов ({applications.length})
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {applications.map(app => (
          <div key={app.id} className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{app.fullName}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <div><strong>Факультет:</strong> {app.faculty}</div>
                  <div><strong>Группа:</strong> {app.studyGroup} ({app.course} курс)</div>
                  <div><strong>Форма:</strong> {app.educationForm}</div>
                  <div><strong>Телефон:</strong> {app.phone}</div>
                  {app.vkLink && <div><strong>ВК:</strong> <a href={app.vkLink} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-color)' }}>Перейти</a></div>}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn-primary" 
                  style={{ background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '5px' }}
                  disabled={loadingId === app.id}
                  onClick={async () => {
                    setLoadingId(app.id)
                    const res = await acceptApplication(app.id, squadId)
                    if (res?.warning) alert(res.warning)
                    if (res?.error) alert(res.error)
                    setLoadingId(null)
                  }}
                >
                  <Check size={16} /> Принять
                </button>
                <button 
                  className="btn-danger" 
                  style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '5px' }}
                  disabled={loadingId === app.id}
                  onClick={async () => {
                    const reason = prompt('Укажите причину отклонения заявки. Она будет отправлена кандидату в ВК:');
                    if (reason !== null) {
                      setLoadingId(app.id)
                      await rejectApplication(app.id, squadId, reason || 'Без указания причины')
                      setLoadingId(null)
                    }
                  }}
                >
                  <X size={16} /> Отклонить
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
