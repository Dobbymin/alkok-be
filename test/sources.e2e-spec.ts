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

describe('Admin Sources CRUD & Fetch Trigger (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  const createdSourceIds: string[] = [];

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
    app.get(RateLimitService).reset();

    const adminEmail = `sources-admin-${Date.now()}@sources-e2e.test`;
    await prisma.user.create({
      data: {
        id: uuidv7(),
        email: adminEmail,
        passwordHash: await hashPassword('Password123!'),
        nickname: '출처관리자',
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
  });

  afterAll(async () => {
    if (createdSourceIds.length > 0) {
      await prisma.jobRun.deleteMany({
        where: { type: 'RSS_FETCH' },
      });
      await prisma.source.deleteMany({ where: { id: { in: createdSourceIds } } });
    }
    await prisma.user.deleteMany({ where: { email: { endsWith: '@sources-e2e.test' } } });
    await app.close();
  });

  it('creates, updates, triggers fetch job, and soft-deletes a source', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/admin/sources')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: '테스트 AI 피드',
        feedUrl: `https://example.com/rss-${Date.now()}.xml?utm_source=test`,
        sourceType: 'OFFICIAL',
        fetchIntervalHours: 12,
      })
      .expect(201);

    const sourceId = createRes.body.data.id as string;
    createdSourceIds.push(sourceId);
    expect(createRes.body.data.feedUrl).not.toContain('utm_source');

    const updateRes = await request(app.getHttpServer())
      .patch(`/api/v1/admin/sources/${sourceId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false })
      .expect(200);
    expect(updateRes.body.data.isActive).toBe(false);

    const fetchRes = await request(app.getHttpServer())
      .post(`/api/v1/admin/sources/${sourceId}/fetch`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(fetchRes.body.data.jobId).toBeTruthy();

    await request(app.getHttpServer())
      .delete(`/api/v1/admin/sources/${sourceId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);
  });
});
