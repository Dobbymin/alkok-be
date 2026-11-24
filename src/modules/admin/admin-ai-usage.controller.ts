import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { buildPaginationMeta, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AiRouterService } from '../../infra/ai/ai-router.service';
import { PrismaService } from '../../infra/prisma/prisma.service';

@ApiTags('admin-ai-usage')
@ApiBearerAuth()
@Controller('admin/ai-usage')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminAiUsageController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiRouterService: AiRouterService,
  ) {}

  @Get()
  @ApiOperation({ operationId: 'adminListAiUsage', summary: '내부 AI 토큰·비용 이력 조회' })
  async list(@Query() query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [items, total, summary] = await Promise.all([
      this.prisma.aiUsageLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.aiUsageLog.count(),
      this.aiRouterService.getMonthlyUsageSummary(),
    ]);

    return {
      data: {
        summary,
        logs: items.map((i) => ({
          ...i,
          estimatedCostUsd: Number(i.estimatedCostUsd),
        })),
      },
      meta: buildPaginationMeta(page, limit, total),
    };
  }
}
