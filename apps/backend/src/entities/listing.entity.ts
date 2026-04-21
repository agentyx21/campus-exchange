import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Category } from './category.entity';
import { ListingImage } from './listing-image.entity';
import { Bid } from './bid.entity';

@Entity('listings')
export class Listing {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'seller_id' })
  sellerId: number;

  @Column({ name: 'category_id' })
  categoryId: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({
    name: 'listing_type',
    type: 'enum',
    enum: ['fixed', 'bidding'],
    default: 'fixed',
  })
  listingType: 'fixed' | 'bidding';

  @Column({
    name: 'condition_status',
    type: 'enum',
    enum: ['new', 'like_new', 'good', 'fair', 'poor'],
    default: 'good',
  })
  conditionStatus: 'new' | 'like_new' | 'good' | 'fair' | 'poor';

  @Column({
    type: 'enum',
    enum: ['active', 'sold', 'hidden', 'deleted', 'admin_removed'],
    default: 'active',
  })
  status: 'active' | 'sold' | 'hidden' | 'deleted' | 'admin_removed';

  @Column({ name: 'sold_to_buyer_id', nullable: true })
  soldToBuyerId: number | null;

  @Column({ name: 'bid_end_date', nullable: true })
  bidEndDate: Date;

  @Column({ name: 'views_count', default: 0 })
  viewsCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.listings)
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @ManyToOne(() => Category, (category) => category.listings)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'sold_to_buyer_id' })
  soldToBuyer: User | null;

  @OneToMany(() => ListingImage, (image) => image.listing)
  images: ListingImage[];

  @OneToMany(() => Bid, (bid) => bid.listing)
  bids: Bid[];
}
