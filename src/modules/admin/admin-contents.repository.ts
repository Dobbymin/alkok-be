import { Injectable } from '@nestjs/common';
import {
  ContentType,
  DifficultyLevel,
  KoreanSupportLevel,
  PricingModel,
  Prisma,
  PublishStatus,
  ToolKind,
  VerificationStatus,
} from '@prisma/client';
import { slugify } from '../../common/utils/content-mapper.util';
import { uuidv7 } from '../../common/utils/uuidv7';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type {
  AdminContentListQueryDto,
  CreateAdminContentDto,
  UpdateAdminContentDto,
} from './admin-contents.dto';

const CONTENT_INCLUDE = {
  categories: { include: { category: true } },
  tags: { include: { tag: true } },
  guideDetail: true,
  toolDetail: true,
  newsDetail: true,
} satisfies Prisma.ContentInclude;

@Injectable()
export class AdminContentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: AdminContentListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ContentWhereInput = {
      deletedAt: null,
      ...(query.type ? { type: query.type } : {}),
      ...(query.publishStatus ? { publishStatus: query.publishStatus } : {}),
      ...(query.verificationStatus ? { verificationStatus: query.verificationStatus } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.content.findMany({
        where,
        include: CONTENT_INCLUDE,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.content.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  findById(id: string) {
    return this.prisma.content.findFirst({
      where: { id, deletedAt: null },
      include: CONTENT_INCLUDE,
    });
  }

  async create(dto: CreateAdminContentDto, authorId: string) {
    const id = uuidv7();
    const publishStatus = dto.publishStatus ?? PublishStatus.DRAFT;
    const now = new Date();
    const slugBase = slugify(dto.slug || dto.title);
    const slug = `${slugBase}-${id.slice(-6)}`;

    return this.prisma.$transaction(async (tx) => {
      await tx.content.create({
        data: {
          id,
          type: dto.type,
          slug,
          title: dto.title.trim(),
          summary: dto.summary.trim(),
          publishStatus,
          verificationStatus: VerificationStatus.VALID,
          verifiedAt: publishStatus === PublishStatus.PUBLISHED ? now : null,
          publishedAt: publishStatus === PublishStatus.PUBLISHED ? now : null,
          sourceType: dto.sourceType,
          sourceUrl: dto.sourceUrl,
          sourceName: dto.sourceName ?? null,
          authorId,
          isFeatured: dto.isFeatured ?? false,
        },
      });

      if (dto.type === ContentType.GUIDE) {
        await tx.guideDetail.create({
          data: {
            contentId: id,
            difficulty: dto.difficulty ?? DifficultyLevel.PRACTICAL,
            estimatedMinutes: dto.estimatedMinutes ?? 10,
            pricingModel: dto.pricingModel ?? PricingModel.FREEMIUM,
            markdownBody: dto.markdownBody ?? '',
            prompts: (dto.prompts ?? []).map((p) => ({
              id: p.id || uuidv7(),
              title: p.title,
              content: p.content,
              variables: p.variables,
              ...(p.variableExamples ? { variableExamples: p.variableExamples } : {}),
              ...(p.expectedOutput ? { expectedOutput: p.expectedOutput } : {}),
              ...(p.tips ? { tips: p.tips } : {}),
            })),
            beforeAfterExamples: (dto.beforeAfterExamples ?? []).map((e) => ({
              id: e.id || uuidv7(),
              title: e.title,
              beforeInput: e.beforeInput,
              afterOutput: e.afterOutput,
              improvementPoints: e.improvementPoints ?? [],
            })),
            commonMistakes: (dto.commonMistakes ?? []).map((m) => ({
              id: m.id || uuidv7(),
              category: m.category,
              title: m.title,
              mistake: m.mistake,
              prevention: m.prevention,
            })),
            cautions: dto.cautions ?? null,
          },
        });
      } else if (dto.type === ContentType.TOOL) {
        await tx.toolDetail.create({
          data: {
            contentId: id,
            toolKind: dto.toolKind ?? ToolKind.TOOL,
            providerName: dto.providerName ?? dto.sourceName ?? 'Unknown',
            officialUrl: dto.officialUrl ?? dto.sourceUrl,
            pricingModel: dto.pricingModel ?? PricingModel.FREEMIUM,
            hasFreePlan: dto.hasFreePlan ?? false,
            pricingSummary: dto.pricingSummary ?? '[확인 필요]',
            koreanSupport: dto.koreanSupport ?? KoreanSupportLevel.PARTIAL,
            platforms: dto.platforms ?? ['Web'],
            strengths: dto.strengths ?? [],
            limitations: dto.limitations ?? [],
          },
        });
      } else if (dto.type === ContentType.NEWS) {
        await tx.newsDetail.create({
          data: {
            contentId: id,
            keyPoints: dto.keyPoints ?? [],
            workImpact: dto.workImpact ?? '',
            originalPublishedAt: now,
          },
        });
      }

      if (dto.categorySlugs && dto.categorySlugs.length > 0) {
        const categories = await tx.category.findMany({
          where: { slug: { in: dto.categorySlugs } },
        });
        if (categories.length > 0) {
          await tx.contentCategory.createMany({
            data: categories.map((c) => ({ contentId: id, categoryId: c.id })),
            skipDuplicates: true,
          });
        }
      }

      if (dto.tagSlugs && dto.tagSlugs.length > 0) {
        await this.syncTags(tx, id, dto.tagSlugs);
      }

      if (dto.recommendedToolIds && dto.recommendedToolIds.length > 0) {
        await tx.contentRelation.createMany({
          data: dto.recommendedToolIds.map((toolId, idx) => ({
            fromContentId: id,
            toContentId: toolId,
            relationType: 'RECOMMENDED_TOOL',
            sortOrder: idx,
          })),
          skipDuplicates: true,
        });
      }

      return tx.content.findUniqueOrThrow({
        where: { id },
        include: CONTENT_INCLUDE,
      });
    });
  }

  async update(id: string, type: ContentType, dto: UpdateAdminContentDto) {
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      await tx.content.update({
        where: { id },
        data: {
          ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
          ...(dto.summary !== undefined ? { summary: dto.summary.trim() } : {}),
          ...(dto.publishStatus !== undefined
            ? {
                publishStatus: dto.publishStatus,
                ...(dto.publishStatus === PublishStatus.PUBLISHED
                  ? { publishedAt: now, verifiedAt: now }
                  : {}),
              }
            : {}),
          ...(dto.sourceType !== undefined ? { sourceType: dto.sourceType } : {}),
          ...(dto.sourceUrl !== undefined ? { sourceUrl: dto.sourceUrl } : {}),
          ...(dto.sourceName !== undefined ? { sourceName: dto.sourceName } : {}),
          ...(dto.isFeatured !== undefined ? { isFeatured: dto.isFeatured } : {}),
        },
      });

      if (type === ContentType.GUIDE) {
        await tx.guideDetail.updateMany({
          where: { contentId: id },
          data: {
            ...(dto.difficulty !== undefined ? { difficulty: dto.difficulty } : {}),
            ...(dto.estimatedMinutes !== undefined
              ? { estimatedMinutes: dto.estimatedMinutes }
              : {}),
            ...(dto.pricingModel !== undefined ? { pricingModel: dto.pricingModel } : {}),
            ...(dto.markdownBody !== undefined ? { markdownBody: dto.markdownBody } : {}),
            ...(dto.prompts !== undefined
              ? {
                  prompts: dto.prompts.map((p) => ({
                    id: p.id || uuidv7(),
                    title: p.title,
                    content: p.content,
                    variables: p.variables,
                    ...(p.variableExamples ? { variableExamples: p.variableExamples } : {}),
                    ...(p.expectedOutput ? { expectedOutput: p.expectedOutput } : {}),
                    ...(p.tips ? { tips: p.tips } : {}),
                  })),
                }
              : {}),
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
            ...(dto.cautions !== undefined ? { cautions: dto.cautions } : {}),
          },
        });
      } else if (type === ContentType.TOOL) {
        await tx.toolDetail.updateMany({
          where: { contentId: id },
          data: {
            ...(dto.toolKind !== undefined ? { toolKind: dto.toolKind } : {}),
            ...(dto.providerName !== undefined ? { providerName: dto.providerName } : {}),
            ...(dto.officialUrl !== undefined ? { officialUrl: dto.officialUrl } : {}),
            ...(dto.pricingModel !== undefined ? { pricingModel: dto.pricingModel } : {}),
            ...(dto.hasFreePlan !== undefined ? { hasFreePlan: dto.hasFreePlan } : {}),
            ...(dto.pricingSummary !== undefined ? { pricingSummary: dto.pricingSummary } : {}),
            ...(dto.koreanSupport !== undefined ? { koreanSupport: dto.koreanSupport } : {}),
            ...(dto.platforms !== undefined ? { platforms: dto.platforms } : {}),
            ...(dto.strengths !== undefined ? { strengths: dto.strengths } : {}),
            ...(dto.limitations !== undefined ? { limitations: dto.limitations } : {}),
          },
        });
      } else if (type === ContentType.NEWS) {
        await tx.newsDetail.updateMany({
          where: { contentId: id },
          data: {
            ...(dto.keyPoints !== undefined ? { keyPoints: dto.keyPoints } : {}),
            ...(dto.workImpact !== undefined ? { workImpact: dto.workImpact } : {}),
          },
        });
      }

      if (dto.categorySlugs !== undefined) {
        await tx.contentCategory.deleteMany({ where: { contentId: id } });
        if (dto.categorySlugs.length > 0) {
          const categories = await tx.category.findMany({
            where: { slug: { in: dto.categorySlugs } },
          });
          await tx.contentCategory.createMany({
            data: categories.map((c) => ({ contentId: id, categoryId: c.id })),
            skipDuplicates: true,
          });
        }
      }

      if (dto.tagSlugs !== undefined) {
        await tx.contentTag.deleteMany({ where: { contentId: id } });
        if (dto.tagSlugs.length > 0) {
          await this.syncTags(tx, id, dto.tagSlugs);
        }
      }

      return tx.content.findUniqueOrThrow({
        where: { id },
        include: CONTENT_INCLUDE,
      });
    });
  }

  verify(id: string) {
    return this.prisma.content.update({
      where: { id },
      data: {
        verificationStatus: VerificationStatus.VALID,
        verifiedAt: new Date(),
      },
      include: CONTENT_INCLUDE,
    });
  }

  archive(id: string) {
    return this.prisma.content.update({
      where: { id },
      data: {
        publishStatus: PublishStatus.ARCHIVED,
      },
      include: CONTENT_INCLUDE,
    });
  }

  softDelete(id: string) {
    return this.prisma.content.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async syncTags(
    tx: Prisma.TransactionClient,
    contentId: string,
    rawTags: string[],
  ): Promise<void> {
    const slugs = [...new Set(rawTags.map((t) => slugify(t)).filter(Boolean))];
    for (const tagSlug of slugs) {
      const tag = await tx.tag.upsert({
        where: { slug: tagSlug },
        update: {},
        create: { id: uuidv7(), slug: tagSlug, name: tagSlug },
      });
      await tx.contentTag.create({
        data: { contentId, tagId: tag.id },
      });
    }
  }
}
