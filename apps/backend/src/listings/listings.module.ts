import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';
import { AuctionsScheduler } from './auctions.scheduler';
import { Listing, ListingImage, Category, Conversation, Message, Bid } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Listing, ListingImage, Category, Conversation, Message, Bid])],
  controllers: [ListingsController],
  providers: [ListingsService, AuctionsScheduler],
  exports: [ListingsService],
})
export class ListingsModule {}
