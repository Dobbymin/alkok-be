import type { ContentType } from '@prisma/client';

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return base || `item-${Date.now()}`;
}

export interface ContentWithRelations {
  id: string;
  type: ContentType;
  slug: string;
  title: string;
  summary: string;
  publishStatus: string;
  verificationStatus: string;
  verifiedAt: Date | null;
  publishedAt: Date | null;
  sourceType: string;
  sourceUrl: string;
  sourceName: string | null;
  helpfulCount: number;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  categories?: Array<{
    category: {
      id: string;
      group: string;
      slug: string;
      name: string;
      sortOrder: number;
    };
  }>;
  tags?: Array<{
    tag: {
      id: string;
      slug: string;
      name: string;
    };
  }>;
  guideDetail?: {
    difficulty: string;
    estimatedMinutes: number | null;
    pricingModel: string;
    markdownBody: string;
    prompts: unknown;
    cautions: string | null;
    toc: unknown;
  } | null;
  toolDetail?: {
    toolKind: string;
    providerName: string;
    officialUrl: string;
    isAffiliate: boolean;
    affiliateUrl: string | null;
    pricingModel: string;
    hasFreePlan: boolean;
    pricingSummary: string;
    pricingPlans: unknown;
    koreanSupport: string;
    platforms: string[];
    strengths: string[];
    limitations: string[];
  } | null;
  newsDetail?: {
    keyPoints: string[];
    workImpact: string;
    originalPublishedAt: Date | null;
  } | null;
}

export function mapContentSummary(
  row: ContentWithRelations,
  flags?: { isBookmarked?: boolean; isHelpful?: boolean },
) {
  return {
    id: row.id,
    type: row.type,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    publishStatus: row.publishStatus,
    verificationStatus: row.verificationStatus,
    verifiedAt: row.verifiedAt?.toISOString() ?? null,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    sourceType: row.sourceType,
    sourceUrl: row.sourceUrl,
    sourceName: row.sourceName,
    helpfulCount: row.helpfulCount,
    isFeatured: row.isFeatured,
    isBookmarked: flags?.isBookmarked ?? false,
    isHelpful: flags?.isHelpful ?? false,
    categories: row.categories?.map((c) => c.category) ?? [],
    tags: row.tags?.map((t) => t.tag) ?? [],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
