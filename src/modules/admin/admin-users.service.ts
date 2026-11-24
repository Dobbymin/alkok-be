import { HttpStatus, Injectable } from '@nestjs/common';
import { buildPaginationMeta } from '../../common/dto/pagination.dto';
import { AppException } from '../../common/exceptions/app.exception';
import { formatUserProfile } from '../auth/auth.service';
import type {
  AdminUserListQueryDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
} from './admin-users.dto';
import { AdminUsersRepository } from './admin-users.repository';

@Injectable()
export class AdminUsersService {
  constructor(private readonly adminUsersRepository: AdminUsersRepository) {}

  async list(query: AdminUserListQueryDto) {
    const result = await this.adminUsersRepository.list(query);
    return {
      data: result.items.map(formatUserProfile),
      meta: buildPaginationMeta(result.page, result.limit, result.total),
    };
  }

  async updateRole(id: string, dto: UpdateUserRoleDto) {
    const existing = await this.adminUsersRepository.findById(id);
    if (!existing) {
      throw new AppException(HttpStatus.NOT_FOUND, 'NOT_FOUND', '사용자를 찾을 수 없습니다.');
    }
    const updated = await this.adminUsersRepository.updateRole(id, dto.role);
    return formatUserProfile(updated);
  }

  async updateStatus(id: string, dto: UpdateUserStatusDto) {
    const existing = await this.adminUsersRepository.findById(id);
    if (!existing) {
      throw new AppException(HttpStatus.NOT_FOUND, 'NOT_FOUND', '사용자를 찾을 수 없습니다.');
    }
    const updated = await this.adminUsersRepository.updateStatus(id, dto.status);
    return formatUserProfile(updated);
  }
}
