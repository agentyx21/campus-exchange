import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThan, Repository } from 'typeorm';
import { Bid, Listing } from '../entities';

/**
 * Every minute, flip expired bidding listings to `sold` and mark the
 * highest bid as `won`. Listings with no bids are left alone.
 */
@Injectable()
export class AuctionsScheduler {
  private readonly logger = new Logger(AuctionsScheduler.name);

  constructor(
    @InjectRepository(Listing)
    private listingsRepository: Repository<Listing>,
    // Bid operations all happen inside the transaction below via
    // manager.findOne(Bid, ...), so no Bid repository is injected here.
    private dataSource: DataSource,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async closeExpiredAuctions() {
    const now = new Date();

    const expired = await this.listingsRepository.find({
      where: {
        status: 'active',
        listingType: 'bidding',
        bidEndDate: LessThan(now),
      },
    });

    if (expired.length === 0) return;

    for (const listing of expired) {
      try {
        await this.dataSource.transaction(async (manager) => {
          const winningBid = await manager.findOne(Bid, {
            where: { listingId: listing.id, status: 'active' },
            order: { amount: 'DESC' },
          });

          if (!winningBid) {
            // No bids at all — leave the listing alone. The seller can
            // decide to mark it sold manually or delete it.
            return;
          }

          await manager.update(Bid, winningBid.id, { status: 'won' });
          await manager.update(Listing, listing.id, {
            status: 'sold',
            soldToBuyerId: winningBid.bidderId,
          });

          this.logger.log(
            `Auction ${listing.id} closed — winning bidder ${winningBid.bidderId} at $${winningBid.amount}`,
          );
        });
      } catch (err) {
        this.logger.error(`Failed to close auction ${listing.id}`, err as Error);
      }
    }
  }
}
