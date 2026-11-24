import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { RateLimitService } from '../src/common/rate-limit/rate-limit.service';
import { MAIL_PROVIDER, type MailProvider } from '../src/infra/mail/mail.interface';
import { PrismaService } from '../src/infra/prisma/prisma.service';
import { configureApp } from '../src/main';

describe('Auth Integration (e2e against PostgreSQL 17)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let rateLimit: RateLimitService;
  const sentEmails: Array<{ to: string; url: string; type: 'verify' | 'reset' }> = [];

  const testMailProvider: MailProvider = {
    sendVerificationEmail(to, verifyUrl) {
      sentEmails.push({ to, url: verifyUrl, type: 'verify' });
      return Promise.resolve();
    },
    sendPasswordResetEmail(to, resetUrl) {
      sentEmails.push({ to, url: resetUrl, type: 'reset' });
      return Promise.resolve();
    },
  };

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL =
      process.env.DATABASE_URL || 'postgresql://alkok:alkok@localhost:5432/alkok?schema=public';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MAIL_PROVIDER)
      .useValue(testMailProvider)
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    rateLimit = app.get(RateLimitService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { endsWith: '@auth-e2e.test' } } });
    await app.close();
  });

  beforeEach(() => {
    rateLimit.reset();
    sentEmails.length = 0;
  });

  it('runs signup -> unverified 403 -> verify -> login -> rotation -> reuse 401 -> password reset', async () => {
    const email = `flow-${Date.now()}@auth-e2e.test`;
    const password = 'Password123!';

    // 1. Signup
    await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({ email, password, nickname: '인증테스터' })
      .expect(201);

    expect(sentEmails).toHaveLength(1);
    const verifyToken = decodeURIComponent(sentEmails[0].url.split('token=')[1]);

    // 2. Unverified login blocked with 403 AUTH_EMAIL_NOT_VERIFIED
    const unverifiedRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(403);
    expect(unverifiedRes.body.errorCode).toBe('AUTH_EMAIL_NOT_VERIFIED');

    // 3. Resend within 60s returns 429 AUTH_RESEND_COOLDOWN
    const cooldownRes = await request(app.getHttpServer())
      .post('/api/v1/auth/resend-verification')
      .send({ email })
      .expect(429);
    expect(cooldownRes.body.errorCode).toBe('AUTH_RESEND_COOLDOWN');

    // 4. Verify email
    await request(app.getHttpServer())
      .post('/api/v1/auth/verify-email')
      .send({ token: verifyToken })
      .expect(200);

    // 5. Login succeeds, returns accessToken + sets alkok_rt cookie
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);

    expect(loginRes.body.data.accessToken).toBeTruthy();
    expect(loginRes.body.data.user.email).toBe(email);
    const cookies1 = loginRes.headers['set-cookie'] as unknown as string[];
    const rtCookie1 = cookies1.find((c) => c.startsWith('alkok_rt='));
    expect(rtCookie1).toBeTruthy();

    // 6. Refresh rotation returns new RT cookie
    const refreshRes = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', [rtCookie1!])
      .expect(200);

    const cookies2 = refreshRes.headers['set-cookie'] as unknown as string[];
    const rtCookie2 = cookies2.find((c) => c.startsWith('alkok_rt='));
    expect(rtCookie2).toBeTruthy();
    expect(rtCookie2).not.toBe(rtCookie1);

    // 7. Reusing old RT1 triggers 401 AUTH_TOKEN_REUSED and revokes family (RT2 also invalidated)
    const reuseRes = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', [rtCookie1!])
      .expect(401);
    expect(reuseRes.body.errorCode).toBe('AUTH_TOKEN_REUSED');

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', [rtCookie2!])
      .expect(401);

    // 8. Re-login + Password reset revokes all active sessions
    const loginRes2 = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    const rtCookie3 = (loginRes2.headers['set-cookie'] as unknown as string[]).find((c) =>
      c.startsWith('alkok_rt='),
    );

    await request(app.getHttpServer())
      .post('/api/v1/auth/password-reset/request')
      .send({ email })
      .expect(200);
    const resetEmail = sentEmails.find((e) => e.type === 'reset');
    expect(resetEmail).toBeTruthy();
    const resetToken = decodeURIComponent(resetEmail!.url.split('token=')[1]);

    await request(app.getHttpServer())
      .post('/api/v1/auth/password-reset/confirm')
      .send({ token: resetToken, newPassword: 'NewPassword456!' })
      .expect(200);

    // RT3 must be revoked after password reset
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', [rtCookie3!])
      .expect(401);

    // New password works
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'NewPassword456!' })
      .expect(200);
  });
});
