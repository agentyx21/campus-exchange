import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Report, Listing, User } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Report, Listing, User])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
