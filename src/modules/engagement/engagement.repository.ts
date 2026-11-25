import { Injectable } from '@nestjs/common';
import { PublishStatus, ReportReason, ReportStatus, VerificationStatus } from '@prisma/client';
import { uuidv7 } from '../../common/utils/uuidv7';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class EngagementRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPublishedContent(contentId: string) {
    return this.prisma.content.findFirst({
      where: { id: contentId, publishStatus: PublishStatus.PUBLISHED, deletedAt: null },
      select: { id: true, helpfulCount: true, verificationStatus: true },
    });
  }

  async addHelpfulVote(userId: string, contentId: string): Promise<{ helpfulCount: number }> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.helpfulVote.findUnique({
        where: { userId_contentId: { userId, contentId } },
      });

      if (!existing) {
        await tx.helpfulVote.create({
          data: { userId, contentId },
        });
        const updated = await tx.content.update({
          where: { id: contentId },
          data: { helpfulCount: { increment: 1 } },
          select: { helpfulCount: true },
        });
        return { helpfulCount: updated.helpfulCount };
      }

      const current = await tx.content.findUniqueOrThrow({
        where: { id: contentId },
        select: { helpfulCount: true },
      });
      return { helpfulCount: current.helpfulCount };
    });
  }

  async removeHelpfulVote(userId: string, contentId: string): Promise<{ helpfulCount: number }> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.helpfulVote.findUnique({
        where: { userId_contentId: { userId, contentId } },
      });

      if (existing) {
        await tx.helpfulVote.delete({
          where: { userId_contentId: { userId, contentId } },
        });
        const current = await tx.content.findUniqueOrThrow({
          where: { id: contentId },
          select: { helpfulCount: true },
        });
        const nextCount = Math.max(0, current.helpfulCount - 1);
        await tx.content.update({
          where: { id: contentId },
          data: { helpfulCount: nextCount },
        });
        return { helpfulCount: nextCount };
      }

      const current = await tx.content.findUniqueOrThrow({
        where: { id: contentId },
        select: { helpfulCount: true },
      });
      return { helpfulCount: current.helpfulCount };
    });
  }

  async createReportAndCheckThreshold(params: {
    contentId: string;
    reporterUserId?: string;
    reporterEmail?: string;
    reason: ReportReason;
    detail: string;
    reporterIpHash: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const report = await tx.contentReport.create({
        data: {
          id: uuidv7(),
          contentId: params.contentId,
          reporterUserId: params.reporterUserId ?? null,
          reporterEmail: params.reporterEmail ?? null,
          reason: params.reason,
          detail: params.detail,
          reporterIpHash: params.reporterIpHash,
          status: ReportStatus.OPEN,
        },
      });

      const distinctIps = await tx.contentReport.groupBy({
        by: ['reporterIpHash'],
        where: {
          contentId: params.contentId,
          status: { in: [ReportStatus.OPEN, ReportStatus.IN_PROGRESS] },
        },
      });

      if (distinctIps.length >= 3) {
        await tx.content.updateMany({
          where: {
            id: params.contentId,
            publishStatus: PublishStatus.PUBLISHED,
            verificationStatus: VerificationStatus.VALID,
            deletedAt: null,
          },
          data: {
            verificationStatus: VerificationStatus.NEEDS_REVIEW,
          },
        });
      }

      return report;
    });
  }
}
