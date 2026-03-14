import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Prisma with Accelerate extension
const prisma = new PrismaClient().$extends(withAccelerate());

const JWT_SECRET = process.env.JWT_SECRET || 'supers3cr3t';

app.get('/', (req, res) => {
  res.json({ message: 'CoreInventory API is running' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- AUTH ROUTES ---

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email } = req.body;
    let user = await prisma.user.findUnique({ where: { email } });

    // Mock an OTP signup if user doesn't exist
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0],
          password: await bcrypt.hash('123456', 10), // mock password
          role: 'admin',
        },
      });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });
    
    // @ts-ignore
    delete user.password;
    res.json({ token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Authentication Middleware
const authMiddleware = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = (decoded as any).userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// --- DATA INITIALIZATION (MOCK DATA PORTING) ---
app.post('/api/init', async (req, res) => {
  try {
    // Generate some basic locations if none exist
    const count = await prisma.location.count();
    if (count === 0) {
      await prisma.location.createMany({
        data: [
          { id: 'loc-vendor', name: 'Partner Locations / Vendors', type: 'vendor' },
          { id: 'loc-customer', name: 'Partner Locations / Customers', type: 'customer' },
          { id: 'loc-main', name: 'WH / Main Stock', type: 'warehouse' },
          { id: 'loc-rack-A', name: 'WH / Rack A', type: 'rack' },
          { id: 'loc-rack-B', name: 'WH / Rack B', type: 'rack' },
          { id: 'loc-virtual', name: 'Virtual Locations / Inventory Loss', type: 'virtual' },
        ]
      });
    }
    res.json({ message: 'Initialized mock data' });
  } catch(error) {
    console.error(error);
    res.status(500).json({ error: 'Failed' });
  }
});

app.use('/api', authMiddleware);

// --- PRODUCTS ---

app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const product = await prisma.product.create({ data: req.body });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- LOCATIONS ---

app.get('/api/locations', async (req, res) => {
  try {
    const locations = await prisma.location.findMany();
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/locations', async (req, res) => {
  try {
    const location = await prisma.location.create({ data: req.body });
    res.json(location);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- STOCK LEVELS ---

app.get('/api/stockLevels', async (req, res) => {
  try {
    const stockLevels = await prisma.stockLevel.findMany({
      where: { quantity: { not: 0 } },
    });
    res.json(stockLevels);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- MOVEMENTS ---

app.get('/api/movements', async (req, res) => {
  try {
    const movements = await prisma.movement.findMany({
      include: { lines: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(movements);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/movements', async (req: any, res: any) => {
  try {
    const { type, fromLocationId, toLocationId, status, notes, lines } = req.body;
    
    // generate reference safely (could be atomic in real db, but this is fine for now)
    const typeCount = await prisma.movement.count({ where: { type } });
    const prefixMap: Record<string, string> = {
      RECEIPT: 'WH/IN',
      DELIVERY: 'WH/OUT',
      TRANSFER: 'WH/INT',
      ADJUSTMENT: 'WH/ADJ'
    };
    const prefix = prefixMap[type] || 'WH/MOV';
    const seq = String(typeCount + 1).padStart(5, '0');
    const reference = `${prefix}/${seq}`;

    const movement = await prisma.movement.create({
      data: {
        reference,
        type,
        fromLocationId,
        toLocationId,
        status: status || 'DRAFT',
        notes,
        createdById: req.userId,
        lines: {
          create: lines.map((l: any) => ({
            productId: l.productId,
            quantity: l.quantity,
          })),
        },
      },
      include: { lines: true },
    });
    
    res.json(movement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/movements/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const movement = await prisma.movement.update({
      where: { id: req.params.id },
      data: { status },
      include: { lines: true },
    });
    res.json(movement);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Validation updates stock levels
app.post('/api/movements/:id/validate', async (req, res) => {
  try {
    const { id } = req.params;
    const movement = await prisma.movement.findUnique({
      where: { id },
      include: { lines: true, fromLocation: true, toLocation: true },
    });

    if (!movement) return res.status(404).json({ error: 'Movement not found' });
    if (movement.status === 'DONE') return res.status(400).json({ error: 'Already validated' });

    // Transaction for correctness
    await prisma.$transaction(async (tx) => {
      // 1. Process lines
      for (const line of movement.lines) {
        // From Location (decrease)
        if (movement.fromLocation.type !== 'vendor' && movement.fromLocation.type !== 'virtual') {
          const existingFrom = await tx.stockLevel.findUnique({
            where: { productId_locationId: { productId: line.productId, locationId: movement.fromLocationId } }
          });
          if (existingFrom) {
            await tx.stockLevel.update({
              where: { id: existingFrom.id },
              data: { quantity: { decrement: line.quantity } }
            });
          } else {
            await tx.stockLevel.create({
              data: { productId: line.productId, locationId: movement.fromLocationId, quantity: -line.quantity }
            });
          }
        }

        // To Location (increase)
        if (movement.toLocation.type !== 'customer' && movement.toLocation.type !== 'virtual') {
           const existingTo = await tx.stockLevel.findUnique({
            where: { productId_locationId: { productId: line.productId, locationId: movement.toLocationId } }
          });
          if (existingTo) {
            await tx.stockLevel.update({
              where: { id: existingTo.id },
              data: { quantity: { increment: line.quantity } }
            });
          } else {
            await tx.stockLevel.create({
              data: { productId: line.productId, locationId: movement.toLocationId, quantity: line.quantity }
            });
          }
        }
      }

      // 2. Mark movement as DONE
      await tx.movement.update({
        where: { id },
        data: { status: 'DONE' }
      });
    });

    const updatedMovement = await prisma.movement.findUnique({ where: { id }, include: { lines: true } });
    res.json(updatedMovement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

export default app;
