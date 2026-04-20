import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Review, User, Conversation, Message, Listing } from '../entities';
import { CreateReviewDto } from './dto/create-review.dto';
import { MIN_REVIEW_MESSAGE_THRESHOLD } from '../common/constants';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Conversation)
    private conversationsRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    @InjectRepository(Listing)
    private listingsRepository: Repository<Listing>,
    private dataSource: DataSource,
  ) {}

  async getEligibility(listingId: number, reviewerId: number) {
    const listing = await this.listingsRepository.findOne({
      where: { id: listingId },
      relations: ['seller', 'soldToBuyer'],
    });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.status !== 'sold' || !listing.soldToBuyerId || !listing.soldToBuyer) {
      return {
        canReview: false,
        reason: 'Reviews unlock only after the listing is marked as sold',
        minimumMessages: MIN_REVIEW_MESSAGE_THRESHOLD,
      };
    }

    let reviewedId: number | null = null;
    let reviewedUser: User | null = null;

    if (reviewerId === listing.sellerId) {
      reviewedId = listing.soldToBuyerId;
      reviewedUser = listing.soldToBuyer;
    } else if (reviewerId === listing.soldToBuyerId) {
      reviewedId = listing.sellerId;
      reviewedUser = listing.seller;
    } else {
      return {
        canReview: false,
        reason: 'Only the seller and selected buyer can review this transaction',
        minimumMessages: MIN_REVIEW_MESSAGE_THRESHOLD,
      };
    }

    if (!reviewedId || !reviewedUser) {
      return {
        canReview: false,
        reason: 'Review participant could not be resolved',
        minimumMessages: MIN_REVIEW_MESSAGE_THRESHOLD,
      };
    }

    const conversation = await this.conversationsRepository.findOne({
      where: {
        listingId,
        buyerId: listing.soldToBuyerId,
        sellerId: listing.sellerId,
      },
    });

    if (!conversation) {
      return {
        canReview: false,
        reason: 'Reviews require a conversation between the seller and buyer',
        minimumMessages: MIN_REVIEW_MESSAGE_THRESHOLD,
        reviewedId,
      };
    }

    const messageCount = await this.messagesRepository.count({
      where: { conversationId: conversation.id },
    });

    if (messageCount < MIN_REVIEW_MESSAGE_THRESHOLD) {
      return {
        canReview: false,
        reason: `At least ${MIN_REVIEW_MESSAGE_THRESHOLD} messages are required before reviewing`,
        minimumMessages: MIN_REVIEW_MESSAGE_THRESHOLD,
        messageCount,
        reviewedId,
        reviewedUser: {
          id: reviewedUser.id,
          firstName: reviewedUser.firstName,
          lastName: reviewedUser.lastName,
        },
      };
    }

    const existing = await this.reviewsRepository.findOne({
      where: { reviewerId, listingId },
    });

    return {
      canReview: !existing,
      reason: existing ? 'You have already reviewed this transaction' : null,
      minimumMessages: MIN_REVIEW_MESSAGE_THRESHOLD,
      messageCount,
      reviewedId,
      reviewedUser: {
        id: reviewedUser.id,
        firstName: reviewedUser.firstName,
        lastName: reviewedUser.lastName,
      },
    };
  }

  async create(reviewerId: number, dto: CreateReviewDto) {
    const eligibility = await this.getEligibility(dto.listingId, reviewerId);

    if (!eligibility.canReview) {
      throw new BadRequestException(eligibility.reason || 'Review is not available');
    }

    if (dto.reviewedId !== eligibility.reviewedId) {
      throw new BadRequestException('You can only review the matched transaction participant');
    }

    // Use transaction to ensure review and rating update are atomic
    return this.dataSource.transaction(async (manager) => {
      const review = manager.create(Review, {
        reviewerId,
        reviewedId: dto.reviewedId,
        listingId: dto.listingId,
        rating: dto.rating,
        comment: dto.comment,
      });

      await manager.save(review);

      // Update user's average rating
      const { avg, count } = await manager
        .createQueryBuilder(Review, 'review')
        .select('AVG(review.rating)', 'avg')
        .addSelect('COUNT(*)', 'count')
        .where('review.reviewedId = :id', { id: dto.reviewedId })
        .getRawOne();

      await manager.update(User, dto.reviewedId, {
        averageRating: parseFloat(avg) || 0,
        totalRatings: parseInt(count) || 0,
      });

      return review;
    });
  }

  async findByUser(userId: number) {
    const reviews = await this.reviewsRepository.find({
      where: { reviewedId: userId },
      relations: ['reviewer'],
      order: { createdAt: 'DESC' },
    });

    return reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      reviewer: {
        id: review.reviewer.id,
        firstName: review.reviewer.firstName,
        lastName: review.reviewer.lastName,
      },
    }));
  }
}
