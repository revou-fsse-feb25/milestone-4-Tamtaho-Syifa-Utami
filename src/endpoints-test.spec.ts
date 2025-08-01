import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './app.module';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

jest.setTimeout(30000);

describe('Banking System - All Endpoints', () => {
  let app: INestApplication;
  let userToken: string;
  let accountId: string;
  let transactionId: string;
  let userId: string;

  beforeAll(async () => {
    // Check if user exists, if not run seed
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const user = await prisma.user.findFirst({
      where: { email: 'john.doe@example.com' },
    });

    if (!user) {
      console.log('No test user found, seeding...');
      await execAsync('npx prisma db seed');
    }

    await prisma.$disconnect();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Get user token and ID
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'john.doe@example.com',
        password: 'password123',
      });

    userToken = loginResponse.body.access_token;

    // Get user ID
    const profileResponse = await request(app.getHttpServer())
      .get('/user/profile')
      .set('Authorization', `Bearer ${userToken}`);

    userId = profileResponse.body.id;

    // Get account ID for testing
    const accountsResponse = await request(app.getHttpServer())
      .get('/accounts')
      .set('Authorization', `Bearer ${userToken}`);

    accountId = accountsResponse.body[0]?.id;
  });

  afterAll(async () => {
    await app.close();
  });

  // ==================== USER PROFILE ENDPOINTS ====================
  describe('User Profile Endpoints', () => {
    it('GET /user/profile - should get user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/user/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
    });

    it('PATCH /user/profile - should update user profile', async () => {
      const updateData = { firstName: 'UpdatedName' };

      const response = await request(app.getHttpServer())
        .patch('/user/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.firstName).toBe(updateData.firstName);
    });
  });

  // ==================== ACCOUNT ENDPOINTS ====================
  describe('Account Endpoints', () => {
    it('POST /accounts - should create new account', async () => {
      const accountData = {
        accountNumber: `TEST-JEST-${Date.now()}`,
        accountType: 'CHECKING',
        userId: userId,
        balance: 1000,
      };

      const response = await request(app.getHttpServer())
        .post('/accounts')
        .set('Authorization', `Bearer ${userToken}`)
        .send(accountData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.accountNumber).toBe(accountData.accountNumber);
    });

    it('GET /accounts - should get user accounts', async () => {
      const response = await request(app.getHttpServer())
        .get('/accounts')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('GET /accounts/:id - should get specific account', async () => {
      if (!accountId) return;

      const response = await request(app.getHttpServer())
        .get(`/accounts/${accountId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.id).toBe(accountId);
      expect(response.body).toHaveProperty('accountNumber');
    });

    it('GET /accounts/:id/balance - should get account balance', async () => {
      if (!accountId) return;

      const response = await request(app.getHttpServer())
        .get(`/accounts/${accountId}/balance`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('balance');
    });

    it('PATCH /accounts/:id - should update account', async () => {
      if (!accountId) return;

      const updateData = { accountType: 'SAVINGS' };

      const response = await request(app.getHttpServer())
        .patch(`/accounts/${accountId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.accountType).toBe(updateData.accountType);
    });
  });

  // ==================== TRANSACTION ENDPOINTS ====================
  describe('Transaction Endpoints', () => {
    it('POST /transactions/withdraw - should withdraw money', async () => {
      if (!accountId) return;

      const withdrawalData = {
        amount: 100,
        description: 'Test withdrawal',
      };

      const response = await request(app.getHttpServer())
        .post(`/transactions/withdraw/${accountId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(withdrawalData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.type).toBe('WITHDRAWAL');
      expect(parseFloat(response.body.amount)).toBe(withdrawalData.amount);

      transactionId = response.body.id;
    });

    it('POST /transactions/deposit - should deposit money', async () => {
      if (!accountId) return;

      const depositData = {
        amount: 500,
        description: 'Test deposit',
      };

      const response = await request(app.getHttpServer())
        .post(`/transactions/deposit/${accountId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(depositData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.type).toBe('DEPOSIT');
      expect(parseFloat(response.body.amount)).toBe(depositData.amount);
    });

    it('GET /transactions - should get transactions', async () => {
      const response = await request(app.getHttpServer())
        .get('/transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('GET /transactions/:id - should get specific transaction', async () => {
      if (!transactionId) return;

      const response = await request(app.getHttpServer())
        .get(`/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.id).toBe(transactionId);
      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('amount');
    });
  });

  // ==================== AUTHORIZATION TESTS ====================
  describe('Authorization Tests', () => {
    it('should reject requests without token', async () => {
      await request(app.getHttpServer())
        .get('/user/profile')
        .expect(401);
    });

    it('should reject requests with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/user/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  // ==================== ERROR HANDLING TESTS ====================
  describe('Error Handling', () => {
    it('should handle non-existent account (403 due to owner guard)', async () => {
      await request(app.getHttpServer())
        .get('/accounts/non-existent-id-12345')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should handle invalid account creation', async () => {
      const invalidAccountData = {
        accountNumber: '',
        accountType: 'INVALID_TYPE',
        userId: 'invalid-id',
      };

      await request(app.getHttpServer())
        .post('/accounts')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidAccountData)
        .expect(400);
    });

    it('should handle duplicate account number', async () => {
      const accountData = {
        accountNumber: `DUPLICATE-TEST-${Date.now()}`,
        accountType: 'CHECKING',
        userId: userId,
      };

      await request(app.getHttpServer())
        .post('/accounts')
        .set('Authorization', `Bearer ${userToken}`)
        .send(accountData)
        .expect(201);

      await request(app.getHttpServer())
        .post('/accounts')
        .set('Authorization', `Bearer ${userToken}`)
        .send(accountData)
        .expect(400);
    });

    it('should handle insufficient funds for withdrawal', async () => {
      if (!accountId) return;

      await request(app.getHttpServer())
        .post(`/transactions/withdraw/${accountId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amount: 999999, description: 'Too much money' })
        .expect(400);
    });

    it('should validate transaction amounts', async () => {
      if (!accountId) return;

      await request(app.getHttpServer())
        .post(`/transactions/deposit/${accountId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amount: 0, description: 'Zero amount' })
        .expect(400);
    });
  });

  // ==================== BUSINESS LOGIC TESTS ====================
  describe('Business Logic Tests', () => {
    it('should update account balance after deposit', async () => {
      if (!accountId) return;

      const initialBalanceResponse = await request(app.getHttpServer())
        .get(`/accounts/${accountId}/balance`)
        .set('Authorization', `Bearer ${userToken}`);

      const initialBalance = parseFloat(initialBalanceResponse.body.balance);

      const depositAmount = 250;
      await request(app.getHttpServer())
        .post(`/transactions/deposit/${accountId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amount: depositAmount, description: 'Balance test' })
        .expect(201);

      const newBalanceResponse = await request(app.getHttpServer())
        .get(`/accounts/${accountId}/balance`)
        .set('Authorization', `Bearer ${userToken}`);

      const newBalance = parseFloat(newBalanceResponse.body.balance);
      expect(newBalance).toBe(initialBalance + depositAmount);
    });

    it('should create transaction record with correct data', async () => {
      if (!accountId) return;

      const transactionData = {
        amount: 75,
        description: 'Data validation test',
      };

      const response = await request(app.getHttpServer())
        .post(`/transactions/deposit/${accountId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(transactionData)
        .expect(201);

      expect(response.body.type).toBe('DEPOSIT');
      expect(response.body.description).toBe(transactionData.description);
      expect(parseFloat(response.body.amount)).toBe(transactionData.amount);
      expect(response.body.toAccountId).toBe(accountId);
      expect(response.body.status).toBe('COMPLETED');
    });
  });
});
