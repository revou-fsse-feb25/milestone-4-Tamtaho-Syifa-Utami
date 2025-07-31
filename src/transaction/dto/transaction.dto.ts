import { IsNotEmpty, IsString, IsIn, IsUUID, IsOptional, IsPositive } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTransactionDto {
  @Transform(({ value }) => parseFloat(value))
  @IsPositive()
  amount: number;

  @IsString()
  @IsIn(['DEPOSIT', 'WITHDRAWAL', 'TRANSFER'])
  type: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  fromAccountId?: string;

  @IsOptional()
  @IsUUID()
  toAccountId?: string;
}

export class TransferDto {
  @IsUUID()
  @IsNotEmpty()
  fromAccountId: string;

  @IsUUID()
  @IsNotEmpty()
  toAccountId: string;

  @Transform(({ value }) => parseFloat(value))
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;
}