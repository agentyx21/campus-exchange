import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Listing } from './listing.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'reviewer_id' })
  reviewerId: number;

  @Column({ name: 'reviewed_id' })
  reviewedId: number;

  @Column({ name: 'listing_id' })
  listingId: number;

  @Column({ type: 'tinyint' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User;

  @ManyToOne(() => User, (user) => user.reviews)
  @JoinColumn({ name: 'reviewed_id' })
  reviewed: User;

  @ManyToOne(() => Listing)
  @JoinColumn({ name: 'listing_id' })
  listing: Listing;
}
