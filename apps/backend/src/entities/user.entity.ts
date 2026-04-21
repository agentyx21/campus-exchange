import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Listing } from './listing.entity';
import { Review } from './review.entity';
import { Bid } from './bid.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ name: 'profile_image', nullable: true })
  profileImage: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'enum', enum: ['student', 'admin'], default: 'student' })
  role: 'student' | 'admin';

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'verification_token', nullable: true })
  verificationToken: string;

  @Column({ name: 'otp_code', type: 'varchar', nullable: true, select: false })
  otpCode: string | null;

  @Column({ name: 'otp_created_at', type: 'datetime', nullable: true, select: false })
  otpCreatedAt: Date | null;

  @Column({ name: 'otp_attempts', type: 'int', default: 0, select: false })
  otpAttempts: number;

  @Column({ name: 'is_banned', default: false })
  isBanned: boolean;

  @Column({
    name: 'average_rating',
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 0,
  })
  averageRating: number;

  @Column({ name: 'total_ratings', default: 0 })
  totalRatings: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Listing, (listing) => listing.seller)
  listings: Listing[];

  @OneToMany(() => Review, (review) => review.reviewed)
  reviews: Review[];

  @OneToMany(() => Bid, (bid) => bid.bidder)
  bids: Bid[];
}
