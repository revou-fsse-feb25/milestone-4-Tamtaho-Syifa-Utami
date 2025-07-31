import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAccountDto, UpdateAccountDto } from './dto/accounts.dto';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async create(createAccountDto: CreateAccountDto) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: createAccountDto.userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${createAccountDto.userId} not found`);
    }

    // Check if account number already exists
    const existingAccount = await this.prisma.account.findUnique({
      where: { accountNumber: createAccountDto.accountNumber },
    });

    if (existingAccount) {
      throw new BadRequestException(`Account number ${createAccountDto.accountNumber} already exists`);
    }

    return this.prisma.account.create({
      data: {
        ...createAccountDto,
        balance: createAccountDto.balance || 0,
      },
      include: {
        user: true,
      },
    });
  }

  async findAll() {
    return this.prisma.account.findMany({
      include: {
        user: true,
        sentTransactions: true,
        receivedTransactions: true,
      },
    });
  }

  async findOne(id: string) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: {
        user: true,
        sentTransactions: {
          orderBy: { createdAt: 'desc' },
        },
        receivedTransactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    return account;
  }

  async findByUserId(userId: string) {
    return this.prisma.account.findMany({
      where: { userId },
      include: {
        user: true,
      },
    });
  }

  async update(id: string, updateAccountDto: UpdateAccountDto) {
    try {
      return await this.prisma.account.update({
        where: { id },
        data: updateAccountDto,
        include: {
          user: true,
        },
      });
    } catch (error) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.account.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }
  }

  async getBalance(id: string) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      select: { balance: true },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    return { balance: account.balance };
  }
}