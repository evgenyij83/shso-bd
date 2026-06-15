import { getSession, logout } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import { LogOut, Shield } from 'lucide-react'
import Link from 'next/link'
import sql from '@/lib/db'
import ReadStatuteButton from './ReadStatuteButton'
import VkLinkEditor from './VkLinkEditor'
import InteractionPanel from './InteractionPanel'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/')
  
  const roleLabels: Record<string, string> = {
    UNIVERSITY_ADMIN: 'Руководство Университета',
    HQ_COMMANDER: 'Командир Штаба',
    HQ_COMMISSAR: 'Комиссар Штаба',
    SQUAD_COMMANDER: 'Командир Отряда',
    SQUAD_COMMISSAR: 'Комиссар Отряда',
    DEVELOPER: 'Разработчик (Root)'
  }

  let displayRole = roleLabels[session.role] || session.role
  if (session.role === 'UNIVERSITY_ADMIN' && session.fullName) {
    displayRole = `Руководство Университета (${session.fullName})`
  } else if ((session.role === 'SQUAD_COMMANDER' || session.role === 'SQUAD_COMMISSAR') && session.squadName) {
    displayRole = `${roleLabels[session.role]} (${session.squadName})`
  }

  const statuteResult = await sql`SELECT value FROM "SystemSettings" WHERE key = 'STATUTE'`
  const statute = statuteResult.length > 0 ? statuteResult[0].value : ''

  const showVkEditor = true
  const isHQ = session.role === 'HQ_COMMANDER' || session.role === 'HQ_COMMISSAR'
  const showInteractionPanel = session.role === 'UNIVERSITY_ADMIN' || isHQ

  let pendingRequestsCount = 0
  if (session.role === 'DEVELOPER') {
    const reqResult = await sql`SELECT COUNT(*) as count FROM "AccountRequest"`
    const idReqResult = await sql`SELECT COUNT(*) as count FROM "IdentifierRequest" WHERE status = 'PENDING'`
    pendingRequestsCount = parseInt(reqResult[0].count, 10) + parseInt(idReqResult[0].count, 10)
  }

  let squads: any[] = []
  let pendingAwardsCount = 0
  let pendingAbsencesCount = 0
  if (showInteractionPanel) {
    squads = await sql`SELECT id, name FROM "Squad" ORDER BY name ASC` as any[]
    
    if (isHQ) {
      const awardRes = await sql`SELECT COUNT(*) as count FROM "AwardNomination" WHERE status = 'PENDING_HQ'`
      pendingAwardsCount = parseInt(awardRes[0].count, 10)
    } else if (session.role === 'UNIVERSITY_ADMIN') {
      const awardRes = await sql`SELECT COUNT(*) as count FROM "AwardNomination" WHERE status = 'PENDING_UNIVERSITY' AND "targetAdminUserId" = ${session.userId}`
      const absenceRes = await sql`SELECT COUNT(*) as count FROM "AbsenceList" WHERE status = 'SENT' AND "targetAdminUserId" = ${session.userId}`
      pendingAwardsCount = parseInt(awardRes[0].count, 10)
      pendingAbsencesCount = parseInt(absenceRes[0].count, 10)
    }
  }

  return (
    <div className="layout-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', padding: '1rem 1.5rem', background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: '1px solid var(--glass-border)', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Shield color="var(--accent-color)" />
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>База ШСО</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              Роль: {displayRole}
              {showVkEditor && <VkLinkEditor currentVkLink={session.vkLink} />}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <ReadStatuteButton statute={statute} />
          {showInteractionPanel && (
            <InteractionPanel squads={squads} hasVkLink={!!session.vkLink} userRole={session.role} pendingAwardsCount={pendingAwardsCount} pendingAbsencesCount={pendingAbsencesCount} />
          )}
          <Link href="/dashboard/events" style={{ color: 'var(--text-primary)', textDecoration: 'none', background: 'rgba(16, 185, 129, 0.2)', padding: '8px 16px', borderRadius: '8px', fontSize: '0.9rem' }}>
            Мероприятия
          </Link>
          {session.role === 'DEVELOPER' && (
            <Link href="/dashboard/admin" style={{ position: 'relative', color: 'var(--text-primary)', textDecoration: 'none', background: 'rgba(59, 130, 246, 0.2)', padding: '8px 16px', borderRadius: '8px', fontSize: '0.9rem' }}>
              Панель управления
              {pendingRequestsCount > 0 && (
                <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--danger-color)', color: 'white', fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px' }}>
                  {pendingRequestsCount}
                </span>
              )}
            </Link>
          )}
          <form action={logout}>
            <button type="submit" className="btn-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LogOut size={16} /> Выйти
            </button>
          </form>
        </div>
      </header>
      <main className="animate-in">{children}</main>
    </div>
  )
}
