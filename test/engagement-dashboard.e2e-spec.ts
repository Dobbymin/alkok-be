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
import { configureApp } from '../src/main';

describe('Engagement (Helpful & Reports) + Admin Reports/Dashboard (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let rateLimit: RateLimitService;
  let userToken: string;
  let adminToken: string;
  let contentId: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.ENABLE_SCHEDULER = 'false';
    process.env.DATABASE_URL =
      process.env.DATABASE_URL || 'postgresql://alkok:alkok@localhost:5432/alkok?schema=public';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.getHttpAdapter().getInstance().set('trust proxy', true);
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    rateLimit = app.get(RateLimitService);

    const passwordHash = await hashPassword('Password123!');
    const userEmail = `eng-user-${Date.now()}@eng-e2e.test`;
    const adminEmail = `eng-admin-${Date.now()}@eng-e2e.test`;

    await prisma.user.createMany({
      data: [
        {
          id: uuidv7(),
          email: userEmail,
          passwordHash,
          nickname: '참여유저',
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
          emailVerifiedAt: new Date(),
        },
        {
          id: uuidv7(),
          email: adminEmail,
          passwordHash,
          nickname: '참여관리자',
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          emailVerifiedAt: new Date(),
        },
      ],
    });

    const loginU = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: userEmail, password: 'Password123!' })
      .expect(200);
    userToken = loginU.body.data.accessToken;

    const loginA = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: 'Password123!' })
      .expect(200);
    adminToken = loginA.body.data.accessToken;

    contentId = uuidv7();
    await prisma.content.create({
      data: {
        id: contentId,
        type: ContentType.TOOL,
        slug: `eng-tool-${Date.now()}`,
        title: '참여 테스트 도구',
        summary: '요약',
        publishStatus: PublishStatus.PUBLISHED,
        verificationStatus: VerificationStatus.VALID,
        verifiedAt: new Date(),
        publishedAt: new Date(),
        sourceType: SourceType.OFFICIAL,
        sourceUrl: 'https://eng-e2e.test/tool',
      },
    });
  });

  afterAll(async () => {
    await prisma.content.deleteMany({ where: { id: contentId } });
    await prisma.user.deleteMany({ where: { email: { endsWith: '@eng-e2e.test' } } });
    await app.close();
  });

  beforeEach(() => {
    rateLimit.reset();
  });

  it('toggles helpful vote transactionally', async () => {
    const add1 = await request(app.getHttpServer())
      .post(`/api/v1/contents/${contentId}/helpful`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(add1.body.data).toEqual({ helpfulCount: 1, isHelpful: true });

    // Idempotent second POST
    const add2 = await request(app.getHttpServer())
      .post(`/api/v1/contents/${contentId}/helpful`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(add2.body.data).toEqual({ helpfulCount: 1, isHelpful: true });

    const del = await request(app.getHttpServer())
      .delete(`/api/v1/contents/${contentId}/helpful`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(del.body.data).toEqual({ helpfulCount: 0, isHelpful: false });
  });

  it('ignores honeypot, keeps VALID for same-IP reports, flips to NEEDS_REVIEW on 3 distinct IPs, and restores via verify', async () => {
    // Honeypot ignored
    const honey = await request(app.getHttpServer())
      .post(`/api/v1/contents/${contentId}/reports`)
      .send({ reason: 'BROKEN_LINK', detail: '스팸입니다', website: 'http://spam.bot' })
      .expect(201);
    expect(honey.body.data.id).toBe('ignored');

    // 3 reports from same IP -> remains VALID
    for (let i = 0; i < 3; i += 1) {
      await request(app.getHttpServer())
        .post(`/api/v1/contents/${contentId}/reports`)
        .set('X-Forwarded-For', '203.0.113.10')
        .send({ reason: 'PRICING_CHANGED', detail: `동일 IP 제보 ${i}` })
        .expect(201);
    }

    const afterSameIp = await prisma.content.findUniqueOrThrow({ where: { id: contentId } });
    expect(afterSameIp.verificationStatus).toBe(VerificationStatus.VALID);

    // 2 more distinct IPs -> total 3 distinct IPs -> auto NEEDS_REVIEW
    await request(app.getHttpServer())
      .post(`/api/v1/contents/${contentId}/reports`)
      .set('X-Forwarded-For', '203.0.113.11')
      .send({ reason: 'PRICING_CHANGED', detail: '다른 IP 제보 2' })
      .expect(201);

    const report3 = await request(app.getHttpServer())
      .post(`/api/v1/contents/${contentId}/reports`)
      .set('X-Forwarded-For', '203.0.113.12')
      .send({ reason: 'PRICING_CHANGED', detail: '다른 IP 제보 3' })
      .expect(201);

    const after3Ips = await prisma.content.findUniqueOrThrow({ where: { id: contentId } });
    expect(after3Ips.verificationStatus).toBe(VerificationStatus.NEEDS_REVIEW);

    // Admin dashboard reflects staleContentCount & openReportCount
    const dash = await request(app.getHttpServer())
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(dash.body.data.staleContentCount).toBeGreaterThanOrEqual(1);
    expect(dash.body.data.openReportCount).toBeGreaterThanOrEqual(5);

    // Admin resolves report & verifies content back to VALID
    await request(app.getHttpServer())
      .patch(`/api/v1/admin/reports/${report3.body.data.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'RESOLVED', resolutionMemo: '요금표 갱신 완료' })
      .expect(200);

    const verified = await request(app.getHttpServer())
      .post(`/api/v1/admin/contents/${contentId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(verified.body.data.verificationStatus).toBe(VerificationStatus.VALID);
  });
});
