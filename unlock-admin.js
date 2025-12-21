const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.update({
    where: { email: 'admin@starter.dev' },
    data: { 
      failedLoginAttempts: 0, 
      accountLockedUntil: null 
    }
  });
  console.log('Account unlocked:', user.email);
  console.log('Failed attempts reset to:', user.failedLoginAttempts);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

