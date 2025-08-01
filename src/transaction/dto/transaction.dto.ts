import { IsNotEmpty, IsString, IsIn, IsOptional, IsPositive, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateTransactionDto {
  @Transform(({ value }) => parseFloat(value))
  @Type(() => Number)
  @IsPositive({ message: 'Amount must be positive' })
  @Min(0.01, { message: 'Amount must be at least 0.01' })
  amount: number;

  @IsString()
  @IsIn(['DEPOSIT', 'WITHDRAWAL', 'TRANSFER'])
  type: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  fromAccountId?: string;

  @IsOptional()
  @IsString()
  toAccountId?: string;
}

export class TransferDto {
  @IsString()
  @IsNotEmpty()
  fromAccountId: string;

  @IsString()
  @IsNotEmpty()
  toAccountId: string;

  @Transform(({ value }) => parseFloat(value))
  @Type(() => Number)
  @IsPositive({ message: 'Amount must be positive' })
  @Min(0.01, { message: 'Amount must be at least 0.01' })
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;
}