import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException } from '../../common/exceptions/app.exception';
import { hashPassword, verifyPassword } from '../../common/utils/crypto.util';
import { formatUserProfile } from '../auth/auth.service';
import { UpdateInterestsDto, UpdatePasswordDto, UpdateProfileDto } from './users.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getMe(userId: string) {
    const user = await this.usersRepository.findByIdWithInterests(userId);
    if (!user || user.deletedAt) {
      throw new AppException(HttpStatus.NOT_FOUND, 'NOT_FOUND', '사용자를 찾을 수 없습니다.');
    }
    return formatUserProfile(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.usersRepository.updateNickname(userId, dto.nickname.trim());
    return formatUserProfile(user);
  }

  async updateInterests(userId: string, dto: UpdateInterestsDto) {
    const slugs = dto.categorySlugs.map((s) => s.trim()).filter(Boolean);
    const categories = await this.usersRepository.findWorkDomainCategoriesBySlugs(slugs);

    if (categories.length !== slugs.length) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'VALIDATION_FAILED',
        '유효하지 않은 업무 도메인 슬러그가 포함되어 있습니다.',
      );
    }

    const user = await this.usersRepository.replaceInterests(
      userId,
      categories.map((c) => c.id),
    );
    return formatUserProfile(user);
  }

  async updatePassword(userId: string, dto: UpdatePasswordDto): Promise<void> {
    const user = await this.usersRepository.findByIdWithInterests(userId);
    if (!user || user.deletedAt) {
      throw new AppException(HttpStatus.NOT_FOUND, 'NOT_FOUND', '사용자를 찾을 수 없습니다.');
    }

    const valid = await verifyPassword(user.passwordHash, dto.currentPassword);
    if (!valid) {
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        'AUTH_INVALID_CREDENTIALS',
        '현재 비밀번호가 올바르지 않습니다.',
      );
    }

    const newHash = await hashPassword(dto.newPassword);
    await this.usersRepository.updatePasswordHash(userId, newHash);
  }

  async deleteMe(userId: string): Promise<void> {
    const user = await this.usersRepository.findByIdWithInterests(userId);
    if (!user || user.deletedAt) {
      throw new AppException(HttpStatus.NOT_FOUND, 'NOT_FOUND', '사용자를 찾을 수 없습니다.');
    }

    await this.usersRepository.withdrawUserInTransaction(userId);
  }
}
