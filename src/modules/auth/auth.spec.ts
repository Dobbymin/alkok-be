import { Test } from '@nestjs/testing';
import { UserRole, UserStatus } from '@prisma/client';
import { AppModule } from '../../app.module';
import { RateLimitService } from '../../common/rate-limit/rate-limit.service';
import { MAIL_PROVIDER } from '../../infra/mail/mail.interface';
import { configureApp } from '../../main';
import { DB_HEALTH_CHECKER } from '../health/health.constants';
import { AuthRepository } from './auth.repository';

describe('AuthModule (unit)', () => {
  it('enforces resend cooldown and rotation reuse detection via AuthService', async () => {
    process.env.NODE_ENV = 'test';
    process.env.SKIP_DB_CONNECT = 'true';

    const mockRepo = {
      findUserByEmail: jest.fn().mockResolvedValue({
        id: '01930000-0000-7000-8000-000000000001',
        email: 'user@alkok.test',
        passwordHash: '',
        nickname: '테스터',
        role: UserRole.USER,
        status: UserStatus.PENDING_VERIFICATION,
        emailVerifiedAt: null,
        lastLoginAt: null,
        deletedAt: null,
        createdAt: new Date(),
        interests: [],
      }),
      findLatestVerificationTokenForUser: jest.fn().mockResolvedValue({
        createdAt: new Date(),
      }),
      findRefreshSessionByHash: jest.fn().mockResolvedValue({
        id: 'sess-1',
        userId: 'user-1',
        familyId: 'fam-1',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
        user: {
          id: 'user-1',
          email: 'user@alkok.test',
          nickname: '테스터',
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
          emailVerifiedAt: new Date(),
          lastLoginAt: new Date(),
          createdAt: new Date(),
          interests: [],
        },
      }),
      revokeFamilySessions: jest.fn().mockResolvedValue({ count: 2 }),
    };

    const mockMail = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DB_HEALTH_CHECKER)
      .useValue({ ping: () => Promise.resolve('up') })
      .overrideProvider(AuthRepository)
      .useValue(mockRepo)
      .overrideProvider(MAIL_PROVIDER)
      .useValue(mockMail)
      .compile();

    const app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    const rateLimit = app.get(RateLimitService);
    rateLimit.reset();

    const request = (await import('supertest')).default;

    const resendRes = await request(app.getHttpServer())
      .post('/api/v1/auth/resend-verification')
      .send({ email: 'user@alkok.test' })
      .expect(429);
    expect(resendRes.body.errorCode).toBe('AUTH_RESEND_COOLDOWN');

    const reuseRes = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', ['alkok_rt=reused-token-value'])
      .expect(401);
    expect(reuseRes.body.errorCode).toBe('AUTH_TOKEN_REUSED');
    expect(mockRepo.revokeFamilySessions).toHaveBeenCalledWith('fam-1');

    await app.close();
  });
});
