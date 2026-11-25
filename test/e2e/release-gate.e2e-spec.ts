import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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
import { runSeed } from '../../prisma/seed';
import { AppModule } from '../../src/app.module';
import { RateLimitService } from '../../src/common/rate-limit/rate-limit.service';
import { hashPassword } from '../../src/common/utils/crypto.util';
import { uuidv7 } from '../../src/common/utils/uuidv7';
import {
  GEMINI_PROVIDER,
  HERMES_PROVIDER,
  type AiProviderClient,
} from '../../src/infra/ai/ai-provider.interface';
import { MAIL_PROVIDER, type MailProvider } from '../../src/infra/mail/mail.interface';
import { PrismaService } from '../../src/infra/prisma/prisma.service';
import { configureApp } from '../../src/main';
import { AiDraftService } from '../../src/modules/ingestion/ai-draft.service';
import { MaintenanceBatchService } from '../../src/modules/ingestion/maintenance-batch.service';

function extractCookie(
  setCookieHeader: string[] | string | undefined,
  name: string,
): string | null {
  const list = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : setCookieHeader
      ? [setCookieHeader]
      : [];
  for (const item of list) {
    if (item.startsWith(`${name}=`)) {
      return item.split(';')[0];
    }
  }
  return null;
}

describe('MVP Release Gates #1, #2, #3, #5 & #6 (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let rateLimit: RateLimitService;
  let aiDraftService: AiDraftService;
  let maintenanceService: MaintenanceBatchService;
  let adminToken: string;

  const sentVerifyTokens = new Map<string, string>();
  const createdContentIds: string[] = [];
  const createdRawDocIds: string[] = [];

  const mockHermes: jest.Mocked<AiProviderClient> = {
    name: 'hermes',
    generateRawJson: jest.fn(),
  };
  const mockGemini: jest.Mocked<AiProviderClient> = {
    name: 'gemini',
    generateRawJson: jest.fn(),
  };
  const mockMail: MailProvider = {
    sendVerificationEmail(to: string, verifyUrl: string) {
      const url = new URL(verifyUrl);
      const token = url.searchParams.get('token');
      if (token) sentVerifyTokens.set(to.toLowerCase(), token);
      return Promise.resolve();
    },
    sendPasswordResetEmail() {
      return Promise.resolve();
    },
  };

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.ENABLE_SCHEDULER = 'false';
    process.env.AI_PRIMARY_PROVIDER = 'hermes';
    process.env.DATABASE_URL =
      process.env.DATABASE_URL || 'postgresql://alkok:alkok@localhost:5432/alkok?schema=public';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(HERMES_PROVIDER)
      .useValue(mockHermes)
      .overrideProvider(GEMINI_PROVIDER)
      .useValue(mockGemini)
      .overrideProvider(MAIL_PROVIDER)
      .useValue(mockMail)
      .compile();

    app = moduleRef.createNestApplication();
    app.getHttpAdapter().getInstance().set('trust proxy', true);
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    rateLimit = app.get(RateLimitService);
    aiDraftService = app.get(AiDraftService);
    maintenanceService = app.get(MaintenanceBatchService);
    rateLimit.reset();

    const publishedCount = await prisma.content.count({
      where: { publishStatus: PublishStatus.PUBLISHED, deletedAt: null },
    });
    if (publishedCount < 42) {
      await runSeed(prisma);
    }

    const adminEmail = `gate-admin-${Date.now()}@release-gate.test`;
    await prisma.user.create({
      data: {
        id: uuidv7(),
        email: adminEmail,
        passwordHash: await hashPassword('Password123!'),
        nickname: '게이트관리자',
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
    await prisma.aiUsageLog.deleteMany({});
    if (createdContentIds.length > 0) {
      await prisma.content.deleteMany({ where: { id: { in: createdContentIds } } });
    }
    if (createdRawDocIds.length > 0) {
      await prisma.rawDocument.deleteMany({ where: { id: { in: createdRawDocIds } } });
    }
    await prisma.user.deleteMany({ where: { email: { endsWith: '@release-gate.test' } } });
    await app.close();
  });

  it('Gate #1: RawDocument -> Hermes fallback to Gemini -> IN_REVIEW -> /admin/inbox approve -> public /news/:slug', async () => {
    const rawDocId = uuidv7();
    createdRawDocIds.push(rawDocId);
    await prisma.rawDocument.create({
      data: {
        id: rawDocId,
        url: `https://release-gate.test/news-${Date.now()}`,
        normalizedUrl: `https://release-gate.test/news-${Date.now()}`,
        title: '릴리스 게이트 AI 업데이트',
        rawText: '팀 단위 문서 요약 및 자동 승인 워크플로우가 개선되었습니다.',
      },
    });

    // Primary Hermes fails, Gemini fallback succeeds for Pass 1 & Pass 2
    mockHermes.generateRawJson.mockRejectedValue(new Error('Hermes timeout'));
    mockGemini.generateRawJson
      .mockResolvedValueOnce({
        rawJson: {
          relevanceScore: 5,
          recommendedType: 'NEWS',
          workDomains: ['docs-reports'],
          aiUses: ['writing-summary'],
          suggestedTags: ['gate1', '요약'],
        },
        usage: {
          provider: 'gemini',
          model: 'gemini-2.5-flash',
          inputTokens: 120,
          outputTokens: 60,
          estimatedCostUsd: 0.001,
        },
        latencyMs: 12,
      })
      .mockResolvedValueOnce({
        rawJson: {
          title: '릴리스 게이트 AI 소식',
          summary: 'Gemini 폴백으로 생성된 실무 AI 소식입니다.',
          workDomains: ['docs-reports'],
          aiUses: ['writing-summary'],
          tags: ['gate1'],
          evidenceNotes: ['원문 근거 1'],
          unverifiedFields: [],
          keyPoints: ['핵심 포인트 1', '핵심 포인트 2', '핵심 포인트 3'],
          workImpact: '문서 요약 자동화 정확도가 향상됩니다.',
        },
        usage: {
          provider: 'gemini',
          model: 'gemini-2.5-flash',
          inputTokens: 150,
          outputTokens: 90,
          estimatedCostUsd: 0.002,
        },
        latencyMs: 15,
      });

    const draftResult = await aiDraftService.processRawDocument(rawDocId);
    expect(draftResult.screenedOut).toBe(false);
    expect(draftResult.contentId).toBeTruthy();
    const draftId = draftResult.contentId!;
    createdContentIds.push(draftId);

    const draft = await prisma.content.findUnique({ where: { id: draftId } });
    expect(draft?.publishStatus).toBe(PublishStatus.IN_REVIEW);

    const approveRes = await request(app.getHttpServer())
      .post(`/api/v1/admin/inbox/${draftId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isFeatured: false })
      .expect(200);
    expect(approveRes.body.data.publishStatus).toBe(PublishStatus.PUBLISHED);

    const pubNews = await request(app.getHttpServer())
      .get(`/api/v1/news/${draft!.slug}`)
      .expect(200);
    expect(pubNews.body.data.title).toBe('릴리스 게이트 AI 소식');
    expect(pubNews.body.data.verificationStatus).toBe(VerificationStatus.VALID);
  });

  it('Gate #2: Korean partial-match /search, /search/suggest & 7-axis /tools/compare', async () => {
    const searchRes = await request(app.getHttpServer())
      .get('/api/v1/search')
      .query({ q: '보고서' })
      .expect(200);
    expect(Array.isArray(searchRes.body.data.items)).toBe(true);
    expect(searchRes.body.data.items.length).toBeGreaterThan(0);

    const suggestRes = await request(app.getHttpServer())
      .get('/api/v1/search/suggest')
      .query({ q: '보고' })
      .expect(200);
    expect(Array.isArray(suggestRes.body.data)).toBe(true);
    expect(suggestRes.body.data.length).toBeGreaterThan(0);

    const compareRes = await request(app.getHttpServer())
      .get('/api/v1/tools/compare')
      .query({ slugs: 'chatgpt,claude,gemini' })
      .expect(200);
    expect(compareRes.body.data).toHaveLength(3);
    for (const tool of compareRes.body.data) {
      expect(tool.providerName).toBeDefined();
      expect(tool.pricingModel).toBeDefined();
      expect(tool.koreanSupport).toBeDefined();
      expect(Array.isArray(tool.platforms)).toBe(true);
      expect(Array.isArray(tool.strengths)).toBe(true);
      expect(Array.isArray(tool.limitations)).toBe(true);
    }
  });

  it('Gate #3: Auth lifecycle, rotation reuse 401, Vault + SSRF + fallback, account isolation & withdrawal', async () => {
    const ts = Date.now();
    const userAEmail = `gate-a-${ts}@release-gate.test`;
    const userBEmail = `gate-b-${ts}@release-gate.test`;
    const password = 'Password123!';

    // Signup A
    await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({ email: userAEmail, password, nickname: '게이트A' })
      .expect(201);

    // Unverified login -> 403
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: userAEmail, password })
      .expect(403);

    // Verify email -> login -> rotation -> reuse 401
    const tokenA = sentVerifyTokens.get(userAEmail);
    expect(tokenA).toBeTruthy();
    await request(app.getHttpServer())
      .post('/api/v1/auth/verify-email')
      .send({ token: tokenA })
      .expect(200);

    const loginA = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: userAEmail, password })
      .expect(200);
    const accessA1 = loginA.body.data.accessToken as string;
    const rtCookie1 = extractCookie(loginA.headers['set-cookie'], 'alkok_rt');
    expect(rtCookie1).toBeTruthy();

    const refreshRes = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', [rtCookie1!])
      .expect(200);
    const accessA2 = refreshRes.body.data.accessToken as string;
    const rtCookie2 = extractCookie(refreshRes.headers['set-cookie'], 'alkok_rt');
    expect(typeof accessA2).toBe('string');
    expect(accessA2.length).toBeGreaterThan(20);
    expect(rtCookie2).toBeTruthy();
    expect(rtCookie2).not.toBe(rtCookie1);

    // Reusing rtCookie1 triggers AUTH_TOKEN_REUSED 401
    const reuseRes = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', [rtCookie1!])
      .expect(401);
    expect(reuseRes.body.errorCode).toBe('AUTH_TOKEN_REUSED');

    // Re-login A for clean session
    const loginA2 = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: userAEmail, password })
      .expect(200);
    const accessA = loginA2.body.data.accessToken as string;
    expect(typeof accessA).toBe('string');
    expect(accessA1.length).toBeGreaterThan(20);

    // SSRF block + fallback preview
    const ssrfRes = await request(app.getHttpServer())
      .post('/api/v1/vault/preview-url')
      .set('Authorization', `Bearer ${accessA}`)
      .send({ url: 'http://127.0.0.1:8080/secret' })
      .expect(400);
    expect(ssrfRes.body.errorCode).toBe('SSRF_BLOCKED_URL');

    const fallbackRes = await request(app.getHttpServer())
      .post('/api/v1/vault/preview-url')
      .set('Authorization', `Bearer ${accessA}`)
      .send({ url: 'https://nonexistent.invalid/article' })
      .expect(200);
    expect(fallbackRes.body.data.fallback).toBe(true);

    // Save external URL to A's vault
    const extRes = await request(app.getHttpServer())
      .post('/api/v1/vault/items/external-url')
      .set('Authorization', `Bearer ${accessA}`)
      .send({ url: 'https://example.com/gate-doc', title: '게이트 외부 문서' })
      .expect(201);
    const vaultItemId = extRes.body.data.id as string;

    // Create User B and verify isolation
    await prisma.user.create({
      data: {
        id: uuidv7(),
        email: userBEmail,
        passwordHash: await hashPassword(password),
        nickname: '게이트B',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      },
    });
    const loginB = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: userBEmail, password })
      .expect(200);
    const accessB = loginB.body.data.accessToken as string;

    await request(app.getHttpServer())
      .delete(`/api/v1/vault/items/${vaultItemId}`)
      .set('Authorization', `Bearer ${accessB}`)
      .expect(404);

    // Withdraw A -> hard delete PII
    await request(app.getHttpServer())
      .delete('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessA}`)
      .send({ currentPassword: password })
      .expect(204);

    const deletedUser = await prisma.user.findUnique({ where: { email: userAEmail } });
    expect(deletedUser).toBeNull();
  });

  it('Gate #5: 1 report keeps VALID, 3 distinct IPs -> NEEDS_REVIEW, admin verify -> VALID, and FRESHNESS_CHECK', async () => {
    rateLimit.reset();
    const toolId = uuidv7();
    createdContentIds.push(toolId);
    await prisma.content.create({
      data: {
        id: toolId,
        type: ContentType.TOOL,
        slug: `gate5-tool-${Date.now()}`,
        title: '게이트5 신선도 테스트 도구',
        summary: '제보 및 30일 신선도 검증용 도구입니다.',
        publishStatus: PublishStatus.PUBLISHED,
        verificationStatus: VerificationStatus.VALID,
        verifiedAt: new Date(),
        publishedAt: new Date(),
        sourceType: SourceType.OFFICIAL,
        sourceUrl: 'https://example.com/gate5',
      },
    });

    // 1 report -> stays VALID
    await request(app.getHttpServer())
      .post(`/api/v1/contents/${toolId}/reports`)
      .set('X-Forwarded-For', '203.0.113.10')
      .send({ reason: 'PRICING_CHANGED', detail: '가격 변경 제보 1' })
      .expect(201);
    let content = await prisma.content.findUnique({ where: { id: toolId } });
    expect(content?.verificationStatus).toBe(VerificationStatus.VALID);

    // 2 more distinct IPs -> 3 distinct IPs -> NEEDS_REVIEW
    await request(app.getHttpServer())
      .post(`/api/v1/contents/${toolId}/reports`)
      .set('X-Forwarded-For', '203.0.113.11')
      .send({ reason: 'PRICING_CHANGED', detail: '가격 변경 제보 2' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/contents/${toolId}/reports`)
      .set('X-Forwarded-For', '203.0.113.12')
      .send({ reason: 'PRICING_CHANGED', detail: '가격 변경 제보 3' })
      .expect(201);

    content = await prisma.content.findUnique({ where: { id: toolId } });
    expect(content?.verificationStatus).toBe(VerificationStatus.NEEDS_REVIEW);

    // Admin verify restores VALID
    await request(app.getHttpServer())
      .post(`/api/v1/admin/contents/${toolId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    content = await prisma.content.findUnique({ where: { id: toolId } });
    expect(content?.verificationStatus).toBe(VerificationStatus.VALID);

    // Simulate 35 days old -> FRESHNESS_CHECK marks NEEDS_REVIEW
    const thirtyFiveDaysAgo = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);
    await prisma.content.update({
      where: { id: toolId },
      data: { verifiedAt: thirtyFiveDaysAgo },
    });
    await maintenanceService.runFreshnessCheck(new Date());

    content = await prisma.content.findUnique({ where: { id: toolId } });
    expect(content?.verificationStatus).toBe(VerificationStatus.NEEDS_REVIEW);
  });

  it('Gate #6: Production compose, ARM64 deploy rollback/Discord workflow, and backup-db.sh invariants', () => {
    const rootDir = join(__dirname, '..', '..');
    const composeProd = readFileSync(join(rootDir, 'deploy/docker-compose.prod.yml'), 'utf8');
    const deployWorkflow = readFileSync(join(rootDir, '.github/workflows/deploy.yml'), 'utf8');
    const backupScript = readFileSync(join(rootDir, 'deploy/scripts/backup-db.sh'), 'utf8');

    expect(composeProd).toContain('postgres:17-alpine');
    expect(composeProd).toContain('alkok-be:');
    expect(composeProd).toContain('alkok-fe-web:');
    expect(composeProd).toContain('alkok-fe-admin:');
    expect(composeProd).toContain('127.0.0.1:18102:8080');
    expect(composeProd).toContain('mem_limit: 512m');

    expect(deployWorkflow).toContain('linux/arm64');
    expect(deployWorkflow).toContain('.last_good_alkok-be');
    expect(deployWorkflow).toContain('http://127.0.0.1:18102/api/health');
    expect(deployWorkflow).toContain('DISCORD_WEBHOOK_URL');

    expect(backupScript).toContain('pg_dump');
    expect(backupScript).toContain('pg_restore --list');
    expect(backupScript).toContain('rclone copy');
    expect(backupScript).toContain('DISCORD_WEBHOOK_URL');
  });
});
