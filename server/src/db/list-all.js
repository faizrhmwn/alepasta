import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });
const { products } = schema;

async function run() {
  try {
    const allProducts = await db.select().from(products);
    console.log(allProducts.map(p => `${p.id} - ${p.name} (${p.category}) [Active: ${p.isActive}]`));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

run();
