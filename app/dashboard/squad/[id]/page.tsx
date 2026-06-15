import sql from '@/lib/db'
import { getSession } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ClientFighterList from './ClientFighterList'
import ApplicationsList from './ApplicationsList'
import EditDescriptionButton from './EditDescriptionButton'
import EditFighterLimit from './EditFighterLimit'
import EditChatLinkButton from './EditChatLinkButton'
import ExportModal from '../../ExportModal'
import CommanderCorner from './CommanderCorner'

export default async function SquadPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getSession()
  if (!session) redirect('/')
  if ((session.role === 'SQUAD_COMMANDER' || session.role === 'SQUAD_COMMISSAR') && session.squadId !== params.id) {
    return <div>У вас нет доступа к этому отряду.</div>
  }

  const squadResult = await sql`SELECT * FROM "Squad" WHERE id = ${params.id}`
  const squad = squadResult[0] as any
  if (!squad) return <div>Отряд не найден</div>

  const fighters = await sql`
    SELECT * FROM "Fighter" 
    WHERE "squadId" = ${squad.id} 
    ORDER BY 
      CASE position 
        WHEN 'Командир' THEN 1 
        WHEN 'Комиссар' THEN 2 
        WHEN 'Боец' THEN 3
        WHEN 'Кандидат' THEN 4
        ELSE 5
      END, 
      "fullName" ASC
  ` as any[]
  
  squad.fighters = fighters

  const applications = await sql`SELECT * FROM "Application" WHERE "squadId" = ${squad.id} ORDER BY "createdAt" ASC` as any[]

  const canEdit = session.role === 'DEVELOPER' || session.role === 'UNIVERSITY_ADMIN' || session.role === 'HQ_COMMANDER' || session.role === 'HQ_COMMISSAR' || session.role === 'SQUAD_COMMANDER' || session.role === 'SQUAD_COMMISSAR'

  const isSquadLeader = session.role === 'SQUAD_COMMANDER' || session.role === 'SQUAD_COMMISSAR'

  let allSquads: any[] = []
  if (session.role === 'HQ_COMMANDER' || session.role === 'HQ_COMMISSAR' || session.role === 'DEVELOPER') {
    allSquads = await sql`SELECT id, name FROM "Squad" ORDER BY name ASC` as any[]
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {(session.role !== 'SQUAD_COMMANDER' && session.role !== 'SQUAD_COMMISSAR') && (
          <Link href="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}><ArrowLeft size={24} /></Link>
        )}
        <h2>{squad.name} — Панель отряда</h2>
        <ExportModal squads={[{ id: squad.id, name: squad.name }]} isGlobal={false} />
      </div>

      <EditFighterLimit 
        squadId={squad.id} 
        currentLimit={squad.fighterLimit} 
        canSetLimit={session.role === 'UNIVERSITY_ADMIN' || session.role === 'DEVELOPER'} 
      />

      {canEdit && <EditDescriptionButton squadId={squad.id} initialData={{ workType: squad.workType, workPlace: squad.workPlace, workSchedule: squad.workSchedule, workPeriod: squad.workPeriod }} />}
      {canEdit && <EditChatLinkButton squadId={squad.id} initialLink={squad.chatLink} />}

      {isSquadLeader && (
        <CommanderCorner 
          squadId={squad.id} 
          fighters={fighters.map((f: any) => ({ id: f.id, fullName: f.fullName, position: f.position }))} 
          userRole={session.role} 
        />
      )}
      
      <ApplicationsList applications={applications} squadId={squad.id} canEdit={canEdit} />
      
      <ClientFighterList fighters={squad.fighters} squadId={squad.id} canEdit={canEdit} userRole={session.role} allSquads={allSquads} />
    </div>
  )
}
