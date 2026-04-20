import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Bid, Listing } from '../entities';
import { CreateBidDto } from './dto/create-bid.dto';

@Injectable()
export class BidsService {
  constructor(
    @InjectRepository(Bid)
    private bidsRepository: Repository<Bid>,
    @InjectRepository(Listing)
    private listingsRepository: Repository<Listing>,
    private dataSource: DataSource,
  ) {}

  async create(bidderId: number, createDto: CreateBidDto) {
    const listing = await this.listingsRepository.findOne({
      where: { id: createDto.listingId },
    });

    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.status !== 'active') {
      throw new BadRequestException('This listing is not available for bidding');
    }
    if (listing.listingType !== 'bidding') {
      throw new BadRequestException('This listing does not accept bids');
    }
    if (listing.sellerId === bidderId) {
      throw new BadRequestException('You cannot bid on your own listing');
    }
    if (listing.bidEndDate && new Date(listing.bidEndDate) < new Date()) {
      throw new BadRequestException('Bidding has ended for this listing');
    }

    // Use a transaction to prevent race conditions between concurrent bids
    return this.dataSource.transaction(async (manager) => {
      const highestBid = await manager.findOne(Bid, {
        where: { listingId: createDto.listingId, status: 'active' },
        order: { amount: 'DESC' },
        lock: { mode: 'pessimistic_write' },
      });

      const minAmount = highestBid
        ? Number(highestBid.amount)
        : Number(listing.price);
      if (createDto.amount <= minAmount) {
        throw new BadRequestException(
          `Bid must be higher than $${minAmount.toFixed(2)}`,
        );
      }

      // Mark previous active bids as outbid
      if (highestBid) {
        await manager.update(
          Bid,
          { listingId: createDto.listingId, status: 'active' },
          { status: 'outbid' },
        );
      }

      const bid = manager.create(Bid, {
        listingId: createDto.listingId,
        bidderId,
        amount: createDto.amount,
      });

      return manager.save(bid);
    });
  }

  async findByListing(listingId: number, viewer: { id: number; role: string }) {
    const listing = await this.listingsRepository.findOne({
      where: { id: listingId },
    });

    if (!listing) throw new NotFoundException('Listing not found');

    const canManageListing =
      viewer.role === 'admin' || viewer.id === listing.sellerId;

    if (
      (listing.status === 'hidden' || listing.status === 'deleted') &&
      !canManageListing
    ) {
      throw new NotFoundException('Listing not found');
    }

    const bids = await this.bidsRepository.find({
      where: { listingId },
      relations: ['bidder'],
      order: { amount: 'DESC' },
    });

    return bids.map((bid) => {
      const canSeeBidderIdentity =
        canManageListing || viewer.id === bid.bidderId;

      return {
        id: bid.id,
        amount: bid.amount,
        status: bid.status,
        createdAt: bid.createdAt,
        bidder: canSeeBidderIdentity
          ? {
              id: bid.bidder.id,
              firstName: bid.bidder.firstName,
              lastName: bid.bidder.lastName,
            }
          : {
              id: 0,
              firstName: 'Private',
              lastName: 'Bidder',
            },
      };
    });
  }

  async findByUser(userId: number) {
    return this.bidsRepository.find({
      where: { bidderId: userId },
      relations: ['listing', 'listing.images'],
      order: { createdAt: 'DESC' },
    });
  }
}
