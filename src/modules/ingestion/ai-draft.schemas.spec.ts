import { ContentType, DifficultyLevel, PricingModel, SkillKind } from '@prisma/client';
import { GuideDraftSchema, ScreeningOutputSchema, SkillDraftSchema } from './ai-draft.schemas';

describe('GuideDraftSchema', () => {
  const validPayload = {
    title: '주간 보고서 10분 완성 가이드',
    summary: '메신저 메모를 구조화된 보고서로 변환합니다.',
    workDomains: ['docs-reports'],
    aiUses: ['writing-summary'],
    tags: ['보고서'],
    evidenceNotes: ['공식 문서 기반 가이드'],
    unverifiedFields: [],
    difficulty: DifficultyLevel.BEGINNER,
    estimatedMinutes: 10,
    pricingModel: PricingModel.FREEMIUM,
    markdownBody: '## 1. 메모 모으기\n업무 메모를 복사합니다.',
    prompts: [
      {
        title: '보고서 프롬프트',
        content: '{{메모}}를 요약하세요.',
        variables: ['메모'],
        variableExamples: { 메모: '화요일 CS 10건 처리' },
        expectedOutput: '개조식 보고서',
        tips: '실명 마스킹 필수',
      },
    ],
    beforeAfterExamples: [
      {
        title: '메모 변환 예시',
        beforeInput: 'CS 10건 처리했고 내일 회의 있음',
        afterOutput: '1) 성과: CS 10건 처리 완료\n2) 일정: 차일 회의 예정',
        improvementPoints: ['개조식 구조화'],
      },
    ],
    commonMistakes: [
      {
        category: 'SECURITY',
        title: '고객 정보 노출',
        mistake: '실명을 그대로 입력함',
        prevention: 'A사 형태로 마스킹함',
      },
    ],
    cautions: '대외비 제외',
  };

  it('accepts valid structured GUIDE draft payload', () => {
    const parsed = GuideDraftSchema.parse(validPayload);
    expect(parsed.beforeAfterExamples).toHaveLength(1);
    expect(parsed.commonMistakes).toHaveLength(1);
    expect(parsed.prompts[0].variableExamples).toEqual({ 메모: '화요일 CS 10건 처리' });
  });

  it('rejects GUIDE draft missing beforeAfterExamples or invalid mistake category', () => {
    const withoutExamples = { ...validPayload, beforeAfterExamples: [] };
    expect(() => GuideDraftSchema.parse(withoutExamples)).toThrow();

    const invalidCategory = {
      ...validPayload,
      commonMistakes: [{ ...validPayload.commonMistakes[0], category: 'INVALID_CAT' }],
    };
    expect(() => GuideDraftSchema.parse(invalidCategory)).toThrow();
  });

  it('accepts SKILL in ScreeningOutputSchema and SkillDraftSchema', () => {
    const screen = ScreeningOutputSchema.parse({
      relevanceScore: 5,
      recommendedType: ContentType.SKILL,
      workDomains: ['docs-reports'],
      aiUses: ['automation-workflow'],
      suggestedTags: ['claude-skills'],
    });
    expect(screen.recommendedType).toBe(ContentType.SKILL);

    const skill = SkillDraftSchema.parse({
      title: 'Humanize KR',
      summary: 'AI 글 윤문 스킬입니다.',
      evidenceNotes: ['SKILL.md 확인'],
      skillKind: SkillKind.SKILL,
      skillSlug: 'humanize-korean',
      authorName: 'epoko77-ai',
      difficulty: DifficultyLevel.PRACTICAL,
      pricingModel: PricingModel.FREE,
      compatibleAgents: ['Claude Code'],
      overview: '번역투를 제거하고 자연스러운 한국어로 다듬습니다.',
      useCases: ['블로그 윤문'],
      beforeAfter: { beforeItems: ['어색함'], afterItems: ['자연스러움'] },
      workflowSteps: [{ step: 1, title: '진단', description: '패턴 탐지' }],
    });
    expect(skill.skillKind).toBe(SkillKind.SKILL);
  });
});
