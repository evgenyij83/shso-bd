import { getSession } from '@/app/actions/auth'
import { redirect, notFound } from 'next/navigation'
import sql from '@/lib/db'
import EventDetailsClient from './EventDetailsClient'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function EventPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getSession()
  if (!session) redirect('/')

  const eventRes = await sql`
    SELECT e.*, u."fullName" as "authorName" 
    FROM "Event" e
    JOIN "User" u ON e."createdById" = u.id
    WHERE e.id = ${params.id}
  `
  if (eventRes.length === 0) notFound()
  const event = eventRes[0] as any

  const participantsRes = await sql`
    SELECT ep.id, ep."createdAt", f."fullName" as "fighterName", s.name as "squadName"
    FROM "EventParticipant" ep
    JOIN "Fighter" f ON ep."fighterId" = f.id
    JOIN "Squad" s ON ep."squadId" = s.id
    WHERE ep."eventId" = ${params.id}
    ORDER BY ep."createdAt" DESC
  `
  const participants = participantsRes as any[]

  // Если юзер — командир/комиссар, нужно дать возможность выбрать бойцов
  let fighters: any[] = []
  const canSubmit = (session.role === 'SQUAD_COMMANDER' || session.role === 'SQUAD_COMMISSAR') && session.squadId

  if (canSubmit) {
    const sqId = session.squadId as string
    fighters = await sql`SELECT id, "fullName", position FROM "Fighter" WHERE "squadId" = ${sqId} ORDER BY "fullName" ASC` as any[]
  }

  const isCreatorOrDev = session.role === 'DEVELOPER' || event.createdById === session.userId

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
      <Link href="/dashboard/events" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '1.5rem' }}>
        <ArrowLeft size={18} /> К списку мероприятий
      </Link>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: '0 0 1rem 0', fontSize: '2rem', color: 'var(--accent-color)' }}>{event.title}</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Создано: {event.authorName} • {new Date(event.createdAt).toLocaleDateString('ru-RU')}
              {event.maxParticipants !== null && ` • Лимит: ${event.maxParticipants} чел.`}
            </p>
          </div>
          {event.status === 'APPROVED' && (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 'bold' }}>
              Списки утверждены
            </div>
          )}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Описание</h3>
          <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{event.description}</p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Требования к участникам</h3>
          <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{event.requirements}</p>
        </div>

        {event.chatLink && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Ссылка на беседу</h3>
            <a href={event.chatLink} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-color)' }}>{event.chatLink}</a>
          </div>
        )}

        {canSubmit && (
          <EventDetailsClient 
            eventId={event.id} 
            fighters={fighters} 
            status={event.status}
            maxParticipants={event.maxParticipants}
            currentParticipantsCount={participants.length}
            participants={participants}
            isCreatorOrDev={isCreatorOrDev}
          />
        )}

        {!canSubmit && isCreatorOrDev && (
           <EventDetailsClient 
            eventId={event.id} 
            fighters={[]} 
            status={event.status}
            maxParticipants={event.maxParticipants}
            currentParticipantsCount={participants.length}
            participants={participants}
            isCreatorOrDev={isCreatorOrDev}
          />
        )}
      </div>
    </div>
  )
}
