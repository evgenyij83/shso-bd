import sql from '@/lib/db'
import { getSession } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users } from 'lucide-react'
import CreateSquadButton from './CreateSquadButton'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/')
  if (session.role === 'SQUAD_COMMANDER' || session.role === 'SQUAD_COMMISSAR') {
    if (session.squadId) redirect(`/dashboard/squad/${session.squadId}`)
    else return <div>Ошибка: Отряд не назначен.</div>
  }

  const squads = await sql`
    SELECT 
      s.*, 
      (SELECT COUNT(*) FROM "Fighter" f WHERE f."squadId" = s.id) as "fightersCount",
      (SELECT COUNT(*) FROM "Application" a WHERE a."squadId" = s.id) as "applicationsCount"
    FROM "Squad" s 
    ORDER BY s.name ASC
  ` as any[]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <h2>Сводка по всем отрядам</h2>
        {session.role === 'UNIVERSITY_ADMIN' && <CreateSquadButton />}
      </div>
      
      {session.role === 'UNIVERSITY_ADMIN' && (
        <div className="glass-panel" style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '12px', borderRadius: '12px' }}>
            <Users size={24} color="#60a5fa" />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Общая численность всех отрядов</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#60a5fa' }}>
              {squads.reduce((acc, s) => acc + parseInt(s.fightersCount || '0', 10), 0)} чел.
            </div>
          </div>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
        {squads.map(squad => (
          <Link href={`/dashboard/squad/${squad.id}`} key={squad.id} style={{ textDecoration: 'none', position: 'relative', display: 'block' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', transition: 'all 0.3s', cursor: 'pointer', border: squad.applicationsCount > 0 ? '1px solid rgba(251, 191, 36, 0.4)' : undefined }}>
              {squad.applicationsCount > 0 && (
                <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#fbbf24', color: '#000', fontWeight: 'bold', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', boxShadow: '0 4px 10px rgba(251,191,36,0.3)' }}>
                  {squad.applicationsCount}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '10px' }}><Users color="var(--accent-color)" /></div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>{squad.name}</h3>
              </div>
              {squad.description && (
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
                  {squad.description}
                </p>
              )}
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <span>Количество бойцов:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{squad.fightersCount}</span>
              </div>
              {squad.applicationsCount > 0 && (
                <div style={{ marginTop: '0.5rem', color: '#fbbf24', fontSize: '0.85rem', textAlign: 'right' }}>
                  Есть новые заявки!
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
