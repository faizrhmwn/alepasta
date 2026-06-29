import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq } from 'drizzle-orm';
import * as schema from './schema.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

const { users, products } = schema;

// ── Menu Items ──────────────────────────────────────────────────────────────────
const menuItems = [
  // PASTA
  { name: 'Aglio E Olio', price: 10000, category: 'Pasta' },
  { name: 'Alfredo', price: 10000, category: 'Pasta' },
  { name: 'Bolognese', price: 10000, category: 'Pasta' },
  { name: 'Mac & Cheese', price: 10000, category: 'Pasta' },

  // RICE
  { name: 'Alepasta Bowl', price: 12000, category: 'Rice' },
  { name: 'Bolognese Bowl', price: 12000, category: 'Rice' },
  { name: 'Curry Bowl', price: 12000, category: 'Rice' },

  // SALAD
  { name: 'Simple Green', price: 10000, category: 'Salad' },
  { name: 'Egg-Tra Green', price: 13000, category: 'Salad' },
  { name: 'Signature Green', price: 15000, category: 'Salad' },

  // SIDE
  { name: 'Burger', price: 10000, category: 'Side' },
  { name: 'Chicken Wrap', price: 12000, category: 'Side' },
  { name: 'Bolognese Fries', price: 15000, category: 'Side' },
  { name: 'Burger W/Fries', price: 15000, category: 'Side' },
  { name: 'Cheesy Fries', price: 15000, category: 'Side' },
  { name: 'Combo', price: 15000, category: 'Side' },

  // BEVERAGE
  { name: 'Blue Ocean Lemon', price: 7000, category: 'Beverage' },
  { name: 'Lemon Tea', price: 7000, category: 'Beverage' },
  { name: 'Matcha', price: 9000, category: 'Beverage' },
  { name: 'Milo', price: 9000, category: 'Beverage' },

  // A LA CARTE
  { name: 'Ayam Crispy', price: 6000, category: 'A La Carte' },
  { name: 'Alepasta Sauce', price: 3000, category: 'A La Carte' },
];

async function seed() {
  console.log('🌱 Starting Alepasta seed...\n');

  // ── Seed Admin User ───────────────────────────────────────────────────────
  try {
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.username, 'admin'))
      .limit(1);

    if (existingAdmin.length === 0) {
      const passwordHash = await bcrypt.hash('alepasta123', 10);
      await db.insert(users).values({
        username: 'admin',
        passwordHash,
        name: 'Admin Alepasta',
      });
      console.log('✅ Admin user created (admin / alepasta123)');
    } else {
      console.log('⏭️  Admin user already exists, skipping');
    }
  } catch (err) {
    console.error('❌ Error seeding admin user:', err.message);
  }

  // ── Seed Products ─────────────────────────────────────────────────────────
  let created = 0;
  let skipped = 0;

  for (const item of menuItems) {
    try {
      const existing = await db
        .select()
        .from(products)
        .where(eq(products.name, item.name))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(products).values(item);
        created++;
        console.log(`  🍽️  Created: ${item.name} (${item.category}) - Rp ${item.price.toLocaleString('id-ID')}`);
      } else {
        skipped++;
      }
    } catch (err) {
      console.error(`  ❌ Error seeding ${item.name}:`, err.message);
    }
  }

  console.log(`\n📊 Products: ${created} created, ${skipped} skipped (already exist)`);
  console.log('🎉 Seed complete!\n');

  process.exit(0);
}

seed();
