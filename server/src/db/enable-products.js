import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { inArray } from 'drizzle-orm';
import * as schema from './schema.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });
const { products } = schema;

async function run() {
  try {
    const names = ['Smoked Beef', 'French Fries', 'Teh', 'Snacks'];
    await db.update(products).set({ isActive: true }).where(inArray(products.name, names));
    console.log("Enabled products:", names.join(', '));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

run();
