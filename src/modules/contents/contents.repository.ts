import { Injectable } from '@nestjs/common';
import { ContentType, Prisma, PublishStatus, VerificationStatus } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { GuideListQueryDto, NewsListQueryDto, ToolListQueryDto } from './contents.dto';

const PUBLIC_WHERE_BASE: Prisma.ContentWhereInput = {
  publishStatus: PublishStatus.PUBLISHED,
  deletedAt: null,
};

const PUBLIC_INCLUDE = {
  categories: { include: { category: true } },
  tags: { include: { tag: true } },
  guideDetail: true,
  toolDetail: true,
  newsDetail: true,
} satisfies Prisma.ContentInclude;

@Injectable()
export class ContentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getUserInterestCategoryIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.userInterest.findMany({
      where: { userId },
      select: { categoryId: true },
    });
    return rows.map((r) => r.categoryId);
  }

  async getUserContentFlags(userId: string, contentIds: string[]) {
    if (contentIds.length === 0) {
      return { bookmarkedIds: new Set<string>(), helpfulIds: new Set<string>() };
    }
    const [bookmarks, helpfuls] = await Promise.all([
      this.prisma.vaultItem.findMany({
        where: { userId, contentId: { in: contentIds } },
        select: { contentId: true },
      }),
      this.prisma.helpfulVote.findMany({
        where: { userId, contentId: { in: contentIds } },
        select: { contentId: true },
      }),
    ]);

    return {
      bookmarkedIds: new Set(bookmarks.map((b) => b.contentId).filter(Boolean) as string[]),
      helpfulIds: new Set(helpfuls.map((h) => h.contentId)),
    };
  }

  async getRecentVaultItems(userId: string, limit = 3) {
    return this.prisma.vaultItem.findMany({
      where: { userId },
      include: { content: { select: { slug: true, type: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  findHomeGuides(limit = 12) {
    return this.prisma.content.findMany({
      where: { ...PUBLIC_WHERE_BASE, type: ContentType.GUIDE },
      include: PUBLIC_INCLUDE,
      orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
      take: limit,
    });
  }

  findHomeTools(limit = 6) {
    return this.prisma.content.findMany({
      where: { ...PUBLIC_WHERE_BASE, type: ContentType.TOOL },
      include: PUBLIC_INCLUDE,
      orderBy: [{ isFeatured: 'desc' }, { helpfulCount: 'desc' }, { publishedAt: 'desc' }],
      take: limit,
    });
  }

  findHomeNews(limit = 5) {
    return this.prisma.content.findMany({
      where: { ...PUBLIC_WHERE_BASE, type: ContentType.NEWS },
      include: PUBLIC_INCLUDE,
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });
  }

  async listGuides(query: GuideListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 18;
    const categorySlugs = [query.workDomain, query.aiUse].filter(Boolean) as string[];

    const where: Prisma.ContentWhereInput = {
      ...PUBLIC_WHERE_BASE,
      type: ContentType.GUIDE,
      ...(categorySlugs.length > 0
        ? {
            AND: categorySlugs.map((slug) => ({
              categories: { some: { category: { slug } } },
            })),
          }
        : {}),
      ...(query.difficulty || query.pricingModel
        ? {
            guideDetail: {
              ...(query.difficulty ? { difficulty: query.difficulty } : {}),
              ...(query.pricingModel ? { pricingModel: query.pricingModel } : {}),
            },
          }
        : {}),
    };

    const orderBy: Prisma.ContentOrderByWithRelationInput[] =
      query.sort === 'latest'
        ? [{ publishedAt: 'desc' }]
        : query.sort === 'helpful'
          ? [{ helpfulCount: 'desc' }, { publishedAt: 'desc' }]
          : [{ isFeatured: 'desc' }, { helpfulCount: 'desc' }, { publishedAt: 'desc' }];

    const [items, total] = await this.prisma.$transaction([
      this.prisma.content.findMany({
        where,
        include: PUBLIC_INCLUDE,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.content.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findGuideBySlug(slug: string) {
    const guide = await this.prisma.content.findFirst({
      where: { ...PUBLIC_WHERE_BASE, type: ContentType.GUIDE, slug },
      include: {
        ...PUBLIC_INCLUDE,
        fromRelations: {
          where: {
            relationType: 'RECOMMENDED_TOOL',
            toContent: PUBLIC_WHERE_BASE,
          },
          include: {
            toContent: { include: PUBLIC_INCLUDE },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!guide) return null;

    const domainIds = guide.categories
      .filter((c) => c.category.group === 'WORK_DOMAIN')
      .map((c) => c.categoryId);

    const relatedGuides = await this.prisma.content.findMany({
      where: {
        ...PUBLIC_WHERE_BASE,
        type: ContentType.GUIDE,
        id: { not: guide.id },
        ...(domainIds.length > 0
          ? { categories: { some: { categoryId: { in: domainIds } } } }
          : {}),
      },
      include: PUBLIC_INCLUDE,
      orderBy: { publishedAt: 'desc' },
      take: 3,
    });

    return { guide, relatedGuides };
  }

  async listTools(query: ToolListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const categorySlugs = [query.workDomain, query.aiUse].filter(Boolean) as string[];

    const where: Prisma.ContentWhereInput = {
      ...PUBLIC_WHERE_BASE,
      type: ContentType.TOOL,
      ...(query.validOnly ? { verificationStatus: VerificationStatus.VALID } : {}),
      ...(categorySlugs.length > 0
        ? {
            AND: categorySlugs.map((slug) => ({
              categories: { some: { category: { slug } } },
            })),
          }
        : {}),
      ...(query.toolKind || query.hasFreePlan !== undefined || query.koreanSupport
        ? {
            toolDetail: {
              ...(query.toolKind ? { toolKind: query.toolKind } : {}),
              ...(query.hasFreePlan !== undefined ? { hasFreePlan: query.hasFreePlan } : {}),
              ...(query.koreanSupport ? { koreanSupport: query.koreanSupport } : {}),
            },
          }
        : {}),
    };

    const orderBy: Prisma.ContentOrderByWithRelationInput[] =
      query.sort === 'latest'
        ? [{ publishedAt: 'desc' }]
        : query.sort === 'helpful'
          ? [{ helpfulCount: 'desc' }, { publishedAt: 'desc' }]
          : [{ isFeatured: 'desc' }, { helpfulCount: 'desc' }, { publishedAt: 'desc' }];

    const [items, total] = await this.prisma.$transaction([
      this.prisma.content.findMany({
        where,
        include: PUBLIC_INCLUDE,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.content.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  findToolsBySlugs(slugs: string[]) {
    return this.prisma.content.findMany({
      where: {
        ...PUBLIC_WHERE_BASE,
        type: ContentType.TOOL,
        slug: { in: slugs },
      },
      include: PUBLIC_INCLUDE,
    });
  }

  async findToolBySlug(slug: string) {
    const tool = await this.prisma.content.findFirst({
      where: { ...PUBLIC_WHERE_BASE, type: ContentType.TOOL, slug },
      include: {
        ...PUBLIC_INCLUDE,
        toRelations: {
          where: {
            relationType: 'RECOMMENDED_TOOL',
            fromContent: PUBLIC_WHERE_BASE,
          },
          include: {
            fromContent: { include: PUBLIC_INCLUDE },
          },
        },
      },
    });
    return tool;
  }

  async listNews(query: NewsListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ContentWhereInput = {
      ...PUBLIC_WHERE_BASE,
      type: ContentType.NEWS,
      ...(query.tag ? { tags: { some: { tag: { slug: query.tag.toLowerCase() } } } } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.content.findMany({
        where,
        include: PUBLIC_INCLUDE,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.content.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findNewsBySlug(slug: string) {
    const news = await this.prisma.content.findFirst({
      where: { ...PUBLIC_WHERE_BASE, type: ContentType.NEWS, slug },
      include: PUBLIC_INCLUDE,
    });
    if (!news) return null;

    const relatedContents = await this.prisma.content.findMany({
      where: {
        ...PUBLIC_WHERE_BASE,
        id: { not: news.id },
        type: { in: [ContentType.GUIDE, ContentType.TOOL] },
      },
      include: PUBLIC_INCLUDE,
      orderBy: { publishedAt: 'desc' },
      take: 3,
    });

    return { news, relatedContents };
  }
}
