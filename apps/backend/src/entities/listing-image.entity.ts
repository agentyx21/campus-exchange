import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Listing } from './listing.entity';

@Entity('listing_images')
export class ListingImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'listing_id' })
  listingId: number;

  // Stored as either a public URL or a `data:image/...;base64,...` data URI.
  // MEDIUMTEXT (up to 16 MB) accommodates inline base64 uploads.
  @Column({ name: 'image_url', type: 'mediumtext' })
  imageUrl: string;

  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Listing, (listing) => listing.images)
  @JoinColumn({ name: 'listing_id' })
  listing: Listing;
}
