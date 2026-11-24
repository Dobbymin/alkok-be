import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsUrl } from 'class-validator';
import { buildPaginationMeta, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { RssFetcherService } from './rss-fetcher.service';

export class ManualUrlDto {
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  url!: string;
}

@ApiTags('admin-ingestion')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminJobsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rssFetcherService: RssFetcherService,
  ) {}

  @Post('inbox/manual-url')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    operationId: 'adminManualUrl',
    summary: '관리자 URL 수동 투입 및 AI 초안 Job 생성',
  })
  manualUrl(@Body() dto: ManualUrlDto) {
    return this.rssFetcherService.ingestManualUrl(dto.url);
  }

  @Get('jobs')
  @ApiOperation({ operationId: 'adminListJobs', summary: '비동기 JobRun 이력 조회' })
  async listJobs(@Query() query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.jobRun.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.jobRun.count(),
    ]);

    return {
      data: items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }
}
