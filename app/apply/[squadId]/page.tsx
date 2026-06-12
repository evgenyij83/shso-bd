import sql from '@/lib/db'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ApplicationForm from './ApplicationForm'

export default async function SquadApplyPage(props: { params: Promise<{ squadId: string }> }) {
  const params = await props.params;
  const squadResult = await sql`SELECT * FROM "Squad" WHERE id = ${params.squadId}`
  const squad = squadResult[0] as any

  if (!squad) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Отряд не найден</h2>
        <Link href="/apply" style={{ color: 'var(--accent-color)' }}>Вернуться к списку</Link>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/apply" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={24} />
        </Link>
        <h2>Подача заявки</h2>
      </header>
      
      <ApplicationForm squadId={squad.id} squadName={squad.name} />
    </div>
  )
}
