import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../entities';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { EmailService } from '../email/email.service';
import { OTP_EXPIRY_MS, OTP_MAX_ATTEMPTS } from '../common/constants';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existing = await this.usersRepository.findOne({
      where: { email: registerDto.email },
    });

    // Same response for all branches to prevent user enumeration.
    const genericResponse = {
      message: 'OTP sent to your FAU email',
      email: registerDto.email,
    };

    if (existing) {
      // If the user never finished verification, re-issue a fresh OTP so they
      // can recover from a failed first email.
      if (!existing.isVerified) {
        const newOtp = crypto.randomInt(100000, 999999).toString();
        existing.otpCode = newOtp;
        existing.otpCreatedAt = new Date();
        existing.otpAttempts = 0;
        await this.usersRepository.save(existing);
        await this.emailService.sendOtp(existing.email, newOtp);
      }
      return genericResponse;
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);
    const otp = crypto.randomInt(100000, 999999).toString();

    const user = this.usersRepository.create({
      email: registerDto.email,
      passwordHash,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      isVerified: false,
      otpCode: otp,
      otpCreatedAt: new Date(),
      otpAttempts: 0,
    });

    await this.usersRepository.save(user);
    await this.emailService.sendOtp(registerDto.email, otp);

    return genericResponse;
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new ForbiddenException('Account pending email verification');
    }

    if (user.isBanned) {
      throw new ForbiddenException('Your account has been banned');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profileImage: user.profileImage,
      },
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.otpCode')
      .addSelect('user.otpCreatedAt')
      .addSelect('user.otpAttempts')
      .where('user.email = :email', { email: verifyOtpDto.email })
      .getOne();

    // Generic error — don't leak whether the email has an account.
    if (!user || !user.otpCode || !user.otpCreatedAt) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    // Check expiry first so a stale code doesn't count toward attempts.
    const ageMs = Date.now() - user.otpCreatedAt.getTime();
    if (ageMs > OTP_EXPIRY_MS) {
      // Clear the dead code so a later submission of the same digits can't
      // accidentally succeed after the clock rolls back or similar edge cases.
      user.otpCode = null;
      user.otpCreatedAt = null;
      user.otpAttempts = 0;
      await this.usersRepository.save(user);
      throw new BadRequestException(
        'Verification code has expired. Please register again to receive a new one.',
      );
    }

    if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
      user.otpCode = null;
      user.otpCreatedAt = null;
      user.otpAttempts = 0;
      await this.usersRepository.save(user);
      throw new BadRequestException(
        'Too many incorrect attempts. Please register again to receive a new code.',
      );
    }

    if (user.otpCode !== verifyOtpDto.otp) {
      user.otpAttempts += 1;
      await this.usersRepository.save(user);
      throw new BadRequestException('Invalid verification code');
    }

    user.isVerified = true;
    user.otpCode = null;
    user.otpCreatedAt = null;
    user.otpAttempts = 0;
    await this.usersRepository.save(user);

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profileImage: user.profileImage,
      },
    };
  }

  async getProfile(userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'profileImage',
        'bio',
        'role',
        'averageRating',
        'totalRatings',
        'createdAt',
      ],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
