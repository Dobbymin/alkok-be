import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ApproveInboxDto, RejectInboxDto } from './admin-inbox.dto';
import { AdminInboxService } from './admin-inbox.service';

@ApiTags('admin-inbox')
@ApiBearerAuth()
@Controller('admin/inbox')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminInboxController {
  constructor(private readonly adminInboxService: AdminInboxService) {}

  @Get()
  @ApiOperation({ operationId: 'adminListInbox', summary: '검수 대기(DRAFT/IN_REVIEW) 목록' })
  list() {
    return this.adminInboxService.list();
  }

  @Get(':id')
  @ApiOperation({ operationId: 'adminGetInboxDetail', summary: '원문+초안 2단 검수 상세' })
  getDetail(@Param('id') id: string) {
    return this.adminInboxService.getDetail(id);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'adminApproveInbox', summary: '초안 수정 반영 및 원클릭 공개' })
  approve(@Param('id') id: string, @Body() dto: ApproveInboxDto) {
    return this.adminInboxService.approve(id, dto);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'adminRejectInbox', summary: '초안 반려 처리' })
  reject(@Param('id') id: string, @Body() dto: RejectInboxDto) {
    return this.adminInboxService.reject(id, dto);
  }
}
