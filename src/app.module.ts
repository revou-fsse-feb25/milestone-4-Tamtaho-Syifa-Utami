import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AccountsModule } from './accounts/accounts.module';
import { TransactionsModule } from './transaction/transaction.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [AuthModule, UsersModule, AccountsModule, TransactionsModule],
  providers: [PrismaService],
})
export class AppModule {}