import { IsNotEmpty, IsString, IsIn, IsUUID, IsDecimal, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @IsString()
  @IsIn(['CHECKING', 'SAVINGS'])
  accountType: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  balance?: number;
}

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  @IsIn(['CHECKING', 'SAVINGS'])
  accountType?: string;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  balance?: number;
}