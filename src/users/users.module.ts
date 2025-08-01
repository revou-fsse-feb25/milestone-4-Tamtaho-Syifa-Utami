import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController, UserProfileController } from './users.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [UsersController, UserProfileController],
  providers: [UsersService, PrismaService],
  exports: [UsersService],
})
export class UsersModule {}