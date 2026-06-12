const postgres = require('postgres');

const sql = postgres("postgresql://postgres.myuuymguxktiqebtvkoh:9d5yEYlRnR7nKGUK@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true", { ssl: 'require' });

async function addColumn() {
  try {
    await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "fullName" TEXT;`;
    console.log('Column fullName added successfully.');
  } catch (err) {
    console.error('Error adding column:', err);
  } finally {
    process.exit();
  }
}

addColumn();
