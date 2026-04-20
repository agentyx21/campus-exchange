import { IsNumber, IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateReportDto {
  @IsNumber()
  listingId: number;

  @IsEnum(['inappropriate', 'spam', 'scam', 'prohibited_item', 'other'])
  reason: 'inappropriate' | 'spam' | 'scam' | 'prohibited_item' | 'other';

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
