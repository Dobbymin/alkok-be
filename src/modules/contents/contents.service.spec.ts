import {
  ContentType,
  DifficultyLevel,
  PricingModel,
  PublishStatus,
  SkillExecutionVerification,
  SkillKind,
  SourceType,
  VerificationStatus,
} from '@prisma/client';
import { ContentsService } from './contents.service';
import type { ContentsRepository } from './contents.repository';

describe('ContentsService (GuideDetail & SkillDetail structured fields)', () => {
  const mockRepo = {
    findGuideBySlug: jest.fn(),
    findSkillBySlug: jest.fn(),
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
    expect(result.verificationChecklist).toEqual([]);
  });

  it('maps SkillDetail structured fields with defensive defaults', async () => {
    const now = new Date();
    mockRepo.findSkillBySlug.mockResolvedValue({
      skill: {
        id: 'skill-1',
        type: ContentType.SKILL,
        slug: 'skill-humanize-korean',
        title: 'Humanize KR',
        summary: 'AI 티 제거 윤문 스킬',
        publishStatus: PublishStatus.PUBLISHED,
        verificationStatus: VerificationStatus.VALID,
        verifiedAt: now,
        publishedAt: now,
        sourceType: SourceType.OFFICIAL,
        sourceUrl: 'https://github.com/epoko77-ai/im-not-ai',
        sourceName: 'epoko77-ai',
        helpfulCount: 3,
        isFeatured: true,
        createdAt: now,
        updatedAt: now,
        categories: [],
        tags: [],
        fromRelations: [],
        skillDetail: {
          skillKind: SkillKind.SKILL,
          skillSlug: 'humanize-korean',
          authorName: 'epoko77-ai',
          license: 'MIT',
          repositoryUrl: 'https://github.com/epoko77-ai/im-not-ai',
          sourceFileUrl: null,
          executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
          difficulty: DifficultyLevel.PRACTICAL,
          pricingModel: PricingModel.FREE,
          compatibleAgents: ['Claude Code', 'Codex'],
          overview: '번역투를 교정합니다.',
          useCases: ['블로그 윤문'],
          beforeAfter: { beforeItems: ['AI 티 남'], afterItems: ['자연스러움'] },
          workflowSteps: [{ step: 1, title: '진단', description: '점수화' }],
          prerequisites: [{ name: 'Python 3', required: false, description: '선택' }],
          installPrompt: '설치해줘',
          installGuides: [{ environment: 'claude-code', label: 'Claude Code', steps: ['복사'] }],
          examplePrompts: [{ label: '기본', prompt: '윤문해줘' }],
          expectedOutputs: [{ order: '01', title: '윤문본', description: '결과' }],
          postRunChecklist: ['숫자 확인'],
          tips: ['팁'],
          cautions: '주의',
          faq: [{ question: '무료?', answer: '네' }],
          fileStructure: ['SKILL.md'],
          skillMdPreview: '# Humanize',
          webAlternative: {
            title: '웹 대안',
            description: 'Projects',
            recommendedTools: ['claude'],
          },
          toc: [{ id: 'overview', text: '개요', level: 2 }],
        },
      } as never,
      relatedSkills: [],
    });

    const res = await service.getSkillBySlug('skill-humanize-korean');
    expect(res.skillKind).toBe('SKILL');
    expect(res.compatibleAgents).toEqual(['Claude Code', 'Codex']);
    expect(res.beforeAfter.afterItems).toEqual(['자연스러움']);
    expect(res.webAlternative?.recommendedTools).toEqual(['claude']);
  });
});
