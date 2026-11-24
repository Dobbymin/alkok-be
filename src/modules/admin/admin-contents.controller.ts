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
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  AdminContentListQueryDto,
  CreateAdminContentDto,
  UpdateAdminContentDto,
} from './admin-contents.dto';
import { AdminContentsService } from './admin-contents.service';

@ApiTags('admin-contents')
@ApiBearerAuth()
@Controller('admin/contents')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminContentsController {
  constructor(private readonly adminContentsService: AdminContentsService) {}

  @Get()
  @ApiOperation({ operationId: 'adminListContents', summary: '관리자 콘텐츠 목록' })
  list(@Query() query: AdminContentListQueryDto) {
    return this.adminContentsService.list(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ operationId: 'adminCreateContent', summary: '관리자 콘텐츠 직접 등록' })
  create(@Body() dto: CreateAdminContentDto, @CurrentUser() user: AuthUser) {
    return this.adminContentsService.create(dto, user.id);
  }

  @Patch(':id')
  @ApiOperation({ operationId: 'adminUpdateContent', summary: '관리자 콘텐츠 수정' })
  update(@Param('id') id: string, @Body() dto: UpdateAdminContentDto) {
    return this.adminContentsService.update(id, dto);
  }

  @Post(':id/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'adminVerifyContent', summary: '콘텐츠 확인 완료(VALID) 갱신' })
  verify(@Param('id') id: string) {
    return this.adminContentsService.verify(id);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'adminArchiveContent', summary: '콘텐츠 노출 중단(ARCHIVED)' })
  archive(@Param('id') id: string) {
    return this.adminContentsService.archive(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ operationId: 'adminDeleteContent', summary: '콘텐츠 Soft Delete' })
  remove(@Param('id') id: string) {
    return this.adminContentsService.remove(id);
  }
}
