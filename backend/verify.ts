
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient().$extends(withAccelerate());

async function main() {
  console.log('Checking tables...');
  const users = await prisma.user.count();
  const products = await prisma.product.count();
  const locations = await prisma.location.count();
  console.log({ users, products, locations });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
