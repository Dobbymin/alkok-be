import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JobStatus, JobType, SourceType, UserRole, UserStatus } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { RateLimitService } from '../src/common/rate-limit/rate-limit.service';
import { hashPassword } from '../src/common/utils/crypto.util';
import { SafeFetchService } from '../src/common/utils/safe-fetch';
import { uuidv7 } from '../src/common/utils/uuidv7';
import { PrismaService } from '../src/infra/prisma/prisma.service';
import { configureApp } from '../src/main';
import { JobWorkerService } from '../src/modules/ingestion/job-worker.service';
import { RssFetcherService } from '../src/modules/ingestion/rss-fetcher.service';

describe('JobWorker & RSS/Manual URL Ingestion (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jobWorker: JobWorkerService;
  let rssFetcher: RssFetcherService;
  let adminToken: string;
  let sourceId: string;

  const sampleItems = Array.from({ length: 18 }, (_, i) => {
    const longText = i === 0 ? '가'.repeat(25_000) : `요약 본문 ${i}`;
    return `<item><title>AI 기사 ${i}</title><link>https://example.com/news/${i}?utm_source=rss</link><description>${longText}</description></item>`;
  }).join('');

  const mockSafeFetch = {
    fetchText: jest.fn().mockImplementation((url: string) => {
      if (url.includes('robots.txt')) {
        return Promise.resolve({
          status: 404,
          finalUrl: url,
          contentType: 'text/plain',
          bodyText: '',
        });
      }
      if (url.includes('manual-page')) {
        return Promise.resolve({
          status: 200,
          finalUrl: url,
          contentType: 'text/html',
          bodyText:
            '<html><head><title>수동 투입 페이지</title></head><body><main>핵심 본문</main></body></html>',
        });
      }
      return Promise.resolve({
        status: 200,
        finalUrl: url,
        contentType: 'application/rss+xml',
        bodyText: `<?xml version="1.0"?><rss version="2.0"><channel><title>Feed</title>${sampleItems}</channel></rss>`,
      });
    }),
  };

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.ENABLE_SCHEDULER = 'false';
    process.env.DATABASE_URL =
      process.env.DATABASE_URL || 'postgresql://alkok:alkok@localhost:5432/alkok?schema=public';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SafeFetchService)
      .useValue(mockSafeFetch)
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    jobWorker = app.get(JobWorkerService);
    rssFetcher = app.get(RssFetcherService);
    app.get(RateLimitService).reset();

    const adminEmail = `jobs-admin-${Date.now()}@jobs-e2e.test`;
    await prisma.user.create({
      data: {
        id: uuidv7(),
        email: adminEmail,
        passwordHash: await hashPassword('Password123!'),
        nickname: '잡관리자',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      },
    });

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: 'Password123!' })
      .expect(200);
    adminToken = loginRes.body.data.accessToken;

    const src = await prisma.source.create({
      data: {
        id: uuidv7(),
        name: '테스트 RSS',
        feedUrl: `https://example.com/feed-${Date.now()}.xml`,
        sourceType: SourceType.OFFICIAL,
      },
    });
    sourceId = src.id;
  });

  afterAll(async () => {
    await prisma.jobRun.deleteMany({});
    await prisma.rawDocument.deleteMany({ where: { url: { startsWith: 'https://example.com/' } } });
    await prisma.source.deleteMany({ where: { id: sourceId } });
    await prisma.user.deleteMany({ where: { email: { endsWith: '@jobs-e2e.test' } } });
    await app.close();
  });

  it('caps RSS fetch at 15 items, trims rawText to 20,000 chars, and deduplicates normalizedUrl', async () => {
    const first = await rssFetcher.fetchSourceById(sourceId);
    expect(first.insertedCount).toBe(15);

    const firstDoc = await prisma.rawDocument.findUniqueOrThrow({
      where: { normalizedUrl: 'https://example.com/news/0' },
    });
    expect(firstDoc.rawText?.length).toBe(20_000);

    // Second fetch deduplicates all 15
    const second = await rssFetcher.fetchSourceById(sourceId);
    expect(second.insertedCount).toBe(0);
  });

  it('handles manual-url and /admin/jobs listing', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/inbox/manual-url')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ url: 'https://example.com/manual-page?utm_source=x' })
      .expect(201);

    expect(res.body.data.jobId).toBeTruthy();
    expect(res.body.data.rawDocumentId).toBeTruthy();

    const jobsRes = await request(app.getHttpServer())
      .get('/api/v1/admin/jobs')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(jobsRes.body.data.length).toBeGreaterThan(0);
  });

  it('retries failed JobRun with exponential backoff and transitions to DEAD_LETTER after 3 attempts', async () => {
    await prisma.jobRun.deleteMany({});
    jobWorker.registerHandler(JobType.URL_INGEST, () => Promise.reject(new Error('boom')));

    const job = await prisma.jobRun.create({
      data: {
        id: uuidv7(),
        type: JobType.URL_INGEST,
        status: JobStatus.PENDING,
        payload: {},
        nextRunAt: new Date(Date.now() - 1000),
      },
    });

    // Attempt 1 -> PENDING with ~1m backoff
    await jobWorker.processNextJob();
    const after1 = await prisma.jobRun.findUniqueOrThrow({ where: { id: job.id } });
    expect(after1.status).toBe(JobStatus.PENDING);
    expect(after1.attempts).toBe(1);
    expect(after1.nextRunAt.getTime()).toBeGreaterThan(Date.now() + 30_000);

    // Force due and Attempt 2 -> PENDING with ~5m backoff
    await prisma.jobRun.update({
      where: { id: job.id },
      data: { nextRunAt: new Date(Date.now() - 1000) },
    });
    await jobWorker.processNextJob();
    const after2 = await prisma.jobRun.findUniqueOrThrow({ where: { id: job.id } });
    expect(after2.status).toBe(JobStatus.PENDING);
    expect(after2.attempts).toBe(2);
    expect(after2.nextRunAt.getTime()).toBeGreaterThan(Date.now() + 2 * 60_000);

    // Force due and Attempt 3 -> DEAD_LETTER
    await prisma.jobRun.update({
      where: { id: job.id },
      data: { nextRunAt: new Date(Date.now() - 1000) },
    });
    await jobWorker.processNextJob();
    const after3 = await prisma.jobRun.findUniqueOrThrow({ where: { id: job.id } });
    expect(after3.status).toBe(JobStatus.DEAD_LETTER);
    expect(after3.attempts).toBe(3);
  });
});
