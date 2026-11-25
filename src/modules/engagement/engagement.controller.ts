import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { SubmitReportDto } from './engagement.dto';
import { EngagementService } from './engagement.service';

@ApiTags('engagement')
@Controller('contents')
export class EngagementController {
  constructor(private readonly engagementService: EngagementService) {}

  @Post(':id/helpful')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'markContentHelpful', summary: '콘텐츠 도움됨 등록' })
  markHelpful(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.engagementService.markHelpful(user.id, id);
  }

  @Delete(':id/helpful')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'unmarkContentHelpful', summary: '콘텐츠 도움됨 취소' })
  unmarkHelpful(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.engagementService.unmarkHelpful(user.id, id);
  }

  @Post(':id/reports')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ operationId: 'submitContentReport', summary: '정보 오류/최신화 제보' })
  submitReport(
    @Param('id') id: string,
    @Body() dto: SubmitReportDto,
    @Req() req: Request,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.engagementService.submitReport(id, dto, {
      ip: req.ip || 'unknown',
      userId: user?.id,
    });
  }
}
