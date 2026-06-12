import sql from '@/lib/db'
import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'

export default async function ApplyPage() {
  const squads = await sql`SELECT * FROM "Squad" ORDER BY name ASC` as any[]

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={24} />
        </Link>
        <Shield color="var(--accent-color)" size={32} />
        <h2>Выберите отряд для вступления</h2>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {squads.map(squad => (
          <Link href={`/apply/${squad.id}`} key={squad.id} style={{ textDecoration: 'none' }}>
            <div className="glass-panel hover-effect" style={{ padding: '2rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{squad.name}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Подать заявку &rarr;</p>
            </div>
          </Link>
        ))}
      </div>
      
      {squads.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '3rem' }}>
          Отряды пока не созданы.
        </div>
      )}
    </div>
  )
}
