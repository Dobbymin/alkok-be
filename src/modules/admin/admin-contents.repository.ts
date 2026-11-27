import { Injectable } from '@nestjs/common';
import {
  ContentType,
  DifficultyLevel,
  KoreanSupportLevel,
  PricingModel,
  Prisma,
  PublishStatus,
  SkillExecutionVerification,
  SkillKind,
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
  skillDetail: true,
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
            verificationChecklist: dto.verificationChecklist ?? [],
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
            pricingPlans: (dto.pricingPlans ?? []) as Prisma.InputJsonValue,
            koreanSupport: dto.koreanSupport ?? KoreanSupportLevel.PARTIAL,
            platforms: dto.platforms ?? ['Web'],
            strengths: dto.strengths ?? [],
            limitations: dto.limitations ?? [],
            useCases: dto.useCases ?? [],
            gettingStartedSteps: (dto.gettingStartedSteps ?? []) as Prisma.InputJsonValue,
            examplePrompts: (dto.examplePrompts ?? []) as Prisma.InputJsonValue,
            faq: (dto.faq ?? []) as Prisma.InputJsonValue,
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
      } else if (dto.type === ContentType.SKILL) {
        await tx.skillDetail.create({
          data: {
            contentId: id,
            skillKind: dto.skillKind ?? SkillKind.SKILL,
            skillSlug: dto.skillSlug ?? slugBase,
            authorName: dto.authorName ?? dto.sourceName ?? '알콕 큐레이션',
            license: dto.license ?? null,
            repositoryUrl: dto.repositoryUrl ?? dto.sourceUrl,
            sourceFileUrl: dto.sourceFileUrl ?? null,
            executionVerification:
              dto.executionVerification ?? SkillExecutionVerification.SOURCE_CHECKED,
            difficulty: dto.difficulty ?? DifficultyLevel.PRACTICAL,
            pricingModel: dto.pricingModel ?? PricingModel.FREE,
            compatibleAgents: dto.compatibleAgents ?? [],
            overview: dto.overview ?? dto.summary.trim(),
            useCases: dto.useCases ?? [],
            beforeAfter: (dto.beforeAfter ?? {
              beforeItems: [],
              afterItems: [],
            }) as Prisma.InputJsonValue,
            workflowSteps: (dto.workflowSteps ?? []) as Prisma.InputJsonValue,
            prerequisites: (dto.prerequisites ?? []) as Prisma.InputJsonValue,
            installPrompt: dto.installPrompt ?? null,
            installGuides: (dto.installGuides ?? []) as Prisma.InputJsonValue,
            examplePrompts: (dto.examplePrompts ?? []) as Prisma.InputJsonValue,
            expectedOutputs: (dto.expectedOutputs ?? []) as Prisma.InputJsonValue,
            postRunChecklist: dto.postRunChecklist ?? [],
            tips: dto.tips ?? [],
            cautions: dto.cautions ?? null,
            faq: (dto.faq ?? []) as Prisma.InputJsonValue,
            fileStructure: dto.fileStructure ?? [],
            skillMdPreview: dto.skillMdPreview ?? null,
            webAlternative: dto.webAlternative
              ? (dto.webAlternative as Prisma.InputJsonValue)
              : Prisma.JsonNull,
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
            ...(dto.verificationChecklist !== undefined
              ? { verificationChecklist: dto.verificationChecklist }
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
            ...(dto.pricingPlans !== undefined
              ? { pricingPlans: dto.pricingPlans as Prisma.InputJsonValue }
              : {}),
            ...(dto.koreanSupport !== undefined ? { koreanSupport: dto.koreanSupport } : {}),
            ...(dto.platforms !== undefined ? { platforms: dto.platforms } : {}),
            ...(dto.strengths !== undefined ? { strengths: dto.strengths } : {}),
            ...(dto.limitations !== undefined ? { limitations: dto.limitations } : {}),
            ...(dto.useCases !== undefined ? { useCases: dto.useCases } : {}),
            ...(dto.gettingStartedSteps !== undefined
              ? { gettingStartedSteps: dto.gettingStartedSteps as Prisma.InputJsonValue }
              : {}),
            ...(dto.examplePrompts !== undefined
              ? { examplePrompts: dto.examplePrompts as Prisma.InputJsonValue }
              : {}),
            ...(dto.faq !== undefined ? { faq: dto.faq as Prisma.InputJsonValue } : {}),
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
      } else if (type === ContentType.SKILL) {
        await tx.skillDetail.updateMany({
          where: { contentId: id },
          data: {
            ...(dto.skillKind !== undefined ? { skillKind: dto.skillKind } : {}),
            ...(dto.skillSlug !== undefined ? { skillSlug: dto.skillSlug } : {}),
            ...(dto.authorName !== undefined ? { authorName: dto.authorName } : {}),
            ...(dto.license !== undefined ? { license: dto.license } : {}),
            ...(dto.repositoryUrl !== undefined ? { repositoryUrl: dto.repositoryUrl } : {}),
            ...(dto.sourceFileUrl !== undefined ? { sourceFileUrl: dto.sourceFileUrl } : {}),
            ...(dto.executionVerification !== undefined
              ? { executionVerification: dto.executionVerification }
              : {}),
            ...(dto.difficulty !== undefined ? { difficulty: dto.difficulty } : {}),
            ...(dto.pricingModel !== undefined ? { pricingModel: dto.pricingModel } : {}),
            ...(dto.compatibleAgents !== undefined
              ? { compatibleAgents: dto.compatibleAgents }
              : {}),
            ...(dto.overview !== undefined ? { overview: dto.overview } : {}),
            ...(dto.useCases !== undefined ? { useCases: dto.useCases } : {}),
            ...(dto.beforeAfter !== undefined
              ? { beforeAfter: dto.beforeAfter as Prisma.InputJsonValue }
              : {}),
            ...(dto.workflowSteps !== undefined
              ? { workflowSteps: dto.workflowSteps as Prisma.InputJsonValue }
              : {}),
            ...(dto.prerequisites !== undefined
              ? { prerequisites: dto.prerequisites as Prisma.InputJsonValue }
              : {}),
            ...(dto.installPrompt !== undefined ? { installPrompt: dto.installPrompt } : {}),
            ...(dto.installGuides !== undefined
              ? { installGuides: dto.installGuides as Prisma.InputJsonValue }
              : {}),
            ...(dto.examplePrompts !== undefined
              ? { examplePrompts: dto.examplePrompts as Prisma.InputJsonValue }
              : {}),
            ...(dto.expectedOutputs !== undefined
              ? { expectedOutputs: dto.expectedOutputs as Prisma.InputJsonValue }
              : {}),
            ...(dto.postRunChecklist !== undefined
              ? { postRunChecklist: dto.postRunChecklist }
              : {}),
            ...(dto.tips !== undefined ? { tips: dto.tips } : {}),
            ...(dto.cautions !== undefined ? { cautions: dto.cautions } : {}),
            ...(dto.faq !== undefined ? { faq: dto.faq as Prisma.InputJsonValue } : {}),
            ...(dto.fileStructure !== undefined ? { fileStructure: dto.fileStructure } : {}),
            ...(dto.skillMdPreview !== undefined ? { skillMdPreview: dto.skillMdPreview } : {}),
            ...(dto.webAlternative !== undefined
              ? { webAlternative: dto.webAlternative as Prisma.InputJsonValue }
              : {}),
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
