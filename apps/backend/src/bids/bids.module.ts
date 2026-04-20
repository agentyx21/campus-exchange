import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BidsService } from './bids.service';
import { BidsController } from './bids.controller';
import { Bid, Listing } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Bid, Listing])],
  controllers: [BidsController],
  providers: [BidsService],
})
export class BidsModule {}
