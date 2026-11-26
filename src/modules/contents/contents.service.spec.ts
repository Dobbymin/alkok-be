import {
  ContentType,
  DifficultyLevel,
  PricingModel,
  PublishStatus,
  SourceType,
  VerificationStatus,
} from '@prisma/client';
import { ContentsService } from './contents.service';
import type { ContentsRepository } from './contents.repository';

describe('ContentsService (GuideDetail structured fields)', () => {
  const mockRepo = {
    findGuideBySlug: jest.fn(),
    getUserContentFlags: jest.fn(),
  } as unknown as jest.Mocked<ContentsRepository>;

  const service = new ContentsService(mockRepo);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes legacy prompt field and structured beforeAfterExamples/commonMistakes', async () => {
    const now = new Date();
    mockRepo.findGuideBySlug.mockResolvedValue({
      guide: {
        id: 'guide-1',
        type: ContentType.GUIDE,
        slug: 'legacy-and-structured',
        title: '테스트 가이드',
        summary: '요약',
        publishStatus: PublishStatus.PUBLISHED,
        verificationStatus: VerificationStatus.VALID,
        verifiedAt: now,
        publishedAt: now,
        sourceType: SourceType.OFFICIAL,
        sourceUrl: 'https://example.com/guide',
        sourceName: '알콕',
        helpfulCount: 0,
        isFeatured: false,
        createdAt: now,
        updatedAt: now,
        categories: [],
        tags: [],
        fromRelations: [],
        guideDetail: {
          difficulty: DifficultyLevel.BEGINNER,
          estimatedMinutes: 10,
          pricingModel: PricingModel.FREE,
          markdownBody: '## 본문',
          prompts: [
            {
              id: 'p-1',
              title: '레거시 프롬프트',
              prompt: '{{대상}} 요약해줘',
              variables: ['대상'],
              variableExamples: { 대상: '주간 보고서' },
              expectedOutput: '3줄 요약',
            },
          ],
          beforeAfterExamples: [
            {
              id: 'ba-1',
              title: '예시 1',
              beforeInput: '원본 입력',
              afterOutput: '개선 출력',
              improvementPoints: ['구조화'],
            },
          ],
          commonMistakes: [
            {
              id: 'cm-1',
              category: 'SECURITY',
              title: '기밀 입력',
              mistake: '실명 입력',
              prevention: '익명화',
            },
          ],
          cautions: null,
          toc: [],
        },
      } as never,
      relatedGuides: [],
    });

    const result = await service.getGuideBySlug('legacy-and-structured');

    expect(result.prompts).toEqual([
      {
        id: 'p-1',
        title: '레거시 프롬프트',
        content: '{{대상}} 요약해줘',
        variables: ['대상'],
        variableExamples: { 대상: '주간 보고서' },
        expectedOutput: '3줄 요약',
      },
    ]);
    expect(result.beforeAfterExamples).toEqual([
      {
        id: 'ba-1',
        title: '예시 1',
        beforeInput: '원본 입력',
        afterOutput: '개선 출력',
        improvementPoints: ['구조화'],
      },
    ]);
    expect(result.commonMistakes).toEqual([
      {
        id: 'cm-1',
        category: 'SECURITY',
        title: '기밀 입력',
        mistake: '실명 입력',
        prevention: '익명화',
      },
    ]);
  });

  it('defaults beforeAfterExamples and commonMistakes to empty arrays for legacy records', async () => {
    const now = new Date();
    mockRepo.findGuideBySlug.mockResolvedValue({
      guide: {
        id: 'guide-2',
        type: ContentType.GUIDE,
        slug: 'legacy-only',
        title: '레거시 가이드',
        summary: '요약',
        publishStatus: PublishStatus.PUBLISHED,
        verificationStatus: VerificationStatus.VALID,
        verifiedAt: now,
        publishedAt: now,
        sourceType: SourceType.OFFICIAL,
        sourceUrl: 'https://example.com/guide-2',
        sourceName: '알콕',
        helpfulCount: 0,
        isFeatured: false,
        createdAt: now,
        updatedAt: now,
        categories: [],
        tags: [],
        fromRelations: [],
        guideDetail: {
          difficulty: DifficultyLevel.PRACTICAL,
          estimatedMinutes: null,
          pricingModel: PricingModel.FREEMIUM,
          markdownBody: '## 본문',
          prompts: null,
          beforeAfterExamples: null,
          commonMistakes: undefined,
          cautions: null,
          toc: null,
        },
      } as never,
      relatedGuides: [],
    });

    const result = await service.getGuideBySlug('legacy-only');
    expect(result.prompts).toEqual([]);
    expect(result.beforeAfterExamples).toEqual([]);
    expect(result.commonMistakes).toEqual([]);
  });
});
