import { IsNumber, IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsNumber()
  listingId: number;

  @IsNumber()
  receiverId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;
}
