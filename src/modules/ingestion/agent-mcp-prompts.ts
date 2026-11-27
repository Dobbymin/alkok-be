import { ContentType } from '@prisma/client';

export const AGENT_MCP_PRIMARY_TAG = '에이전트-스킬-mcp';

const AGENT_MCP_PATTERNS = [
  /\bmcp\b/i,
  /model\s+context\s+protocol/i,
  /modelcontextprotocol\.io/i,
  /claude\s+skills?/i,
  /skill\.md/i,
  /agent\s+skills?/i,
  /\bai\s+agents?\b/i,
  /claude\s+code/i,
  /\bcodex\b/i,
  /mcp\s*(server|client|서버|클라이언트)/i,
  /에이전트\s*스킬/,
  /ai\s*에이전트/,
];

export interface TopicDetectionInput {
  title?: string | null;
  url?: string | null;
  rawText?: string | null;
  sourceName?: string | null;
  tags?: string[] | null;
}

export function isAgentOrMcpTopic(input: TopicDetectionInput): boolean {
  const haystack = [
    input.title ?? '',
    input.url ?? '',
    input.sourceName ?? '',
    ...(input.tags ?? []),
    (input.rawText ?? '').slice(0, 4000),
  ].join('\n');

  return AGENT_MCP_PATTERNS.some((pattern) => pattern.test(haystack));
}

export function buildPass1SystemPrompt(isAgentMcp: boolean): string {
  const base =
    '당신은 실무 직장인을 위한 AI 지식 큐레이터입니다. 원문의 유용성을 1~5점으로 평가하고 JSON으로 반환하세요.';

  if (!isAgentMcp) {
    return base;
  }

  return [
    base,
    '이 원문은 AI 에이전트·Claude Skills·MCP 트렌드와 관련될 수 있습니다.',
    'CLI, VS Code, 프로토콜 등 개발자 용어가 포함되어 있더라도 비개발자 직장인에게 트렌드 이해 또는 도입 판단 가치가 있으면 relevanceScore를 3점 이상으로 선별하세요.',
    `선별 시 aiUses에는 "automation-workflow"를 우선 포함하고, suggestedTags에는 "${AGENT_MCP_PRIMARY_TAG}"와 관련 태그를 포함하세요.`,
  ].join('\n');
}

export function buildPass2SystemPrompt(targetType: ContentType, isAgentMcp: boolean): string {
  const lines = [
    `당신은 한국 실무 직장인을 위한 AI 지식 편집자입니다. 유형(${targetType})에 맞는 한국어 초안 JSON을 작성하세요.`,
    '원문에 없는 가격, 무료 한도, 출시일, 한국어 지원 여부는 추측하지 말고 "[확인 필요]"로 표기한 뒤 unverifiedFields에 필드명을 기록하세요.',
    '원문 핵심 근거 2~3줄을 evidenceNotes에 포함하세요.',
  ];

  if (targetType === ContentType.GUIDE) {
    lines.push(
      'GUIDE 작성 필수 규칙:',
      '1. prompts에는 복붙 가능한 {{변수}} 템플릿과 variables[], variableExamples(변수별 입력 예시), expectedOutput, tips를 포함하세요.',
      '2. beforeAfterExamples에는 최소 1~2건의 실제 업무 입력 샘플(beforeInput) -> AI 출력 결과 요약(afterOutput)과 improvementPoints[]를 포함하세요.',
      '3. commonMistakes에는 최소 2~3건의 실무 실패 사례(category: SECURITY | HALLUCINATION | FREE_LIMIT | WORKFLOW 중 선택, mistake, prevention)를 포함하세요.',
      '4. verificationChecklist에는 결과물 검수 체크리스트 3~4개를 포함하세요.',
    );
  } else if (targetType === ContentType.SKILL) {
    lines.push(
      'SKILL(스킬·플러그인·MCP) 작성 필수 규칙:',
      '1. skillKind(SKILL | PLUGIN | MCP), skillSlug, authorName, compatibleAgents, overview, useCases를 명확히 작성하세요.',
      '2. beforeAfter(beforeItems[], afterItems[])와 workflowSteps(step, title, description)를 구체적으로 정리하세요.',
      '3. installPrompt(에이전트 자연어 설치 요청문), installGuides(환경별 설치 단계), examplePrompts, expectedOutputs, postRunChecklist, faq를 포함하세요.',
      '4. 비개발자도 설치 없이 따라 할 수 있도록 webAlternative(title, description, recommendedTools)를 반드시 포함하세요.',
    );
  }

  if (isAgentMcp) {
    lines.push(
      '에이전트·스킬·MCP 비개발자 실무 번역 필수 규칙 (플랫폼 내 Agent 실행 기능은 제공하지 않으므로 지식·비교·가이드에 집중):',
      '1. 한 줄 개념 설명: 비개발자 직장인 눈높이의 일상 비유로 개념을 쉽게 번역하세요.',
      '2. 비개발자 도입 난이도: "웹에서 즉시 사용 / 앱 설정 필요 / IT·개발자 지원 필요" 중 어디에 해당하는지 명시하세요.',
      '3. 대안 웹 AI 서비스 비교: 별도 설치 없이 바로 쓸 수 있는 웹 AI 대안(예: ChatGPT Custom GPTs, Claude Projects, Gemini, NotebookLM, Notion AI, Zapier/Make)과 비교하세요.',
    );

    if (targetType === ContentType.NEWS) {
      lines.push(
        'NEWS의 workImpact 문단에 위 3요소(한 줄 개념 설명, 비개발자 도입 난이도, 대안 웹 AI 서비스 비교)를 반드시 포함하세요.',
      );
    } else if (targetType === ContentType.GUIDE) {
      lines.push(
        'GUIDE의 summary, markdownBody, beforeAfterExamples, commonMistakes에 위 3요소와 설치 없이 웹 AI로 대체하는 실무 흐름을 반영하세요.',
      );
    } else {
      lines.push(
        'TOOL의 summary, strengths, limitations에 비개발자 도입 난이도와 설치 없는 웹 대안 대비 장단점을 반영하세요.',
      );
    }
  }

  return lines.join('\n');
}
