
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient().$extends(withAccelerate());

async function main() {
  console.log('Seeding data...');
  
  // 1. Create a user if none exists
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Admin User',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin'
      }
    });
    console.log('User created.');
  }

  // 2. Create some products if none exist
  const productCount = await prisma.product.count();
  if (productCount === 0) {
    await prisma.product.createMany({
      data: [
        { name: 'Laptop', sku: 'LAP-001', category: 'Electronics', unit: 'pcs' },
        { name: 'Desk Chair', sku: 'CHR-002', category: 'Furniture', unit: 'pcs' },
        { name: 'Monitor', sku: 'MON-003', category: 'Electronics', unit: 'pcs' }
      ]
    });
    console.log('Products created.');
  }

  console.log('Seeding complete.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
