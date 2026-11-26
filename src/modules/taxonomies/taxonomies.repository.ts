import { Injectable } from '@nestjs/common';
import { CategoryGroup, PublishStatus } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class TaxonomiesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveCategories() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  async findPopularTags(limit = 20) {
    const tags = await this.prisma.tag.findMany({
      take: limit,
      include: {
        _count: {
          select: {
            contents: {
              where: {
                content: {
                  publishStatus: PublishStatus.PUBLISHED,
                  deletedAt: null,
                },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return tags
      .map((t) => ({
        id: t.id,
        slug: t.slug,
        name: t.name,
        count: t._count.contents,
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ko'));
  }

  groupCategories(
    categories: Array<{
      id: string;
      group: CategoryGroup;
      slug: string;
      name: string;
      sortOrder: number;
    }>,
  ) {
    return {
      workDomains: categories.filter((c) => c.group === CategoryGroup.WORK_DOMAIN),
      aiUses: categories.filter((c) => c.group === CategoryGroup.AI_USE),
    };
  }
}
