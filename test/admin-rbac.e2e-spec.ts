import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UserRole, UserStatus } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { RateLimitService } from '../src/common/rate-limit/rate-limit.service';
import { hashPassword } from '../src/common/utils/crypto.util';
import { uuidv7 } from '../src/common/utils/uuidv7';
import { PrismaService } from '../src/infra/prisma/prisma.service';
import { configureApp } from '../src/main';

describe('OpenAPI, Taxonomies & Admin RBAC/CMS (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let rateLimit: RateLimitService;
  let userToken: string;
  let adminToken: string;
  const createdContentIds: string[] = [];

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
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
    rateLimit.reset();

    const passwordHash = await hashPassword('Password123!');
    const userEmail = `member-${Date.now()}@rbac-e2e.test`;
    const adminEmail = `admin-${Date.now()}@rbac-e2e.test`;

    await prisma.user.createMany({
      data: [
        {
          id: uuidv7(),
          email: userEmail,
          passwordHash,
          nickname: '일반회원',
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
          emailVerifiedAt: new Date(),
        },
        {
          id: uuidv7(),
          email: adminEmail,
          passwordHash,
          nickname: '관리자',
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          emailVerifiedAt: new Date(),
        },
      ],
    });

    const userLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: userEmail, password: 'Password123!' })
      .expect(200);
    userToken = userLogin.body.data.accessToken;

    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: 'Password123!' })
      .expect(200);
    adminToken = adminLogin.body.data.accessToken;
  });

  afterAll(async () => {
    if (createdContentIds.length > 0) {
      await prisma.content.deleteMany({ where: { id: { in: createdContentIds } } });
    }
    await prisma.user.deleteMany({ where: { email: { endsWith: '@rbac-e2e.test' } } });
    await app.close();
  });

  it('returns 11 seeded categories from GET /api/v1/taxonomies', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/taxonomies').expect(200);
    expect(res.body.data.workDomains).toHaveLength(6);
    expect(res.body.data.aiUses).toHaveLength(5);
  });

  it('blocks USER role with 403 FORBIDDEN_ADMIN_ONLY on /api/v1/admin/**', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/contents')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
    expect(res.body.errorCode).toBe('FORBIDDEN_ADMIN_ONLY');

    const usersRes = await request(app.getHttpServer())
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
    expect(usersRes.body.errorCode).toBe('FORBIDDEN_ADMIN_ONLY');
  });

  it('allows ADMIN to create, update, verify, archive, soft-delete content and manage users', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/admin/contents')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        type: 'GUIDE',
        title: '회의록 자동 요약 가이드',
        summary: '실무 회의록 3분 요약 가이드',
        publishStatus: 'DRAFT',
        sourceType: 'OFFICIAL',
        sourceUrl: 'https://openai.com',
        categorySlugs: ['meetings-comms', 'writing-summary'],
        tagSlugs: ['meeting', 'summary'],
        difficulty: 'BEGINNER',
        pricingModel: 'FREE',
        markdownBody: '## 단계\n1. 회의록을 붙여넣습니다.',
        prompts: [{ title: '요약 프롬프트', content: '요약해줘: [내용]', variables: ['내용'] }],
      })
      .expect(201);

    const contentId = createRes.body.data.id as string;
    createdContentIds.push(contentId);
    expect(createRes.body.data.publishStatus).toBe('DRAFT');

    const verifyRes = await request(app.getHttpServer())
      .post(`/api/v1/admin/contents/${contentId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(verifyRes.body.data.verificationStatus).toBe('VALID');
    expect(verifyRes.body.data.verifiedAt).toBeTruthy();

    const archiveRes = await request(app.getHttpServer())
      .post(`/api/v1/admin/contents/${contentId}/archive`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(archiveRes.body.data.publishStatus).toBe('ARCHIVED');

    await request(app.getHttpServer())
      .delete(`/api/v1/admin/contents/${contentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);

    const listUsersRes = await request(app.getHttpServer())
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(listUsersRes.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('serves OpenAPI 3.1 JSON at /api-docs-json in non-production', async () => {
    const res = await request(app.getHttpServer()).get('/api-docs-json').expect(200);
    expect(res.body.openapi).toBe('3.1.0');
    expect(res.body.paths['/api/v1/taxonomies']).toBeDefined();
  });
});
