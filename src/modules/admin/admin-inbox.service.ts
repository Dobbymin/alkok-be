import { HttpStatus, Injectable } from '@nestjs/common';
import { ContentType, PublishStatus, VerificationStatus } from '@prisma/client';
import { AppException } from '../../common/exceptions/app.exception';
import { mapContentSummary, slugify } from '../../common/utils/content-mapper.util';
import { uuidv7 } from '../../common/utils/uuidv7';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { SearchVectorService } from '../../infra/prisma/search-vector.service';
import type { ApproveInboxDto, RejectInboxDto } from './admin-inbox.dto';

@Injectable()
export class AdminInboxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly searchVectorService: SearchVectorService,
  ) {}

  async list() {
    const items = await this.prisma.content.findMany({
      where: {
        deletedAt: null,
        publishStatus: { in: [PublishStatus.DRAFT, PublishStatus.IN_REVIEW] },
      },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((c) => {
      const meta =
        typeof c.aiMetadata === 'object' && c.aiMetadata !== null && !Array.isArray(c.aiMetadata)
          ? (c.aiMetadata as { unverifiedFields?: string[] })
          : {};
      return {
        id: c.id,
        type: c.type,
        title: c.title,
        summary: c.summary,
        publishStatus: c.publishStatus,
        verificationStatus: c.verificationStatus,
        sourceType: c.sourceType,
        sourceUrl: c.sourceUrl,
        sourceName: c.sourceName,
        unverifiedFields: meta.unverifiedFields ?? [],
        createdAt: c.createdAt.toISOString(),
      };
    });
  }

  async getDetail(id: string) {
    const content = await this.prisma.content.findFirst({
      where: { id, deletedAt: null },
      include: {
        rawDocument: true,
        tags: { include: { tag: true } },
        guideDetail: true,
        toolDetail: true,
        newsDetail: true,
        skillDetail: true,
      },
    });
    if (!content) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'CONTENT_NOT_FOUND',
        '콘텐츠를 찾을 수 없습니다.',
      );
    }

    const meta =
      typeof content.aiMetadata === 'object' &&
      content.aiMetadata !== null &&
      !Array.isArray(content.aiMetadata)
        ? (content.aiMetadata as { evidenceNotes?: string[]; unverifiedFields?: string[] })
        : {};

    return {
      id: content.id,
      type: content.type,
      title: content.title,
      summary: content.summary,
      publishStatus: content.publishStatus,
      verificationStatus: content.verificationStatus,
      sourceType: content.sourceType,
      sourceUrl: content.sourceUrl,
      sourceName: content.sourceName,
      unverifiedFields: meta.unverifiedFields ?? [],
      evidenceNotes: meta.evidenceNotes ?? [],
      rawTextExcerpt: content.rawDocument?.rawText?.slice(0, 4000) ?? '',
      tags: content.tags.map((t) => t.tag.name),
      workImpact: content.newsDetail?.workImpact ?? null,
      keyPoints: content.newsDetail?.keyPoints ?? [],
      markdownBody: content.guideDetail?.markdownBody ?? null,
      prompts: Array.isArray(content.guideDetail?.prompts) ? content.guideDetail.prompts : [],
      beforeAfterExamples: Array.isArray(content.guideDetail?.beforeAfterExamples)
        ? content.guideDetail.beforeAfterExamples
        : [],
      commonMistakes: Array.isArray(content.guideDetail?.commonMistakes)
        ? content.guideDetail.commonMistakes
        : [],
      pricingSummary: content.toolDetail?.pricingSummary ?? null,
      skillKind: content.skillDetail?.skillKind ?? null,
      compatibleAgents: content.skillDetail?.compatibleAgents ?? [],
      overview: content.skillDetail?.overview ?? null,
      installPrompt: content.skillDetail?.installPrompt ?? null,
      skillMdPreview: content.skillDetail?.skillMdPreview ?? null,
      webAlternative: content.skillDetail?.webAlternative ?? null,
      createdAt: content.createdAt.toISOString(),
    };
  }

  async approve(id: string, dto: ApproveInboxDto) {
    const existing = await this.prisma.content.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'CONTENT_NOT_FOUND',
        '콘텐츠를 찾을 수 없습니다.',
      );
    }

    const now = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.content.update({
        where: { id },
        data: {
          ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
          ...(dto.summary !== undefined ? { summary: dto.summary.trim() } : {}),
          publishStatus: PublishStatus.PUBLISHED,
          verificationStatus: VerificationStatus.VALID,
          verifiedAt: now,
          publishedAt: existing.publishedAt ?? now,
        },
      });

      if (existing.type === ContentType.NEWS && dto.workImpact !== undefined) {
        await tx.newsDetail.updateMany({
          where: { contentId: id },
          data: { workImpact: dto.workImpact },
        });
      } else if (
        existing.type === ContentType.GUIDE &&
        (dto.markdownBody !== undefined ||
          dto.beforeAfterExamples !== undefined ||
          dto.commonMistakes !== undefined)
      ) {
        await tx.guideDetail.updateMany({
          where: { contentId: id },
          data: {
            ...(dto.markdownBody !== undefined ? { markdownBody: dto.markdownBody } : {}),
            ...(dto.beforeAfterExamples !== undefined
              ? {
                  beforeAfterExamples: dto.beforeAfterExamples.map((e) => ({
                    id: e.id || uuidv7(),
                    title: e.title,
                    beforeInput: e.beforeInput,
                    afterOutput: e.afterOutput,
                    improvementPoints: e.improvementPoints ?? [],
                  })),
                }
              : {}),
            ...(dto.commonMistakes !== undefined
              ? {
                  commonMistakes: dto.commonMistakes.map((m) => ({
                    id: m.id || uuidv7(),
                    category: m.category,
                    title: m.title,
                    mistake: m.mistake,
                    prevention: m.prevention,
                  })),
                }
              : {}),
          },
        });
      } else if (existing.type === ContentType.TOOL && dto.pricingSummary !== undefined) {
        await tx.toolDetail.updateMany({
          where: { contentId: id },
          data: { pricingSummary: dto.pricingSummary },
        });
      } else if (
        existing.type === ContentType.SKILL &&
        (dto.overview !== undefined ||
          dto.installPrompt !== undefined ||
          dto.skillMdPreview !== undefined)
      ) {
        await tx.skillDetail.updateMany({
          where: { contentId: id },
          data: {
            ...(dto.overview !== undefined ? { overview: dto.overview } : {}),
            ...(dto.installPrompt !== undefined ? { installPrompt: dto.installPrompt } : {}),
            ...(dto.skillMdPreview !== undefined ? { skillMdPreview: dto.skillMdPreview } : {}),
          },
        });
      }

      if (dto.tags !== undefined) {
        await tx.contentTag.deleteMany({ where: { contentId: id } });
        const slugs = [...new Set(dto.tags.map(slugify).filter(Boolean))];
        for (const s of slugs) {
          const tag = await tx.tag.upsert({
            where: { slug: s },
            update: {},
            create: { id: uuidv7(), slug: s, name: s },
          });
          await tx.contentTag.create({ data: { contentId: id, tagId: tag.id } });
        }
      }

      return tx.content.findUniqueOrThrow({
        where: { id },
        include: {
          categories: { include: { category: true } },
          tags: { include: { tag: true } },
        },
      });
    });

    await this.searchVectorService.refresh(updated.id);
    return mapContentSummary(updated);
  }

  async reject(id: string, dto: RejectInboxDto) {
    const existing = await this.prisma.content.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'CONTENT_NOT_FOUND',
        '콘텐츠를 찾을 수 없습니다.',
      );
    }

    const meta =
      typeof existing.aiMetadata === 'object' &&
      existing.aiMetadata !== null &&
      !Array.isArray(existing.aiMetadata)
        ? (existing.aiMetadata as Record<string, unknown>)
        : {};

    const updated = await this.prisma.content.update({
      where: { id },
      data: {
        publishStatus: PublishStatus.REJECTED,
        aiMetadata: {
          ...meta,
          ...(dto.reason ? { rejectReason: dto.reason } : {}),
        },
      },
      include: {
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
    });
    return mapContentSummary(updated);
  }
}
