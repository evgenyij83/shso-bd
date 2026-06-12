import sql from '@/lib/db'
import { getSession } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import AdminForms from './AdminForms'

export default async function AdminPage() {
  const session = await getSession()
  if (!session || session.role !== 'DEVELOPER') {
    redirect('/dashboard')
  }

  const squads = await sql`SELECT * FROM "Squad" ORDER BY name ASC` as any[]
  
  const users = await sql`
    SELECT u.*, s.name as "squadName" 
    FROM "User" u 
    LEFT JOIN "Squad" s ON u."squadId" = s.id 
    ORDER BY u.role, u."uniqueCode"
  ` as any[]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}><ArrowLeft size={24} /></Link>
        <h2>Панель Разработчика</h2>
      </div>

      <AdminForms squads={squads} users={users} />
    </div>
  )
}
