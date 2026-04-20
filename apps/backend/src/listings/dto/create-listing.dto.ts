import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  IsNotEmpty,
  Min,
  Max,
  MaxLength,
  ArrayMaxSize,
  Validate,
} from 'class-validator';
import { IsListingImageConstraint } from '../../common/safe-url.validator';
import { MAX_LISTING_IMAGES } from '../../common/constants';

export class CreateListingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;

  @IsNumber()
  @Min(0)
  @Max(999999.99)
  price: number;

  @IsNumber()
  categoryId: number;

  @IsEnum(['fixed', 'bidding'])
  @IsOptional()
  listingType?: 'fixed' | 'bidding';

  @IsEnum(['new', 'like_new', 'good', 'fair', 'poor'])
  @IsOptional()
  conditionStatus?: 'new' | 'like_new' | 'good' | 'fair' | 'poor';

  @IsDateString()
  @IsOptional()
  bidEndDate?: string;

  @IsOptional()
  @Validate(IsListingImageConstraint, { each: true })
  @ArrayMaxSize(MAX_LISTING_IMAGES)
  imageUrls?: string[];
}
