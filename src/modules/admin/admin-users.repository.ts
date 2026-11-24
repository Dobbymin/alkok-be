import { Injectable } from '@nestjs/common';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { AdminUserListQueryDto } from './admin-users.dto';

@Injectable()
export class AdminUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: AdminUserListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const keyword = query.q?.trim();

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(keyword
        ? {
            OR: [
              { email: { contains: keyword, mode: 'insensitive' } },
              { nickname: { contains: keyword, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: { interests: { include: { category: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  findById(id: string) {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { interests: { include: { category: true } } },
    });
  }

  updateRole(id: string, role: UserRole) {
    return this.prisma.user.update({
      where: { id },
      data: { role },
      include: { interests: { include: { category: true } } },
    });
  }

  updateStatus(id: string, status: UserStatus) {
    return this.prisma.user.update({
      where: { id },
      data: { status },
      include: { interests: { include: { category: true } } },
    });
  }
}
