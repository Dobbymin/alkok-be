import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateSourceDto, UpdateSourceDto } from './admin-sources.dto';
import { AdminSourcesService } from './admin-sources.service';

@ApiTags('admin-sources')
@ApiBearerAuth()
@Controller('admin/sources')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminSourcesController {
  constructor(private readonly adminSourcesService: AdminSourcesService) {}

  @Get()
  @ApiOperation({ operationId: 'adminListSources', summary: '수집 출처 목록' })
  list() {
    return this.adminSourcesService.list();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ operationId: 'adminCreateSource', summary: '수집 출처 등록' })
  create(@Body() dto: CreateSourceDto) {
    return this.adminSourcesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ operationId: 'adminUpdateSource', summary: '수집 출처 수정' })
  update(@Param('id') id: string, @Body() dto: UpdateSourceDto) {
    return this.adminSourcesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'adminDeleteSource', summary: '수집 출처 Soft Delete' })
  remove(@Param('id') id: string) {
    return this.adminSourcesService.remove(id);
  }

  @Post(':id/fetch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'adminTriggerSourceFetch', summary: '출처 즉시 수집 Job 생성' })
  triggerFetch(@Param('id') id: string) {
    return this.adminSourcesService.triggerFetch(id);
  }
}
