import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting to seed database...');

  // Clear existing data (optional - be careful in production!)
  await prisma.transaction.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  console.log('🗑️  Cleared existing data');

  // Hash passwords for users
  const saltRounds = 10;

  // Create Admin Users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@bank.com',
      firstName: 'System',
      lastName: 'Administrator',
      password: await bcrypt.hash('admin123', saltRounds),
      role: 'ADMIN',
    },
  });

  const superAdmin = await prisma.user.create({
    data: {
      email: 'super@bank.com',
      firstName: 'Super',
      lastName: 'Admin',
      password: await bcrypt.hash('super123', saltRounds),
      role: 'ADMIN',
    },
  });

  console.log('👑 Created admin users:', { 
    admin: adminUser.email, 
    superAdmin: superAdmin.email 
  });

  // Create Regular Users
  const user1 = await prisma.user.create({
    data: {
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      password: await bcrypt.hash('password123', saltRounds),
      role: 'USER',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'jane.smith@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      password: await bcrypt.hash('password123', saltRounds),
      role: 'USER',
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'bob.wilson@example.com',
      firstName: 'Bob',
      lastName: 'Wilson',
      password: await bcrypt.hash('password123', saltRounds),
      role: 'USER',
    },
  });

  console.log('👥 Created regular users:', { 
    user1: user1.email, 
    user2: user2.email, 
    user3: user3.email 
  });

  // Create Accounts for Regular Users (not admins - they don't need bank accounts)
  const account1 = await prisma.account.create({
    data: {
      accountNumber: 'ACC-001-CHK',
      accountType: 'CHECKING',
      balance: 5000.00,
      userId: user1.id,
    },
  });

  const account2 = await prisma.account.create({
    data: {
      accountNumber: 'ACC-001-SAV',
      accountType: 'SAVINGS',
      balance: 15000.00,
      userId: user1.id,
    },
  });

  const account3 = await prisma.account.create({
    data: {
      accountNumber: 'ACC-002-CHK',
      accountType: 'CHECKING',
      balance: 3200.50,
      userId: user2.id,
    },
  });

  const account4 = await prisma.account.create({
    data: {
      accountNumber: 'ACC-002-SAV',
      accountType: 'SAVINGS',
      balance: 8750.25,
      userId: user2.id,
    },
  });

  const account5 = await prisma.account.create({
    data: {
      accountNumber: 'ACC-003-CHK',
      accountType: 'CHECKING',
      balance: 1500.00,
      userId: user3.id,
    },
  });

  console.log('🏦 Created accounts:', {
    johnChecking: account1.accountNumber,
    johnSavings: account2.accountNumber,
    janeChecking: account3.accountNumber,
    janeSavings: account4.accountNumber,
    bobChecking: account5.accountNumber,
  });

  // Create Transactions
  const transactions = [];

  // Deposits
  const deposit1 = await prisma.transaction.create({
    data: {
      type: 'DEPOSIT',
      amount: 1000.00,
      description: 'Initial deposit',
      toAccountId: account1.id,
      status: 'COMPLETED',
    },
  });
  transactions.push(deposit1);

  const deposit2 = await prisma.transaction.create({
    data: {
      type: 'DEPOSIT',
      amount: 5000.00,
      description: 'Salary deposit',
      toAccountId: account3.id,
      status: 'COMPLETED',
    },
  });
  transactions.push(deposit2);

  // Withdrawals
  const withdrawal1 = await prisma.transaction.create({
    data: {
      type: 'WITHDRAWAL',
      amount: 200.00,
      description: 'ATM withdrawal',
      fromAccountId: account1.id,
      status: 'COMPLETED',
    },
  });
  transactions.push(withdrawal1);

  const withdrawal2 = await prisma.transaction.create({
    data: {
      type: 'WITHDRAWAL',
      amount: 150.00,
      description: 'Cash withdrawal',
      fromAccountId: account3.id,
      status: 'COMPLETED',
    },
  });
  transactions.push(withdrawal2);

  // Transfers
  const transfer1 = await prisma.transaction.create({
    data: {
      type: 'TRANSFER',
      amount: 500.00,
      description: 'Transfer to savings',
      fromAccountId: account1.id, // John's checking
      toAccountId: account2.id,   // John's savings
      status: 'COMPLETED',
    },
  });
  transactions.push(transfer1);

  const transfer2 = await prisma.transaction.create({
    data: {
      type: 'TRANSFER',
      amount: 300.00,
      description: 'Payment for services',
      fromAccountId: account3.id, // Jane's checking
      toAccountId: account5.id,   // Bob's checking
      status: 'COMPLETED',
    },
  });
  transactions.push(transfer2);

  const transfer3 = await prisma.transaction.create({
    data: {
      type: 'TRANSFER',
      amount: 750.00,
      description: 'Rent payment',
      fromAccountId: account4.id, // Jane's savings
      toAccountId: account1.id,   // John's checking
      status: 'COMPLETED',
    },
  });
  transactions.push(transfer3);

  console.log('💸 Created transactions:', {
    deposits: 2,
    withdrawals: 2,
    transfers: 3,
    total: transactions.length,
  });

  // Display summary
  console.log('\n📊 Seed Summary:');
  console.log('================');
  
  console.log('\n👑 ADMIN ACCOUNTS:');
  console.log(`📧 Email: admin@bank.com | Password: admin123`);
  console.log(`📧 Email: super@bank.com | Password: super123`);
  
  console.log('\n👥 REGULAR USER ACCOUNTS:');
  console.log(`📧 Email: john.doe@example.com | Password: password123`);
  console.log(`📧 Email: jane.smith@example.com | Password: password123`);
  console.log(`📧 Email: bob.wilson@example.com | Password: password123`);

  const allUsers = await prisma.user.findMany({
    include: {
      accounts: {
        include: {
          _count: {
            select: {
              sentTransactions: true,
              receivedTransactions: true,
            },
          },
        },
      },
    },
  });

  allUsers.forEach((user) => {
    const roleIcon = user.role === 'ADMIN' ? '👑' : '👤';
    console.log(`\n${roleIcon} ${user.firstName} ${user.lastName} (${user.email}) - ${user.role}`);
    if (user.accounts.length > 0) {
      user.accounts.forEach((account) => {
        const totalTransactions = account._count.sentTransactions + account._count.receivedTransactions;
        console.log(`  💳 ${account.accountNumber} (${account.accountType}): $${account.balance} | ${totalTransactions} transactions`);
      });
    } else {
      console.log(`  📋 No bank accounts (Admin user)`);
    }
  });

  console.log('\n✅ Database seeded successfully!');
  console.log('\n🔐 LOGIN CREDENTIALS:');
  console.log('Admin: admin@bank.com / admin123');
  console.log('User: john.doe@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });