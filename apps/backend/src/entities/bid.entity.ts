import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Listing } from './listing.entity';
import { User } from './user.entity';

@Entity('bids')
export class Bid {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'listing_id' })
  listingId: number;

  @Column({ name: 'bidder_id' })
  bidderId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: ['active', 'outbid', 'won', 'cancelled'],
    default: 'active',
  })
  status: 'active' | 'outbid' | 'won' | 'cancelled';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Listing, (listing) => listing.bids)
  @JoinColumn({ name: 'listing_id' })
  listing: Listing;

  @ManyToOne(() => User, (user) => user.bids)
  @JoinColumn({ name: 'bidder_id' })
  bidder: User;
}
