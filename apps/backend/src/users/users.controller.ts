import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  updateProfile(@Request() req, @Body() updateDto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, updateDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put(':id/ban')
  banUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.banUser(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put(':id/unban')
  unbanUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.unbanUser(id);
  }
}
