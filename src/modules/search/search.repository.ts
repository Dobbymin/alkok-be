import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { SearchQueryDto } from './search.dto';

interface RankedIdRow {
  id: string;
  score: number;
}

interface CountRow {
  total: bigint;
}

export interface SuggestRow {
  id: string;
  type: string;
  slug: string;
  title: string;
}

@Injectable()
export class SearchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async searchContents(query: SearchQueryDto) {
    const q = query.q.trim();
    const stem = q.length >= 3 ? q.slice(0, q.length - 1) : q;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const typeFilter =
      query.type && query.type !== 'ALL' && query.type !== 'VAULT'
        ? Prisma.sql`AND c.type = ${query.type}::"ContentType"`
        : Prisma.empty;

    const validFilter = query.validOnly
      ? Prisma.sql`AND c.verification_status = 'VALID'::"VerificationStatus"`
      : Prisma.empty;

    const domainFilter = query.workDomain
      ? Prisma.sql`AND EXISTS (
          SELECT 1 FROM content_categories cc
          JOIN categories cat ON cat.id = cc.category_id
          WHERE cc.content_id = c.id AND cat.slug = ${query.workDomain}
        )`
      : Prisma.empty;

    const matchCondition = Prisma.sql`(
      c.search_vector @@ plainto_tsquery('simple', ${q})
      OR similarity(c.title, ${q}) > 0.1
      OR word_similarity(${q}, c.title) > 0.25
      OR word_similarity(c.title, ${q}) > 0.25
      OR c.title ILIKE '%' || ${q} || '%'
      OR c.summary ILIKE '%' || ${q} || '%'
      OR c.title ILIKE '%' || ${stem} || '%'
      OR c.summary ILIKE '%' || ${stem} || '%'
      OR EXISTS (
        SELECT 1 FROM content_tags ct
        JOIN tags t ON t.id = ct.tag_id
        WHERE ct.content_id = c.id
          AND (t.name ILIKE '%' || ${q} || '%' OR similarity(t.name, ${q}) > 0.2)
      )
    )`;

    const [idRows, countRows] = await Promise.all([
      this.prisma.$queryRaw<RankedIdRow[]>`
        SELECT
          c.id,
          (
            coalesce(ts_rank_cd(c.search_vector, plainto_tsquery('simple', ${q})), 0) * 0.5 +
            greatest(similarity(c.title, ${q}), word_similarity(${q}, c.title), word_similarity(c.title, ${q})) * 0.35 +
            (CASE WHEN c.verification_status = 'VALID' THEN 0.15 ELSE 0 END) +
            (CASE WHEN c.type = 'GUIDE' THEN 0.10 ELSE 0 END)
          )::float8 AS score
        FROM contents c
        WHERE c.publish_status = 'PUBLISHED'::"PublishStatus"
          AND c.deleted_at IS NULL
          ${typeFilter}
          ${validFilter}
          ${domainFilter}
          AND ${matchCondition}
        ORDER BY score DESC, c.published_at DESC NULLS LAST
        LIMIT ${limit}
        OFFSET ${offset}
      `,
      this.prisma.$queryRaw<CountRow[]>`
        SELECT COUNT(*)::bigint AS total
        FROM contents c
        WHERE c.publish_status = 'PUBLISHED'::"PublishStatus"
          AND c.deleted_at IS NULL
          ${typeFilter}
          ${validFilter}
          ${domainFilter}
          AND ${matchCondition}
      `,
    ]);

    const total = Number(countRows[0]?.total ?? 0n);
    if (idRows.length === 0) {
      return { items: [], total, page, limit };
    }

    const orderedIds = idRows.map((r) => r.id);
    const contents = await this.prisma.content.findMany({
      where: { id: { in: orderedIds } },
      include: {
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
      },
    });
    const byId = new Map(contents.map((c) => [c.id, c]));
    const ordered = orderedIds.map((id) => byId.get(id)).filter(Boolean) as typeof contents;

    return { items: ordered, total, page, limit };
  }

  async searchVaultItems(userId: string, qRaw: string, limit = 10) {
    const q = qRaw.trim();
    return this.prisma.vaultItem.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { memo: { contains: q, mode: 'insensitive' } },
          { url: { contains: q, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        url: true,
        memo: true,
      },
    });
  }

  suggest(qRaw: string) {
    const q = qRaw.trim();
    const stem = q.length >= 3 ? q.slice(0, q.length - 1) : q;
    return this.prisma.$queryRaw<SuggestRow[]>`
      SELECT
        c.id,
        c.type::text AS type,
        c.slug,
        c.title
      FROM contents c
      WHERE c.publish_status = 'PUBLISHED'::"PublishStatus"
        AND c.deleted_at IS NULL
        AND (
          c.title ILIKE '%' || ${q} || '%'
          OR c.title ILIKE '%' || ${stem} || '%'
          OR similarity(c.title, ${q}) > 0.1
          OR EXISTS (
            SELECT 1 FROM content_tags ct
            JOIN tags t ON t.id = ct.tag_id
            WHERE ct.content_id = c.id
              AND (t.name ILIKE '%' || ${q} || '%' OR similarity(t.name, ${q}) > 0.2)
          )
        )
      ORDER BY
        greatest(similarity(c.title, ${q}), word_similarity(${q}, c.title)) DESC,
        (CASE WHEN c.type = 'GUIDE' THEN 1 ELSE 0 END) DESC,
        c.published_at DESC NULLS LAST
      LIMIT 8
    `;
  }
}
