import { getSession } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import Link from 'next/link'
import EventsListClient from './EventsListClient'

export default async function EventsPage() {
  const session = await getSession()
  if (!session) redirect('/')

  const events = await sql`SELECT id, title, description, "createdAt", "maxParticipants", status FROM "Event" ORDER BY "createdAt" DESC` as any[]

  const canCreate = session.role === 'DEVELOPER' || session.role === 'UNIVERSITY_ADMIN' || session.role === 'HQ_COMMANDER'

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', margin: 0, textShadow: '0 0 20px rgba(255,255,255,0.1)' }}>Мероприятия</h1>
      </div>

      <EventsListClient events={events} canCreate={canCreate} role={session.role} />
    </div>
  )
}
