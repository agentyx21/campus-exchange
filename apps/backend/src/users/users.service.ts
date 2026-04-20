import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findById(id: number) {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: [
        'id',
        'firstName',
        'lastName',
        'profileImage',
        'bio',
        'averageRating',
        'totalRatings',
        'createdAt',
      ],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: number, updateDto: UpdateProfileDto) {
    await this.usersRepository.update(userId, updateDto);
    return this.findById(userId);
  }
}
