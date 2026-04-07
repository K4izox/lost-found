require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const items = await prisma.item.findMany();
    console.log("SUCCESS:", items.length, "items");
  } catch (err) {
    console.error("ERROR:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
