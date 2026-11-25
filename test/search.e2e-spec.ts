import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  ContentType,
  PublishStatus,
  SourceType,
  UserRole,
  UserStatus,
  VerificationStatus,
} from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { RateLimitService } from '../src/common/rate-limit/rate-limit.service';
import { hashPassword } from '../src/common/utils/crypto.util';
import { uuidv7 } from '../src/common/utils/uuidv7';
import { PrismaService } from '../src/infra/prisma/prisma.service';
import { SearchVectorService } from '../src/infra/prisma/search-vector.service';
import { configureApp } from '../src/main';

describe('Korean Hybrid Search & Suggest (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let rateLimit: RateLimitService;
  let userAToken: string;
  let userBId: string;
  const createdContentIds: string[] = [];

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.ENABLE_SCHEDULER = 'false';
    process.env.DATABASE_URL =
      process.env.DATABASE_URL || 'postgresql://alkok:alkok@localhost:5432/alkok?schema=public';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    rateLimit = app.get(RateLimitService);
    const searchVector = app.get(SearchVectorService);

    const userAEmail = `search-a-${Date.now()}@search-e2e.test`;
    const userBEmail = `search-b-${Date.now()}@search-e2e.test`;
    const passwordHash = await hashPassword('Password123!');

    const userA = await prisma.user.create({
      data: {
        id: uuidv7(),
        email: userAEmail,
        passwordHash,
        nickname: '검색유저A',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      },
    });
    const userB = await prisma.user.create({
      data: {
        id: uuidv7(),
        email: userBEmail,
        passwordHash,
        nickname: '검색유저B',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      },
    });
    userBId = userB.id;

    const loginA = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: userAEmail, password: 'Password123!' })
      .expect(200);
    userAToken = loginA.body.data.accessToken;

    await prisma.vaultItem.createMany({
      data: [
        {
          id: uuidv7(),
          userId: userA.id,
          itemType: 'EXTERNAL_URL',
          url: 'https://search-e2e.test/a',
          normalizedUrl: 'https://search-e2e.test/a',
          title: '회의록 정리 개인 메모 A',
        },
        {
          id: uuidv7(),
          userId: userBId,
          itemType: 'EXTERNAL_URL',
          url: 'https://search-e2e.test/b',
          normalizedUrl: 'https://search-e2e.test/b',
          title: '회의록 정리 개인 메모 B',
        },
      ],
    });

    const guideId = uuidv7();
    const newsId = uuidv7();
    createdContentIds.push(guideId, newsId);

    const now = new Date();
    await prisma.content.createMany({
      data: [
        {
          id: guideId,
          type: ContentType.GUIDE,
          slug: `search-guide-${Date.now()}`,
          title: '회의록 자동 요약 실무 가이드',
          summary: '회의록과 보고서 초안을 빠르게 정리합니다.',
          publishStatus: PublishStatus.PUBLISHED,
          verificationStatus: VerificationStatus.VALID,
          verifiedAt: now,
          publishedAt: now,
          sourceType: SourceType.OFFICIAL,
          sourceUrl: 'https://search-e2e.test/g',
        },
        {
          id: newsId,
          type: ContentType.NEWS,
          slug: `search-news-${Date.now()}`,
          title: '회의록 자동 요약 신규 소식',
          summary: '회의록 기능 업데이트 소식입니다.',
          publishStatus: PublishStatus.PUBLISHED,
          verificationStatus: VerificationStatus.NEEDS_REVIEW,
          verifiedAt: now,
          publishedAt: now,
          sourceType: SourceType.MEDIA,
          sourceUrl: 'https://search-e2e.test/n',
        },
      ],
    });

    await searchVector.refresh(guideId);
    await searchVector.refresh(newsId);
  });

  afterAll(async () => {
    await prisma.content.deleteMany({ where: { id: { in: createdContentIds } } });
    await prisma.user.deleteMany({ where: { email: { endsWith: '@search-e2e.test' } } });
    await app.close();
  });

  beforeEach(() => {
    rateLimit.reset();
  });

  it('matches Korean particle queries (회의록을) and ranks GUIDE+VALID higher than NEWS', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/search')
      .query({ q: '회의록을' })
      .expect(200);

    const items = res.body.data.items as Array<{ type: string; title: string }>;
    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items[0].type).toBe('GUIDE');
  });

  it('isolates VAULT results to authenticated user only', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/search')
      .set('Authorization', `Bearer ${userAToken}`)
      .query({ q: '회의록', type: 'ALL' })
      .expect(200);

    const vaultTitles = (res.body.data.vaultItems as Array<{ title: string }>).map((v) => v.title);
    expect(vaultTitles).toContain('회의록 정리 개인 메모 A');
    expect(vaultTitles).not.toContain('회의록 정리 개인 메모 B');
  });

  it('returns max 8 suggestions and enforces 60/min IP rate limit on /search/suggest', async () => {
    const suggestRes = await request(app.getHttpServer())
      .get('/api/v1/search/suggest')
      .query({ q: '회의록' })
      .expect(200);
    expect(suggestRes.body.data.length).toBeGreaterThanOrEqual(1);
    expect(suggestRes.body.data.length).toBeLessThanOrEqual(8);

    // Remaining 59 calls succeed, 61st returns 429 RATE_LIMIT_EXCEEDED
    for (let i = 0; i < 59; i += 1) {
      await request(app.getHttpServer())
        .get('/api/v1/search/suggest')
        .query({ q: '회의록' })
        .expect(200);
    }

    const limitedRes = await request(app.getHttpServer())
      .get('/api/v1/search/suggest')
      .query({ q: '회의록' })
      .expect(429);
    expect(limitedRes.body.errorCode).toBe('RATE_LIMIT_EXCEEDED');
  });
});
