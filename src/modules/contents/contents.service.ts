import { HttpStatus, Injectable } from '@nestjs/common';
import { buildPaginationMeta } from '../../common/dto/pagination.dto';
import { AppException } from '../../common/exceptions/app.exception';
import {
  mapContentSummary,
  type ContentWithRelations,
} from '../../common/utils/content-mapper.util';
import type { GuideListQueryDto, NewsListQueryDto, ToolListQueryDto } from './contents.dto';
import { ContentsRepository } from './contents.repository';

@Injectable()
export class ContentsService {
  constructor(private readonly contentsRepository: ContentsRepository) {}

  async getHome(userId?: string) {
    const [guidesRaw, toolsRaw, newsRaw, interestIds, recentVault] = await Promise.all([
      this.contentsRepository.findHomeGuides(18),
      this.contentsRepository.findHomeTools(6),
      this.contentsRepository.findHomeNews(5),
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
    const allIds = [...topGuides, ...toolsRaw, ...newsRaw].map((c) => c.id);
    const flags = userId
      ? await this.contentsRepository.getUserContentFlags(userId, allIds)
      : undefined;

    return {
      guides: topGuides.map((g) => this.mapSummaryWithFlags(g, flags)),
      tools: toolsRaw.map((t) => this.mapToolDetail(t, flags)),
      news: newsRaw.map((n) => this.mapNewsDetail(n, flags)),
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
      prompts: Array.isArray(guide.guideDetail?.prompts)
        ? guide.guideDetail.prompts.map((item) => {
            if (typeof item === 'object' && item !== null) {
              const p = item as Record<string, unknown>;
              const content =
                typeof p.content === 'string'
                  ? p.content
                  : typeof p.prompt === 'string'
                    ? p.prompt
                    : '';
              return {
                ...p,
                content,
                variables: Array.isArray(p.variables) ? p.variables : [],
              };
            }
            return item;
          })
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

    const relatedGuides = tool.toRelations.map((r) => r.fromContent);
    const flags = userId
      ? await this.contentsRepository.getUserContentFlags(userId, [
          tool.id,
          ...relatedGuides.map((g) => g.id),
        ])
      : undefined;

    return {
      ...this.mapToolDetail(tool, flags),
      relatedGuides: relatedGuides.map((g) => this.mapSummaryWithFlags(g, flags)),
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
    return {
      ...this.mapSummaryWithFlags(row, flags),
      toolKind: row.toolDetail?.toolKind ?? 'TOOL',
      providerName: row.toolDetail?.providerName ?? '',
      officialUrl: row.toolDetail?.officialUrl ?? row.sourceUrl,
      isAffiliate: row.toolDetail?.isAffiliate ?? false,
      affiliateUrl: row.toolDetail?.affiliateUrl ?? null,
      pricingModel: row.toolDetail?.pricingModel ?? 'FREEMIUM',
      hasFreePlan: row.toolDetail?.hasFreePlan ?? false,
      pricingSummary: row.toolDetail?.pricingSummary ?? '',
      koreanSupport: row.toolDetail?.koreanSupport ?? 'PARTIAL',
      platforms: row.toolDetail?.platforms ?? [],
      strengths: row.toolDetail?.strengths ?? [],
      limitations: row.toolDetail?.limitations ?? [],
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
