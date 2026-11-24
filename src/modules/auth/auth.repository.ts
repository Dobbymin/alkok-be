import { Injectable } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { uuidv7 } from '../../common/utils/uuidv7';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        interests: {
          include: { category: true },
        },
      },
    });
  }

  findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        interests: {
          include: { category: true },
        },
      },
    });
  }

  async createUserWithVerificationToken(params: {
    email: string;
    passwordHash: string;
    nickname: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          id: uuidv7(),
          email: params.email,
          passwordHash: params.passwordHash,
          nickname: params.nickname,
          role: UserRole.USER,
          status: UserStatus.PENDING_VERIFICATION,
        },
      });

      await tx.emailVerificationToken.create({
        data: {
          id: uuidv7(),
          userId: user.id,
          tokenHash: params.tokenHash,
          expiresAt: params.expiresAt,
        },
      });

      return user;
    });
  }

  findVerificationTokenByHash(tokenHash: string) {
    return this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  }

  findLatestVerificationTokenForUser(userId: string) {
    return this.prisma.emailVerificationToken.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  createVerificationToken(userId: string, tokenHash: string, expiresAt: Date) {
    return this.prisma.emailVerificationToken.create({
      data: {
        id: uuidv7(),
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  async markEmailVerified(tokenId: string, userId: string): Promise<void> {
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({
        where: { id: tokenId },
        data: { usedAt: now },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          status: UserStatus.ACTIVE,
          emailVerifiedAt: now,
        },
      }),
    ]);
  }

  async createRefreshSessionAndTouchLogin(params: {
    userId: string;
    familyId: string;
    tokenHash: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }) {
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      const session = await tx.refreshSession.create({
        data: {
          id: uuidv7(),
          userId: params.userId,
          familyId: params.familyId,
          tokenHash: params.tokenHash,
          expiresAt: params.expiresAt,
          userAgent: params.userAgent,
          ipAddress: params.ipAddress,
        },
      });

      await tx.user.update({
        where: { id: params.userId },
        data: { lastLoginAt: now },
      });

      return session;
    });
  }

  findRefreshSessionByHash(tokenHash: string) {
    return this.prisma.refreshSession.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            interests: {
              include: { category: true },
            },
          },
        },
      },
    });
  }

  revokeFamilySessions(familyId: string) {
    return this.prisma.refreshSession.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  revokeSessionByHash(tokenHash: string) {
    return this.prisma.refreshSession.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async rotateRefreshSession(params: {
    oldSessionId: string;
    userId: string;
    familyId: string;
    newTokenHash: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      await tx.refreshSession.update({
        where: { id: params.oldSessionId },
        data: { revokedAt: new Date() },
      });

      return tx.refreshSession.create({
        data: {
          id: uuidv7(),
          userId: params.userId,
          familyId: params.familyId,
          tokenHash: params.newTokenHash,
          expiresAt: params.expiresAt,
          userAgent: params.userAgent,
          ipAddress: params.ipAddress,
        },
      });
    });
  }

  createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date) {
    return this.prisma.passwordResetToken.create({
      data: {
        id: uuidv7(),
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  findPasswordResetTokenByHash(tokenHash: string) {
    return this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  }

  async resetPasswordAndRevokeAllSessions(params: {
    tokenId: string;
    userId: string;
    newPasswordHash: string;
  }): Promise<void> {
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({
        where: { id: params.tokenId },
        data: { usedAt: now },
      }),
      this.prisma.user.update({
        where: { id: params.userId },
        data: { passwordHash: params.newPasswordHash },
      }),
      this.prisma.refreshSession.updateMany({
        where: { userId: params.userId, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);
  }
}
