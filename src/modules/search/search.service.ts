import { Injectable } from '@nestjs/common';
import { buildPaginationMeta } from '../../common/dto/pagination.dto';
import { RateLimitService } from '../../common/rate-limit/rate-limit.service';
import { mapContentSummary } from '../../common/utils/content-mapper.util';
import type { SearchQueryDto } from './search.dto';
import { SearchRepository } from './search.repository';

@Injectable()
export class SearchService {
  constructor(
    private readonly searchRepository: SearchRepository,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async search(query: SearchQueryDto, userId?: string) {
    const includeContents = query.type !== 'VAULT';
    const includeVault = Boolean(userId && (query.type === 'ALL' || query.type === 'VAULT'));

    const [contentRes, vaultItems] = await Promise.all([
      includeContents
        ? this.searchRepository.searchContents(query)
        : Promise.resolve({
            items: [],
            total: 0,
            page: query.page ?? 1,
            limit: query.limit ?? 20,
          }),
      includeVault && userId
        ? this.searchRepository.searchVaultItems(userId, query.q)
        : Promise.resolve(undefined),
    ]);

    return {
      data: {
        items: contentRes.items.map((item) => mapContentSummary(item)),
        ...(vaultItems !== undefined ? { vaultItems } : {}),
      },
      meta: buildPaginationMeta(contentRes.page, contentRes.limit, contentRes.total),
    };
  }

  suggest(q: string, ip: string) {
    this.rateLimitService.consume(`search:suggest:${ip}`, 60, 60 * 1000);
    return this.searchRepository.suggest(q);
  }
}
