import { Controller, Get, Injectable, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  JobStatus,
  PublishStatus,
  ReportStatus,
  UserRole,
  VerificationStatus,
} from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AiRouterService } from '../../infra/ai/ai-router.service';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiRouterService: AiRouterService,
  ) {}

  async getSummary() {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      pendingInboxCount,
      staleContentCount,
      openReportCount,
      failedJobs24hCount,
      recentSources,
      monthlyAiUsage,
    ] = await Promise.all([
      this.prisma.content.count({
        where: {
          deletedAt: null,
          publishStatus: { in: [PublishStatus.DRAFT, PublishStatus.IN_REVIEW] },
        },
      }),
      this.prisma.content.count({
        where: {
          deletedAt: null,
          publishStatus: PublishStatus.PUBLISHED,
          verificationStatus: { in: [VerificationStatus.NEEDS_REVIEW, VerificationStatus.EXPIRED] },
        },
      }),
      this.prisma.contentReport.count({
        where: {
          status: { in: [ReportStatus.OPEN, ReportStatus.IN_PROGRESS] },
        },
      }),
      this.prisma.jobRun.count({
        where: {
          status: { in: [JobStatus.FAILED, JobStatus.DEAD_LETTER] },
          createdAt: { gte: yesterday },
        },
      }),
      this.prisma.source.findMany({
        where: { deletedAt: null },
        orderBy: { lastFetchedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          sourceType: true,
          isActive: true,
          lastFetchedAt: true,
          lastError: true,
        },
      }),
      this.aiRouterService.getMonthlyUsageSummary(),
    ]);

    return {
      pendingInboxCount,
      staleContentCount,
      openReportCount,
      failedJobs24hCount,
      recentSources,
      monthlyAiUsage,
    };
  }
}

@ApiTags('admin-dashboard')
@ApiBearerAuth()
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Get()
  @ApiOperation({ operationId: 'adminGetDashboard', summary: '관리자 운영 대시보드 요약' })
  getSummary() {
    return this.adminDashboardService.getSummary();
  }
}
