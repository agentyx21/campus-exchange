import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { Conversation, Message, Listing } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation, Message, Listing])],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
