import { IsNumber } from 'class-validator';

export class MarkSoldDto {
  @IsNumber()
  buyerId: number;
}
