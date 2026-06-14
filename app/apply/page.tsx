import sql from '@/lib/db'
import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'
import SquadCard from './SquadCard'

export default async function ApplyPage() {
  const squads = await sql`SELECT id, name, "workType", "workPlace", "workSchedule", "workPeriod" FROM "Squad" ORDER BY name ASC` as any[]

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
        {squads.map((squad: any) => (
          <SquadCard key={squad.id} squad={squad} />
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
