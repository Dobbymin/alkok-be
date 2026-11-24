import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JobStatus, JobType } from '@prisma/client';
import Parser from 'rss-parser';
import { normalizeUrl } from '../../common/utils/normalize-url';
import { SafeFetchService } from '../../common/utils/safe-fetch';
import { uuidv7 } from '../../common/utils/uuidv7';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { HtmlExtractorService } from './html-extractor.service';
import { JobWorkerService } from './job-worker.service';

const MAX_ITEMS_PER_FETCH = 15;
const MAX_RAW_TEXT_CHARS = 20_000;

@Injectable()
export class RssFetcherService implements OnModuleInit {
  private readonly logger = new Logger(RssFetcherService.name);
  private readonly rssParser = new Parser();

  constructor(
    private readonly prisma: PrismaService,
    private readonly safeFetchService: SafeFetchService,
    private readonly htmlExtractorService: HtmlExtractorService,
    private readonly jobWorkerService: JobWorkerService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit(): void {
    this.jobWorkerService.registerHandler(JobType.RSS_FETCH, async (job) => {
      const sourceId = typeof job.payload.sourceId === 'string' ? job.payload.sourceId : '';
      if (!sourceId) {
        throw new Error('RSS_FETCH job missing sourceId');
      }
      await this.fetchSourceById(sourceId);
    });
  }

  @Cron(CronExpression.EVERY_HOUR)
  async scheduleDueSources(): Promise<void> {
    if (!this.configService.get<boolean>('ENABLE_SCHEDULER')) {
      return;
    }
    const sources = await this.prisma.source.findMany({
      where: { isActive: true, deletedAt: null },
    });

    const now = Date.now();
    for (const src of sources) {
      const intervalMs = src.fetchIntervalHours * 60 * 60 * 1000;
      const due = !src.lastFetchedAt || now - src.lastFetchedAt.getTime() >= intervalMs;
      if (due) {
        await this.prisma.jobRun.create({
          data: {
            id: uuidv7(),
            type: JobType.RSS_FETCH,
            status: JobStatus.PENDING,
            payload: { sourceId: src.id },
          },
        });
      }
    }
  }

  async fetchSourceById(sourceId: string): Promise<{ insertedCount: number }> {
    const source = await this.prisma.source.findFirst({
      where: { id: sourceId, deletedAt: null },
    });
    if (!source) {
      return { insertedCount: 0 };
    }

    try {
      const res = await this.safeFetchService.fetchText(source.feedUrl);
      if (res.status >= 400) {
        throw new Error(`Feed HTTP ${res.status}`);
      }

      const items = await this.parseFeedItems(res.bodyText, res.contentType);
      const limited = items.slice(0, MAX_ITEMS_PER_FETCH);

      let insertedCount = 0;
      for (const item of limited) {
        if (!item.link) continue;
        let normUrl: string;
        try {
          normUrl = normalizeUrl(item.link);
        } catch {
          continue;
        }

        const existing = await this.prisma.rawDocument.findUnique({
          where: { normalizedUrl: normUrl },
        });
        if (existing) {
          continue;
        }

        const rawText = (item.content || '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, MAX_RAW_TEXT_CHARS);
        const rawDoc = await this.prisma.rawDocument.create({
          data: {
            id: uuidv7(),
            sourceId: source.id,
            url: item.link,
            normalizedUrl: normUrl,
            title: (item.title || normUrl).slice(0, 500),
            rawText,
            publishedAt: item.pubDate ? new Date(item.pubDate) : null,
            meta: {
              sourceName: source.name,
              sourceType: source.sourceType,
            },
          },
        });

        await this.prisma.jobRun.create({
          data: {
            id: uuidv7(),
            type: JobType.AI_DRAFT,
            status: JobStatus.PENDING,
            payload: { rawDocumentId: rawDoc.id, skipScreening: false },
          },
        });
        insertedCount += 1;
      }

      await this.prisma.source.update({
        where: { id: source.id },
        data: { lastFetchedAt: new Date(), lastError: null },
      });

      return { insertedCount };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await this.prisma.source.update({
        where: { id: source.id },
        data: { lastFetchedAt: new Date(), lastError: msg.slice(0, 500) },
      });
      throw err;
    }
  }

  async ingestManualUrl(rawUrl: string): Promise<{ jobId: string; rawDocumentId: string }> {
    const normalized = normalizeUrl(rawUrl);
    const existing = await this.prisma.rawDocument.findUnique({
      where: { normalizedUrl: normalized },
    });

    if (existing) {
      const job = await this.prisma.jobRun.create({
        data: {
          id: uuidv7(),
          type: JobType.AI_DRAFT,
          status: JobStatus.PENDING,
          payload: { rawDocumentId: existing.id, skipScreening: true },
        },
      });
      return { jobId: job.id, rawDocumentId: existing.id };
    }

    const extracted = await this.htmlExtractorService.extractFromUrl(normalized);
    const rawDoc = await this.prisma.rawDocument.create({
      data: {
        id: uuidv7(),
        url: extracted.finalUrl,
        normalizedUrl: normalizeUrl(extracted.finalUrl),
        title: extracted.title || normalized,
        rawText: extracted.textContent.slice(0, MAX_RAW_TEXT_CHARS),
        meta: { manual: true, description: extracted.description },
      },
    });

    const job = await this.prisma.jobRun.create({
      data: {
        id: uuidv7(),
        type: JobType.AI_DRAFT,
        status: JobStatus.PENDING,
        payload: { rawDocumentId: rawDoc.id, skipScreening: true },
      },
    });

    return { jobId: job.id, rawDocumentId: rawDoc.id };
  }

  private async parseFeedItems(
    bodyText: string,
    contentType: string,
  ): Promise<Array<{ link?: string; title?: string; content?: string; pubDate?: string }>> {
    if (contentType.includes('application/json') || bodyText.trim().startsWith('{')) {
      try {
        const json = JSON.parse(bodyText) as {
          items?: Array<{
            url?: string;
            link?: string;
            title?: string;
            content_text?: string;
            content_html?: string;
            summary?: string;
            date_published?: string;
          }>;
        };
        return (json.items ?? []).map((item) => ({
          link: item.url || item.link,
          title: item.title,
          content: item.content_text || item.summary || item.content_html || '',
          pubDate: item.date_published,
        }));
      } catch {
        this.logger.warn('Failed to parse JSON feed, falling back to RSS parser');
      }
    }

    const feed = await this.rssParser.parseString(bodyText);
    return (feed.items ?? []).map((item) => ({
      link: item.link,
      title: item.title,
      content: item.contentSnippet || item.content || item.summary || '',
      pubDate: item.isoDate || item.pubDate,
    }));
  }
}
