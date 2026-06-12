const postgres = require('postgres');

const sql = postgres("postgresql://postgres.myuuymguxktiqebtvkoh:9d5yEYlRnR7nKGUK@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true", { ssl: 'require' });

async function createTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "Application" (
        "id" TEXT DEFAULT gen_random_uuid()::text PRIMARY KEY,
        "squadId" TEXT NOT NULL REFERENCES "Squad"("id") ON DELETE CASCADE,
        "fullName" TEXT NOT NULL,
        "faculty" TEXT NOT NULL,
        "studyGroup" TEXT NOT NULL,
        "course" INTEGER NOT NULL,
        "educationForm" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "vkLink" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('Table Application created successfully.');
  } catch (err) {
    console.error('Error creating table:', err);
  } finally {
    process.exit();
  }
}

createTable();
