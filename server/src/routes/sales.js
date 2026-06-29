import { Router } from 'express';
import { sql, eq, and, between, desc, asc, sum, count } from 'drizzle-orm';
import { db } from '../db/index.js';
import { sales, products } from '../db/schema.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

// All sales routes require authentication
router.use(authMiddleware);

// ── Helpers ─────────────────────────────────────────────────────────────────────

/** Get today's date string in Asia/Jakarta timezone */
function todayJakarta() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
}

/** Get current month string YYYY-MM in Asia/Jakarta timezone */
function currentMonthJakarta() {
  const d = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  return d.slice(0, 7); // YYYY-MM
}

/** Fill missing dates in a range with zero values */
function fillDateRange(rows, from, to) {
  const map = new Map();
  for (const row of rows) {
    map.set(row.date, row);
  }

  const result = [];
  const current = new Date(from);
  const end = new Date(to);

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    if (map.has(dateStr)) {
      result.push(map.get(dateStr));
    } else {
      result.push({ date: dateStr, revenue: 0, items: 0 });
    }
    current.setDate(current.getDate() + 1);
  }

  return result;
}

// ── POST / ── Create sale ───────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { productId, quantity = 1, saleDate, notes, toppingPrice = 0, orderType = 'Dine-in' } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, error: 'productId is required' });
    }

    // Look up product for unit price
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, Number(productId)))
      .limit(1);

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const unitPrice = product.price + Number(toppingPrice);
    const totalPrice = unitPrice * Number(quantity);

    const [newSale] = await db
      .insert(sales)
      .values({
        productId: Number(productId),
        quantity: Number(quantity),
        unitPrice,
        totalPrice,
        saleDate: saleDate || todayJakarta(),
        orderType,
        notes: notes || null,
      })
      .returning();

    return res.status(201).json({
      success: true,
      data: {
        ...newSale,
        productName: product.name,
        category: product.category,
      },
    });
  } catch (err) {
    console.error('Create sale error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create sale' });
  }
});

// ── GET /daily ── Daily recap ───────────────────────────────────────────────────
router.get('/daily', async (req, res) => {
  try {
    const date = req.query.date || todayJakarta();

    // Grouped by product
    const items = await db
      .select({
        productId: sales.productId,
        productName: products.name,
        category: products.category,
        quantity: sum(sales.quantity).mapWith(Number),
        unitPrice: sales.unitPrice,
        totalPrice: sum(sales.totalPrice).mapWith(Number),
      })
      .from(sales)
      .innerJoin(products, eq(sales.productId, products.id))
      .where(eq(sales.saleDate, date))
      .groupBy(sales.productId, products.name, products.category, sales.unitPrice)
      .orderBy(asc(products.category), asc(products.name));

    // Raw individual records
    const records = await db
      .select({
        id: sales.id,
        productId: sales.productId,
        productName: products.name,
        category: products.category,
        quantity: sales.quantity,
        unitPrice: sales.unitPrice,
        totalPrice: sales.totalPrice,
        saleDate: sales.saleDate,
        orderType: sales.orderType,
        notes: sales.notes,
        createdAt: sales.createdAt,
      })
      .from(sales)
      .innerJoin(products, eq(sales.productId, products.id))
      .where(eq(sales.saleDate, date))
      .orderBy(desc(sales.createdAt));

    // Summary
    const totalRevenue = items.reduce((s, i) => s + i.totalPrice, 0);
    const totalItems = items.reduce((s, i) => s + i.quantity, 0);
    const totalTransactions = records.length;

    return res.json({
      success: true,
      data: {
        date,
        items,
        records,
        summary: { totalRevenue, totalItems, totalTransactions },
      },
    });
  } catch (err) {
    console.error('Daily recap error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch daily recap' });
  }
});

// ── GET /monthly ── Monthly recap ───────────────────────────────────────────────
router.get('/monthly', async (req, res) => {
  try {
    const month = req.query.month || currentMonthJakarta(); // YYYY-MM
    const startDate = `${month}-01`;

    // Calculate last day of the month
    const [year, mon] = month.split('-').map(Number);
    const lastDay = new Date(year, mon, 0).getDate();
    const endDate = `${month}-${String(lastDay).padStart(2, '0')}`;

    // Daily breakdown
    const dailyBreakdown = await db
      .select({
        date: sales.saleDate,
        revenue: sum(sales.totalPrice).mapWith(Number),
        items: sum(sales.quantity).mapWith(Number),
      })
      .from(sales)
      .where(between(sales.saleDate, startDate, endDate))
      .groupBy(sales.saleDate)
      .orderBy(asc(sales.saleDate));

    // Product breakdown
    const productBreakdown = await db
      .select({
        productId: sales.productId,
        productName: products.name,
        category: products.category,
        quantity: sum(sales.quantity).mapWith(Number),
        revenue: sum(sales.totalPrice).mapWith(Number),
      })
      .from(sales)
      .innerJoin(products, eq(sales.productId, products.id))
      .where(between(sales.saleDate, startDate, endDate))
      .groupBy(sales.productId, products.name, products.category)
      .orderBy(desc(sum(sales.totalPrice)));

    // Summary
    const totalRevenue = dailyBreakdown.reduce((s, d) => s + d.revenue, 0);
    const totalItems = dailyBreakdown.reduce((s, d) => s + d.items, 0);
    const daysWithSales = dailyBreakdown.length;
    const avgPerDay = daysWithSales > 0 ? Math.round(totalRevenue / daysWithSales) : 0;

    return res.json({
      success: true,
      data: {
        month,
        dailyBreakdown,
        productBreakdown,
        summary: { totalRevenue, totalItems, avgPerDay, daysWithSales },
      },
    });
  } catch (err) {
    console.error('Monthly recap error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch monthly recap' });
  }
});

// ── GET /chart ── Chart data ────────────────────────────────────────────────────
router.get('/chart', async (req, res) => {
  try {
    const today = todayJakarta();
    const thirtyDaysAgo = new Date(new Date(today).getTime() - 29 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const from = req.query.from || thirtyDaysAgo;
    const to = req.query.to || today;

    // Daily revenue
    const dailyRaw = await db
      .select({
        date: sales.saleDate,
        revenue: sum(sales.totalPrice).mapWith(Number),
        items: sum(sales.quantity).mapWith(Number),
      })
      .from(sales)
      .where(between(sales.saleDate, from, to))
      .groupBy(sales.saleDate)
      .orderBy(asc(sales.saleDate));

    const daily = fillDateRange(dailyRaw, from, to);

    // By product (top 10 by revenue)
    const byProduct = await db
      .select({
        productId: sales.productId,
        productName: products.name,
        category: products.category,
        quantity: sum(sales.quantity).mapWith(Number),
        revenue: sum(sales.totalPrice).mapWith(Number),
      })
      .from(sales)
      .innerJoin(products, eq(sales.productId, products.id))
      .where(between(sales.saleDate, from, to))
      .groupBy(sales.productId, products.name, products.category)
      .orderBy(desc(sum(sales.totalPrice)))
      .limit(10);

    return res.json({
      success: true,
      data: { from, to, daily, byProduct },
    });
  } catch (err) {
    console.error('Chart data error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch chart data' });
  }
});

// ── GET /dashboard ── Dashboard summary ─────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const today = todayJakarta();
    const monthStart = today.slice(0, 7) + '-01';

    // Today stats
    const todayStatsRows = await db
      .select({
        revenue: sum(sales.totalPrice).mapWith(Number),
        items: sum(sales.quantity).mapWith(Number),
        transactions: count(sales.id).mapWith(Number),
      })
      .from(sales)
      .where(eq(sales.saleDate, today));

    const todayStats = todayStatsRows[0] || { revenue: 0, items: 0, transactions: 0 };

    // This month stats
    const monthEnd = today; // up to today
    const monthStatsRows = await db
      .select({
        revenue: sum(sales.totalPrice).mapWith(Number),
        items: sum(sales.quantity).mapWith(Number),
        transactions: count(sales.id).mapWith(Number),
      })
      .from(sales)
      .where(between(sales.saleDate, monthStart, monthEnd));

    const thisMonth = monthStatsRows[0] || { revenue: 0, items: 0, transactions: 0 };

    // Top 5 products today by quantity
    const topProducts = await db
      .select({
        productId: sales.productId,
        productName: products.name,
        category: products.category,
        quantity: sum(sales.quantity).mapWith(Number),
        revenue: sum(sales.totalPrice).mapWith(Number),
      })
      .from(sales)
      .innerJoin(products, eq(sales.productId, products.id))
      .where(eq(sales.saleDate, today))
      .groupBy(sales.productId, products.name, products.category)
      .orderBy(desc(sum(sales.quantity)))
      .limit(5);

    // Recent 10 sales
    const recentSales = await db
      .select({
        id: sales.id,
        productName: products.name,
        category: products.category,
        quantity: sales.quantity,
        totalPrice: sales.totalPrice,
        saleDate: sales.saleDate,
        orderType: sales.orderType,
        notes: sales.notes,
        createdAt: sales.createdAt,
      })
      .from(sales)
      .innerJoin(products, eq(sales.productId, products.id))
      .orderBy(desc(sales.createdAt))
      .limit(10);

    // Weekly trend (last 7 days)
    const sevenDaysAgo = new Date(new Date(today).getTime() - 6 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const weeklyRaw = await db
      .select({
        date: sales.saleDate,
        revenue: sum(sales.totalPrice).mapWith(Number),
        items: sum(sales.quantity).mapWith(Number),
      })
      .from(sales)
      .where(between(sales.saleDate, sevenDaysAgo, today))
      .groupBy(sales.saleDate)
      .orderBy(asc(sales.saleDate));

    const weeklyTrend = fillDateRange(weeklyRaw, sevenDaysAgo, today);

    return res.json({
      success: true,
      data: {
        today: {
          date: today,
          revenue: todayStats.revenue || 0,
          items: todayStats.items || 0,
          transactions: todayStats.transactions || 0,
        },
        thisMonth: {
          month: today.slice(0, 7),
          revenue: thisMonth.revenue || 0,
          items: thisMonth.items || 0,
          transactions: thisMonth.transactions || 0,
        },
        topProducts,
        recentSales,
        weeklyTrend,
      },
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch dashboard data' });
  }
});

// ── PUT /:id ── Update sale ───────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, orderType, notes } = req.body;

    const updates = {};
    if (quantity !== undefined) {
      // Need to fetch original unit_price to recalculate total_price
      const [existingSale] = await db
        .select()
        .from(sales)
        .where(eq(sales.id, Number(id)))
        .limit(1);
        
      if (!existingSale) return res.status(404).json({ success: false, error: 'Sale not found' });
      
      updates.quantity = Number(quantity);
      updates.totalPrice = existingSale.unitPrice * Number(quantity);
    }
    
    if (orderType !== undefined) updates.orderType = orderType;
    if (notes !== undefined) updates.notes = notes;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    const [updatedSale] = await db
      .update(sales)
      .set(updates)
      .where(eq(sales.id, Number(id)))
      .returning();

    if (!updatedSale) {
      return res.status(404).json({ success: false, error: 'Sale not found' });
    }

    return res.json({ success: true, data: updatedSale });
  } catch (err) {
    console.error('Update sale error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update sale' });
  }
});

// ── DELETE /:id ── Delete sale ───────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [deleted] = await db
      .delete(sales)
      .where(eq(sales.id, Number(id)))
      .returning();

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Sale not found' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Delete sale error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete sale' });
  }
});

export default router;
