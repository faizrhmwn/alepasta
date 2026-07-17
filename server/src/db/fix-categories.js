import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const sql = neon(process.env.DATABASE_URL);

  const before = await sql`SELECT DISTINCT category FROM products;`;
  console.log('Categories before:', before);

  // Update all alacarte to A La Carte
  await sql`UPDATE products SET category = 'A La Carte' WHERE category = 'alacarte';`;
  console.log('Updated alacarte to A La Carte');

  const after = await sql`SELECT DISTINCT category FROM products;`;
  console.log('Categories after:', after);
}

main().catch(console.error);
