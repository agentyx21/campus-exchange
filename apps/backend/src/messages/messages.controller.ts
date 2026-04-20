import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  // Limit messages: 30 per minute per IP to prevent spam
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post()
  sendMessage(@Request() req, @Body() dto: SendMessageDto) {
    return this.messagesService.sendMessage(req.user.id, dto);
  }

  @Get('conversations')
  getConversations(@Request() req) {
    return this.messagesService.getConversations(req.user.id);
  }

  @Get('conversations/:id')
  getMessages(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.messagesService.getMessages(id, req.user.id);
  }
}
