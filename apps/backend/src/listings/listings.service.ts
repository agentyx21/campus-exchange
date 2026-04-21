import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Listing, ListingImage, Category, Conversation, Message, Bid } from '../entities';
import { CreateListingDto } from './dto/create-listing.dto';
import {
  DEFAULT_PAGE_LIMIT,
  MIN_REVIEW_MESSAGE_THRESHOLD,
} from '../common/constants';
import { UpdateListingDto } from './dto/update-listing.dto';
import { MarkSoldDto } from './dto/mark-sold.dto';

type ListingViewer = {
  id: number;
  role: string;
};

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(Listing)
    private listingsRepository: Repository<Listing>,
    @InjectRepository(ListingImage)
    private imagesRepository: Repository<ListingImage>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    @InjectRepository(Conversation)
    private conversationsRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    @InjectRepository(Bid)
    private bidsRepository: Repository<Bid>,
    private dataSource: DataSource,
  ) {}

  async create(sellerId: number, createDto: CreateListingDto) {
    // Validate category exists
    const category = await this.categoriesRepository.findOne({
      where: { id: createDto.categoryId },
    });
    if (!category) {
      throw new BadRequestException('Invalid category');
    }

    // Bidding listings must have an end date. Without one, an auction would
    // never close and the highest bidder would never be locked in.
    if (createDto.listingType === 'bidding' && !createDto.bidEndDate) {
      throw new BadRequestException('Bidding listings require an end date');
    }

    // Validate bid end date is in the future
    if (createDto.bidEndDate && new Date(createDto.bidEndDate) <= new Date()) {
      throw new BadRequestException('Bid end date must be in the future');
    }

    const listing = new Listing();
    listing.sellerId = sellerId;
    listing.title = createDto.title;
    listing.description = createDto.description;
    listing.price = createDto.price;
    listing.categoryId = createDto.categoryId;
    listing.listingType = createDto.listingType || 'fixed';
    listing.conditionStatus = createDto.conditionStatus || 'good';
    if (createDto.bidEndDate) {
      listing.bidEndDate = new Date(createDto.bidEndDate);
    }

    const saved = await this.listingsRepository.save(listing);

    if (createDto.imageUrls?.length) {
      const images = createDto.imageUrls.map((url, index) =>
        this.imagesRepository.create({
          listingId: saved.id,
          imageUrl: url,
          isPrimary: index === 0,
          sortOrder: index,
        }),
      );
      await this.imagesRepository.save(images);
    }

    return this.findOne(saved.id);
  }

  async findAll(query: {
    category?: number;
    search?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) {
    const qb = this.listingsRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.images', 'images')
      .leftJoinAndSelect('listing.category', 'category')
      .leftJoin('listing.seller', 'seller')
      .addSelect(['seller.id', 'seller.firstName', 'seller.lastName', 'seller.averageRating', 'seller.profileImage'])
      .where('listing.status = :status', { status: 'active' })
      .orderBy('listing.createdAt', 'DESC');

    if (query.category) {
      qb.andWhere('listing.categoryId = :categoryId', {
        categoryId: query.category,
      });
    }

    if (query.search) {
      qb.andWhere(
        '(listing.title LIKE :search OR listing.description LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.type) {
      qb.andWhere('listing.listingType = :type', { type: query.type });
    }

    const page = Math.max(query.page || 1, 1);
    const limit = Math.min(Math.max(query.limit || DEFAULT_PAGE_LIMIT, 1), 100);
    qb.skip((page - 1) * limit).take(limit);

    const [listings, total] = await qb.getManyAndCount();

    return {
      data: listings.map((l) => ({
        ...l,
        seller: l.seller
          ? {
              id: l.seller.id,
              firstName: l.seller.firstName,
              lastName: l.seller.lastName,
              averageRating: l.seller.averageRating,
            }
          : null,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number, viewer?: ListingViewer) {
    const listing = await this.listingsRepository.findOne({
      where: { id },
      relations: ['images', 'category', 'seller', 'soldToBuyer', 'bids', 'bids.bidder'],
    });
    if (!listing) throw new NotFoundException('Listing not found');

    const canManageListing =
      viewer?.role === 'admin' || viewer?.id === listing.sellerId;

    if (
      (listing.status === 'hidden' || listing.status === 'deleted' || listing.status === 'admin_removed') &&
      !canManageListing
    ) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.status === 'active') {
      await this.listingsRepository.increment({ id }, 'viewsCount', 1);
      listing.viewsCount += 1;
    }

    return {
      ...listing,
      seller: {
        id: listing.seller.id,
        firstName: listing.seller.firstName,
        lastName: listing.seller.lastName,
        averageRating: listing.seller.averageRating,
        totalRatings: listing.seller.totalRatings,
        profileImage: listing.seller.profileImage,
        isBanned: listing.seller.isBanned,
      },
      soldToBuyer: listing.soldToBuyer
        ? {
            id: listing.soldToBuyer.id,
            firstName: listing.soldToBuyer.firstName,
            lastName: listing.soldToBuyer.lastName,
            profileImage: listing.soldToBuyer.profileImage,
          }
        : null,
      bids: listing.bids
        ?.sort((a, b) => Number(b.amount) - Number(a.amount))
        .map((b) => {
          const canSeeBidderIdentity =
            canManageListing || viewer?.id === b.bidder.id;

          return {
            id: b.id,
            amount: b.amount,
            status: b.status,
            createdAt: b.createdAt,
            bidder: canSeeBidderIdentity
              ? {
                  id: b.bidder.id,
                  firstName: b.bidder.firstName,
                  lastName: b.bidder.lastName,
                }
              : {
                  id: 0,
                  firstName: 'Private',
                  lastName: 'Bidder',
                },
          };
        }),
    };
  }

  async update(id: number, userId: number, updateDto: UpdateListingDto) {
    const listing = await this.listingsRepository.findOne({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.sellerId !== userId) {
      throw new ForbiddenException('You can only edit your own listings');
    }
    if (listing.status !== 'active') {
      throw new ForbiddenException('Only active listings can be edited');
    }

    // Validate category if being changed
    if (updateDto.categoryId !== undefined) {
      const category = await this.categoriesRepository.findOne({
        where: { id: updateDto.categoryId },
      });
      if (!category) {
        throw new BadRequestException('Invalid category');
      }
    }

    // Only update fields that are explicitly provided (not undefined)
    const updateData: Record<string, any> = {};
    if (updateDto.title !== undefined) updateData.title = updateDto.title;
    if (updateDto.description !== undefined) updateData.description = updateDto.description;
    if (updateDto.price !== undefined) updateData.price = updateDto.price;
    if (updateDto.categoryId !== undefined) updateData.categoryId = updateDto.categoryId;
    if (updateDto.conditionStatus !== undefined) updateData.conditionStatus = updateDto.conditionStatus;

    // Field updates + image replacement in one transaction.
    await this.dataSource.transaction(async (manager) => {
      if (Object.keys(updateData).length > 0) {
        await manager.update(Listing, id, updateData);
      }

      // `imageUrls` present (even []) replaces images; absent means leave them.
      if (updateDto.imageUrls !== undefined) {
        await manager.delete(ListingImage, { listingId: id });

        if (updateDto.imageUrls.length > 0) {
          const rows = updateDto.imageUrls.map((url, index) => ({
            listingId: id,
            imageUrl: url,
            isPrimary: index === 0,
            sortOrder: index,
          }));
          await manager.insert(ListingImage, rows);
        }
      }
    });

    return this.findOne(id);
  }

  async getEligibleBuyers(listingId: number, userId: number) {
    const listing = await this.listingsRepository.findOne({ where: { id: listingId } });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
    if (listing.sellerId !== userId) {
      throw new ForbiddenException('You can only manage your own listings');
    }

    const conversations = await this.conversationsRepository.find({
      where: {
        listingId,
        sellerId: userId,
      },
      relations: ['buyer'],
      order: { lastMessageAt: 'DESC' },
    });

    const eligibleBuyers = await Promise.all(
      conversations.map(async (conversation) => {
        const messageCount = await this.messagesRepository.count({
          where: { conversationId: conversation.id },
        });

        return {
          conversationId: conversation.id,
          buyerId: conversation.buyerId,
          firstName: conversation.buyer.firstName,
          lastName: conversation.buyer.lastName,
          profileImage: conversation.buyer.profileImage,
          lastMessageAt: conversation.lastMessageAt,
          messageCount,
          reviewUnlocked: messageCount >= MIN_REVIEW_MESSAGE_THRESHOLD,
        };
      }),
    );

    return eligibleBuyers;
  }

  async markSold(id: number, viewer: ListingViewer, dto: MarkSoldDto) {
    const listing = await this.listingsRepository.findOne({ where: { id } });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
    if (listing.sellerId !== viewer.id) {
      throw new ForbiddenException('You can only manage your own listings');
    }
    if (listing.status !== 'active') {
      throw new BadRequestException('Only active listings can be marked as sold');
    }

    const eligibleBuyers = await this.getEligibleBuyers(id, viewer.id);
    const selectedBuyer = eligibleBuyers.find((buyer) => buyer.buyerId === dto.buyerId);

    if (!selectedBuyer) {
      throw new BadRequestException(
        'Buyer must be selected from users who messaged you about this listing',
      );
    }

    await this.listingsRepository.update(id, {
      status: 'sold',
      soldToBuyerId: dto.buyerId,
    });

    return this.findOne(id, viewer);
  }

  async remove(id: number, userId: number) {
    const listing = await this.listingsRepository.findOne({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.sellerId !== userId) {
      throw new ForbiddenException('You can only delete your own listings');
    }
    if (listing.status === 'deleted' || listing.status === 'admin_removed') {
      throw new BadRequestException('This listing is already deleted');
    }

    await this.listingsRepository.update(id, { status: 'deleted' });
    return { message: 'Listing deleted' };
  }

  async adminRemoveListing(id: number) {
    const listing = await this.listingsRepository.findOne({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.status === 'admin_removed') {
      throw new BadRequestException('This listing has already been removed');
    }

    await this.listingsRepository.update(id, { status: 'admin_removed' });
    return { message: 'Listing removed by admin' };
  }

  async endAuction(listingId: number, sellerId: number) {
    const listing = await this.listingsRepository.findOne({
      where: { id: listingId },
      relations: ['seller'],
    });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.sellerId !== sellerId) {
      throw new ForbiddenException('You can only manage your own listings');
    }
    if (listing.listingType !== 'bidding') {
      throw new BadRequestException('This is not a bidding listing');
    }
    if (listing.status !== 'active') {
      throw new BadRequestException('Only active listings can end their auction early');
    }
    if (listing.bidEndDate && new Date(listing.bidEndDate) < new Date()) {
      throw new BadRequestException('Auction has already ended');
    }

    // Close the auction immediately
    await this.listingsRepository.update(listingId, { bidEndDate: new Date() });

    // Find the highest active bid to notify the winner
    const highestBid = await this.bidsRepository.findOne({
      where: { listingId, status: 'active' },
      order: { amount: 'DESC' },
      relations: ['bidder'],
    });

    if (highestBid) {
      // Get or create the conversation between seller and winning bidder
      let conversation = await this.conversationsRepository.findOne({
        where: { listingId, buyerId: highestBid.bidderId, sellerId },
      });

      if (!conversation) {
        try {
          conversation = this.conversationsRepository.create({
            listingId,
            buyerId: highestBid.bidderId,
            sellerId,
            lastMessageAt: new Date(),
          });
          conversation = await this.conversationsRepository.save(conversation);
        } catch (error: any) {
          if (error.code === 'ER_DUP_ENTRY') {
            conversation = await this.conversationsRepository.findOne({
              where: { listingId, buyerId: highestBid.bidderId, sellerId },
            });
          } else {
            throw error;
          }
        }
      }

      if (conversation) {
        const congratsMessage = `Congratulations! Your bid of $${Number(highestBid.amount).toFixed(2)} on "${listing.title}" was the winning bid. I'd love to arrange a handoff — please reply with a time and place that works for you.`;

        await this.messagesRepository.save(
          this.messagesRepository.create({
            conversationId: conversation.id,
            senderId: sellerId,
            content: congratsMessage,
          }),
        );

        await this.conversationsRepository.update(conversation.id, {
          lastMessageAt: new Date(),
        });
      }
    }

    return this.findOne(listingId, { id: sellerId, role: 'student' });
  }

  async findByUser(userId: number) {
    return this.listingsRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.images', 'images')
      .leftJoinAndSelect('listing.category', 'category')
      .where('listing.sellerId = :userId', { userId })
      .orderBy('listing.createdAt', 'DESC')
      .getMany();
  }

  async getCategories() {
    return this.categoriesRepository.find({ order: { name: 'ASC' } });
  }
}
