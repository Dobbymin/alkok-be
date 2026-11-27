import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { ContentType, PublishStatus, VerificationStatus } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class MaintenanceBatchService {
  private readonly logger = new Logger(MaintenanceBatchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  @Cron('0 3 * * *', { timeZone: 'Asia/Seoul' })
  async runDailyMaintenance(): Promise<void> {
    if (!this.configService.get<boolean>('ENABLE_SCHEDULER')) {
      return;
    }
    await this.runFreshnessCheck();
    await this.purgeOldRawText();
    await this.cleanupExpiredTokens();
  }

  async runFreshnessCheck(now: Date = new Date()): Promise<{
    toolsFlagged: number;
    skillsFlagged: number;
    guidesFlagged: number;
  }> {
    const toolCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const skillCutoff = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const guideCutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [toolRes, skillRes, guideRes] = await this.prisma.$transaction([
      this.prisma.content.updateMany({
        where: {
          type: ContentType.TOOL,
          publishStatus: PublishStatus.PUBLISHED,
          verificationStatus: VerificationStatus.VALID,
          deletedAt: null,
          verifiedAt: { lt: toolCutoff },
        },
        data: { verificationStatus: VerificationStatus.NEEDS_REVIEW },
      }),
      this.prisma.content.updateMany({
        where: {
          type: ContentType.SKILL,
          publishStatus: PublishStatus.PUBLISHED,
          verificationStatus: VerificationStatus.VALID,
          deletedAt: null,
          verifiedAt: { lt: skillCutoff },
        },
        data: { verificationStatus: VerificationStatus.NEEDS_REVIEW },
      }),
      this.prisma.content.updateMany({
        where: {
          type: ContentType.GUIDE,
          publishStatus: PublishStatus.PUBLISHED,
          verificationStatus: VerificationStatus.VALID,
          deletedAt: null,
          verifiedAt: { lt: guideCutoff },
        },
        data: { verificationStatus: VerificationStatus.NEEDS_REVIEW },
      }),
    ]);

    this.logger.log(
      `Freshness check flagged tools=${toolRes.count}, skills=${skillRes.count}, guides=${guideRes.count}`,
    );
    return {
      toolsFlagged: toolRes.count,
      skillsFlagged: skillRes.count,
      guidesFlagged: guideRes.count,
    };
  }

  async purgeOldRawText(now: Date = new Date()): Promise<{ purgedCount: number }> {
    const cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const res = await this.prisma.rawDocument.updateMany({
      where: {
        fetchedAt: { lt: cutoff },
        rawText: { not: null },
      },
      data: { rawText: null },
    });
    return { purgedCount: res.count };
  }

  async cleanupExpiredTokens(now: Date = new Date()): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.deleteMany({
        where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }] },
      }),
      this.prisma.passwordResetToken.deleteMany({
        where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }] },
      }),
      this.prisma.refreshSession.deleteMany({
        where: { OR: [{ expiresAt: { lt: now } }, { revokedAt: { not: null } }] },
      }),
    ]);
  }
}
