import { IsNumber, IsString, IsOptional, Min, Max, MaxLength } from 'class-validator';

export class CreateReviewDto {
  @IsNumber()
  reviewedId: number;

  @IsNumber()
  listingId: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  comment?: string;
}
