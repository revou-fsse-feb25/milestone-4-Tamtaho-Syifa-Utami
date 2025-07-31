import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ValidationPipe,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TransactionsService } from './transaction.service';
import { CreateTransactionDto, TransferDto } from './dto/transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('transactions')
@UseGuards(JwtAuthGuard) // Protect all transaction endpoints
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(@Body(ValidationPipe) createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create(createTransactionDto);
  }

  @Post('transfer')
  transfer(@Body(ValidationPipe) transferDto: TransferDto) {
    return this.transactionsService.transfer(transferDto);
  }

  @Post('deposit/:accountId')
  deposit(
    @Param('accountId') accountId: string,
    @Body('amount') amount: number,
    @Body('description') description?: string,
  ) {
    return this.transactionsService.deposit(accountId, amount, description);
  }

  @Post('withdraw/:accountId')
  withdraw(
    @Param('accountId') accountId: string,
    @Body('amount') amount: number,
    @Body('description') description?: string,
  ) {
    return this.transactionsService.withdraw(accountId, amount, description);
  }

  @Get()
  findAll(@Query('accountId') accountId?: string) {
    if (accountId) {
      return this.transactionsService.findByAccountId(accountId);
    }
    return this.transactionsService.findAll();
  }

  @Get('my-transactions')
  getMyTransactions(@Request() req) {
    // This would need additional logic to get user's account transactions
    // For now, we'll just return all transactions
    return this.transactionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }
}