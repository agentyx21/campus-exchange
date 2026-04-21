import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

  async banUser(userId: number) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'admin') throw new BadRequestException('Cannot ban an admin account');
    await this.usersRepository.update(userId, { isBanned: true });
    return { message: 'User banned successfully' };
  }

  async unbanUser(userId: number) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    await this.usersRepository.update(userId, { isBanned: false });
    return { message: 'User unbanned successfully' };
  }
}
