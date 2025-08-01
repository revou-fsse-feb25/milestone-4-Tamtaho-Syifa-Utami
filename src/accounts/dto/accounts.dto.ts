import { IsNotEmpty, IsString, IsIn, IsOptional, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty({ message: 'Account number is required' })
  accountNumber: string;

  @IsString()
  @IsIn(['CHECKING', 'SAVINGS'], { message: 'Account type must be CHECKING or SAVINGS' })
  accountType: string;

  @IsString()
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @Type(() => Number)
  @Min(0, { message: 'Balance cannot be negative' })
  balance?: number;
}

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  @IsIn(['CHECKING', 'SAVINGS'], { message: 'Account type must be CHECKING or SAVINGS' })
  accountType?: string;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @Type(() => Number)
  @Min(0, { message: 'Balance cannot be negative' })
  balance?: number;
}