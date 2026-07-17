import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq } from 'drizzle-orm';
import * as schema from './schema.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });
const { products } = schema;

async function run() {
  try {
    console.log("Restoring Smoked Beef...");
    // Update its category back to 'topping' (or 'A La Carte' depending on what it was).
    // Let's set it to 'topping' because they said "kenapa topping smoked beef malah dihapus woi"
    await db.update(products).set({ category: 'topping' }).where(eq(products.name, 'Smoked Beef'));
    console.log("✅ Smoked Beef restored!");
  } catch (err) {
    console.error("Error restoring:", err);
  } finally {
    process.exit(0);
  }
}

run();
