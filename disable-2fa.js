// Quick script to disable 2FA for admin user
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.update({
    where: { email: 'admin@example.com' },
    data: { 
      twoFactorEnabled: false, 
      twoFactorSecret: null 
    }
  });
  console.log('2FA disabled for:', user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

