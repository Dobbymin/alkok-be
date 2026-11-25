import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UserRole, UserStatus } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { RateLimitService } from '../src/common/rate-limit/rate-limit.service';
import { hashPassword } from '../src/common/utils/crypto.util';
import { SafeFetchService } from '../src/common/utils/safe-fetch';
import { uuidv7 } from '../src/common/utils/uuidv7';
import { PrismaService } from '../src/infra/prisma/prisma.service';
import { configureApp } from '../src/main';

class MockableSafeFetchService extends SafeFetchService {
  protected override resolveHostname() {
    return Promise.resolve([{ address: '93.184.216.34' }]);
  }

  protected override performFetch(url: string) {
    if (url.includes('forbidden.example.com')) {
      return Promise.resolve(new Response('Forbidden', { status: 403 }));
    }
    if (url.includes('timeout.example.com')) {
      return Promise.reject(new Error('Request timed out'));
    }
    return Promise.resolve(
      new Response(
        '<html><head><meta property="og:title" content="OG 제목" /><meta property="og:description" content="OG 설명" /><link rel="icon" href="/icon.png" /></head><body></body></html>',
        { status: 200, headers: { 'content-type': 'text/html' } },
      ),
    );
  }
}

describe('Vault Preview URL SSRF & 200 OK Fallback (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let rateLimit: RateLimitService;
  let userToken: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.ENABLE_SCHEDULER = 'false';
    process.env.DATABASE_URL =
      process.env.DATABASE_URL || 'postgresql://alkok:alkok@localhost:5432/alkok?schema=public';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SafeFetchService)
      .useClass(MockableSafeFetchService)
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    rateLimit = app.get(RateLimitService);

    const email = `preview-${Date.now()}@preview-e2e.test`;
    await prisma.user.create({
      data: {
        id: uuidv7(),
        email,
        passwordHash: await hashPassword('Password123!'),
        nickname: '프리뷰테스터',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      },
    });

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'Password123!' })
      .expect(200);
    userToken = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { endsWith: '@preview-e2e.test' } } });
    await app.close();
  });

  beforeEach(() => {
    rateLimit.reset();
  });

  it('blocks loopback and metadata SSRF URLs with 400 SSRF_BLOCKED_URL', async () => {
    const res1 = await request(app.getHttpServer())
      .post('/api/v1/vault/preview-url')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ url: 'http://127.0.0.1:8080/secret' })
      .expect(400);
    expect(res1.body.errorCode).toBe('SSRF_BLOCKED_URL');

    const res2 = await request(app.getHttpServer())
      .post('/api/v1/vault/preview-url')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ url: 'http://169.254.169.254/latest/meta-data' })
      .expect(400);
    expect(res2.body.errorCode).toBe('SSRF_BLOCKED_URL');
  });

  it('parses OG metadata on valid page and returns 200 fallback on 403 or timeout', async () => {
    const okRes = await request(app.getHttpServer())
      .post('/api/v1/vault/preview-url')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ url: 'https://public.example.com/guide?utm_source=x' })
      .expect(200);
    expect(okRes.body.data).toMatchObject({
      parsed: true,
      fallback: false,
      normalizedUrl: 'https://public.example.com/guide',
      title: 'OG 제목',
      description: 'OG 설명',
      faviconUrl: 'https://public.example.com/icon.png',
    });

    const forbiddenRes = await request(app.getHttpServer())
      .post('/api/v1/vault/preview-url')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ url: 'https://forbidden.example.com/article' })
      .expect(200);
    expect(forbiddenRes.body.data).toMatchObject({
      parsed: false,
      fallback: true,
      title: null,
    });

    const timeoutRes = await request(app.getHttpServer())
      .post('/api/v1/vault/preview-url')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ url: 'https://timeout.example.com/slow' })
      .expect(200);
    expect(timeoutRes.body.data).toMatchObject({
      parsed: false,
      fallback: true,
      title: null,
    });
  });

  it('enforces 15 requests/min rate limit per user', async () => {
    for (let i = 0; i < 15; i += 1) {
      await request(app.getHttpServer())
        .post('/api/v1/vault/preview-url')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ url: `https://public.example.com/p/${i}` })
        .expect(200);
    }

    const limited = await request(app.getHttpServer())
      .post('/api/v1/vault/preview-url')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ url: 'https://public.example.com/p/16' })
      .expect(429);
    expect(limited.body.errorCode).toBe('RATE_LIMIT_EXCEEDED');
  });
});
