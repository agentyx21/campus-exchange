import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { Review, User, Conversation, Message, Listing } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Review, User, Conversation, Message, Listing])],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
