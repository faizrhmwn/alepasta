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
    const existing = await db.select().from(products).where(eq(products.name, 'Smoked Beef'));
    if (existing.length > 0) {
      await db.update(products).set({ category: 'topping' }).where(eq(products.name, 'Smoked Beef'));
      console.log("Updated existing Smoked Beef to topping");
    } else {
      await db.insert(products).values({ name: 'Smoked Beef', price: 5000, category: 'topping' });
      console.log("Inserted new Smoked Beef as topping");
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

run();
