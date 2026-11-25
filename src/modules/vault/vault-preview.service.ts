import { Injectable } from '@nestjs/common';
import { AppException } from '../../common/exceptions/app.exception';
import { RateLimitService } from '../../common/rate-limit/rate-limit.service';
import { normalizeUrl } from '../../common/utils/normalize-url';
import { SafeFetchService } from '../../common/utils/safe-fetch';
import { HtmlExtractorService } from '../ingestion/html-extractor.service';
import { VaultRepository } from './vault.repository';

export interface VaultPreviewResult {
  parsed: boolean;
  fallback: boolean;
  url: string;
  normalizedUrl: string;
  title: string | null;
  description: string | null;
  faviconUrl: string | null;
  thumbnailUrl: string | null;
  alreadySavedItemId: string | null;
}

@Injectable()
export class VaultPreviewService {
  constructor(
    private readonly safeFetchService: SafeFetchService,
    private readonly htmlExtractorService: HtmlExtractorService,
    private readonly vaultRepository: VaultRepository,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async previewUrl(userId: string, rawUrl: string): Promise<VaultPreviewResult> {
    this.rateLimitService.consume(`vault:preview:${userId}`, 15, 60 * 1000);

    const normalizedUrl = normalizeUrl(rawUrl);
    const existing = await this.vaultRepository.findItemByUserAndNormalizedUrl(
      userId,
      normalizedUrl,
    );
    const alreadySavedItemId = existing?.id ?? null;

    try {
      const response = await this.safeFetchService.fetchText(normalizedUrl);
      if (response.status >= 400) {
        return this.buildFallback(rawUrl, normalizedUrl, alreadySavedItemId);
      }

      const extracted = this.htmlExtractorService.parseHtml(response.bodyText, response.finalUrl);
      if (!extracted.title && !extracted.description) {
        return this.buildFallback(rawUrl, normalizedUrl, alreadySavedItemId);
      }

      return {
        parsed: true,
        fallback: false,
        url: extracted.finalUrl,
        normalizedUrl,
        title: extracted.title,
        description: extracted.description,
        faviconUrl: extracted.faviconUrl,
        thumbnailUrl: extracted.thumbnailUrl ?? extracted.faviconUrl,
        alreadySavedItemId,
      };
    } catch (err) {
      if (err instanceof AppException && err.errorCode === 'SSRF_BLOCKED_URL') {
        throw err;
      }
      return this.buildFallback(rawUrl, normalizedUrl, alreadySavedItemId);
    }
  }

  private buildFallback(
    url: string,
    normalizedUrl: string,
    alreadySavedItemId: string | null,
  ): VaultPreviewResult {
    return {
      parsed: false,
      fallback: true,
      url,
      normalizedUrl,
      title: null,
      description: null,
      faviconUrl: null,
      thumbnailUrl: null,
      alreadySavedItemId,
    };
  }
}
