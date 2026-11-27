import { HttpStatus, Injectable } from '@nestjs/common';
import { buildPaginationMeta } from '../../common/dto/pagination.dto';
import { AppException } from '../../common/exceptions/app.exception';
import {
  mapContentSummary,
  type ContentWithRelations,
} from '../../common/utils/content-mapper.util';
import {
  GUIDE_MISTAKE_CATEGORIES,
  type GuideBeforeAfterExampleDto,
  type GuideCommonMistakeDto,
  type GuideListQueryDto,
  type GuideMistakeCategory,
  type GuidePromptDto,
  type NewsListQueryDto,
  type SkillBeforeAfterDto,
  type SkillExamplePromptDto,
  type SkillExpectedOutputDto,
  type SkillFaqItemDto,
  type SkillInstallGuideDto,
  type SkillListQueryDto,
  type SkillPrerequisiteDto,
  type SkillWebAlternativeDto,
  type SkillWorkflowStepDto,
  type ToolListQueryDto,
} from './contents.dto';
import { ContentsRepository } from './contents.repository';

@Injectable()
export class ContentsService {
  constructor(private readonly contentsRepository: ContentsRepository) {}

  async getHome(userId?: string) {
    const [guidesRaw, toolsRaw, newsRaw, skillsRaw, interestIds, recentVault] = await Promise.all([
      this.contentsRepository.findHomeGuides(18),
      this.contentsRepository.findHomeTools(6),
      this.contentsRepository.findHomeNews(5),
      this.contentsRepository.findHomeSkills(6),
      userId ? this.contentsRepository.getUserInterestCategoryIds(userId) : Promise.resolve([]),
      userId ? this.contentsRepository.getRecentVaultItems(userId, 3) : Promise.resolve(undefined),
    ]);

    let sortedGuides = guidesRaw;
    if (interestIds.length > 0) {
      const interestSet = new Set(interestIds);
      sortedGuides = [...guidesRaw].sort((a, b) => {
        const aMatch = a.categories.some((c) => interestSet.has(c.categoryId)) ? 1 : 0;
        const bMatch = b.categories.some((c) => interestSet.has(c.categoryId)) ? 1 : 0;
        return bMatch - aMatch;
      });
    }

    const topGuides = sortedGuides.slice(0, 6);
    const allIds = [...topGuides, ...toolsRaw, ...newsRaw, ...skillsRaw].map((c) => c.id);
    const flags = userId
      ? await this.contentsRepository.getUserContentFlags(userId, allIds)
      : undefined;

    return {
      guides: topGuides.map((g) => this.mapSummaryWithFlags(g, flags)),
      tools: toolsRaw.map((t) => this.mapToolDetail(t, flags)),
      news: newsRaw.map((n) => this.mapNewsDetail(n, flags)),
      skills: skillsRaw.map((s) => this.mapSkillDetail(s, flags)),
      comparisonPresets: [
        {
          id: 'free-chatbots',
          label: 'ChatGPT vs Claude vs Gemini 무료 플랜 비교',
          slugs: ['chatgpt', 'claude', 'gemini'],
        },
        {
          id: 'research-tools',
          label: 'Perplexity vs NotebookLM 리서치 비교',
          slugs: ['perplexity', 'notebooklm'],
        },
        {
          id: 'workplace-docs',
          label: 'Notion AI vs Microsoft Copilot 문서 업무 비교',
          slugs: ['notion-ai', 'microsoft-copilot'],
        },
      ],
      ...(recentVault
        ? {
            recentVaultItems: recentVault.map((v) => ({
              id: v.id,
              title: v.title,
              itemType: v.itemType,
              url: v.url,
              contentSlug: v.content?.slug ?? null,
              contentType: v.content?.type ?? null,
            })),
          }
        : {}),
    };
  }

  async listGuides(query: GuideListQueryDto, userId?: string) {
    const result = await this.contentsRepository.listGuides(query);
    const flags = userId
      ? await this.contentsRepository.getUserContentFlags(
          userId,
          result.items.map((i) => i.id),
        )
      : undefined;
    return {
      data: result.items.map((i) => this.mapSummaryWithFlags(i, flags)),
      meta: buildPaginationMeta(result.page, result.limit, result.total),
    };
  }

  async getGuideBySlug(slug: string, userId?: string) {
    const found = await this.contentsRepository.findGuideBySlug(slug);
    if (!found) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'CONTENT_NOT_FOUND',
        '가이드를 찾을 수 없습니다.',
      );
    }

    const { guide, relatedGuides } = found;
    const recommendedTools = guide.fromRelations.map((r) => r.toContent);
    const allIds = [
      guide.id,
      ...recommendedTools.map((t) => t.id),
      ...relatedGuides.map((g) => g.id),
    ];
    const flags = userId
      ? await this.contentsRepository.getUserContentFlags(userId, allIds)
      : undefined;

    return {
      ...this.mapSummaryWithFlags(guide, flags),
      difficulty: guide.guideDetail?.difficulty ?? 'PRACTICAL',
      estimatedMinutes: guide.guideDetail?.estimatedMinutes ?? null,
      pricingModel: guide.guideDetail?.pricingModel ?? 'FREEMIUM',
      markdownBody: guide.guideDetail?.markdownBody ?? '',
      prompts: this.normalizeGuidePrompts(guide.guideDetail?.prompts),
      beforeAfterExamples: this.normalizeBeforeAfterExamples(
        guide.guideDetail?.beforeAfterExamples,
      ),
      commonMistakes: this.normalizeCommonMistakes(guide.guideDetail?.commonMistakes),
      verificationChecklist: Array.isArray(guide.guideDetail?.verificationChecklist)
        ? guide.guideDetail.verificationChecklist
        : [],
      cautions: guide.guideDetail?.cautions ?? null,
      toc: Array.isArray(guide.guideDetail?.toc) ? guide.guideDetail.toc : [],
      recommendedTools: recommendedTools.map((t) => this.mapToolDetail(t, flags)),
      relatedGuides: relatedGuides.map((g) => this.mapSummaryWithFlags(g, flags)),
    };
  }

  async listTools(query: ToolListQueryDto, userId?: string) {
    const result = await this.contentsRepository.listTools(query);
    const flags = userId
      ? await this.contentsRepository.getUserContentFlags(
          userId,
          result.items.map((i) => i.id),
        )
      : undefined;
    return {
      data: result.items.map((t) => this.mapToolDetail(t, flags)),
      meta: buildPaginationMeta(result.page, result.limit, result.total),
    };
  }

  async compareTools(slugsRaw: string, userId?: string) {
    const slugs = [
      ...new Set(
        slugsRaw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    ];

    if (slugs.length === 0 || slugs.length > 4) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'VALIDATION_FAILED',
        '비교할 도구/모델은 최소 1개에서 최대 4개까지 선택할 수 있습니다.',
      );
    }

    const tools = await this.contentsRepository.findToolsBySlugs(slugs);
    const bySlug = new Map(tools.map((t) => [t.slug, t]));
    const ordered = slugs.map((s) => bySlug.get(s)).filter(Boolean) as ContentWithRelations[];

    const flags = userId
      ? await this.contentsRepository.getUserContentFlags(
          userId,
          ordered.map((t) => t.id),
        )
      : undefined;

    return ordered.map((t) => this.mapToolDetail(t, flags));
  }

  async getToolBySlug(slug: string, userId?: string) {
    const tool = await this.contentsRepository.findToolBySlug(slug);
    if (!tool) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'CONTENT_NOT_FOUND',
        '도구/모델 정보를 찾을 수 없습니다.',
      );
    }

    const relatedGuides = tool.toRelations
      .filter((r) => r.relationType === 'RECOMMENDED_TOOL')
      .map((r) => r.fromContent);
    const compatibleSkills = tool.toRelations
      .filter((r) => r.relationType === 'COMPATIBLE_TOOL')
      .map((r) => r.fromContent);
    const flags = userId
      ? await this.contentsRepository.getUserContentFlags(userId, [
          tool.id,
          ...relatedGuides.map((g) => g.id),
          ...compatibleSkills.map((s) => s.id),
        ])
      : undefined;

    return {
      ...this.mapToolDetail(tool, flags),
      relatedGuides: relatedGuides.map((g) => this.mapSummaryWithFlags(g, flags)),
      compatibleSkills: compatibleSkills.map((s) => this.mapSkillDetail(s, flags)),
    };
  }

  async listSkills(query: SkillListQueryDto, userId?: string) {
    const result = await this.contentsRepository.listSkills(query);
    const flags = userId
      ? await this.contentsRepository.getUserContentFlags(
          userId,
          result.items.map((i) => i.id),
        )
      : undefined;
    return {
      data: result.items.map((s) => this.mapSkillDetail(s, flags)),
      meta: buildPaginationMeta(result.page, result.limit, result.total),
    };
  }

  async getSkillBySlug(slug: string, userId?: string) {
    const found = await this.contentsRepository.findSkillBySlug(slug);
    if (!found) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'CONTENT_NOT_FOUND',
        '플러그인·스킬 정보를 찾을 수 없습니다.',
      );
    }

    const { skill, relatedSkills } = found;
    const compatibleTools = skill.fromRelations.map((r) => r.toContent);
    const flags = userId
      ? await this.contentsRepository.getUserContentFlags(userId, [
          skill.id,
          ...compatibleTools.map((t) => t.id),
          ...relatedSkills.map((s) => s.id),
        ])
      : undefined;

    return {
      ...this.mapSkillDetail(skill, flags),
      compatibleTools: compatibleTools.map((t) => this.mapToolDetail(t, flags)),
      relatedSkills: relatedSkills.map((s) => this.mapSummaryWithFlags(s, flags)),
    };
  }

  async listNews(query: NewsListQueryDto, userId?: string) {
    const result = await this.contentsRepository.listNews(query);
    const flags = userId
      ? await this.contentsRepository.getUserContentFlags(
          userId,
          result.items.map((i) => i.id),
        )
      : undefined;
    return {
      data: result.items.map((n) => this.mapNewsDetail(n, flags)),
      meta: buildPaginationMeta(result.page, result.limit, result.total),
    };
  }

  async getNewsBySlug(slug: string, userId?: string) {
    const found = await this.contentsRepository.findNewsBySlug(slug);
    if (!found) {
      throw new AppException(HttpStatus.NOT_FOUND, 'CONTENT_NOT_FOUND', '소식을 찾을 수 없습니다.');
    }

    const { news, relatedContents } = found;
    const flags = userId
      ? await this.contentsRepository.getUserContentFlags(userId, [
          news.id,
          ...relatedContents.map((c) => c.id),
        ])
      : undefined;

    return {
      ...this.mapNewsDetail(news, flags),
      relatedContents: relatedContents.map((c) => this.mapSummaryWithFlags(c, flags)),
    };
  }

  private normalizeGuidePrompts(raw: unknown): GuidePromptDto[] {
    if (!Array.isArray(raw)) return [];
    const result: GuidePromptDto[] = [];
    for (let idx = 0; idx < raw.length; idx += 1) {
      const item: unknown = raw[idx];
      if (typeof item !== 'object' || item === null) continue;
      const p = item as Record<string, unknown>;
      const content =
        typeof p.content === 'string' ? p.content : typeof p.prompt === 'string' ? p.prompt : '';
      const variables = Array.isArray(p.variables)
        ? p.variables.filter((v): v is string => typeof v === 'string')
        : [];
      const normalized: GuidePromptDto = {
        id: typeof p.id === 'string' && p.id.length > 0 ? p.id : `prompt-${idx + 1}`,
        title: typeof p.title === 'string' ? p.title : '',
        content,
        variables,
      };
      if (
        typeof p.variableExamples === 'object' &&
        p.variableExamples !== null &&
        !Array.isArray(p.variableExamples)
      ) {
        const examples: Record<string, string> = {};
        for (const [k, v] of Object.entries(p.variableExamples as Record<string, unknown>)) {
          if (typeof v === 'string') {
            examples[k] = v;
          }
        }
        if (Object.keys(examples).length > 0) {
          normalized.variableExamples = examples;
        }
      }
      if (typeof p.expectedOutput === 'string') {
        normalized.expectedOutput = p.expectedOutput;
      }
      if (typeof p.tips === 'string') {
        normalized.tips = p.tips;
      }
      result.push(normalized);
    }
    return result;
  }

  private normalizeBeforeAfterExamples(raw: unknown): GuideBeforeAfterExampleDto[] {
    if (!Array.isArray(raw)) return [];
    const result: GuideBeforeAfterExampleDto[] = [];
    for (let idx = 0; idx < raw.length; idx += 1) {
      const item: unknown = raw[idx];
      if (typeof item !== 'object' || item === null) continue;
      const e = item as Record<string, unknown>;
      result.push({
        id: typeof e.id === 'string' && e.id.length > 0 ? e.id : `example-${idx + 1}`,
        title: typeof e.title === 'string' ? e.title : '',
        beforeInput: typeof e.beforeInput === 'string' ? e.beforeInput : '',
        afterOutput: typeof e.afterOutput === 'string' ? e.afterOutput : '',
        improvementPoints: Array.isArray(e.improvementPoints)
          ? e.improvementPoints.filter((pt): pt is string => typeof pt === 'string')
          : [],
      });
    }
    return result;
  }

  private normalizeCommonMistakes(raw: unknown): GuideCommonMistakeDto[] {
    if (!Array.isArray(raw)) return [];
    const result: GuideCommonMistakeDto[] = [];
    for (let idx = 0; idx < raw.length; idx += 1) {
      const item: unknown = raw[idx];
      if (typeof item !== 'object' || item === null) continue;
      const m = item as Record<string, unknown>;
      const category =
        typeof m.category === 'string' &&
        (GUIDE_MISTAKE_CATEGORIES as readonly string[]).includes(m.category)
          ? (m.category as GuideMistakeCategory)
          : 'WORKFLOW';
      result.push({
        id: typeof m.id === 'string' && m.id.length > 0 ? m.id : `mistake-${idx + 1}`,
        category,
        title: typeof m.title === 'string' ? m.title : '',
        mistake: typeof m.mistake === 'string' ? m.mistake : '',
        prevention: typeof m.prevention === 'string' ? m.prevention : '',
      });
    }
    return result;
  }

  private mapSummaryWithFlags(
    row: ContentWithRelations,
    flags?: { bookmarkedIds: Set<string>; helpfulIds: Set<string> },
  ) {
    return mapContentSummary(row, {
      isBookmarked: flags?.bookmarkedIds.has(row.id) ?? false,
      isHelpful: flags?.helpfulIds.has(row.id) ?? false,
    });
  }

  private mapToolDetail(
    row: ContentWithRelations,
    flags?: { bookmarkedIds: Set<string>; helpfulIds: Set<string> },
  ) {
    const rawDetail = row.toolDetail;

    return {
      ...this.mapSummaryWithFlags(row, flags),
      toolKind: rawDetail?.toolKind ?? 'TOOL',
      providerName: rawDetail?.providerName ?? '',
      officialUrl: rawDetail?.officialUrl ?? row.sourceUrl,
      isAffiliate: rawDetail?.isAffiliate ?? false,
      affiliateUrl: rawDetail?.affiliateUrl ?? null,
      pricingModel: rawDetail?.pricingModel ?? 'FREEMIUM',
      hasFreePlan: rawDetail?.hasFreePlan ?? false,
      pricingSummary: rawDetail?.pricingSummary ?? '',
      pricingPlans: Array.isArray(rawDetail?.pricingPlans)
        ? (rawDetail.pricingPlans as Array<Record<string, unknown>>)
        : [],
      koreanSupport: rawDetail?.koreanSupport ?? 'PARTIAL',
      platforms: rawDetail?.platforms ?? [],
      strengths: rawDetail?.strengths ?? [],
      limitations: rawDetail?.limitations ?? [],
      useCases: Array.isArray(rawDetail?.useCases) ? rawDetail.useCases : [],
      gettingStartedSteps: Array.isArray(rawDetail?.gettingStartedSteps)
        ? (rawDetail.gettingStartedSteps as Array<Record<string, unknown>>)
        : [],
      examplePrompts: Array.isArray(rawDetail?.examplePrompts)
        ? (rawDetail.examplePrompts as Array<Record<string, unknown>>)
        : [],
      faq: this.normalizeFaqItems(rawDetail?.faq),
    };
  }

  private mapSkillDetail(
    row: ContentWithRelations,
    flags?: { bookmarkedIds: Set<string>; helpfulIds: Set<string> },
  ) {
    const s = row.skillDetail;
    return {
      ...this.mapSummaryWithFlags(row, flags),
      skillKind: s?.skillKind ?? 'SKILL',
      skillSlug: s?.skillSlug ?? row.slug,
      authorName: s?.authorName ?? row.sourceName ?? '알콕 큐레이션',
      license: s?.license ?? null,
      repositoryUrl: s?.repositoryUrl ?? row.sourceUrl,
      sourceFileUrl: s?.sourceFileUrl ?? null,
      executionVerification: s?.executionVerification ?? 'SOURCE_CHECKED',
      difficulty: s?.difficulty ?? 'PRACTICAL',
      pricingModel: s?.pricingModel ?? 'FREE',
      compatibleAgents: s?.compatibleAgents ?? [],
      overview: s?.overview ?? row.summary,
      useCases: s?.useCases ?? [],
      beforeAfter: this.normalizeSkillBeforeAfter(s?.beforeAfter),
      workflowSteps: this.normalizeSkillWorkflowSteps(s?.workflowSteps),
      prerequisites: this.normalizeSkillPrerequisites(s?.prerequisites),
      installPrompt: s?.installPrompt ?? null,
      installGuides: this.normalizeSkillInstallGuides(s?.installGuides),
      examplePrompts: this.normalizeSkillExamplePrompts(s?.examplePrompts),
      expectedOutputs: this.normalizeSkillExpectedOutputs(s?.expectedOutputs),
      postRunChecklist: s?.postRunChecklist ?? [],
      tips: s?.tips ?? [],
      cautions: s?.cautions ?? null,
      faq: this.normalizeFaqItems(s?.faq),
      fileStructure: s?.fileStructure ?? [],
      skillMdPreview: s?.skillMdPreview ?? null,
      webAlternative: this.normalizeSkillWebAlternative(s?.webAlternative),
      toc: Array.isArray(s?.toc) ? s.toc : [],
    };
  }

  private normalizeSkillBeforeAfter(raw: unknown): SkillBeforeAfterDto {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      return { beforeItems: [], afterItems: [] };
    }
    const obj = raw as Record<string, unknown>;
    return {
      beforeItems: Array.isArray(obj.beforeItems)
        ? obj.beforeItems.filter((x): x is string => typeof x === 'string')
        : [],
      afterItems: Array.isArray(obj.afterItems)
        ? obj.afterItems.filter((x): x is string => typeof x === 'string')
        : [],
    };
  }

  private normalizeSkillWorkflowSteps(raw: unknown): SkillWorkflowStepDto[] {
    if (!Array.isArray(raw)) return [];
    const out: SkillWorkflowStepDto[] = [];
    for (let idx = 0; idx < raw.length; idx += 1) {
      const item: unknown = raw[idx];
      if (typeof item !== 'object' || item === null) continue;
      const obj = item as Record<string, unknown>;
      out.push({
        step: typeof obj.step === 'number' ? obj.step : idx + 1,
        title: typeof obj.title === 'string' ? obj.title : '',
        description: typeof obj.description === 'string' ? obj.description : '',
        ...(typeof obj.badge === 'string' ? { badge: obj.badge } : {}),
      });
    }
    return out;
  }

  private normalizeSkillPrerequisites(raw: unknown): SkillPrerequisiteDto[] {
    if (!Array.isArray(raw)) return [];
    const out: SkillPrerequisiteDto[] = [];
    for (const item of raw) {
      if (typeof item !== 'object' || item === null) continue;
      const obj = item as Record<string, unknown>;
      out.push({
        name: typeof obj.name === 'string' ? obj.name : '',
        required: typeof obj.required === 'boolean' ? obj.required : true,
        description: typeof obj.description === 'string' ? obj.description : '',
      });
    }
    return out;
  }

  private normalizeSkillInstallGuides(raw: unknown): SkillInstallGuideDto[] {
    if (!Array.isArray(raw)) return [];
    const out: SkillInstallGuideDto[] = [];
    for (const item of raw) {
      if (typeof item !== 'object' || item === null) continue;
      const obj = item as Record<string, unknown>;
      out.push({
        environment: typeof obj.environment === 'string' ? obj.environment : 'claude-code',
        label: typeof obj.label === 'string' ? obj.label : '',
        steps: Array.isArray(obj.steps)
          ? obj.steps.filter((x): x is string => typeof x === 'string')
          : [],
        ...(typeof obj.command === 'string' ? { command: obj.command } : {}),
        ...(typeof obj.invokeExample === 'string' ? { invokeExample: obj.invokeExample } : {}),
      });
    }
    return out;
  }

  private normalizeSkillExamplePrompts(raw: unknown): SkillExamplePromptDto[] {
    if (!Array.isArray(raw)) return [];
    const out: SkillExamplePromptDto[] = [];
    for (const item of raw) {
      if (typeof item !== 'object' || item === null) continue;
      const obj = item as Record<string, unknown>;
      out.push({
        label: typeof obj.label === 'string' ? obj.label : '',
        prompt: typeof obj.prompt === 'string' ? obj.prompt : '',
      });
    }
    return out;
  }

  private normalizeSkillExpectedOutputs(raw: unknown): SkillExpectedOutputDto[] {
    if (!Array.isArray(raw)) return [];
    const out: SkillExpectedOutputDto[] = [];
    for (let idx = 0; idx < raw.length; idx += 1) {
      const item: unknown = raw[idx];
      if (typeof item !== 'object' || item === null) continue;
      const obj = item as Record<string, unknown>;
      out.push({
        order: typeof obj.order === 'string' ? obj.order : String(idx + 1).padStart(2, '0'),
        title: typeof obj.title === 'string' ? obj.title : '',
        description: typeof obj.description === 'string' ? obj.description : '',
      });
    }
    return out;
  }

  private normalizeFaqItems(raw: unknown): SkillFaqItemDto[] {
    if (!Array.isArray(raw)) return [];
    const out: SkillFaqItemDto[] = [];
    for (const item of raw) {
      if (typeof item !== 'object' || item === null) continue;
      const obj = item as Record<string, unknown>;
      out.push({
        question: typeof obj.question === 'string' ? obj.question : '',
        answer: typeof obj.answer === 'string' ? obj.answer : '',
      });
    }
    return out;
  }

  private normalizeSkillWebAlternative(raw: unknown): SkillWebAlternativeDto | null {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
    const obj = raw as Record<string, unknown>;
    return {
      title: typeof obj.title === 'string' ? obj.title : '',
      description: typeof obj.description === 'string' ? obj.description : '',
      recommendedTools: Array.isArray(obj.recommendedTools)
        ? obj.recommendedTools.filter((x): x is string => typeof x === 'string')
        : [],
      ...(typeof obj.guideSlug === 'string' ? { guideSlug: obj.guideSlug } : {}),
    };
  }

  private mapNewsDetail(
    row: ContentWithRelations,
    flags?: { bookmarkedIds: Set<string>; helpfulIds: Set<string> },
  ) {
    return {
      ...this.mapSummaryWithFlags(row, flags),
      keyPoints: row.newsDetail?.keyPoints ?? [],
      workImpact: row.newsDetail?.workImpact ?? '',
      originalPublishedAt: row.newsDetail?.originalPublishedAt?.toISOString() ?? null,
    };
  }
}
