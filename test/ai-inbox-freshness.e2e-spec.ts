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
import { HERMES_PROVIDER, type AiProviderClient } from '../src/infra/ai/ai-provider.interface';
import { PrismaService } from '../src/infra/prisma/prisma.service';
import { configureApp } from '../src/main';
import { AiDraftService } from '../src/modules/ingestion/ai-draft.service';
import { MaintenanceBatchService } from '../src/modules/ingestion/maintenance-batch.service';

describe('2-Pass AI Draft, Admin Inbox & Freshness/Purge Batch (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let aiDraftService: AiDraftService;
  let maintenanceService: MaintenanceBatchService;
  let adminToken: string;

  const mockHermes: jest.Mocked<AiProviderClient> = {
    name: 'hermes',
    generateRawJson: jest.fn(),
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
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    aiDraftService = app.get(AiDraftService);
    maintenanceService = app.get(MaintenanceBatchService);
    app.get(RateLimitService).reset();

    const adminEmail = `inbox-admin-${Date.now()}@inbox-e2e.test`;
    await prisma.user.create({
      data: {
        id: uuidv7(),
        email: adminEmail,
        passwordHash: await hashPassword('Password123!'),
        nickname: '인박스관리자',
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
    await prisma.content.deleteMany({
      where: { sourceUrl: { startsWith: 'https://inbox-e2e.test/' } },
    });
    await prisma.rawDocument.deleteMany({
      where: { url: { startsWith: 'https://inbox-e2e.test/' } },
    });
    await prisma.user.deleteMany({ where: { email: { endsWith: '@inbox-e2e.test' } } });
    await app.close();
  });

  beforeEach(() => {
    mockHermes.generateRawJson.mockReset();
  });

  it('screens out score < 3 in Pass 1', async () => {
    const rawDoc = await prisma.rawDocument.create({
      data: {
        id: uuidv7(),
        url: `https://inbox-e2e.test/low-${Date.now()}`,
        normalizedUrl: `https://inbox-e2e.test/low-${Date.now()}`,
        title: '잡담 글',
        rawText: '관련 없는 짧은 내용',
      },
    });

    mockHermes.generateRawJson.mockResolvedValueOnce({
      rawJson: {
        relevanceScore: 2,
        recommendedType: 'NEWS',
        workDomains: ['research'],
        aiUses: ['search-analysis'],
        suggestedTags: ['misc'],
        skipReason: '실무 관련성 낮음',
      },
      usage: {
        provider: 'hermes',
        model: 'hermes-default',
        inputTokens: 100,
        outputTokens: 50,
        estimatedCostUsd: 0,
      },
      latencyMs: 10,
    });

    const res = await aiDraftService.processRawDocument(rawDoc.id);
    expect(res.screenedOut).toBe(true);
    expect(res.contentId).toBeNull();
  });

  it('retries Zod validation once, creates IN_REVIEW draft, and approves via /admin/inbox', async () => {
    const rawDoc = await prisma.rawDocument.create({
      data: {
        id: uuidv7(),
        url: `https://inbox-e2e.test/news-${Date.now()}`,
        normalizedUrl: `https://inbox-e2e.test/news-${Date.now()}`,
        title: 'Claude 업무 기능 업데이트',
        rawText: '새로운 문서 요약 및 팀 공유 기능이 출시되었습니다.',
      },
    });

    // Pass 1 -> score 4
    mockHermes.generateRawJson.mockResolvedValueOnce({
      rawJson: {
        relevanceScore: 4,
        recommendedType: 'NEWS',
        workDomains: ['docs-reports'],
        aiUses: ['writing-summary'],
        suggestedTags: ['claude', 'update'],
      },
      usage: {
        provider: 'hermes',
        model: 'hermes-default',
        inputTokens: 100,
        outputTokens: 50,
        estimatedCostUsd: 0,
      },
      latencyMs: 10,
    });

    // Pass 2 attempt 1 -> invalid keyPoints length (fails Zod)
    mockHermes.generateRawJson.mockResolvedValueOnce({
      rawJson: {
        title: 'Claude 업데이트 요약',
        summary: '실무 문서 요약 기능이 강화되었습니다.',
        workDomains: ['docs-reports'],
        aiUses: ['writing-summary'],
        tags: ['claude'],
        evidenceNotes: ['원문 근거 1'],
        unverifiedFields: ['pricingSummary'],
        keyPoints: ['1줄만 있음'],
        workImpact: '보고서 작성 시간이 단축됩니다.',
      },
      usage: {
        provider: 'hermes',
        model: 'hermes-default',
        inputTokens: 100,
        outputTokens: 50,
        estimatedCostUsd: 0,
      },
      latencyMs: 10,
    });

    // Pass 2 attempt 2 -> valid 3 keyPoints
    mockHermes.generateRawJson.mockResolvedValueOnce({
      rawJson: {
        title: 'Claude 업데이트 요약',
        summary: '실무 문서 요약 기능이 강화되었습니다.',
        workDomains: ['docs-reports'],
        aiUses: ['writing-summary'],
        tags: ['claude'],
        evidenceNotes: ['원문 근거 1'],
        unverifiedFields: ['pricingSummary'],
        keyPoints: ['핵심 1', '핵심 2', '핵심 3'],
        workImpact: '보고서 작성 시간이 단축됩니다.',
      },
      usage: {
        provider: 'hermes',
        model: 'hermes-default',
        inputTokens: 100,
        outputTokens: 50,
        estimatedCostUsd: 0,
      },
      latencyMs: 10,
    });

    const draftRes = await aiDraftService.processRawDocument(rawDoc.id);
    expect(draftRes.screenedOut).toBe(false);
    expect(draftRes.contentId).toBeTruthy();

    const inboxList = await request(app.getHttpServer())
      .get('/api/v1/admin/inbox')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(inboxList.body.data.some((i: { id: string }) => i.id === draftRes.contentId)).toBe(true);

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/admin/inbox/${draftRes.contentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(detail.body.data.evidenceNotes).toEqual(['원문 근거 1']);
    expect(detail.body.data.unverifiedFields).toEqual(['pricingSummary']);

    const approved = await request(app.getHttpServer())
      .post(`/api/v1/admin/inbox/${draftRes.contentId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: '검수 완료된 Claude 업데이트' })
      .expect(200);
    expect(approved.body.data.publishStatus).toBe(PublishStatus.PUBLISHED);
    expect(approved.body.data.verificationStatus).toBe(VerificationStatus.VALID);
  });

  it('validates and persists structured GUIDE draft with beforeAfterExamples and commonMistakes', async () => {
    const rawDoc = await prisma.rawDocument.create({
      data: {
        id: uuidv7(),
        url: `https://inbox-e2e.test/guide-${Date.now()}`,
        normalizedUrl: `https://inbox-e2e.test/guide-${Date.now()}`,
        title: '보고서 작성 실무 가이드 원문',
        rawText: '주간 보고서를 빠르게 정리하는 업무 절차와 주의사항 안내',
      },
    });

    mockHermes.generateRawJson.mockResolvedValueOnce({
      rawJson: {
        relevanceScore: 5,
        recommendedType: 'GUIDE',
        workDomains: ['docs-reports'],
        aiUses: ['writing-summary'],
        suggestedTags: ['보고서'],
      },
      usage: {
        provider: 'hermes',
        model: 'hermes-default',
        inputTokens: 100,
        outputTokens: 50,
        estimatedCostUsd: 0,
      },
      latencyMs: 10,
    });

    mockHermes.generateRawJson.mockResolvedValueOnce({
      rawJson: {
        title: '주간 보고서 구조화 가이드',
        summary: '실무 메모를 4단 보고서로 정리합니다.',
        workDomains: ['docs-reports'],
        aiUses: ['writing-summary'],
        tags: ['보고서'],
        evidenceNotes: ['원문 근거 1'],
        unverifiedFields: [],
        difficulty: 'BEGINNER',
        estimatedMinutes: 10,
        pricingModel: 'FREEMIUM',
        markdownBody: '## 1. 메모 정리\n업무 메모를 복사합니다.',
        prompts: [
          {
            title: '보고서 템플릿',
            content: '{{메모}} 정리',
            variables: ['메모'],
            variableExamples: { 메모: '주간 실적 3건' },
          },
        ],
        beforeAfterExamples: [
          {
            title: '메모 변환',
            beforeInput: '회의함, CS 처리함',
            afterOutput: '1) 성과: CS 처리\n2) 회의: 차주 후속',
            improvementPoints: ['구조화'],
          },
        ],
        commonMistakes: [
          {
            category: 'SECURITY',
            title: '기밀 입력',
            mistake: '실명 포함',
            prevention: '익명화 처리',
          },
        ],
        cautions: '대외비 제외',
      },
      usage: {
        provider: 'hermes',
        model: 'hermes-default',
        inputTokens: 200,
        outputTokens: 150,
        estimatedCostUsd: 0,
      },
      latencyMs: 15,
    });

    const draftRes = await aiDraftService.processRawDocument(rawDoc.id);
    expect(draftRes.screenedOut).toBe(false);
    expect(draftRes.contentId).toBeTruthy();

    const detailRes = await request(app.getHttpServer())
      .get(`/api/v1/admin/inbox/${draftRes.contentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(detailRes.body.data.beforeAfterExamples).toHaveLength(1);
    expect(detailRes.body.data.commonMistakes).toHaveLength(1);
    expect(detailRes.body.data.prompts[0].variableExamples).toEqual({ 메모: '주간 실적 3건' });
  });

  it('ingests manual agent/MCP URL with non-technical translation prompt and 에이전트-스킬-mcp tag', async () => {
    const rawDoc = await prisma.rawDocument.create({
      data: {
        id: uuidv7(),
        url: `https://inbox-e2e.test/mcp-${Date.now()}`,
        normalizedUrl: `https://inbox-e2e.test/mcp-${Date.now()}`,
        title: 'Model Context Protocol (MCP) 실무 활용 업데이트',
        rawText: 'MCP servers connect Claude and AI agents to Notion and Google Drive.',
      },
    });

    mockHermes.generateRawJson.mockResolvedValueOnce({
      rawJson: {
        title: 'MCP 연결 기능의 비개발자 실무 활용법',
        summary: '설치 없이 쓸 수 있는 웹 AI 커넥터 대안을 함께 비교합니다.',
        workDomains: ['docs-reports'],
        aiUses: ['automation-workflow'],
        tags: ['mcp', '웹-대안-비교'],
        evidenceNotes: ['원문 MCP 연결 기능 설명'],
        unverifiedFields: [],
        keyPoints: ['한 줄 개념 설명', '비개발자 도입 난이도 구분', '웹 AI 대안 비교'],
        workImpact:
          '한 줄 개념: AI에 업무 앱을 꽂는 공용 포트입니다. 도입 난이도: 웹 커넥터는 즉시 사용 가능. 대안: Claude Projects와 Zapier.',
      },
      usage: {
        provider: 'hermes',
        model: 'hermes-default',
        inputTokens: 150,
        outputTokens: 90,
        estimatedCostUsd: 0,
      },
      latencyMs: 12,
    });

    const draftRes = await aiDraftService.processRawDocument(rawDoc.id, { skipScreening: true });
    expect(draftRes.screenedOut).toBe(false);
    expect(draftRes.contentId).toBeTruthy();
    expect(mockHermes.generateRawJson).toHaveBeenCalledTimes(1);

    const detailRes = await request(app.getHttpServer())
      .get(`/api/v1/admin/inbox/${draftRes.contentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(detailRes.body.data.publishStatus).toBe(PublishStatus.IN_REVIEW);
    expect(detailRes.body.data.tags).toContain('에이전트-스킬-mcp');
    expect(detailRes.body.data.workImpact).toContain('도입 난이도');
  });

  it('runs FRESHNESS_CHECK (TOOL 30d, GUIDE 90d, NEWS exempt) and 90d RawDocument.rawText NULL purge', async () => {
    const old35d = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);
    const old95d = new Date(Date.now() - 95 * 24 * 60 * 60 * 1000);

    const [tool, guide, news, oldRaw] = await Promise.all([
      prisma.content.create({
        data: {
          id: uuidv7(),
          type: ContentType.TOOL,
          slug: `fresh-tool-${Date.now()}`,
          title: '오래된 도구',
          summary: '요약',
          publishStatus: PublishStatus.PUBLISHED,
          verificationStatus: VerificationStatus.VALID,
          verifiedAt: old35d,
          publishedAt: old35d,
          sourceType: SourceType.OFFICIAL,
          sourceUrl: 'https://inbox-e2e.test/tool',
        },
      }),
      prisma.content.create({
        data: {
          id: uuidv7(),
          type: ContentType.GUIDE,
          slug: `fresh-guide-${Date.now()}`,
          title: '오래된 가이드',
          summary: '요약',
          publishStatus: PublishStatus.PUBLISHED,
          verificationStatus: VerificationStatus.VALID,
          verifiedAt: old95d,
          publishedAt: old95d,
          sourceType: SourceType.OFFICIAL,
          sourceUrl: 'https://inbox-e2e.test/guide',
        },
      }),
      prisma.content.create({
        data: {
          id: uuidv7(),
          type: ContentType.NEWS,
          slug: `fresh-news-${Date.now()}`,
          title: '오래된 소식',
          summary: '요약',
          publishStatus: PublishStatus.PUBLISHED,
          verificationStatus: VerificationStatus.VALID,
          verifiedAt: old95d,
          publishedAt: old95d,
          sourceType: SourceType.OFFICIAL,
          sourceUrl: 'https://inbox-e2e.test/news-old',
        },
      }),
      prisma.rawDocument.create({
        data: {
          id: uuidv7(),
          url: `https://inbox-e2e.test/old-raw-${Date.now()}`,
          normalizedUrl: `https://inbox-e2e.test/old-raw-${Date.now()}`,
          title: '95일 전 원문',
          rawText: '삭제 대상 본문',
          fetchedAt: old95d,
        },
      }),
    ]);

    await maintenanceService.runFreshnessCheck();
    await maintenanceService.purgeOldRawText();

    const [toolAfter, guideAfter, newsAfter, rawAfter] = await Promise.all([
      prisma.content.findUniqueOrThrow({ where: { id: tool.id } }),
      prisma.content.findUniqueOrThrow({ where: { id: guide.id } }),
      prisma.content.findUniqueOrThrow({ where: { id: news.id } }),
      prisma.rawDocument.findUniqueOrThrow({ where: { id: oldRaw.id } }),
    ]);

    expect(toolAfter.verificationStatus).toBe(VerificationStatus.NEEDS_REVIEW);
    expect(guideAfter.verificationStatus).toBe(VerificationStatus.NEEDS_REVIEW);
    expect(newsAfter.verificationStatus).toBe(VerificationStatus.VALID);
    expect(rawAfter.rawText).toBeNull();
    expect(rawAfter.title).toBe('95일 전 원문');
  });
});
