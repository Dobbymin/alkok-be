import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { RateLimitService } from '../src/common/rate-limit/rate-limit.service';
import { uuidv7 } from '../src/common/utils/uuidv7';
import { MAIL_PROVIDER, type MailProvider } from '../src/infra/mail/mail.interface';
import { PrismaService } from '../src/infra/prisma/prisma.service';
import { configureApp } from '../src/main';

describe('Users /me & Withdrawal Integration (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let rateLimit: RateLimitService;
  const sentEmails: Array<{ to: string; url: string }> = [];

  const testMailProvider: MailProvider = {
    sendVerificationEmail(to, verifyUrl) {
      sentEmails.push({ to, url: verifyUrl });
      return Promise.resolve();
    },
    sendPasswordResetEmail() {
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
    await prisma.user.deleteMany({
      where: {
        OR: [{ email: { endsWith: '@users-e2e.test' } }, { email: { endsWith: '@deleted.local' } }],
      },
    });
    await app.close();
  });

  beforeEach(() => {
    rateLimit.reset();
    sentEmails.length = 0;
  });

  it('updates profile/interests/password and anonymizes PII + deletes vault/sessions on withdrawal', async () => {
    const email = `user-${Date.now()}@users-e2e.test`;
    const password = 'Password123!';

    await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({ email, password, nickname: '초기닉네임' })
      .expect(201);

    const verifyToken = decodeURIComponent(sentEmails[0].url.split('token=')[1]);
    await request(app.getHttpServer())
      .post('/api/v1/auth/verify-email')
      .send({ token: verifyToken })
      .expect(200);

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);

    const accessToken = loginRes.body.data.accessToken as string;
    const userId = loginRes.body.data.user.id as string;
    const rtCookie = (loginRes.headers['set-cookie'] as unknown as string[]).find((c) =>
      c.startsWith('alkok_rt='),
    );

    // Update profile
    const profileRes = await request(app.getHttpServer())
      .patch('/api/v1/users/me/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ nickname: '새닉네임' })
      .expect(200);
    expect(profileRes.body.data.nickname).toBe('새닉네임');

    // Update interests
    const interestsRes = await request(app.getHttpServer())
      .put('/api/v1/users/me/interests')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ categorySlugs: ['docs-reports', 'research'] })
      .expect(200);
    expect(interestsRes.body.data.interestCategorySlugs.sort()).toEqual([
      'docs-reports',
      'research',
    ]);

    const meRes = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(meRes.body.data.interestCategorySlugs.sort()).toEqual(['docs-reports', 'research']);

    // Update password
    await request(app.getHttpServer())
      .patch('/api/v1/users/me/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: password, newPassword: 'ChangedPass123!' })
      .expect(204);

    // Create a vault folder & item directly to verify cascade hard delete on withdrawal
    const folder = await prisma.vaultFolder.create({
      data: { id: uuidv7(), userId, name: '탈퇴전폴더' },
    });
    await prisma.vaultItem.create({
      data: {
        id: uuidv7(),
        userId,
        itemType: 'EXTERNAL_URL',
        folderId: folder.id,
        url: 'https://example.com',
        normalizedUrl: 'https://example.com',
        title: '테스트',
      },
    });

    // Withdraw
    await request(app.getHttpServer())
      .delete('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    // Verify DB state: vault, interests, sessions deleted; User PII anonymized
    const [vaultCount, folderCount, interestCount, sessionCount, userRow] = await Promise.all([
      prisma.vaultItem.count({ where: { userId } }),
      prisma.vaultFolder.count({ where: { userId } }),
      prisma.userInterest.count({ where: { userId } }),
      prisma.refreshSession.count({ where: { userId } }),
      prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    ]);

    expect(vaultCount).toBe(0);
    expect(folderCount).toBe(0);
    expect(interestCount).toBe(0);
    expect(sessionCount).toBe(0);
    expect(userRow.email).toBe(`deleted-${userId}@deleted.local`);
    expect(userRow.nickname).toBe('탈퇴한 회원');
    expect(userRow.passwordHash).toBe('');
    expect(userRow.status).toBe('SUSPENDED');
    expect(userRow.deletedAt).not.toBeNull();

    // Subsequent refresh & login blocked
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', [rtCookie!])
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'ChangedPass123!' })
      .expect(401);
  });
});
