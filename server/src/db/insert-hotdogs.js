import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const sql = neon(process.env.DATABASE_URL);

  console.log('Inserting Hotdog menus...');

  await sql`
    INSERT INTO products (name, price, category, is_active) 
    VALUES 
      ('Classic Dog', 10000, 'Side', true),
      ('Bolognese Dog', 13000, 'Side', true)
  `;

  console.log('Successfully added Classic Dog and Bolognese Dog!');
}

main().catch(console.error);
