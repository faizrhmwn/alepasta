import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const sql = neon(process.env.DATABASE_URL);

  console.log('Running manual migration...');

  try {
    await sql`ALTER TABLE sales ADD COLUMN transaction_id VARCHAR(100);`;
    console.log('Migration successful: Added transaction_id column to sales table.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  }
}

main();
