import { Router } from 'express';
import { eq, asc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { products } from '../db/schema.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

// All product routes require authentication
router.use(authMiddleware);

// ── GET / ── List active products ───────────────────────────────────────────────
router.get('/', async (_req, res) => {
  try {
    const includeAll = req.query.all === 'true';
    let query = db.select().from(products);
    
    if (!includeAll) {
      query = query.where(eq(products.isActive, true));
    }
    
    const result = await query.orderBy(asc(products.category), asc(products.name));

    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('List products error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

// ── POST / ── Create product ────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, price, category } = req.body;

    if (!name || price == null) {
      return res.status(400).json({
        success: false,
        error: 'Name and price are required',
      });
    }

    const [newProduct] = await db
      .insert(products)
      .values({ name, price: Number(price), category: category || 'makanan' })
      .returning();

    return res.status(201).json({ success: true, data: newProduct });
  } catch (err) {
    console.error('Create product error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create product' });
  }
});

// ── PUT /:id ── Update product ──────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};

    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.price !== undefined) updates.price = Number(req.body.price);
    if (req.body.category !== undefined) updates.category = req.body.category;
    if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    const [updatedProduct] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, Number(id)))
      .returning();

    if (!updatedProduct) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    return res.json({ success: true, data: updatedProduct });
  } catch (err) {
    console.error('Update product error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update product' });
  }
});

// ── DELETE /:id ── Soft delete ──────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [updated] = await db
      .update(products)
      .set({ isActive: false })
      .where(eq(products.id, Number(id)))
      .returning();

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Delete product error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete product' });
  }
});

export default router;
