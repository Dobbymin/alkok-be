import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  ContentType,
  DifficultyLevel,
  KoreanSupportLevel,
  PricingModel,
  PublishStatus,
  SourceType,
  ToolKind,
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

describe('Public Home & Contents 3 Types + Compare (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userToken: string;
  const createdContentIds: string[] = [];

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

    const email = `reader-${Date.now()}@contents-e2e.test`;
    const user = await prisma.user.create({
      data: {
        id: uuidv7(),
        email,
        passwordHash: await hashPassword('Password123!'),
        nickname: '구독자',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      },
    });

    const researchCat = await prisma.category.findUniqueOrThrow({ where: { slug: 'research' } });
    await prisma.userInterest.create({ data: { userId: user.id, categoryId: researchCat.id } });

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'Password123!' })
      .expect(200);
    userToken = loginRes.body.data.accessToken;

    const docsCat = await prisma.category.findUniqueOrThrow({ where: { slug: 'docs-reports' } });
    const now = new Date();

    const g1Id = uuidv7();
    const g2Id = uuidv7();
    const draftId = uuidv7();
    const tool1Id = uuidv7();
    const tool2Id = uuidv7();
    const newsId = uuidv7();
    createdContentIds.push(g1Id, g2Id, draftId, tool1Id, tool2Id, newsId);

    await prisma.content.createMany({
      data: [
        {
          id: g1Id,
          type: ContentType.GUIDE,
          slug: 'e2e-guide-docs',
          title: '문서 보고서 가이드',
          summary: '보고서 작성',
          publishStatus: PublishStatus.PUBLISHED,
          verificationStatus: VerificationStatus.VALID,
          verifiedAt: now,
          publishedAt: new Date(now.getTime() + 1000),
          sourceType: SourceType.OFFICIAL,
          sourceUrl: 'https://contents-e2e.test/g1',
          isFeatured: true,
        },
        {
          id: g2Id,
          type: ContentType.GUIDE,
          slug: 'e2e-guide-research',
          title: '리서치 논문 요약 가이드',
          summary: '리서치 요약',
          publishStatus: PublishStatus.PUBLISHED,
          verificationStatus: VerificationStatus.VALID,
          verifiedAt: now,
          publishedAt: now,
          sourceType: SourceType.OFFICIAL,
          sourceUrl: 'https://contents-e2e.test/g2',
          isFeatured: false,
        },
        {
          id: draftId,
          type: ContentType.GUIDE,
          slug: 'e2e-guide-draft',
          title: '비공개 초안',
          summary: '노출 금지',
          publishStatus: PublishStatus.IN_REVIEW,
          verificationStatus: VerificationStatus.VALID,
          sourceType: SourceType.OFFICIAL,
          sourceUrl: 'https://contents-e2e.test/draft',
        },
        {
          id: tool1Id,
          type: ContentType.TOOL,
          slug: 'e2e-tool-a',
          title: 'Tool A',
          summary: 'A summary',
          publishStatus: PublishStatus.PUBLISHED,
          verificationStatus: VerificationStatus.VALID,
          verifiedAt: now,
          publishedAt: now,
          sourceType: SourceType.OFFICIAL,
          sourceUrl: 'https://contents-e2e.test/t1',
        },
        {
          id: tool2Id,
          type: ContentType.TOOL,
          slug: 'e2e-tool-b',
          title: 'Tool B',
          summary: 'B summary',
          publishStatus: PublishStatus.PUBLISHED,
          verificationStatus: VerificationStatus.VALID,
          verifiedAt: now,
          publishedAt: now,
          sourceType: SourceType.OFFICIAL,
          sourceUrl: 'https://contents-e2e.test/t2',
        },
        {
          id: newsId,
          type: ContentType.NEWS,
          slug: 'e2e-news-1',
          title: 'AI 뉴스 1',
          summary: '뉴스 요약',
          publishStatus: PublishStatus.PUBLISHED,
          verificationStatus: VerificationStatus.VALID,
          verifiedAt: now,
          publishedAt: now,
          sourceType: SourceType.OFFICIAL,
          sourceUrl: 'https://contents-e2e.test/n1',
        },
      ],
    });

    await prisma.guideDetail.createMany({
      data: [
        {
          contentId: g1Id,
          difficulty: DifficultyLevel.BEGINNER,
          pricingModel: PricingModel.FREE,
          markdownBody: '본문 1',
          prompts: [{ id: 'p1', title: '프롬프트', content: '내용', variables: [] }],
        },
        {
          contentId: g2Id,
          difficulty: DifficultyLevel.PRACTICAL,
          pricingModel: PricingModel.FREEMIUM,
          markdownBody: '본문 2',
          prompts: [],
        },
      ],
    });

    await prisma.toolDetail.createMany({
      data: [
        {
          contentId: tool1Id,
          toolKind: ToolKind.TOOL,
          providerName: 'OpenAI',
          officialUrl: 'https://openai.com',
          pricingModel: PricingModel.FREEMIUM,
          hasFreePlan: true,
          pricingSummary: '무료 / Plus $20',
          koreanSupport: KoreanSupportLevel.FULL,
          platforms: ['Web'],
          strengths: ['범용성'],
          limitations: ['할루시네이션 주의'],
        },
        {
          contentId: tool2Id,
          toolKind: ToolKind.MODEL,
          providerName: 'Anthropic',
          officialUrl: 'https://anthropic.com',
          pricingModel: PricingModel.FREEMIUM,
          hasFreePlan: true,
          pricingSummary: '무료 / Pro $20',
          koreanSupport: KoreanSupportLevel.FULL,
          platforms: ['Web', 'API'],
          strengths: ['문서 요약'],
          limitations: ['메시지 한도'],
        },
      ],
    });

    await prisma.newsDetail.create({
      data: {
        contentId: newsId,
        keyPoints: ['포인트1', '포인트2', '포인트3'],
        workImpact: '실무 영향',
      },
    });

    await prisma.contentCategory.createMany({
      data: [
        { contentId: g1Id, categoryId: docsCat.id },
        { contentId: g2Id, categoryId: researchCat.id },
      ],
    });

    await prisma.contentRelation.create({
      data: {
        fromContentId: g1Id,
        toContentId: tool1Id,
        relationType: 'RECOMMENDED_TOOL',
      },
    });
  });

  afterAll(async () => {
    await prisma.content.deleteMany({ where: { id: { in: createdContentIds } } });
    await prisma.user.deleteMany({ where: { email: { endsWith: '@contents-e2e.test' } } });
    await app.close();
  });

  it('excludes non-published contents and prioritizes UserInterest domains on /home', async () => {
    const anonHome = await request(app.getHttpServer()).get('/api/v1/home').expect(200);
    const anonSlugs = anonHome.body.data.guides.map((g: { slug: string }) => g.slug);
    expect(anonSlugs).not.toContain('e2e-guide-draft');
    expect(anonSlugs[0]).toBe('e2e-guide-docs');

    const authHome = await request(app.getHttpServer())
      .get('/api/v1/home')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(authHome.body.data.guides[0].slug).toBe('e2e-guide-research');
    expect(Array.isArray(authHome.body.data.recentVaultItems)).toBe(true);

    await request(app.getHttpServer()).get('/api/v1/guides/e2e-guide-draft').expect(404);
  });

  it('supports /guides/:slug, /tools/compare (max 4), /tools/:slug, and /news/:slug', async () => {
    const guideRes = await request(app.getHttpServer())
      .get('/api/v1/guides/e2e-guide-docs')
      .expect(200);
    expect(guideRes.body.data.recommendedTools).toHaveLength(1);

    const compareRes = await request(app.getHttpServer())
      .get('/api/v1/tools/compare?slugs=e2e-tool-a,e2e-tool-b')
      .expect(200);
    expect(compareRes.body.data).toHaveLength(2);
    expect(compareRes.body.data[0].slug).toBe('e2e-tool-a');

    await request(app.getHttpServer()).get('/api/v1/tools/compare?slugs=a,b,c,d,e').expect(400);

    const toolRes = await request(app.getHttpServer()).get('/api/v1/tools/e2e-tool-a').expect(200);
    expect(toolRes.body.data.relatedGuides).toHaveLength(1);

    const newsRes = await request(app.getHttpServer()).get('/api/v1/news/e2e-news-1').expect(200);
    expect(newsRes.body.data.keyPoints).toHaveLength(3);
  });
});
