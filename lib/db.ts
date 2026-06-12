import postgres from 'postgres'

const sql = postgres("postgresql://postgres.myuuymguxktiqebtvkoh:9d5yEYlRnR7nKGUK@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true", { ssl: 'require' })

export default sql
