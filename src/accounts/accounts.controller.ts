import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto, UpdateAccountDto } from './dto/accounts.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OwnerGuard } from '../auth/guards/owner.guard';
import { Roles, Role } from '../auth/decorators/roles.decorator';

@Controller('accounts')
@UseGuards(JwtAuthGuard) // All endpoints require authentication
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  create(@Body(ValidationPipe) createAccountDto: CreateAccountDto) {
    return this.accountsService.create(createAccountDto);
  }

  @Get()
  findAll(@Query('userId') userId?: string, @Request() req?) {
    // If no userId specified, return current user's accounts
    if (!userId) {
      return this.accountsService.findByUserId(req.user.id);
    }
    
    // If userId specified, check if admin (for viewing other users' accounts)
    // This will be handled by the RolesGuard in the admin-specific endpoint
    return this.accountsService.findByUserId(userId);
  }

  @Get('all')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN) // Only admins can see all accounts
  findAllAccounts() {
    return this.accountsService.findAll();
  }

  @Get('my-accounts')
  getMyAccounts(@Request() req) {
    return this.accountsService.findByUserId(req.user.id);
  }

  @Get(':id')
  @UseGuards(OwnerGuard) // Users can only see their own accounts
  findOne(@Param('id') id: string) {
    return this.accountsService.findOne(id);
  }

  @Get(':id/balance')
  @UseGuards(OwnerGuard) // Users can only see their own account balance
  getBalance(@Param('id') id: string) {
    return this.accountsService.getBalance(id);
  }

  @Patch(':id')
  @UseGuards(OwnerGuard) // Users can only update their own accounts
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateAccountDto: UpdateAccountDto,
  ) {
    return this.accountsService.update(id, updateAccountDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN) // Only admins can delete accounts
  remove(@Param('id') id: string) {
    return this.accountsService.remove(id);
  }
}