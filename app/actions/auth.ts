'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import postgres from 'postgres'

const sql = postgres(process.env.POSTGRES_URL || process.env.DATABASE_URL || '', { ssl: 'require' })

export async function login(uniqueCode: string) {
  let user;
  try {
    const users = await sql`SELECT * FROM "User" WHERE "uniqueCode" = ${uniqueCode}`
    user = users[0]
  } catch (error: any) {
    return { error: `Ошибка базы данных (postgres.js): ${error.message || error.toString()}` }
  }

  if (!user) return { error: 'Неверный уникальный код' }

  const sessionToken = crypto.randomUUID()
  await sql`UPDATE "User" SET "sessionToken" = ${sessionToken} WHERE id = ${user.id}`

  const cookieStore = await cookies()
  const opts = { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 7, path: '/' }
  
  cookieStore.set('session_id', user.id, opts)
  cookieStore.set('session_token', sessionToken, opts)

  if (user.role === 'SQUAD_COMMANDER' && user.squadId) {
    redirect(`/dashboard/squad/${user.squadId}`)
  } else {
    redirect('/dashboard')
  }
}

export async function logout() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('session_id')?.value
  if (sessionId) {
    await sql`UPDATE "User" SET "sessionToken" = NULL WHERE id = ${sessionId}`
  }
  cookieStore.delete('session_id')
  cookieStore.delete('session_token')
  redirect('/')
}

export async function getSession() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('session_id')?.value
  const sessionToken = cookieStore.get('session_token')?.value

  if (!sessionId || !sessionToken) return null

  try {
    const users = await sql`SELECT * FROM "User" WHERE id = ${sessionId}`
    const user = users[0]
    
    if (!user || user.sessionToken !== sessionToken) {
      return null
    }

    let squadName = null
    if (user.squadId) {
      const squads = await sql`SELECT name FROM "Squad" WHERE id = ${user.squadId}`
      if (squads.length > 0) squadName = squads[0].name
    }

    return { 
      userId: user.id, 
      role: user.role, 
      squadId: user.squadId,
      fullName: user.fullName,
      squadName
    }
  } catch (e) {
    return null
  }
}
