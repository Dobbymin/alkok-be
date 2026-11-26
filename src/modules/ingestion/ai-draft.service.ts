import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  ContentType,
  JobType,
  PublishStatus,
  SourceType,
  VerificationStatus,
} from '@prisma/client';
import { ZodError, z } from 'zod';
import { slugify } from '../../common/utils/content-mapper.util';
import { uuidv7 } from '../../common/utils/uuidv7';
import { AiRouterService } from '../../infra/ai/ai-router.service';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { SearchVectorService } from '../../infra/prisma/search-vector.service';
import {
  GuideDraftSchema,
  NewsDraftSchema,
  ScreeningOutputSchema,
  ToolDraftSchema,
  type GuideDraft,
  type NewsDraft,
  type ToolDraft,
} from './ai-draft.schemas';
import {
  AGENT_MCP_PRIMARY_TAG,
  buildPass1SystemPrompt,
  buildPass2SystemPrompt,
  isAgentOrMcpTopic,
} from './agent-mcp-prompts';
import { JobWorkerService } from './job-worker.service';

@Injectable()
export class AiDraftService implements OnModuleInit {
  private readonly logger = new Logger(AiDraftService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiRouterService: AiRouterService,
    private readonly jobWorkerService: JobWorkerService,
    private readonly searchVectorService: SearchVectorService,
  ) {}

  onModuleInit(): void {
    this.aiRouterService.onWorkerPause(() => {
      this.jobWorkerService.pauseAiDraft();
    });

    this.jobWorkerService.registerHandler(JobType.AI_DRAFT, async (job) => {
      const rawDocumentId =
        typeof job.payload.rawDocumentId === 'string' ? job.payload.rawDocumentId : '';
      const skipScreening = job.payload.skipScreening === true;
      if (!rawDocumentId) {
        throw new Error('AI_DRAFT job missing rawDocumentId');
      }
      await this.processRawDocument(rawDocumentId, { jobRunId: job.id, skipScreening });
    });
  }

  async processRawDocument(
    rawDocumentId: string,
    options: { jobRunId?: string; skipScreening?: boolean } = {},
  ): Promise<{ contentId: string | null; screenedOut: boolean }> {
    const existingContent = await this.prisma.content.findUnique({
      where: { rawDocumentId },
    });
    if (existingContent) {
      return { contentId: existingContent.id, screenedOut: false };
    }

    const rawDoc = await this.prisma.rawDocument.findUnique({
      where: { id: rawDocumentId },
      include: { source: true },
    });
    if (!rawDoc) {
      throw new Error(`RawDocument ${rawDocumentId} not found`);
    }

    const sourceType = rawDoc.source?.sourceType ?? SourceType.OFFICIAL;
    const sourceName = rawDoc.source?.name ?? null;
    const isManual = options.skipScreening === true;
    const isAgentMcp = isAgentOrMcpTopic({
      title: rawDoc.title,
      url: rawDoc.url,
      rawText: rawDoc.rawText,
      sourceName,
    });

    let targetType: ContentType = ContentType.NEWS;
    let initialDomains: string[] = [];
    let initialUses: string[] = [];
    let initialTags: string[] = [];

    if (!isManual) {
      const screenRes = await this.generateWithOneRetry(
        {
          systemPrompt: buildPass1SystemPrompt(isAgentMcp),
          userPrompt: JSON.stringify({
            title: rawDoc.title,
            sourceType,
            publishedAt: rawDoc.publishedAt?.toISOString() ?? null,
            excerpt: (rawDoc.rawText ?? '').slice(0, 4000),
          }),
          schema: ScreeningOutputSchema,
        },
        { taskType: 'PASS1_SCREEN', jobRunId: options.jobRunId, isManual: false },
      );

      if (screenRes.relevanceScore < 3) {
        const currentMeta =
          typeof rawDoc.meta === 'object' && rawDoc.meta !== null && !Array.isArray(rawDoc.meta)
            ? (rawDoc.meta as Record<string, unknown>)
            : {};
        await this.prisma.rawDocument.update({
          where: { id: rawDoc.id },
          data: {
            meta: {
              ...currentMeta,
              screenedOut: true,
              relevanceScore: screenRes.relevanceScore,
              skipReason: screenRes.skipReason ?? 'Score below 3',
            },
          },
        });
        return { contentId: null, screenedOut: true };
      }

      targetType = screenRes.recommendedType;
      initialDomains = screenRes.workDomains;
      initialUses = screenRes.aiUses;
      initialTags = screenRes.suggestedTags;
    }

    const schema =
      targetType === ContentType.TOOL
        ? ToolDraftSchema
        : targetType === ContentType.GUIDE
          ? GuideDraftSchema
          : NewsDraftSchema;

    const draft = await this.generateWithOneRetry(
      {
        systemPrompt: buildPass2SystemPrompt(targetType, isAgentMcp),
        userPrompt: JSON.stringify({
          type: targetType,
          title: rawDoc.title,
          url: rawDoc.url,
          isAgentMcpTopic: isAgentMcp,
          suggestedDomains: initialDomains,
          suggestedUses: initialUses,
          suggestedTags: initialTags,
          rawText: (rawDoc.rawText ?? '').slice(0, 12000),
        }),
        schema: schema as z.ZodType<NewsDraft | ToolDraft | GuideDraft>,
      },
      { taskType: 'PASS2_DRAFT', jobRunId: options.jobRunId, isManual },
    );

    const contentId = uuidv7();
    const slug = `${slugify(draft.title)}-${contentId.slice(-6)}`;
    const verificationStatus =
      draft.unverifiedFields.length > 0
        ? VerificationStatus.NEEDS_REVIEW
        : VerificationStatus.VALID;

    const categorySlugs = [
      ...new Set([
        ...initialDomains,
        ...initialUses,
        ...(draft.workDomains ?? []),
        ...(draft.aiUses ?? []),
      ]),
    ];
    const tagSlugs = [
      ...new Set(
        [...initialTags, ...(draft.tags ?? []), ...(isAgentMcp ? [AGENT_MCP_PRIMARY_TAG] : [])]
          .map(slugify)
          .filter(Boolean),
      ),
    ];

    await this.prisma.$transaction(async (tx) => {
      await tx.content.create({
        data: {
          id: contentId,
          type: targetType,
          slug,
          title: draft.title.trim(),
          summary: draft.summary.trim(),
          publishStatus: PublishStatus.IN_REVIEW,
          verificationStatus,
          sourceType,
          sourceUrl: rawDoc.url,
          sourceName,
          rawDocumentId: rawDoc.id,
          aiMetadata: {
            evidenceNotes: draft.evidenceNotes,
            unverifiedFields: draft.unverifiedFields,
            ...(isAgentMcp ? { topicTrack: 'agent-skills-mcp' } : {}),
          },
        },
      });

      if (targetType === ContentType.NEWS) {
        const d = draft as NewsDraft;
        await tx.newsDetail.create({
          data: {
            contentId,
            keyPoints: d.keyPoints,
            workImpact: d.workImpact,
            originalPublishedAt: rawDoc.publishedAt,
          },
        });
      } else if (targetType === ContentType.TOOL) {
        const d = draft as ToolDraft;
        await tx.toolDetail.create({
          data: {
            contentId,
            toolKind: d.toolKind,
            providerName: d.providerName,
            officialUrl: rawDoc.url,
            pricingModel: d.pricingModel,
            hasFreePlan: d.hasFreePlan,
            pricingSummary: d.pricingSummary,
            koreanSupport: d.koreanSupport,
            platforms: d.platforms,
            strengths: d.strengths,
            limitations: d.limitations,
          },
        });
      } else {
        const d = draft as GuideDraft;
        await tx.guideDetail.create({
          data: {
            contentId,
            difficulty: d.difficulty,
            estimatedMinutes: d.estimatedMinutes ?? 10,
            pricingModel: d.pricingModel,
            markdownBody: d.markdownBody,
            prompts: d.prompts.map((p) => ({
              id: uuidv7(),
              title: p.title,
              content: p.content,
              variables: p.variables,
              ...(p.variableExamples ? { variableExamples: p.variableExamples } : {}),
              ...(p.expectedOutput ? { expectedOutput: p.expectedOutput } : {}),
              ...(p.tips ? { tips: p.tips } : {}),
            })),
            beforeAfterExamples: d.beforeAfterExamples.map((e) => ({
              id: uuidv7(),
              title: e.title,
              beforeInput: e.beforeInput,
              afterOutput: e.afterOutput,
              improvementPoints: e.improvementPoints,
            })),
            commonMistakes: d.commonMistakes.map((m) => ({
              id: uuidv7(),
              category: m.category,
              title: m.title,
              mistake: m.mistake,
              prevention: m.prevention,
            })),
            cautions: d.cautions ?? null,
          },
        });
      }

      if (categorySlugs.length > 0) {
        const categories = await tx.category.findMany({
          where: { slug: { in: categorySlugs } },
        });
        if (categories.length > 0) {
          await tx.contentCategory.createMany({
            data: categories.map((c) => ({ contentId, categoryId: c.id })),
            skipDuplicates: true,
          });
        }
      }

      for (const tSlug of tagSlugs) {
        const tag = await tx.tag.upsert({
          where: { slug: tSlug },
          update: {},
          create: { id: uuidv7(), slug: tSlug, name: tSlug },
        });
        await tx.contentTag.create({ data: { contentId, tagId: tag.id } });
      }
    });

    await this.searchVectorService.refresh(contentId);
    return { contentId, screenedOut: false };
  }

  private async generateWithOneRetry<T>(
    req: {
      systemPrompt: string;
      userPrompt: string;
      schema: z.ZodType<T>;
    },
    opts: { taskType: string; jobRunId?: string; isManual: boolean },
  ): Promise<T> {
    try {
      const res = await this.aiRouterService.generateJsonWithGuardrails(req, opts);
      return res.data;
    } catch (err) {
      if (!(err instanceof ZodError)) {
        throw err;
      }
      this.logger.warn(
        `Zod validation failed for ${opts.taskType}; retrying once with error context`,
      );
      const retryRes = await this.aiRouterService.generateJsonWithGuardrails(
        {
          ...req,
          userPrompt: `${req.userPrompt}\n\n[이전 응답 스키마 검증 오류 - 아래 형식을 정확히 준수해 재출력]:\n${JSON.stringify(err.issues)}`,
        },
        opts,
      );
      return retryRes.data;
    }
  }
}
