import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransactionDto, TransferDto } from './dto/transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(createTransactionDto: CreateTransactionDto) {
    const { type, fromAccountId, toAccountId, amount } = createTransactionDto;

    // Validate amount
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive and greater than 0');
    }

    // Validate transaction type requirements
    if (type === 'TRANSFER' && (!fromAccountId || !toAccountId)) {
      throw new BadRequestException('Transfer requires both fromAccountId and toAccountId');
    }

    if (type === 'DEPOSIT' && !toAccountId) {
      throw new BadRequestException('Deposit requires toAccountId');
    }

    if (type === 'WITHDRAWAL' && !fromAccountId) {
      throw new BadRequestException('Withdrawal requires fromAccountId');
    }

    // Use a transaction to ensure data consistency
    return this.prisma.$transaction(async (prisma) => {
      // Create the transaction record
      const transaction = await prisma.transaction.create({
        data: createTransactionDto,
        include: {
          fromAccount: true,
          toAccount: true,
        },
      });

      // Update account balances based on transaction type
      if (type === 'DEPOSIT' && toAccountId) {
        await prisma.account.update({
          where: { id: toAccountId },
          data: {
            balance: {
              increment: amount,
            },
          },
        });
      }

      if (type === 'WITHDRAWAL' && fromAccountId) {
        // Check if account has sufficient balance
        const fromAccount = await prisma.account.findUnique({
          where: { id: fromAccountId },
        });

        if (!fromAccount) {
          throw new NotFoundException(`Account with ID ${fromAccountId} not found`);
        }

        if (fromAccount.balance.toNumber() < amount) {
          throw new BadRequestException('Insufficient balance');
        }

        await prisma.account.update({
          where: { id: fromAccountId },
          data: {
            balance: {
              decrement: amount,
            },
          },
        });
      }

      if (type === 'TRANSFER' && fromAccountId && toAccountId) {
        // Check if both accounts exist
        const [fromAccount, toAccount] = await Promise.all([
          prisma.account.findUnique({ where: { id: fromAccountId } }),
          prisma.account.findUnique({ where: { id: toAccountId } }),
        ]);

        if (!fromAccount) {
          throw new NotFoundException(`From account with ID ${fromAccountId} not found`);
        }

        if (!toAccount) {
          throw new NotFoundException(`To account with ID ${toAccountId} not found`);
        }

        if (fromAccount.balance.toNumber() < amount) {
          throw new BadRequestException('Insufficient balance');
        }

        // Update balances
        await Promise.all([
          prisma.account.update({
            where: { id: fromAccountId },
            data: { balance: { decrement: amount } },
          }),
          prisma.account.update({
            where: { id: toAccountId },
            data: { balance: { increment: amount } },
          }),
        ]);
      }

      return transaction;
    });
  }

  async findAll() {
    return this.prisma.transaction.findMany({
      include: {
        fromAccount: {
          include: { user: true },
        },
        toAccount: {
          include: { user: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        fromAccount: {
          include: { user: true },
        },
        toAccount: {
          include: { user: true },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  async findByAccountId(accountId: string) {
    return this.prisma.transaction.findMany({
      where: {
        OR: [
          { fromAccountId: accountId },
          { toAccountId: accountId },
        ],
      },
      include: {
        fromAccount: true,
        toAccount: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async transfer(transferDto: TransferDto) {
    return this.create({
      type: 'TRANSFER',
      amount: transferDto.amount,
      fromAccountId: transferDto.fromAccountId,
      toAccountId: transferDto.toAccountId,
      description: transferDto.description || 'Transfer',
    });
  }

  async deposit(accountId: string, amount: number, description?: string) {
    // Validate amount here too
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive and greater than 0');
    }

    return this.create({
      type: 'DEPOSIT',
      amount,
      toAccountId: accountId,
      description: description || 'Deposit',
    });
  }

  async withdraw(accountId: string, amount: number, description?: string) {
    // Validate amount here too
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive and greater than 0');
    }

    return this.create({
      type: 'WITHDRAWAL',
      amount,
      fromAccountId: accountId,
      description: description || 'Withdrawal',
    });
  }
}