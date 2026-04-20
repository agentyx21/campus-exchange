import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/roles.decorator';

@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  // Limit reports: 10 per minute per IP
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() dto: CreateReportDto) {
    return this.reportsService.create(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('pending')
  findPending() {
    return this.reportsService.findPending();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put(':id/:action')
  reviewReport(
    @Param('id', ParseIntPipe) id: number,
    @Param('action') action: 'reviewed' | 'dismissed',
    @Request() req,
  ) {
    return this.reportsService.reviewReport(id, req.user.id, action);
  }
}
