import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Conversation, Message, Listing } from '../entities';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Conversation)
    private conversationsRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    @InjectRepository(Listing)
    private listingsRepository: Repository<Listing>,
  ) {}

  async sendMessage(senderId: number, dto: SendMessageDto) {
    if (senderId === dto.receiverId) {
      throw new BadRequestException('You cannot message yourself');
    }

    const trimmedContent = dto.content?.trim();
    if (!trimmedContent) {
      throw new BadRequestException('Message content cannot be empty');
    }

    const listing = await this.listingsRepository.findOne({
      where: { id: dto.listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.status === 'hidden' || listing.status === 'deleted') {
      throw new BadRequestException('Messaging is not available for this listing');
    }

    const sellerId = listing.sellerId;
    const isSenderTheSeller = senderId === sellerId;
    let conversation: Conversation | null = null;

    if (isSenderTheSeller) {
      conversation = await this.conversationsRepository.findOne({
        where: {
          listingId: dto.listingId,
          buyerId: dto.receiverId,
          sellerId,
        },
      });

      if (!conversation) {
        throw new BadRequestException(
          'Sellers can only reply to existing conversations',
        );
      }
    } else {
      if (dto.receiverId !== sellerId) {
        throw new BadRequestException(
          'You can only contact the seller for this listing',
        );
      }

      conversation = await this.conversationsRepository.findOne({
        where: {
          listingId: dto.listingId,
          buyerId: senderId,
          sellerId,
        },
      });

      if (!conversation) {
        try {
          conversation = this.conversationsRepository.create({
            listingId: dto.listingId,
            buyerId: senderId,
            sellerId,
            lastMessageAt: new Date(),
          });
          conversation = await this.conversationsRepository.save(conversation);
        } catch (error: any) {
          // Handle race condition: another request created the same conversation
          if (error.code === 'ER_DUP_ENTRY') {
            conversation = await this.conversationsRepository.findOne({
              where: {
                listingId: dto.listingId,
                buyerId: senderId,
                sellerId,
              },
            });
          } else {
            throw error;
          }
        }
      }
    }

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const expectedReceiverId =
      senderId === conversation.sellerId
        ? conversation.buyerId
        : conversation.sellerId;

    if (dto.receiverId !== expectedReceiverId) {
      throw new BadRequestException('Invalid conversation participants');
    }

    const message = this.messagesRepository.create({
      conversationId: conversation.id,
      senderId,
      content: trimmedContent,
    });

    await this.messagesRepository.save(message);

    // Update last message timestamp
    await this.conversationsRepository.update(conversation.id, {
      lastMessageAt: new Date(),
    });

    return message;
  }

  async getConversations(userId: number) {
    const conversations = await this.conversationsRepository.find({
      where: [{ buyerId: userId }, { sellerId: userId }],
      relations: ['buyer', 'seller', 'listing', 'listing.images'],
      order: { lastMessageAt: 'DESC' },
    });

    // Get last message for each conversation
    const result = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await this.messagesRepository.findOne({
          where: { conversationId: conv.id },
          order: { createdAt: 'DESC' },
        });

        const unreadCount = await this.messagesRepository.count({
          where: {
            conversationId: conv.id,
            isRead: false,
            senderId: Not(userId),
          },
        });

        return {
          id: conv.id,
          listing: {
            id: conv.listing.id,
            title: conv.listing.title,
            image: conv.listing.images?.[0]?.imageUrl,
          },
          otherUser:
            conv.buyerId === userId
              ? {
                  id: conv.seller.id,
                  firstName: conv.seller.firstName,
                  lastName: conv.seller.lastName,
                  profileImage: conv.seller.profileImage,
                }
              : {
                  id: conv.buyer.id,
                  firstName: conv.buyer.firstName,
                  lastName: conv.buyer.lastName,
                  profileImage: conv.buyer.profileImage,
                },
          lastMessage: lastMessage?.content,
          lastMessageAt: conv.lastMessageAt,
          unreadCount,
        };
      }),
    );

    return result;
  }

  async getMessages(conversationId: number, userId: number) {
    const conversation = await this.conversationsRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
      throw new NotFoundException('Conversation not found');
    }

    // Mark messages from the OTHER user as read
    await this.messagesRepository.update(
      { conversationId, isRead: false, senderId: Not(userId) },
      { isRead: true },
    );

    const messages = await this.messagesRepository.find({
      where: { conversationId },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    });

    // Strip sensitive fields from sender
    return messages.map((msg) => ({
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      content: msg.content,
      isRead: msg.isRead,
      createdAt: msg.createdAt,
      sender: {
        id: msg.sender.id,
        firstName: msg.sender.firstName,
        lastName: msg.sender.lastName,
      },
    }));
  }
}
