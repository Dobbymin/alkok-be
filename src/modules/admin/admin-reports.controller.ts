import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Injectable,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReportStatus, UserRole } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { buildPaginationMeta, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { AppException } from '../../common/exceptions/app.exception';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PrismaService } from '../../infra/prisma/prisma.service';

export class AdminReportsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;
}

export class UpdateReportStatusDto {
  @IsEnum(ReportStatus)
  status!: ReportStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  resolutionMemo?: string;
}

@Injectable()
export class AdminReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: AdminReportsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = query.status ? { status: query.status } : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.contentReport.findMany({
        where,
        include: {
          content: { select: { title: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.contentReport.count({ where }),
    ]);

    return {
      data: items.map((r) => ({
        id: r.id,
        contentId: r.contentId,
        contentTitle: r.content?.title ?? null,
        contentSlug: r.content?.slug ?? null,
        reason: r.reason,
        detail: r.detail,
        reporterEmail: r.reporterEmail,
        status: r.status,
        resolutionMemo: r.resolutionMemo,
        createdAt: r.createdAt.toISOString(),
        resolvedAt: r.resolvedAt?.toISOString() ?? null,
      })),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async updateStatus(id: string, dto: UpdateReportStatusDto, adminUserId: string) {
    const existing = await this.prisma.contentReport.findUnique({ where: { id } });
    if (!existing) {
      throw new AppException(HttpStatus.NOT_FOUND, 'NOT_FOUND', '제보를 찾을 수 없습니다.');
    }

    const isResolved =
      dto.status === ReportStatus.RESOLVED || dto.status === ReportStatus.DISMISSED;

    const updated = await this.prisma.contentReport.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.resolutionMemo !== undefined ? { resolutionMemo: dto.resolutionMemo } : {}),
        ...(isResolved ? { resolvedBy: adminUserId, resolvedAt: new Date() } : {}),
      },
      include: {
        content: { select: { title: true, slug: true } },
      },
    });

    return {
      id: updated.id,
      contentId: updated.contentId,
      contentTitle: updated.content?.title ?? null,
      contentSlug: updated.content?.slug ?? null,
      reason: updated.reason,
      detail: updated.detail,
      reporterEmail: updated.reporterEmail,
      status: updated.status,
      resolutionMemo: updated.resolutionMemo,
      createdAt: updated.createdAt.toISOString(),
      resolvedAt: updated.resolvedAt?.toISOString() ?? null,
    };
  }
}

@ApiTags('admin-reports')
@ApiBearerAuth()
@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminReportsController {
  constructor(private readonly adminReportsService: AdminReportsService) {}

  @Get()
  @ApiOperation({ operationId: 'adminListReports', summary: '오류 제보 목록 조회' })
  list(@Query() query: AdminReportsQueryDto) {
    return this.adminReportsService.list(query);
  }

  @Patch(':id')
  @ApiOperation({ operationId: 'adminUpdateReport', summary: '오류 제보 상태 처리' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateReportStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.adminReportsService.updateStatus(id, dto, user.id);
  }
}
