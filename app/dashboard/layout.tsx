import { getSession, logout } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import { LogOut, Shield } from 'lucide-react'
import Link from 'next/link'

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

  return (
    <div className="layout-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', padding: '1rem 1.5rem', background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Shield color="var(--accent-color)" />
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>База ШСО</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Роль: {displayRole}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {session.role === 'DEVELOPER' && (
            <Link href="/dashboard/admin" style={{ color: 'var(--text-primary)', textDecoration: 'none', background: 'rgba(59, 130, 246, 0.2)', padding: '8px 16px', borderRadius: '8px', fontSize: '0.9rem' }}>
              Панель управления
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
