import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const sql = neon(process.env.DATABASE_URL);

  console.log('Fetching all sales...');
  const sales = await sql`SELECT id, created_at, transaction_id FROM sales ORDER BY created_at ASC;`;

  let currentGroupId = null;
  let lastTime = null;

  for (const sale of sales) {
    if (sale.transaction_id) {
      continue; // Skip if already has transactionId
    }

    const saleTime = new Date(sale.created_at).getTime();

    // Group if within 10 seconds (10000 ms)
    if (lastTime && (saleTime - lastTime) < 10000) {
      // Use the same currentGroupId
    } else {
      currentGroupId = `TRX-${saleTime}`;
    }

    // Update the record
    await sql`UPDATE sales SET transaction_id = ${currentGroupId} WHERE id = ${sale.id}`;
    console.log(`Updated sale ${sale.id} with ${currentGroupId}`);

    lastTime = saleTime;
  }

  console.log('Fix complete!');
}

main();
