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

describe('Personal Vault CRUD & userId Isolation (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenA: string;
  let tokenB: string;
  let publishedContentId: string;

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
    app.get(RateLimitService).reset();

    const passwordHash = await hashPassword('Password123!');
    const emailA = `vault-a-${Date.now()}@vault-e2e.test`;
    const emailB = `vault-b-${Date.now()}@vault-e2e.test`;

    await prisma.user.createMany({
      data: [
        {
          id: uuidv7(),
          email: emailA,
          passwordHash,
          nickname: '보관함A',
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
          emailVerifiedAt: new Date(),
        },
        {
          id: uuidv7(),
          email: emailB,
          passwordHash,
          nickname: '보관함B',
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
          emailVerifiedAt: new Date(),
        },
      ],
    });

    const loginA = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: emailA, password: 'Password123!' })
      .expect(200);
    tokenA = loginA.body.data.accessToken;

    const loginB = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: emailB, password: 'Password123!' })
      .expect(200);
    tokenB = loginB.body.data.accessToken;

    publishedContentId = uuidv7();
    await prisma.content.create({
      data: {
        id: publishedContentId,
        type: ContentType.GUIDE,
        slug: `vault-guide-${Date.now()}`,
        title: '보관함 북마크용 가이드',
        summary: '요약',
        publishStatus: PublishStatus.PUBLISHED,
        verificationStatus: VerificationStatus.VALID,
        verifiedAt: new Date(),
        publishedAt: new Date(),
        sourceType: SourceType.OFFICIAL,
        sourceUrl: 'https://vault-e2e.test/guide',
      },
    });
  });

  afterAll(async () => {
    await prisma.content.deleteMany({ where: { id: publishedContentId } });
    await prisma.user.deleteMany({ where: { email: { endsWith: '@vault-e2e.test' } } });
    await app.close();
  });

  it('creates folders/bookmarks/external-urls, enforces 409 duplicates, and isolates User A from User B', async () => {
    // 1. Folder create & duplicate 409
    const folderRes = await request(app.getHttpServer())
      .post('/api/v1/vault/folders')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: '업무자료' })
      .expect(201);
    const folderId = folderRes.body.data.id as string;

    const dupFolder = await request(app.getHttpServer())
      .post('/api/v1/vault/folders')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: '업무자료' })
      .expect(409);
    expect(dupFolder.body.errorCode).toBe('VAULT_FOLDER_DUPLICATE');

    // 2. Bookmark create & duplicate 409 with existingItemId
    const bookmarkRes = await request(app.getHttpServer())
      .post('/api/v1/vault/items/bookmark')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ contentId: publishedContentId, folderId, memo: '꼭 보기', tagNames: ['AI', '업무'] })
      .expect(201);
    const bookmarkId = bookmarkRes.body.data.id as string;

    const dupBookmark = await request(app.getHttpServer())
      .post('/api/v1/vault/items/bookmark')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ contentId: publishedContentId })
      .expect(409);
    expect(dupBookmark.body.errorCode).toBe('VAULT_DUPLICATE_BOOKMARK');
    expect(dupBookmark.body.details.existingItemId).toBe(bookmarkId);

    // 3. External URL create with tracking params & duplicate 409 after normalization
    const extRes = await request(app.getHttpServer())
      .post('/api/v1/vault/items/external-url')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        url: 'https://Example.COM/article/?utm_source=x#top',
        title: '외부 아티클',
        folderId,
        tagNames: ['참고'],
      })
      .expect(201);
    const extId = extRes.body.data.id as string;
    expect(extRes.body.data.normalizedUrl).toBe('https://example.com/article');

    const dupExt = await request(app.getHttpServer())
      .post('/api/v1/vault/items/external-url')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        url: 'https://example.com/article',
        title: '중복 아티클',
      })
      .expect(409);
    expect(dupExt.body.errorCode).toBe('VAULT_DUPLICATE_URL');
    expect(dupExt.body.details.existingItemId).toBe(extId);

    // 4. User B cannot see, update, or delete User A's items or folders
    const listB = await request(app.getHttpServer())
      .get('/api/v1/vault/items')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);
    expect(listB.body.data).toHaveLength(0);

    await request(app.getHttpServer())
      .patch(`/api/v1/vault/items/${extId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: '해킹시도' })
      .expect(404);

    await request(app.getHttpServer())
      .delete(`/api/v1/vault/items/${extId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);

    await request(app.getHttpServer())
      .delete(`/api/v1/vault/folders/${folderId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);

    // 5. Deleting folder moves items to folderId = null (unclassified)
    await request(app.getHttpServer())
      .delete(`/api/v1/vault/folders/${folderId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    const listA = await request(app.getHttpServer())
      .get('/api/v1/vault/items')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect(listA.body.data).toHaveLength(2);
    expect(listA.body.data[0].folderId).toBeNull();
  });
});
