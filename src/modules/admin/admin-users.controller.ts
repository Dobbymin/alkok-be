import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminUserListQueryDto, UpdateUserRoleDto, UpdateUserStatusDto } from './admin-users.dto';
import { AdminUsersService } from './admin-users.service';

@ApiTags('admin-users')
@ApiBearerAuth()
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @ApiOperation({ operationId: 'adminListUsers', summary: '관리자 회원 목록 검색' })
  list(@Query() query: AdminUserListQueryDto) {
    return this.adminUsersService.list(query);
  }

  @Patch(':id/role')
  @ApiOperation({ operationId: 'adminUpdateUserRole', summary: '회원 역할 변경' })
  updateRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.adminUsersService.updateRole(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ operationId: 'adminUpdateUserStatus', summary: '회원 상태 변경' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.adminUsersService.updateStatus(id, dto);
  }
}
