import { IsNumber, Min, Max } from 'class-validator';

export class CreateBidDto {
  @IsNumber()
  listingId: number;

  // Cap matches CreateListingDto.price so nobody can place a bid that the
  // listing price itself could never have been. DECIMAL(10,2) holds up to
  // 99,999,999.99, so 999,999.99 leaves plenty of headroom.
  @IsNumber()
  @Min(0.01)
  @Max(999999.99)
  amount: number;
}
