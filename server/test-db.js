import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon(process.env.DATABASE_URL);

async function main() {
  const result = await sql`
    SELECT payment_method, SUM(total_price) as revenue 
    FROM sales 
    GROUP BY payment_method
  `;
  console.log(result);
}

main();
