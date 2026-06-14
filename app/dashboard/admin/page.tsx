import sql from '@/lib/db'
import { getSession } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import AdminForms from './AdminForms'
import StatuteEditor from './StatuteEditor'
import AccountRequests from './AccountRequests'
import IdentifierRequests from './IdentifierRequests'

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

  const statuteResult = await sql`SELECT value FROM "SystemSettings" WHERE key = 'STATUTE'`
  const statute = statuteResult.length > 0 ? statuteResult[0].value : ''

  const accountRequests = await sql`
    SELECT ar.*, s.name as "squadName", u."fullName" as "requesterName"
    FROM "AccountRequest" ar
    LEFT JOIN "Squad" s ON ar."squadId" = s.id
    LEFT JOIN "User" u ON ar."requestedByUserId" = u.id
    ORDER BY ar."createdAt" ASC
  ` as any[]

  const identifierRequests = await sql`
    SELECT ir.*, u."uniqueCode" as "currentCode", u.role
    FROM "IdentifierRequest" ir
    JOIN "User" u ON ir."userId" = u.id
    WHERE ir.status = 'PENDING'
    ORDER BY ir."createdAt" ASC
  ` as any[]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}><ArrowLeft size={24} /></Link>
        <h2>Панель Разработчика</h2>
      </div>

      <AccountRequests requests={accountRequests} />
      <IdentifierRequests requests={identifierRequests} />

      <AdminForms squads={squads} users={users} />
      
      <StatuteEditor initialStatute={statute} />
    </div>
  )
}
