import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { BidsService } from './bids.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { JwtAuthGuard } from '../auth/guards';

@Controller('bids')
export class BidsController {
  constructor(private bidsService: BidsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() createDto: CreateBidDto) {
    return this.bidsService.create(req.user.id, createDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('listing/:listingId')
  findByListing(@Param('listingId', ParseIntPipe) listingId: number, @Request() req) {
    return this.bidsService.findByListing(listingId, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-bids')
  myBids(@Request() req) {
    return this.bidsService.findByUser(req.user.id);
  }
}
