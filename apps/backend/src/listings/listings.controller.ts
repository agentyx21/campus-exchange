import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { MarkSoldDto } from './dto/mark-sold.dto';
import { JwtAuthGuard } from '../auth/guards';

@Controller('listings')
export class ListingsController {
  constructor(private listingsService: ListingsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('categories')
  getCategories() {
    return this.listingsService.getCategories();
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-listings')
  myListings(@Request() req) {
    return this.listingsService.findByUser(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query('category') category?: number,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.listingsService.findAll({ category, search, type, page, limit });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/eligible-buyers')
  getEligibleBuyers(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.listingsService.getEligibleBuyers(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.listingsService.findOne(id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() createDto: CreateListingDto) {
    return this.listingsService.create(req.user.id, createDto);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() updateDto: UpdateListingDto,
  ) {
    return this.listingsService.update(id, req.user.id, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/mark-sold')
  markSold(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() dto: MarkSoldDto,
  ) {
    return this.listingsService.markSold(id, req.user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.listingsService.remove(id, req.user.id);
  }
}
