import { Injectable } from '@nestjs/common';
import { CategoryGroup, UserStatus } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByIdWithInterests(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        interests: {
          include: { category: true },
        },
      },
    });
  }

  updateNickname(userId: string, nickname: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { nickname },
      include: {
        interests: {
          include: { category: true },
        },
      },
    });
  }

  findWorkDomainCategoriesBySlugs(slugs: string[]) {
    return this.prisma.category.findMany({
      where: {
        slug: { in: slugs },
        group: CategoryGroup.WORK_DOMAIN,
        isActive: true,
      },
    });
  }

  async replaceInterests(userId: string, categoryIds: string[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.userInterest.deleteMany({ where: { userId } });

      if (categoryIds.length > 0) {
        await tx.userInterest.createMany({
          data: categoryIds.map((categoryId) => ({ userId, categoryId })),
          skipDuplicates: true,
        });
      }

      return tx.user.findUniqueOrThrow({
        where: { id: userId },
        include: {
          interests: {
            include: { category: true },
          },
        },
      });
    });
  }

  updatePasswordHash(userId: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async withdrawUserInTransaction(userId: string): Promise<void> {
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.vaultItemTag.deleteMany({
        where: { vaultItem: { userId } },
      });
      await tx.vaultItem.deleteMany({ where: { userId } });
      await tx.vaultFolder.deleteMany({ where: { userId } });
      await tx.vaultTag.deleteMany({ where: { userId } });
      await tx.userInterest.deleteMany({ where: { userId } });
      await tx.refreshSession.deleteMany({ where: { userId } });
      await tx.emailVerificationToken.deleteMany({ where: { userId } });
      await tx.passwordResetToken.deleteMany({ where: { userId } });

      await tx.user.update({
        where: { id: userId },
        data: {
          email: `deleted-${userId}@deleted.local`,
          nickname: '탈퇴한 회원',
          passwordHash: '',
          status: UserStatus.SUSPENDED,
          deletedAt: now,
        },
      });
    });
  }
}
