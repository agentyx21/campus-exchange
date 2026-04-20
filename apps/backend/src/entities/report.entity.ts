import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Listing } from './listing.entity';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'reporter_id' })
  reporterId: number;

  @Column({ name: 'listing_id' })
  listingId: number;

  @Column({
    type: 'enum',
    enum: ['inappropriate', 'spam', 'scam', 'prohibited_item', 'other'],
  })
  reason: 'inappropriate' | 'spam' | 'scam' | 'prohibited_item' | 'other';

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'reviewed', 'dismissed'],
    default: 'pending',
  })
  status: 'pending' | 'reviewed' | 'dismissed';

  @Column({ name: 'reviewed_by', nullable: true })
  reviewedBy: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @ManyToOne(() => Listing)
  @JoinColumn({ name: 'listing_id' })
  listing: Listing;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewed_by' })
  reviewedByUser: User;
}
