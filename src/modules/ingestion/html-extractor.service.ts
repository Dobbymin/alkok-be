import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { SafeFetchService } from '../../common/utils/safe-fetch';

export interface ExtractedHtmlMetadata {
  finalUrl: string;
  title: string | null;
  description: string | null;
  faviconUrl: string | null;
  thumbnailUrl: string | null;
  textContent: string;
}

const MAX_RAW_TEXT_CHARS = 20_000;

@Injectable()
export class HtmlExtractorService {
  private readonly logger = new Logger(HtmlExtractorService.name);

  constructor(private readonly safeFetchService: SafeFetchService) {}

  async isAllowedByRobots(targetUrl: string): Promise<boolean> {
    try {
      const u = new URL(targetUrl);
      const robotsUrl = `${u.protocol}//${u.host}/robots.txt`;
      const res = await this.safeFetchService.fetchText(robotsUrl, {
        timeoutMs: 2000,
        maxBytes: 64 * 1024,
      });
      if (res.status >= 400) {
        return true;
      }
      const lines = res.bodyText.split(/\r?\n/);
      let inWildcard = false;
      for (const rawLine of lines) {
        const line = rawLine.split('#')[0].trim();
        if (!line) continue;
        const lower = line.toLowerCase();
        if (lower.startsWith('user-agent:')) {
          const agent = line.slice('user-agent:'.length).trim().toLowerCase();
          inWildcard = agent === '*' || agent === 'alkokbot';
        } else if (inWildcard && lower.startsWith('disallow:')) {
          const disallowed = line.slice('disallow:'.length).trim();
          if (disallowed && u.pathname.startsWith(disallowed)) {
            return false;
          }
        }
      }
      return true;
    } catch {
      return true;
    }
  }

  parseHtml(html: string, finalUrl: string): ExtractedHtmlMetadata {
    const $ = cheerio.load(html);

    const ogTitle = $('meta[property="og:title"]').attr('content')?.trim() || null;
    const htmlTitle = $('title').first().text().trim() || null;
    const title = ogTitle || htmlTitle;

    const ogDesc = $('meta[property="og:description"]').attr('content')?.trim() || null;
    const metaDesc = $('meta[name="description"]').attr('content')?.trim() || null;
    const description = ogDesc || metaDesc;

    const ogImageRaw = $('meta[property="og:image"]').attr('content')?.trim() || null;
    const thumbnailUrl = ogImageRaw ? this.resolveUrlSafe(ogImageRaw, finalUrl) : null;

    const iconRaw =
      $('link[rel="icon"]').attr('href')?.trim() ||
      $('link[rel="shortcut icon"]').attr('href')?.trim() ||
      $('link[rel="apple-touch-icon"]').attr('href')?.trim() ||
      null;
    const faviconUrl = iconRaw
      ? this.resolveUrlSafe(iconRaw, finalUrl)
      : this.resolveUrlSafe('/favicon.ico', finalUrl);

    $('script, style, nav, footer, aside, noscript, iframe, svg').remove();
    const mainEl = $('main, article').first();
    const rawText = (mainEl.length > 0 ? mainEl.text() : $('body').text())
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, MAX_RAW_TEXT_CHARS);

    return {
      finalUrl,
      title,
      description,
      faviconUrl,
      thumbnailUrl,
      textContent: rawText,
    };
  }

  async extractFromUrl(targetUrl: string): Promise<ExtractedHtmlMetadata> {
    const allowed = await this.isAllowedByRobots(targetUrl);
    if (!allowed) {
      this.logger.warn(`robots.txt disallows crawling ${targetUrl}`);
    }
    const res = await this.safeFetchService.fetchText(targetUrl);
    if (res.status >= 400) {
      throw new Error(`HTTP ${res.status}`);
    }
    return this.parseHtml(res.bodyText, res.finalUrl);
  }

  private resolveUrlSafe(candidate: string, base: string): string | null {
    try {
      return new URL(candidate, base).toString();
    } catch {
      return null;
    }
  }
}
