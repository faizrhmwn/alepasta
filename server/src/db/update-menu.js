import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { inArray, eq } from 'drizzle-orm';
import * as schema from './schema.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });
const { products } = schema;

async function run() {
  try {
    console.log("Archiving old items...");
    await db.update(products).set({ category: 'Archived' }).where(inArray(products.name, ['Bolognese Fries', 'Cheesy Fries', 'Smoked Beef']));
    
    console.log("Processing French Fries...");
    const ff = await db.select().from(products).where(eq(products.name, 'French Fries'));
    if (ff.length > 0) {
      await db.update(products).set({ price: 15000 }).where(eq(products.name, 'French Fries'));
    } else {
      await db.insert(products).values({ name: 'French Fries', price: 15000, category: 'Side' });
    }

    console.log("Processing Teh...");
    const teh = await db.select().from(products).where(eq(products.name, 'Teh'));
    if (teh.length === 0) {
      await db.insert(products).values({ name: 'Teh', price: 3000, category: 'Beverage' });
    }

    console.log("Processing Snacks...");
    const snacks = await db.select().from(products).where(eq(products.name, 'Snacks'));
    if (snacks.length === 0) {
      await db.insert(products).values({ name: 'Snacks', price: 10000, category: 'Side' });
    }

    // Add Classic Dog, Bolognese Dog, Combo to ensure they exist (since seed.js only had Burger W/Fries, Burger, Chicken Wrap before)
    const extraSides = [
      { name: 'Classic Dog', price: 12000, category: 'Side' },
      { name: 'Bolognese Dog', price: 15000, category: 'Side' }
    ];
    for (const item of extraSides) {
      const existing = await db.select().from(products).where(eq(products.name, item.name));
      if (existing.length === 0) {
        await db.insert(products).values(item);
      }
    }

    console.log("✅ Menu successfully updated!");
  } catch (err) {
    console.error("Error updating menu:", err);
  } finally {
    process.exit(0);
  }
}

run();
