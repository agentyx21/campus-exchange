import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, Listing } from '../entities';
import { CreateReportDto } from './dto/create-report.dto';
import { AUTO_HIDE_REPORT_THRESHOLD, REPORT_ACCOUNT_AGE_MS } from '../common/constants';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private reportsRepository: Repository<Report>,
    @InjectRepository(Listing)
    private listingsRepository: Repository<Listing>,
  ) {}

  async create(reporterId: number, dto: CreateReportDto) {
    // Prevent duplicate reports from same user
    const existing = await this.reportsRepository.findOne({
      where: { reporterId, listingId: dto.listingId },
    });
    if (existing) {
      throw new BadRequestException('You have already reported this listing');
    }

    // Prevent reporting own listing
    const listing = await this.listingsRepository.findOne({
      where: { id: dto.listingId },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.sellerId === reporterId) {
      throw new BadRequestException('You cannot report your own listing');
    }

    const report = this.reportsRepository.create({
      reporterId,
      listingId: dto.listingId,
      reason: dto.reason,
      description: dto.description,
    });

    await this.reportsRepository.save(report);

    // Auto-hide listing if it gets 5+ reports from different users.
    // Only count reports from accounts older than 24 hours to reduce mass-report attacks.
    const reportCount = await this.reportsRepository
      .createQueryBuilder('report')
      .innerJoin('report.reporter', 'reporter')
      .where('report.listingId = :listingId', { listingId: dto.listingId })
      .andWhere('report.status = :status', { status: 'pending' })
      .andWhere('reporter.createdAt < :cutoff', {
        cutoff: new Date(Date.now() - REPORT_ACCOUNT_AGE_MS),
      })
      .getCount();
    if (reportCount >= AUTO_HIDE_REPORT_THRESHOLD) {
      await this.listingsRepository.update(dto.listingId, {
        status: 'hidden',
      });
    }

    return { message: 'Report submitted successfully' };
  }

  // Admin endpoints
  async findPending() {
    const reports = await this.reportsRepository.find({
      where: { status: 'pending' },
      relations: ['reporter', 'listing', 'listing.seller'],
      order: { createdAt: 'ASC' },
    });

    // Strip sensitive fields
    return reports.map((r) => ({
      id: r.id,
      reason: r.reason,
      description: r.description,
      status: r.status,
      createdAt: r.createdAt,
      reporter: {
        id: r.reporter.id,
        firstName: r.reporter.firstName,
        lastName: r.reporter.lastName,
      },
      listing: {
        id: r.listing.id,
        title: r.listing.title,
        seller: r.listing.seller
          ? {
              id: r.listing.seller.id,
              firstName: r.listing.seller.firstName,
              lastName: r.listing.seller.lastName,
            }
          : null,
      },
    }));
  }

  async reviewReport(
    reportId: number,
    adminId: number,
    action: 'reviewed' | 'dismissed',
  ) {
    if (!['reviewed', 'dismissed'].includes(action)) {
      throw new BadRequestException('Invalid action');
    }

    const report = await this.reportsRepository.findOne({
      where: { id: reportId },
    });
    if (!report) throw new NotFoundException('Report not found');
    if (report.status !== 'pending') {
      throw new BadRequestException('Report has already been processed');
    }

    if (action === 'reviewed') {
      await this.reportsRepository.update(
        { listingId: report.listingId, status: 'pending' },
        { status: 'reviewed', reviewedBy: adminId },
      );
      await this.listingsRepository.update(report.listingId, {
        status: 'admin_removed',
      });

      return { message: 'Listing removed and report reviewed' };
    }

    report.status = action;
    report.reviewedBy = adminId;
    await this.reportsRepository.save(report);

    // If dismissed, un-hide the listing only if it's currently hidden and no other pending reports
    if (action === 'dismissed') {
      const otherPending = await this.reportsRepository.count({
        where: { listingId: report.listingId, status: 'pending' },
      });
      if (otherPending === 0) {
        const listing = await this.listingsRepository.findOne({
          where: { id: report.listingId },
        });
        if (listing && listing.status === 'hidden') {
          await this.listingsRepository.update(report.listingId, { status: 'active' });
        }
      }
    }

    return { message: `Report ${action}` };
  }
}
