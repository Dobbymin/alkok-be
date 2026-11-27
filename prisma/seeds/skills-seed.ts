import {
  DifficultyLevel,
  PricingModel,
  Prisma,
  SkillExecutionVerification,
  SkillKind,
} from '@prisma/client';

import { EXTRA_SEED_SKILLS } from './skills-catalog-expansion-seed';
import { CAREER_SEED_SKILLS } from './skills-career-seed';

export interface SeedSkillInput {
  slug: string;
  title: string;
  summary: string;
  sourceUrl: string;
  sourceName: string;
  isFeatured?: boolean;
  domains: string[];
  aiUses: string[];
  tags: string[];
  skillKind: SkillKind;
  skillSlug: string;
  authorName: string;
  license?: string;
  repositoryUrl: string;
  sourceFileUrl?: string;
  executionVerification: SkillExecutionVerification;
  difficulty: DifficultyLevel;
  pricingModel: PricingModel;
  compatibleAgents: string[];
  overview: string;
  useCases: string[];
  beforeAfter: {
    beforeItems: string[];
    afterItems: string[];
  };
  workflowSteps: Array<{
    step: number;
    title: string;
    description: string;
    badge?: string;
  }>;
  prerequisites: Array<{
    name: string;
    required: boolean;
    description: string;
  }>;
  installPrompt: string;
  installGuides: Array<{
    environment: string;
    label: string;
    steps: string[];
    command?: string;
    invokeExample?: string;
  }>;
  examplePrompts: Array<{
    label: string;
    prompt: string;
  }>;
  expectedOutputs: Array<{
    order: string;
    title: string;
    description: string;
  }>;
  postRunChecklist: string[];
  tips: string[];
  cautions: string;
  faq: Array<{
    question: string;
    answer: string;
  }>;
  fileStructure: string[];
  skillMdPreview: string;
  webAlternative: {
    title: string;
    description: string;
    recommendedTools: string[];
    guideSlug?: string;
  };
  toc: Array<{ id: string; text: string; level: number }>;
  compatibleToolSlugs: string[];
}

export const DEFAULT_SKILL_TOC: Array<{ id: string; text: string; level: number }> = [
  { id: 'overview', text: '어떤 스킬·플러그인인가요?', level: 2 },
  { id: 'before-after', text: '도입 전후 비교', level: 2 },
  { id: 'workflow', text: '어떻게 진행되나요?', level: 2 },
  { id: 'install', text: '준비물 및 설치·호출 방법', level: 2 },
  { id: 'examples', text: '이렇게 요청하고 결과를 확인하세요', level: 2 },
  { id: 'tips-faq', text: '잘 쓰는 팁 · 주의사항 · FAQ', level: 2 },
  { id: 'web-alternative', text: '설치 없이 웹 AI로 따라 하기', level: 2 },
  { id: 'source-preview', text: '파일 구성 및 SKILL.md 미리보기', level: 2 },
];

const BASE_SEED_SKILLS: SeedSkillInput[] = [
  {
    slug: 'skill-humanize-korean',
    title: 'Humanize KR (AI 글 사람처럼 윤문하기)',
    summary:
      'ChatGPT·Claude·Gemini가 쓴 한글에서 번역투, 기계적 대구, 뻔한 관용구를 찾아 핵심 내용과 숫자는 그대로 두고 사람이 쓴 글처럼 다듬습니다.',
    sourceUrl: 'https://github.com/epoko77-ai/im-not-ai',
    sourceName: 'epoko77-ai',
    isFeatured: true,
    domains: ['docs-reports', 'content-design'],
    aiUses: ['writing-summary'],
    tags: ['에이전트-스킬-mcp', '한국어윤문', 'ai티제거', 'claude-skills'],
    skillKind: SkillKind.SKILL,
    skillSlug: 'humanize-korean',
    authorName: 'epoko77-ai',
    license: 'MIT',
    repositoryUrl: 'https://github.com/epoko77-ai/im-not-ai',
    sourceFileUrl: 'https://github.com/epoko77-ai/im-not-ai',
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.PRACTICAL,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code', 'Claude.ai', 'Codex', 'Antigravity', 'Cursor'],
    overview:
      'AI가 쓴 한국어 초안을 읽으면 "~를 통해", "A가 아니라 B" 같은 번역투와 쉼표 남발, 균일한 문장 길이가 반복되어 어색하게 느껴집니다. 이 스킬은 10대 카테고리 85개 AI 티 패턴을 점수로 진단한 뒤, 사실·수치·고유명사는 건드리지 않고 문체와 호흡만 자연스러운 한국어로 재작성합니다.',
    useCases: [
      'AI로 작성한 블로그 글·뉴스레터·유튜브 대본이 딱 봐도 AI 같다는 피드백을 받을 때',
      '보고서나 공지문에 번역투 문장과 "~하는 것이 중요합니다" 같은 관용구가 반복될 때',
      '내용이나 숫자가 임의로 바뀌지 않도록 보존하면서 문장 호흡만 다듬고 싶을 때',
    ],
    beforeAfter: {
      beforeItems: [
        'AI로 쓴 글이 기계적인 대구와 번역투 때문에 읽기 부담스럽다.',
        '직접 고치다 보면 원래 근거 수치나 핵심 논점까지 함께 달라진다.',
        '어디가 어색한지 구체적으로 짚어내어 수정 지시하기 어렵다.',
      ],
      afterItems: [
        '번역투, 과도한 쉼표, 피동태 남용 등 AI 티 패턴을 자동 진단해 교정한다.',
        '문장별 핵심 키워드와 숫자를 보존하고 변경률이 과도하면 스스로 되돌린다.',
        '변경률·등급·교정 패턴 요약을 함께 제공해 사람이 최종 검수하기 쉽다.',
      ],
    },
    workflowSteps: [
      {
        step: 1,
        title: '글 붙여 넣기 및 인사말 제거',
        description: '윤문할 텍스트나 파일 경로를 전달하면 "물론입니다!" 같은 챗봇 서두를 먼저 걷어냅니다.',
        badge: '입력 정리',
      },
      {
        step: 2,
        title: 'AI 티 점수 계측 및 경로 분기',
        description: 'Python 스크립트가 패턴 밀도를 측정해 가볍게(1콜)·보통(2콜)·정밀(3+콜) 경로를 자동 선택합니다.',
        badge: 'Python',
      },
      {
        step: 3,
        title: '지배 패턴 진단 및 겨냥 윤문',
        description: '이 글을 지배하는 AI 티 패턴 3~6개를 식별하고 핵심 단어를 유지한 채 문체와 리듬만 바꿉니다.',
      },
      {
        step: 4,
        title: '변경률·사실 보존 자체 점검',
        description: '수치나 사실이 누락되거나 변경률이 너무 높으면 되돌린 뒤 최종 등급과 요약표를 출력합니다.',
      },
    ],
    prerequisites: [
      {
        name: '스킬 지원 AI 에이전트',
        required: true,
        description: 'Claude Code, Codex, Antigravity, Cursor 또는 Claude.ai 스킬 기능이 필요합니다.',
      },
      {
        name: 'Python 3 (선택/로컬 정밀 계측용)',
        required: false,
        description: '표준 라이브러리만 사용하며, 로컬 점수 계측 스크립트를 돌릴 때 사용합니다.',
      },
    ],
    installPrompt:
      'https://github.com/epoko77-ai/im-not-ai 저장소의 humanize-korean 스킬을 현재 에이전트의 스킬 폴더에 설치해줘. SKILL.md와 참조하는 scripts·references 파일을 함께 유지하고, 설치 후 humanize-korean 스킬이 정상 인식되는지 확인해줘.',
    installGuides: [
      {
        environment: 'claude-code',
        label: 'Claude Code',
        steps: [
          '저장소에서 스킬 폴더를 내려받아 ~/.claude/skills/humanize-korean/ (또는 프로젝트 .claude/skills/)에 복사합니다.',
          'Claude Code를 재시작한 뒤 /humanize-korean 또는 자연어로 호출합니다.',
        ],
        invokeExample: '/humanize-korean 아래 블로그 초안에서 AI 티를 빼고 자연스럽게 다듬어줘.',
      },
      {
        environment: 'codex',
        label: 'Codex / Cursor',
        steps: [
          '에이전트 채팅창에 위의 자연어 설치 요청 프롬프트를 붙여넣어 스킬 폴더에 배치합니다.',
          '설치 완료 후 $humanize-korean 또는 자연어 트리거로 실행합니다.',
        ],
        invokeExample: '$humanize-korean 이 글 AI 같아? 먼저 진단하고 윤문해줘.',
      },
      {
        environment: 'claude-web',
        label: 'Claude.ai 웹/앱',
        steps: [
          '설정 → 기능(Capabilities) → 스킬 메뉴에서 스킬 폴더를 업로드해 활성화합니다.',
          '대화창에 윤문할 본문을 붙여넣고 "이 글 AI 티 없애줘"라고 입력합니다.',
        ],
      },
    ],
    examplePrompts: [
      { label: '기본 윤문', prompt: '이 글에서 AI 티 없애줘. 숫자와 고유명사는 그대로 유지해줘.' },
      { label: '사전 진단', prompt: '이 글 AI 같아? 먼저 어떤 AI 티 패턴이 많은지 진단만 해줘.' },
      { label: '정밀 재윤문', prompt: '정밀 모드로 다시 다듬고, 변경률과 고친 패턴 요약을 같이 보여줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '사람이 쓴 것처럼 다듬은 윤문본', description: '불릿 남발과 번역투를 걷어낸 최종 한국어 본문' },
      { order: '02', title: '변경률·등급 및 자체 점검 결과', description: '원본 대비 변화 비율과 수치·사실 보존 통과 여부' },
      { order: '03', title: '교정된 AI 티 패턴 요약', description: '어떤 표현(예: 대구, 피동태)을 어떻게 고쳤는지 목록 제공' },
    ],
    postRunChecklist: [
      '원문에 있던 수치, 날짜, 고유명사가 윤문 과정에서 빠지거나 바뀌지 않았는지 대조합니다.',
      '문체가 지나치게 구어체로 흘러 문서 목적(보고서/블로그)과 어긋나지 않았는지 확인합니다.',
      '변경 요약표에서 의도와 다르게 바뀐 문장이 있다면 해당 문단만 지정해 재요청합니다.',
    ],
    tips: [
      '바로 고치기 전에 "이 글 AI 같아?"로 먼저 진단하면 수정이 필요한 문단만 콕 집어 고칠 수 있습니다.',
      '사내 보고서처럼 격식이 필요한 글은 "비즈니스 보고서 톤 유지" 조건을 함께 적어주세요.',
    ],
    cautions:
      'AI 탐지기를 100% 우회하는 도구가 아니라, 실제 한국어 독자가 읽었을 때 부자연스러운 AI 문체 패턴을 줄여주는 윤문 도구입니다.',
    faq: [
      {
        question: '원래 글의 내용이나 숫자가 임의로 바뀌지 않나요?',
        answer: '핵심 내용 단어와 숫자를 보존하는 규칙이 내장되어 있으며 변경률이 과도하면 되돌립니다. 다만 중요한 대외 문서는 반드시 결과 요약표로 한 번 더 검수하세요.',
      },
      {
        question: '단순 맞춤법 교정이나 번역도 이 스킬로 하나요?',
        answer: '맞춤법 교정이나 영한 번역 자체가 목적이라면 전용 맞춤법·번역 도구를 먼저 거친 뒤 마지막 문체 다듬기에 쓰는 것이 효과적입니다.',
      },
    ],
    fileStructure: [
      'SKILL.md',
      'LICENSE',
      'references/ai-tell-taxonomy.md',
      'references/diagnosis-rules.md',
      'references/rewriting-playbook.md',
      'scripts/verify_change_rate.py',
      'scripts/verify_gates.py',
    ],
    skillMdPreview: `---
name: humanize-korean
description: AI(ChatGPT·Claude·Gemini 등)가 쓴 한글 텍스트를 "사람이 쓴 글처럼" 윤문해주는 오케스트레이터 스킬.
---
# Humanize Korean (AI 티 제거 윤문)
## 핵심 원칙
1. 내용과 숫자, 고유명사는 한 글자도 바꾸지 않는다.
2. 번역투·기계적 대구·피동태 남용·이모지 과다 등 AI 티 패턴만 진단해 자연스러운 한국어 리듬으로 재작성한다.
3. route_hint(light | standard | heavy)에 따라 진단 → 겨냥 윤문 → 자체 점검 단계를 선택한다.`,
    webAlternative: {
      title: '설치 없이 Claude Projects / ChatGPT에서 80% 따라 하기',
      description:
        '개발 도구 설치가 어렵다면 Claude Projects 맞춤 지침에 "번역투(~를 통해), A가 아니라 B 대구, 불릿 남발을 금지하고 숫자를 그대로 유지해 윤문하라"는 규칙을 저장해 두고 원문을 붙여넣으면 유사한 효과를 얻을 수 있습니다.',
      recommendedTools: ['claude', 'chatgpt'],
      guideSlug: 'guide-claude-skills-vs-web-alternatives',
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['claude', 'chatgpt', 'cursor'],
  },
  {
    slug: 'skill-hiring-sim-resume-review',
    title: 'Hiring Sim Resume Review (채용 담당자 관점 이력서 점검)',
    summary:
      'ATS 자동 스크리닝과 리크루터 검토 관점을 시뮬레이션해 지원 공고와 이력서의 연결성, 우선 수정 항목을 구조화해 진단합니다.',
    sourceUrl: 'https://github.com/techeer-sv/Career-Skills',
    sourceName: 'techeer-sv',
    isFeatured: true,
    domains: ['career', 'docs-reports', 'planning-slides'],
    aiUses: ['writing-summary', 'search-analysis'],
    tags: ['에이전트-스킬-mcp', '취업·이직', '이력서점검', 'claude-skills'],
    skillKind: SkillKind.SKILL,
    skillSlug: 'hiring-sim-resume-review',
    authorName: 'techeer-sv',
    license: 'MIT',
    repositoryUrl: 'https://github.com/techeer-sv/Career-Skills',
    sourceFileUrl: 'https://github.com/techeer-sv/Career-Skills/blob/main/skills/hiring-sim-resume-review/SKILL.md',
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.BEGINNER,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code', 'Codex', 'Cursor', 'Antigravity'],
    overview:
      '이력서를 여러 번 고쳤는데도 채용 담당자가 핵심 역량을 30초 안에 파악할 수 있을지 막막할 때 사용하는 스킬입니다. 지원 공고의 필수·우대 요건을 분해해 이력서의 근거 문장과 1:1로 대조하고, 합격/보류 관점의 시뮬레이션 피드백과 가장 먼저 고칠 항목을 제시합니다.',
    useCases: [
      '지원 공고의 핵심 자격 요건이 내 이력서 어느 위치에 드러나는지 빠르게 점검할 때',
      '추상적인 업무 나열 문장을 구체적인 성과·근거 중심 문장으로 다듬고 싶을 때',
      '서류 제출 전 리크루터 관점의 Red Flag(경력 공백, 불명확한 기여도 등)를 미리 확인하고 싶을 때',
    ],
    beforeAfter: {
      beforeItems: [
        '이력서만 넣고 "고쳐줘"라고 하면 뻔한 문장 다듬기 조언만 돌아온다.',
        '지원 공고의 필수 요건과 내 경험이 어디서 어긋나는지 한눈에 보이지 않는다.',
        'AI가 없는 성과 수치를 임의로 지어내어 그대로 쓰기 위험하다.',
      ],
      afterItems: [
        '공고 요구사항 / 이력서 근거 / 부족한 설명 / 보완 질문 4영역으로 구조화해 보여준다.',
        'ATS 키워드 매칭과 리크루터 Red Flag 기준을 분리해 우선 수정 3순위를 짚어준다.',
        '없는 경험을 만들어내지 않고 사용자가 확인 질문을 통해 실제 기록을 채우도록 유도한다.',
      ],
    },
    workflowSteps: [
      { step: 1, title: '이력서 및 채용 공고 입력 수집', description: 'PDF/Markdown/TXT 이력서와 지원할 공고 본문(또는 URL)을 입력받습니다.', badge: '입력' },
      { step: 2, title: '경력·프로젝트 및 공고 요건 추출', description: '경력·기술 스택·성과를 파싱하고 공고의 필수(Must-have)와 우대(Nice-to-have) 요건을 분리합니다.' },
      { step: 3, title: 'ATS 시뮬레이션 & 리크루터 스크리닝', description: '키워드 매칭, 경력 요건 충족 여부, Red Flag 유무를 시뮬레이션합니다.' },
      { step: 4, title: '우선 수정 3항목 및 질문 제시', description: '가장 먼저 보완할 문장과 사실 확인 질문을 출력합니다.' },
    ],
    prerequisites: [
      { name: '스킬 지원 에이전트', required: true, description: 'Codex, Claude Code, Cursor, Antigravity 중 하나가 필요합니다.' },
      { name: '이력서(PDF/MD/TXT) & 지원 공고', required: true, description: '개인 연락처를 가린 이력서 파일과 지원할 직무 공고 본문을 준비하세요.' },
    ],
    installPrompt:
      'https://github.com/techeer-sv/Career-Skills 에서 skills/hiring-sim-resume-review 스킬을 현재 에이전트의 스킬 폴더에 설치해줘. SKILL.md와 이 스킬이 참조하는 공통 파일을 함께 유지하고, 설치가 끝나면 hiring-sim-resume-review 스킬을 인식하는지 확인해줘.',
    installGuides: [
      {
        environment: 'codex',
        label: 'Codex / Cursor',
        steps: [
          '채팅창에 설치 요청 프롬프트를 입력해 skills/hiring-sim-resume-review를 설치합니다.',
          '설치 후 $hiring-sim-resume-review 와 함께 이력서 파일 경로·공고를 전달합니다.',
        ],
        invokeExample: '$hiring-sim-resume-review 첨부한 공고와 이력서만 사용해 검토해줘.',
      },
      {
        environment: 'claude-code',
        label: 'Claude Code',
        steps: [
          '~/.claude/skills/hiring-sim-resume-review/ 경로에 스킬을 배치합니다.',
          '/hiring-sim-resume-review 명령 또는 자연어로 이력서와 공고 경로를 알려줍니다.',
        ],
        invokeExample: '/hiring-sim-resume-review 이력서 파일: ./resume.pdf, 공고는 아래에 붙여넣을게.',
      },
    ],
    examplePrompts: [
      {
        label: '근거 중심 검토',
        prompt: '첨부한 지원 공고와 이력서만 사용해 검토해줘. 자료에 없는 경력이나 성과 수치는 추가하지 말고 가장 먼저 고칠 3가지만 알려줘.',
      },
      {
        label: '질문 기반 보완',
        prompt: '공고 요구사항 대비 부족한 설명을 찾고, 내가 답할 수 있는 확인 질문을 먼저 제시해줘.',
      },
    ],
    expectedOutputs: [
      { order: '01', title: '공고 요구사항 대비 근거 매핑표', description: '필수·우대 요건별 이력서 내 근거 유무 정리' },
      { order: '02', title: '우선 수정 항목 Top 3 및 이유', description: '가장 임팩트가 큰 문장 개선 포인트와 수정 방향' },
    ],
    postRunChecklist: [
      '인용한 공고와 이력서 문장이 실제 원문에 존재하는지 확인합니다.',
      'AI가 제안한 문장에 내가 실제로 수행하지 않은 경험이나 임의의 숫자가 섞였다면 즉시 제외합니다.',
      '개인 연락처·주민번호·사내 기밀 프로젝트명이 포함되지 않았는지 점검합니다.',
    ],
    tips: [
      '이력서만 넣지 말고 반드시 지원 공고 본문을 함께 넣어야 직무 맥락에 맞는 피드백이 나옵니다.',
      'DOCX 파일은 직접 읽지 못할 수 있으므로 PDF나 Markdown으로 변환해 전달하세요.',
    ],
    cautions:
      'ATS 점수와 [PASS]/[REJECT] 판정은 스킬이 만든 시뮬레이션 기준이며 실제 회사의 채용 시스템 점수나 합격 확률을 의미하지 않습니다.',
    faq: [
      {
        question: '이력서 파일만 주고 공고 없이도 볼 수 있나요?',
        answer: '가능하지만 일반적인 문장 조언에 그치기 쉽습니다. 지원하려는 직무 공고를 함께 넣어야 요구 역량과의 연결을 정확히 진단할 수 있습니다.',
      },
    ],
    fileStructure: ['SKILL.md', 'hiring-common/evaluation-framework.md'],
    skillMdPreview: `---
name: hiring-sim-resume-review
description: ATS 시뮬레이션과 리크루터 스크리닝을 거쳐 이력서를 실전 기준으로 평가합니다.
user-invocable: true
---
# 이력서 리뷰 (Hiring Resume Review)
실제 기업의 채용 프로세스를 시뮬레이션합니다: ATS 자동 스크리닝 → 리크루터 검토 → 상세 피드백.
## 실행 절차
- Step 1: 이력서(PDF/MD/TXT) 및 채용 공고 수집
- Step 2: 경력·성과·기술 스택 파싱
- Step 3: 필수/우대 요건 대조 및 Red Flag 점검
- Step 4: 우선 수정 3항목 및 확인 질문 제시`,
    webAlternative: {
      title: '설치 없이 Claude / ChatGPT에 복사해 쓰는 방법',
      description:
        '웹 AI 대화창에 "채용 담당자 관점에서 아래 [공고]의 필수 요건과 [이력서]의 근거를 표로 매핑하고, 없는 수치를 지어내지 말고 보완 질문 3가지를 먼저 물어봐"라고 요청하면 동일하게 활용할 수 있습니다.',
      recommendedTools: ['claude', 'chatgpt'],
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['claude', 'chatgpt', 'cursor'],
  },
  {
    slug: 'skill-git-pr-workflow',
    title: 'Git PR Workflow (브랜치·시크릿 스캔·PR 자동화 스킬)',
    summary:
      '이슈 기반 브랜치 생성, 커밋 규약 검증, Pre-PR 품질 게이트 및 시크릿 스캔, 리베이스와 PR 생성·머지를 표준 절차로 안내합니다.',
    sourceUrl: 'https://github.com/Dobbymin/github-convention',
    sourceName: 'github-convention',
    isFeatured: false,
    domains: ['docs-reports', 'planning-slides'],
    aiUses: ['automation-workflow'],
    tags: ['에이전트-스킬-mcp', 'git', 'pr자동화', '시크릿스캔'],
    skillKind: SkillKind.SKILL,
    skillSlug: 'git-pr-workflow',
    authorName: 'Dobbymin',
    license: 'MIT',
    repositoryUrl: 'https://github.com/Dobbymin/github-convention',
    executionVerification: SkillExecutionVerification.VERIFIED,
    difficulty: DifficultyLevel.PRACTICAL,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code', 'Antigravity', 'Codex', 'Cursor'],
    overview:
      'main 브랜치에 실수로 직접 커밋하거나, API 키가 섞인 채 PR을 올리거나, 이슈 번호가 빠진 브랜치로 작업하는 실수를 막아주는 개발·협업 워크플로 스킬입니다.',
    useCases: [
      '이슈 번호 기반 브랜치 생성부터 커밋·푸시·PR 생성까지 팀 컨벤션을 자동으로 지키고 싶을 때',
      'PR 생성 전 테스트·린트·시크릿 스캔을 빠짐없이 실행해 리뷰 왕복을 줄이고 싶을 때',
    ],
    beforeAfter: {
      beforeItems: [
        '브랜치 이름과 커밋 메시지가 작업자마다 달라 이력 추적이 어렵다.',
        'PR을 올린 뒤 CI 실패나 시크릿 노출을 뒤늦게 발견한다.',
      ],
      afterItems: [
        '{type}/{issue}-{slug} 브랜치와 Closes #이슈 키워드를 자동 적용한다.',
        'Pre-PR 품질 게이트와 시크릿 스캔 통과 후에만 PR을 생성한다.',
      ],
    },
    workflowSteps: [
      { step: 1, title: '이슈 확인 및 작업 브랜치 분기', description: '연결된 GitHub 이슈를 확인하고 규칙에 맞는 브랜치를 생성합니다.' },
      { step: 2, title: 'Pre-PR 품질 게이트 및 시크릿 스캔', description: '린트·타입체크·테스트와 민감 정보 유출 여부를 점검합니다.' },
      { step: 3, title: 'PR 생성 및 CI·리뷰 루프 연계', description: '변경 요약과 이슈 닫기 키워드가 포함된 PR을 생성합니다.' },
    ],
    prerequisites: [
      { name: 'Git & GitHub CLI (gh)', required: true, description: '로컬 Git 저장소와 인증된 gh CLI가 필요합니다.' },
    ],
    installPrompt:
      'https://github.com/Dobbymin/github-convention 저장소의 git-pr-workflow 스킬을 현재 에이전트에 설치해줘.',
    installGuides: [
      {
        environment: 'claude-code',
        label: 'Claude Code / Antigravity',
        steps: ['플러그인 또는 스킬 폴더에 git-pr-workflow를 추가합니다.', '작업 완료 후 "PR 올려줘"라고 요청합니다.'],
        invokeExample: '/git-pr-workflow 변경사항 점검하고 이슈 연결해서 PR 만들어줘.',
      },
    ],
    examplePrompts: [
      { label: 'PR 생성', prompt: '현재 변경사항 린트·테스트·시크릿 스캔 확인한 뒤 이슈 연결해서 PR 올려줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '품질 게이트 통과 리포트', description: '테스트·린트·시크릿 스캔 결과 요약' },
      { order: '02', title: '생성된 PR URL', description: '이슈 링크와 변경 요약이 반영된 Pull Request' },
    ],
    postRunChecklist: [
      'PR 대상 브랜치(base)가 main인지 확인합니다.',
      '.env나 토큰 등 민감 파일이 diff에 포함되지 않았는지 확인합니다.',
    ],
    tips: ['작은 작업 단위마다 커밋하고 PR을 쪼개면 리뷰와 롤백이 훨씬 빨라집니다.'],
    cautions: '강제 푸시(--force-with-lease)는 공유 브랜치가 아닌 본인 작업 브랜치에서만 사용하세요.',
    faq: [
      { question: '비개발자도 쓸 일이 있나요?', answer: '문서 저장소(GitHub Wiki/Docs)를 관리하는 기획자나 테크니컬 라이터도 동일한 PR 절차를 지킬 수 있습니다.' },
    ],
    fileStructure: ['SKILL.md'],
    skillMdPreview: `---
name: git-pr-workflow
description: 브랜치 생성, 커밋, Pre-PR 품질 게이트 및 시크릿 스캔, PR 생성·머지를 표준화합니다.
---
1. Issue 확인 후 {type}/{issue}-{slug} 브랜치 생성
2. lint / typecheck / test / secret scan 통과 확인
3. Closes #<issue> 포함 PR 생성`,
    webAlternative: {
      title: '웹 GitHub에서 PR 템플릿으로 대체하기',
      description: 'CLI 에이전트 없이도 GitHub 저장소에 .github/pull_request_template.md를 두면 동일한 체크리스트를 유지할 수 있습니다.',
      recommendedTools: ['chatgpt', 'claude'],
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['cursor', 'claude'],
  },
  {
    slug: 'skill-korean-spell-check',
    title: 'Korean Spell Check (한국어 맞춤법·띄어쓰기 검수 스킬)',
    summary:
      '긴 한국어 문서를 안전하게 분할해 맞춤법·띄어쓰기·표준어 교정 포인트를 원문 대조 표로 정리해 주는 검수 스킬입니다.',
    sourceUrl: 'https://github.com/anthropics/skills',
    sourceName: 'K-Skills',
    isFeatured: false,
    domains: ['docs-reports', 'meetings-comms'],
    aiUses: ['writing-summary'],
    tags: ['에이전트-스킬-mcp', '맞춤법검사', '교정교열'],
    skillKind: SkillKind.SKILL,
    skillSlug: 'korean-spell-check',
    authorName: 'K-Skills Community',
    license: 'MIT',
    repositoryUrl: 'https://github.com/anthropics/skills',
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.BEGINNER,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code', 'Codex', 'Antigravity', 'Claude.ai'],
    overview:
      '보도자료, 제안서, 공지문처럼 오탈자가 치명적인 문서에서 띄어쓰기·조사·외래어 표기 오류를 찾아 변경 전후만 깔끔하게 짚어줍니다.',
    useCases: [
      '대외 발송 메일이나 보도자료 배포 전 최종 맞춤법을 점검할 때',
      '문장 구조는 바꾸지 않고 오탈자와 띄어쓰기만 최소한으로 고치고 싶을 때',
    ],
    beforeAfter: {
      beforeItems: ['일반 AI에게 교정을 맡기면 문장 전체를 자기 마음대로 의역해 버린다.'],
      afterItems: ['원문 문체를 보존하고 수정된 어절과 교정 사유만 표로 비교해 준다.'],
    },
    workflowSteps: [
      { step: 1, title: '긴 글 청크 분할', description: '글자 수 제한에 걸리지 않도록 문단 단위로 안전하게 나눕니다.' },
      { step: 2, title: '맞춤법·띄어쓰기 대조', description: '오탈자, 띄어쓰기, 외래어 표기 오류를 탐지합니다.' },
      { step: 3, title: '변경점 중심 리포트', description: '수정 전 → 수정 후와 간단한 이유를 함께 제시합니다.' },
    ],
    prerequisites: [
      { name: '스킬 지원 에이전트', required: true, description: 'Claude Code, Codex, Antigravity 또는 Claude.ai에서 동작합니다.' },
    ],
    installPrompt: 'korean-spell-check 스킬 지침을 현재 에이전트 스킬 폴더에 추가하고 인식 여부를 확인해줘.',
    installGuides: [
      {
        environment: 'claude-code',
        label: 'Claude Code / Antigravity',
        steps: ['스킬 폴더에 SKILL.md를 배치하고 검수할 문서를 전달합니다.'],
        invokeExample: '/korean-spell-check 이 공지문 원문 문체는 유지하고 맞춤법만 봐줘.',
      },
    ],
    examplePrompts: [
      { label: '최소 교정', prompt: '문체는 바꾸지 말고 맞춤법과 띄어쓰기 오류만 표로 정리해줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '수정 전후 대조표', description: '틀린 어절, 교정안, 교정 사유 목록' },
    ],
    postRunChecklist: ['고유명사나 사내 전문 용어가 잘못 교정되지 않았는지 확인합니다.'],
    tips: ['고유명사 목록을 먼저 알려주면 불필요한 교정을 막을 수 있습니다.'],
    cautions: '법률·계약 문서의 전문 용어는 일반 맞춤법 기준과 다를 수 있으므로 최종 확인이 필요합니다.',
    faq: [
      { question: '문장 다듬기(윤문)와 무엇이 다른가요?', answer: '맞춤법 교정은 오탈자·띄어쓰기만 최소 수정하고, 문체 개선은 Humanize KR 같은 윤문 스킬이 담당합니다.' },
    ],
    fileStructure: ['SKILL.md'],
    skillMdPreview: `---
name: korean-spell-check
description: 한국어 텍스트의 맞춤법·띄어쓰기를 보수적으로 교정하고 변경점 중심 제안을 반환합니다.
---
1. 긴 입력은 문단 단위로 분할 처리
2. 원문 톤과 고유명사는 임의 변경 금지
3. [원문 -> 수정안 (사유)] 형태로 출력`,
    webAlternative: {
      title: '웹 AI에서 문체 보존 맞춤법 지침 쓰기',
      description: 'ChatGPT나 Claude에 "문장 재작성 금지, 오탈자와 띄어쓰기만 수정 전/후 표로 출력"이라고 지시하면 바로 쓸 수 있습니다.',
      recommendedTools: ['claude', 'chatgpt', 'wrtn'],
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['claude', 'chatgpt', 'wrtn'],
  },
  {
    slug: 'skill-hwp-document-parser',
    title: 'HWP/HWPX Document Parser (한글 문서 파싱·변환 스킬)',
    summary:
      '공공기관·국내 기업에서 많이 쓰는 HWP·HWPX 문서를 에이전트가 직접 읽고 JSON·Markdown으로 추출하거나 양식을 분석합니다.',
    sourceUrl: 'https://github.com/anthropics/skills',
    sourceName: 'K-Skills',
    isFeatured: false,
    domains: ['docs-reports', 'research'],
    aiUses: ['writing-summary', 'search-analysis'],
    tags: ['에이전트-스킬-mcp', 'hwp', 'hwpx', '공공문서'],
    skillKind: SkillKind.SKILL,
    skillSlug: 'hwp-document-parser',
    authorName: 'K-Skills Community',
    license: 'MIT',
    repositoryUrl: 'https://github.com/anthropics/skills',
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.PRACTICAL,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code', 'Codex', 'Cursor', 'Antigravity'],
    overview:
      '일반 AI 웹 채팅에 .hwp 파일을 올리면 인식이 안 되거나 표 구조가 깨지는 경우가 많습니다. 이 스킬은 HWP/HWPX 문서를 구조화된 텍스트와 표로 추출해 요약·비교·질의응답이 가능하게 해줍니다.',
    useCases: [
      '나라장터 RFP(제안요청서)나 공공기관 공고문(.hwp/.hwpx) 핵심 요구사항을 빠르게 추출할 때',
      '여러 버전의 한글 문서 변경점을 비교하거나 Markdown으로 변환해 다른 AI에 넘길 때',
    ],
    beforeAfter: {
      beforeItems: ['매번 한컴오피스를 열어 PDF로 인쇄·변환한 뒤 AI에 올려야 했다.'],
      afterItems: ['로컬 에이전트가 HWP/HWPX 본문과 표를 바로 파싱해 요구사항을 정리한다.'],
    },
    workflowSteps: [
      { step: 1, title: '파일 형식 판별', description: 'HWP(바이너리) 또는 HWPX(XML) 형식을 확인합니다.' },
      { step: 2, title: '텍스트·표·양식 필드 추출', description: '본문과 표 데이터를 Markdown/JSON으로 변환합니다.' },
      { step: 3, title: '요구사항 요약 및 질의응답', description: '추출된 내용을 바탕으로 핵심 조건을 요약합니다.' },
    ],
    prerequisites: [
      { name: '로컬 AI 에이전트 + Node/CLI 파서', required: true, description: '파일 시스템 접근이 가능한 Claude Code·Codex·Cursor 환경이 필요합니다.' },
    ],
    installPrompt: 'HWP/HWPX 파싱 스킬을 설치하고 필요한 CLI 도구(kordoc 등) 실행 환경을 점검해줘.',
    installGuides: [
      {
        environment: 'claude-code',
        label: 'Claude Code / Codex',
        steps: ['스킬을 설치하고 작업 폴더의 .hwp/.hwpx 파일 경로를 지정합니다.'],
        invokeExample: '/hwp ./공고문.hwpx 파일에서 지원 자격과 제출 서류 표만 추출해줘.',
      },
    ],
    examplePrompts: [
      { label: 'RFP 요약', prompt: '이 .hwpx 제안요청서에서 사업 기간, 예산, 필수 평가 항목만 표로 뽑아줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '구조화된 Markdown/표 요약', description: '원문 표가 깨지지 않고 정리된 핵심 요약본' },
    ],
    postRunChecklist: ['복잡한 병합 셀이나 스캔 이미지 안의 글자가 누락되지 않았는지 원문과 대조합니다.'],
    tips: ['대외비 문서는 로컬 파싱 후 민감 정보를 가린 뒤 외부 웹 AI에 활용하세요.'],
    cautions: '암호로 잠긴 HWP 파일은 파싱할 수 없으며, 스캔된 이미지 페이지는 별도 OCR이 필요합니다.',
    faq: [
      { question: '웹 ChatGPT나 Claude에서는 바로 안 되나요?', answer: '웹 버전은 .hwp 바이너리를 직접 못 읽는 경우가 많아 한컴오피스에서 PDF로 저장해 올리는 것이 가장 간편한 대안입니다.' },
    ],
    fileStructure: ['SKILL.md'],
    skillMdPreview: `---
name: hwp-document-parser
description: HWP/HWPX 문서를 Markdown 및 JSON으로 파싱하고 표·양식 필드를 추출합니다.
---
1. HWP/HWPX 파일 구조 확인
2. 본문 및 표를 Markdown으로 변환
3. 핵심 요구사항·일정·예산 추출`,
    webAlternative: {
      title: '웹 AI 대안: PDF 변환 후 NotebookLM / Claude 업로드',
      description: '설치 없이 쓰려면 한글 뷰어/한컴오피스에서 "PDF로 저장"한 뒤 Claude나 NotebookLM에 업로드하면 표와 본문을 안정적으로 읽을 수 있습니다.',
      recommendedTools: ['claude', 'notebooklm'],
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['claude', 'notebooklm'],
  },
  {
    slug: 'plugin-chrome-devtools',
    title: 'Chrome DevTools Plugin (웹 접근성·성능·메모리 디버깅 플러그인)',
    summary:
      '실제 브라우저의 DOM, 접근성(a11y), LCP 성능, 메모리 힙 스냅샷을 에이전트가 직접 검사하고 원인을 진단하는 공식 플러그인입니다.',
    sourceUrl: 'https://developer.chrome.com/docs/devtools/',
    sourceName: 'Chrome DevTools',
    isFeatured: true,
    domains: ['content-design', 'research'],
    aiUses: ['search-analysis', 'automation-workflow'],
    tags: ['에이전트-스킬-mcp', '플러그인', 'chrome-devtools', '접근성', '성능'],
    skillKind: SkillKind.PLUGIN,
    skillSlug: 'chrome-devtools-plugin',
    authorName: 'Chrome DevTools / Community',
    license: 'Apache-2.0',
    repositoryUrl: 'https://developer.chrome.com/docs/devtools/',
    executionVerification: SkillExecutionVerification.VERIFIED,
    difficulty: DifficultyLevel.ADVANCED,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Antigravity', 'Claude Code', 'Cursor'],
    overview:
      '코드만 읽어서는 찾기 어려운 브라우저 렌더링 버그, 대비(Contrast) 미달, 느린 초기 로딩(LCP), 메모리 누수를 실제 Chrome DevTools MCP와 전용 스킬(a11y-debugging, memory-leak-debugging)로 추적합니다.',
    useCases: [
      '라이트/다크 모드에서 WCAG 명도 대비나 포커스 링·ARIA 라벨 누락을 자동 점검할 때',
      '특정 페이지가 느리게 뜨는 LCP 병목이나 힙 메모리 누수를 실측 트레이스로 진단할 때',
    ],
    beforeAfter: {
      beforeItems: ['개발자가 직접 개발자 도구 탭을 캡처해 AI에게 설명해야 했다.'],
      afterItems: ['에이전트가 페이지에 접속해 네트워크·성능 트레이스·접근성 트리를 직접 계측한다.'],
    },
    workflowSteps: [
      { step: 1, title: '브라우저 타깃 연결', description: 'Chrome DevTools MCP를 통해 열려 있는 탭 또는 URL에 연결합니다.' },
      { step: 2, title: '접근성·성능 트레이스 수집', description: 'a11y 감사, LCP 트레이스, 힙 스냅샷 비교를 수행합니다.' },
      { step: 3, title: '코드 수정안 도출', description: '실측 원인을 바탕으로 CSS/컴포넌트 개선 지점을 제안합니다.' },
    ],
    prerequisites: [
      { name: 'Chrome 브라우저 & DevTools MCP 서버', required: true, description: '로컬 Chrome 실행 환경과 플러그인 MCP 연결이 필요합니다.' },
    ],
    installPrompt:
      'Chrome DevTools 플러그인(a11y-debugging, memory-leak-debugging, debug-optimize-lcp 포함)을 연결하고 localhost 페이지 접근성 점검이 가능한지 확인해줘.',
    installGuides: [
      {
        environment: 'antigravity',
        label: 'Antigravity / Claude Code',
        steps: ['플러그인 관리자에서 chrome-devtools-plugin을 활성화합니다.', '로컬 서버를 띄운 뒤 점검할 URL과 목적(접근성/LCP)을 요청합니다.'],
        invokeExample: 'http://localhost:3000 페이지의 WCAG 2.1 AA 접근성과 모바일 레이아웃을 점검해줘.',
      },
    ],
    examplePrompts: [
      { label: '접근성 감사', prompt: '현재 페이지의 명도 대비, 키보드 포커스 순서, ARIA 라벨 누락을 점검해줘.' },
      { label: 'LCP 진단', prompt: '초기 로딩이 느린 이유를 DevTools 성능 트레이스로 측정하고 개선 우선순위를 알려줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '접근성/성능 실측 리포트', description: '실패 요소 셀렉터, 대비 비율, 병목 리소스 목록' },
    ],
    postRunChecklist: ['수정 후 동일 뷰포트(390×844 모바일 / 1440px 데스크톱)에서 재측정해 경고가 0건인지 확인합니다.'],
    tips: ['인증이 필요한 화면은 먼저 브라우저에서 로그인한 탭을 연결하면 수월합니다.'],
    cautions: '운영(Production) 서비스에 과도한 반복 부하 테스트를 실행하지 마세요.',
    faq: [
      { question: '비개발자 PM도 활용할 수 있나요?', answer: '직접 플러그인을 연결하기 어렵다면 Chrome 내장 Lighthouse(개발자 도구 → Lighthouse 탭)로 리포트를 뽑아 웹 AI에 붙여넣는 방법을 권장합니다.' },
    ],
    fileStructure: ['skills/a11y-debugging/SKILL.md', 'skills/memory-leak-debugging/SKILL.md', 'skills/debug-optimize-lcp/SKILL.md'],
    skillMdPreview: `---
name: a11y-debugging
description: Chrome DevTools MCP를 활용해 시맨틱 HTML, ARIA, 포커스, 키보드 내비게이션, 명도 대비를 감사하고 개선합니다.
---
1. 대상 URL 로드 및 접근성 스냅샷 수집
2. 대비(4.5:1) · 키보드 탭 이동 · 터치 타깃 점검
3. 수정 전후 재검증`,
    webAlternative: {
      title: '설치 없이 Chrome Lighthouse 리포트 활용하기',
      description: 'Chrome 개발자 도구(F12) → Lighthouse에서 "접근성·성능" 검사를 실행한 뒤 결과 스크린샷이나 JSON을 Claude/ChatGPT에 올려 개선안을 받을 수 있습니다.',
      recommendedTools: ['claude', 'chatgpt'],
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['cursor', 'claude'],
  },
  {
    slug: 'plugin-figma-code-connect',
    title: 'Figma Plugin (디자인·컴포넌트·Code Connect 연동 플러그인)',
    summary:
      'Figma 디자인 시안과 토큰, 컴포넌트 구조를 읽어 프로덕션 코드로 변환하고 Code Connect 매핑을 지원하는 공식 연동 플러그인입니다.',
    sourceUrl: 'https://www.figma.com/developers/code-connect',
    sourceName: 'Figma',
    isFeatured: true,
    domains: ['content-design', 'planning-slides'],
    aiUses: ['image-video', 'automation-workflow'],
    tags: ['에이전트-스킬-mcp', '플러그인', 'figma', '디자인시스템'],
    skillKind: SkillKind.PLUGIN,
    skillSlug: 'figma',
    authorName: 'Figma Partners',
    license: 'Partner / Official',
    repositoryUrl: 'https://www.figma.com/developers/code-connect',
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.PRACTICAL,
    pricingModel: PricingModel.FREEMIUM,
    compatibleAgents: ['Antigravity', 'Claude Code', 'Cursor'],
    overview:
      '디자인 시안을 보고 수동으로 여백·색상·폰트를 옮겨 적는 대신, Figma 파일의 프레임과 디자인 토큰, 기존 코드베이스 컴포넌트를 연결해 일관된 UI 구현을 돕습니다.',
    useCases: [
      'Figma 시안 링크를 주고 프로젝트 디자인 시스템 토큰에 맞춘 컴포넌트 초안을 만들 때',
      '디자인 시안과 실제 구현된 코드 컴포넌트 간 불일치를 점검할 때',
    ],
    beforeAfter: {
      beforeItems: ['시안 스크린샷만 AI에 주면 정확한 토큰명이나 간격 수치를 추측해서 코드를 만든다.'],
      afterItems: ['Figma 노드의 정확한 스펙과 Code Connect 매핑을 참조해 기존 컴포넌트를 재사용한다.'],
    },
    workflowSteps: [
      { step: 1, title: 'Figma 계정 연결 및 프레임 지정', description: '플러그인 인증 후 작업할 Figma URL 또는 노드 ID를 전달합니다.' },
      { step: 2, title: '토큰·컴포넌트 매핑 추출', description: '색상·타이포·간격과 기존 UI 라이브러리 컴포넌트를 대조합니다.' },
      { step: 3, title: '코드 생성 및 시안 비교', description: '반응형 레이아웃과 접근성 속성이 반영된 코드를 작성합니다.' },
    ],
    prerequisites: [
      { name: 'Figma 계정 및 읽기 권한', required: true, description: '대상 Figma 파일에 접근할 수 있는 계정 연동이 필요합니다.' },
    ],
    installPrompt: 'Figma 플러그인을 연결하고 디자인 시안 URL을 읽어 컴포넌트 매핑을 확인할 수 있도록 설정해줘.',
    installGuides: [
      {
        environment: 'antigravity',
        label: 'Antigravity / Cursor',
        steps: ['Plugins Manager에서 Figma 플러그인을 추가하고 OAuth 로그인을 완료합니다.', 'Figma 프레임 링크를 붙여넣고 구현을 요청합니다.'],
        invokeExample: '이 Figma 프레임 시안을 우리 @alkok/ui 컴포넌트와 OKLCH 토큰으로 구현해줘.',
      },
    ],
    examplePrompts: [
      { label: '시안 → 컴포넌트', prompt: '첨부한 Figma 링크의 카드 레이아웃을 프로젝트 디자인 시스템에 맞춰 구현해줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '디자인 토큰 기반 UI 코드', description: '하드코딩 색상 없이 시안 스펙이 반영된 컴포넌트 코드' },
    ],
    postRunChecklist: ['모바일(390px)과 다크 모드에서 디자인 시안과 어긋나는 부분이 없는지 확인합니다.'],
    tips: ['Figma에서 Auto Layout과 변수(Variables)가 정리되어 있을수록 결과 품질이 크게 올라갑니다.'],
    cautions: '유료 조직 플랜 전용 기능(Code Connect 일부)은 Figma 요금제 정책을 따릅니다.',
    faq: [
      { question: 'Figma 무료 요금제에서도 쓸 수 있나요?', answer: '기본 시안 조회와 디자인 스펙 읽기는 가능하지만 팀 라이브러리·Code Connect 고급 기능은 유료 플랜이 필요할 수 있습니다.' },
    ],
    fileStructure: ['plugin.json', 'skills/figma-implement/SKILL.md'],
    skillMdPreview: `---
name: figma-plugin
description: Figma 디자인을 프로덕션 코드로 변환하고 Code Connect 컴포넌트를 매핑합니다.
---
1. Figma URL/노드 스펙 조회
2. 프로젝트 디자인 토큰·컴포넌트 대조
3. UI 구현 및 시각적 검수`,
    webAlternative: {
      title: '설치 없이 Figma AI / 스크린샷 활용하기',
      description: 'Figma 내장 AI 또는 프레임 PNG 내보내기를 Claude Artifacts에 올려 초안을 만든 뒤 디자인 팀의 토큰 값으로 보정할 수 있습니다.',
      recommendedTools: ['figma-ai', 'claude'],
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['figma-ai', 'cursor', 'claude'],
  },
  {
    slug: 'plugin-cloudflare-workers',
    title: 'Cloudflare Plugin (Workers·R2·Pages 배포 및 설정 플러그인)',
    summary:
      'Cloudflare Workers, KV, R2 스토리지, DNS 및 Pages 배포 상태를 에이전트 안에서 조회하고 관리하는 공식 플랫폼 플러그인입니다.',
    sourceUrl: 'https://developers.cloudflare.com/workers/',
    sourceName: 'Cloudflare',
    isFeatured: false,
    domains: ['research', 'docs-reports'],
    aiUses: ['automation-workflow'],
    tags: ['에이전트-스킬-mcp', '플러그인', 'cloudflare', '배포'],
    skillKind: SkillKind.PLUGIN,
    skillSlug: 'cloudflare',
    authorName: 'Cloudflare Partners',
    license: 'Official',
    repositoryUrl: 'https://developers.cloudflare.com/workers/',
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.ADVANCED,
    pricingModel: PricingModel.FREEMIUM,
    compatibleAgents: ['Antigravity', 'Claude Code', 'Cursor'],
    overview:
      '대시보드를 여러 번 오가지 않고도 Cloudflare Workers 로그, R2 버킷 상태, 환경 변수 설정과 문서 검색을 에이전트 대화 흐름 안에서 처리합니다.',
    useCases: [
      'Cloudflare Workers 또는 R2 버킷 설정·권한 오류를 빠르게 진단할 때',
      'Wrangler 설정 파일 작성 시 최신 Cloudflare API 스펙을 확인하며 구성할 때',
    ],
    beforeAfter: {
      beforeItems: ['오래된 블로그 글의 Wrangler v2/v3 문법을 따라 쓰다 배포 오류를 겪는다.'],
      afterItems: ['공식 플러그인과 최신 문서를 기준으로 Workers/R2 구성을 검증한다.'],
    },
    workflowSteps: [
      { step: 1, title: '계정 인증', description: 'Cloudflare 계정 토큰 또는 OAuth 연결을 완료합니다.' },
      { step: 2, title: '리소스 조회 및 진단', description: 'Workers·R2·DNS 상태를 조회해 오류 원인을 파악합니다.' },
      { step: 3, title: '설정 수정 및 검증', description: '변경 전 확인을 거쳐 안전하게 반영합니다.' },
    ],
    prerequisites: [
      { name: 'Cloudflare 계정', required: true, description: 'Workers/R2가 연결된 Cloudflare 계정이 필요합니다.' },
    ],
    installPrompt: 'Cloudflare 플러그인을 연결해 현재 프로젝트의 Workers/R2 설정 상태를 점검할 수 있게 해줘.',
    installGuides: [
      {
        environment: 'antigravity',
        label: 'Antigravity / Claude Code',
        steps: ['플러그인 관리자에서 Cloudflare를 추가하고 계정을 연결합니다.'],
        invokeExample: '우리 R2 백업 버킷의 수명 주기(Lifecycle) 규칙이 올바른지 확인해줘.',
      },
    ],
    examplePrompts: [
      { label: '설정 점검', prompt: '현재 wrangler.toml 설정에서 운영 배포 전 보완할 보안·바인딩 항목을 점검해줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '리소스 상태 및 설정 점검표', description: '바인딩·CORS·권한 설정 요약' },
    ],
    postRunChecklist: ['운영 DNS나 라우팅 변경 전에는 반드시 스테이징 환경이나 dry-run으로 확인합니다.'],
    tips: ['읽기 전용 토큰으로 먼저 연결해 현황 조회부터 시작하면 안전합니다.'],
    cautions: 'DNS 레코드나 프로덕션 Worker 삭제·덮어쓰기는 서비스 중단을 유발할 수 있으므로 주의하세요.',
    faq: [
      { question: '무료 플랜에서도 사용할 수 있나요?', answer: '네, Cloudflare Free 플랜의 Workers/Pages/R2 무료 한도 내에서도 정상 연동됩니다.' },
    ],
    fileStructure: ['plugin.json', 'skills/cloudflare-workers/SKILL.md'],
    skillMdPreview: `---
name: cloudflare-plugin
description: Cloudflare Workers, 스토리지, AI 및 플랫폼 설정을 MCP 서버로 관리합니다.
---
1. 계정 인증 상태 확인
2. 대상 Worker/R2 리소스 조회
3. 설정 검증 및 변경 전 사용자 확인`,
    webAlternative: {
      title: '설치 없이 Cloudflare 대시보드 + 웹 AI 활용하기',
      description: 'wrangler.toml과 에러 로그만 복사해 ChatGPT나 Claude에 붙여넣고 수정 가이드를 받는 방식으로 대체할 수 있습니다.',
      recommendedTools: ['chatgpt', 'claude'],
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['chatgpt', 'claude', 'cursor'],
  },
  {
    slug: 'plugin-firebase-app-backend',
    title: 'Firebase Plugin (인증·Firestore·호스팅 구축 플러그인)',
    summary:
      'Firebase Authentication, Firestore 보안 규칙, 호스팅 배포까지 프로토타입과 프로덕션 백엔드 구성을 돕는 공식 플러그인입니다.',
    sourceUrl: 'https://firebase.google.com/',
    sourceName: 'Google Firebase',
    isFeatured: false,
    domains: ['planning-slides', 'research'],
    aiUses: ['automation-workflow'],
    tags: ['에이전트-스킬-mcp', '플러그인', 'firebase', '백엔드'],
    skillKind: SkillKind.PLUGIN,
    skillSlug: 'firebase',
    authorName: 'Google Firebase',
    license: 'Official',
    repositoryUrl: 'https://firebase.google.com/',
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.PRACTICAL,
    pricingModel: PricingModel.FREEMIUM,
    compatibleAgents: ['Antigravity', 'Claude Code', 'Cursor'],
    overview:
      '빠르게 MVP 웹·앱을 만들 때 가장 실수가 잦은 Firestore 보안 규칙(Security Rules)과 Auth 설정을 공식 가이드와 에뮬레이터 기준으로 검증합니다.',
    useCases: [
      '사이드 프로젝트나 사내 프로토타입에 이메일/소셜 로그인과 DB를 빠르게 붙일 때',
      'Firestore 보안 규칙이 타인 데이터를 차단하는지 검증하고 싶을 때',
    ],
    beforeAfter: {
      beforeItems: ['테스트용 allow read, write: if true; 규칙을 그대로 운영에 배포하는 실수가 발생한다.'],
      afterItems: ['사용자 UID 기반 접근 제어와 에뮬레이터 테스트를 함께 구성한다.'],
    },
    workflowSteps: [
      { step: 1, title: 'Firebase 프로젝트 초기화', description: 'Auth, Firestore, Hosting 필요한 기능을 선택해 연결합니다.' },
      { step: 2, title: '보안 규칙 및 인덱스 작성', description: '인증 사용자 격리 규칙을 작성합니다.' },
      { step: 3, title: '에뮬레이터 검증', description: '로컬 에뮬레이터로 읽기/쓰기 권한을 테스트합니다.' },
    ],
    prerequisites: [
      { name: 'Google / Firebase 계정', required: true, description: 'Firebase 콘솔 프로젝트가 필요합니다.' },
    ],
    installPrompt: 'Firebase 플러그인을 연결해 현재 프로젝트의 Firestore 보안 규칙과 Auth 설정을 점검해줘.',
    installGuides: [
      {
        environment: 'antigravity',
        label: 'Antigravity',
        steps: ['Plugins Manager에서 Firebase 플러그인을 추가합니다.'],
        invokeExample: 'firestore.rules 파일에서 인증되지 않은 접근이 완전히 막혀 있는지 점검해줘.',
      },
    ],
    examplePrompts: [
      { label: '보안 규칙 점검', prompt: '내 보관함 컬렉션에 본인 UID만 읽고 쓸 수 있는 Firestore 보안 규칙을 작성해줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '검증된 보안 규칙 및 설정', description: 'UID 격리 기반 firestore.rules 파일' },
    ],
    postRunChecklist: ['운영 배포 전 Firebase 에뮬레이터에서 비로그인/타인 계정 차단 테스트를 실행합니다.'],
    tips: ['초기에는 Spark(무료) 플랜 한도를 넘지 않도록 쿼리 인덱스만 최소로 유지하세요.'],
    cautions: '과금 상한(Blaze 플랜 전환 시) 알림 예산을 반드시 Google Cloud 콘솔에 먼저 설정하세요.',
    faq: [
      { question: '무료로도 충분한가요?', answer: 'Spark 무료 플랜으로 Auth와 소규모 Firestore 프로토타입을 비용 없이 운영할 수 있습니다.' },
    ],
    fileStructure: ['plugin.json', 'skills/firebase-basics/SKILL.md'],
    skillMdPreview: `---
name: firebase-plugin
description: Firebase 백엔드, Auth, Firestore 보안 규칙 구성을 지원합니다.
---
1. firebase.json 및 프로젝트 연결 확인
2. 최소 권한 Security Rules 작성
3. 로컬 에뮬레이터 테스트`,
    webAlternative: {
      title: '설치 없이 Firebase Studio / 웹 AI 활용하기',
      description: 'Firebase 콘솔 규칙 시뮬레이터와 Gemini/Claude 웹 대화를 함께 쓰면 별도 플러그인 없이도 규칙을 검증할 수 있습니다.',
      recommendedTools: ['gemini', 'claude'],
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['gemini', 'claude', 'cursor'],
  },
  {
    slug: 'mcp-context7-docs',
    title: 'Context7 MCP (최신 공식 라이브러리 문서 실시간 조회 MCP)',
    summary:
      'AI가 오래된 학습 데이터로 존재하지 않는 API를 지어내는 환각을 막기 위해, Next.js·React·NestJS 등의 최신 공식 문서를 실시간 조회하는 MCP 서버입니다.',
    sourceUrl: 'https://context7.com',
    sourceName: 'Upstash Context7',
    isFeatured: true,
    domains: ['research', 'docs-reports'],
    aiUses: ['search-analysis'],
    tags: ['에이전트-스킬-mcp', 'mcp', 'context7', '환각최소화'],
    skillKind: SkillKind.MCP,
    skillSlug: 'context7',
    authorName: 'Upstash',
    license: 'MIT',
    repositoryUrl: 'https://github.com/upstash/context7',
    executionVerification: SkillExecutionVerification.VERIFIED,
    difficulty: DifficultyLevel.BEGINNER,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Antigravity', 'Claude Code', 'Cursor', 'Codex'],
    overview:
      'AI에게 최신 버전의 라이브러리 사용법을 물으면 1~2년 전 구버전 문법을 섞어 답하는 경우가 많습니다. Context7 MCP는 `resolve-library-id`와 `query-docs` 두 도구로 해당 버전의 공식 문서 스니펫을 바로 가져와 정확한 코드와 설명을 생성하게 합니다.',
    useCases: [
      'Next.js 16, React 19, Prisma 6 등 최근 바뀐 프레임워크 문법을 정확히 참고해야 할 때',
      '기술 검토나 아키텍처 문서 작성 시 추측이 아닌 공식 문서 근거를 확인하고 싶을 때',
    ],
    beforeAfter: {
      beforeItems: ['AI가 deprecated된 옵션을 제안해 설치·실행 시 에러가 반복된다.'],
      afterItems: ['최신 공식 문서 예제를 먼저 조회한 뒤 그에 맞춰 답변하므로 시행착오가 크게 줄어든다.'],
    },
    workflowSteps: [
      { step: 1, title: '라이브러리 ID 해석 (resolve-library-id)', description: '질문 대상 패키지명(예: next, prisma)의 공식 문서 ID를 찾습니다.' },
      { step: 2, title: '최신 문서 스니펫 조회 (query-docs)', description: '필요한 주제 키워드로 공식 코드 예제와 설명을 가져옵니다.' },
      { step: 3, title: '근거 기반 코드·가이드 작성', description: '조회된 최신 스펙만 바탕으로 결과를 생성합니다.' },
    ],
    prerequisites: [
      { name: 'MCP 지원 에이전트', required: true, description: 'Antigravity, Claude Code, Cursor 등에서 MCP 서버를 등록할 수 있어야 합니다.' },
    ],
    installPrompt: 'Context7 MCP 서버(@upstash/context7-mcp)를 MCP 설정에 추가하고 Next.js 문서를 조회할 수 있는지 테스트해줘.',
    installGuides: [
      {
        environment: 'cursor',
        label: 'Cursor / Claude Code',
        steps: [
          'MCP 설정 파일(mcp.json / .claude.json)에 npx -y @upstash/context7-mcp 항목을 추가합니다.',
          '질문 끝에 "use context7"을 붙이거나 자연어로 공식 문서 확인을 요청합니다.',
        ],
        command: 'npx -y @upstash/context7-mcp',
        invokeExample: 'Prisma 6에서 JSON 필터링 문법을 context7으로 확인해서 알려줘.',
      },
    ],
    examplePrompts: [
      { label: '최신 문법 확인', prompt: 'Next.js App Router의 sitemap.ts 작성법을 context7 최신 문서로 확인해줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '최신 공식 문서 기반 코드', description: '구버전 API가 섞이지 않은 검증된 예제' },
    ],
    postRunChecklist: ['본인 프로젝트 package.json에 설치된 메이저 버전과 조회한 문서 버전이 일치하는지 확인합니다.'],
    tips: ['프레임워크 업그레이드 직후 작업할 때 가장 효과가 큽니다.'],
    cautions: '사내 비공개 라이브러리 문서는 공개 인덱스에 없으므로 직접 문서를 제공해야 합니다.',
    faq: [
      { question: 'API 키나 유료 결제가 필요한가요?', answer: '공개 오픈소스 문서 조회는 무료로 사용할 수 있습니다.' },
    ],
    fileStructure: ['mcp-config.json (resolve-library-id, query-docs)'],
    skillMdPreview: `{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}`,
    webAlternative: {
      title: '설치 없이 Perplexity / 공식 문서 URL 활용하기',
      description: 'Perplexity에서 공식 문서 도메인(site:nextjs.org)을 지정해 검색하거나, 공식 문서 URL을 Claude/NotebookLM에 직접 붙여넣으면 유사하게 최신 근거를 확보할 수 있습니다.',
      recommendedTools: ['perplexity', 'claude', 'notebooklm'],
      guideSlug: 'guide-mcp-for-office-workers',
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['cursor', 'claude', 'perplexity'],
  },
  {
    slug: 'mcp-notion-official',
    title: 'Notion Official MCP (사내 위키·데이터베이스 연동 MCP)',
    summary:
      'Notion 페이지 검색, 회의록 요약, 데이터베이스 속성 조회·업데이트를 에이전트와 안전하게 연결하는 공식 Notion MCP 서버입니다.',
    sourceUrl: 'https://github.com/makenotion/notion-mcp-server',
    sourceName: 'Notion',
    isFeatured: true,
    domains: ['docs-reports', 'meetings-comms'],
    aiUses: ['writing-summary', 'automation-workflow'],
    tags: ['에이전트-스킬-mcp', 'mcp', '노션', '회의록'],
    skillKind: SkillKind.MCP,
    skillSlug: 'notion-mcp',
    authorName: 'Notion',
    license: 'MIT',
    repositoryUrl: 'https://github.com/makenotion/notion-mcp-server',
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.PRACTICAL,
    pricingModel: PricingModel.FREEMIUM,
    compatibleAgents: ['Claude Code', 'Cursor', 'Antigravity', 'Claude.ai'],
    overview:
      'Notion에 쌓인 회의록, 프로젝트 보드, 사내 가이드를 매번 복사·붙여넣기 하지 않고 에이전트가 권한이 허용된 페이지만 직접 읽고 정리된 초안을 생성하도록 연결합니다.',
    useCases: [
      '이번 주 회의록 페이지들을 한 번에 읽어 주간 보고서 초안을 만들고 싶을 때',
      '프로젝트 태스크 DB에서 마감 임박 항목을 뽑아 리마인드 메시지를 정리할 때',
    ],
    beforeAfter: {
      beforeItems: ['회의록 5개를 일일이 열어 복사한 뒤 AI 채팅창에 붙여넣어야 했다.'],
      afterItems: ['연결된 Notion 폴더에서 키워드로 문서를 찾아 한 번에 요약·정리한다.'],
    },
    workflowSteps: [
      { step: 1, title: 'Notion Integration 토큰 발급', description: '접근을 허용할 특정 페이지/DB에만 Integration을 초대합니다.' },
      { step: 2, title: 'MCP 서버 연결 및 검색', description: '연결된 범위 내에서 문서 조회 및 블록 읽기를 수행합니다.' },
      { step: 3, title: '요약·초안 생성 및 반영', description: '검토 후 새 페이지 초안을 생성하거나 속성을 업데이트합니다.' },
    ],
    prerequisites: [
      { name: 'Notion 워크스페이스 & Integration 토큰', required: true, description: '워크스페이스 관리자 또는 페이지 공유 권한이 필요합니다.' },
    ],
    installPrompt: '공식 Notion MCP 서버(@notionhq/notion-mcp-server) 연결 방법과 읽기 전용 권한 설정 절차를 안내해줘.',
    installGuides: [
      {
        environment: 'claude-code',
        label: 'Claude Code / Cursor',
        steps: [
          'Notion My Integrations에서 새 Integration을 만들고 필요한 페이지에만 "연결 추가"를 합니다.',
          'MCP 설정에 @notionhq/notion-mcp-server와 토큰 환경 변수를 등록합니다.',
        ],
        command: 'npx -y @notionhq/notion-mcp-server',
        invokeExample: '노션 "2026 주간회의" 폴더의 최근 3개 문서를 요약해줘.',
      },
    ],
    examplePrompts: [
      { label: '주간 요약', prompt: '노션 회의록 DB에서 이번 주에 작성된 문서를 찾아 결정사항과 액션 아이템만 표로 정리해줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '회의록 통합 요약표', description: '담당자·마감일·결정사항이 정리된 보고서' },
    ],
    postRunChecklist: ['Integration이 전사 기밀 페이지까지 과도하게 연결되어 있지 않은지 공유 범위를 점검합니다.'],
    tips: ['처음에는 읽기 전용(Read-only) 권한만 켜고 테스트한 뒤 쓰기 권한을 검토하세요.'],
    cautions: 'Integration 토큰이 외부에 유출되지 않도록 .env 또는 로컬 보안 저장소에만 보관하세요.',
    faq: [
      { question: '비개발자 직장인은 설치 없이 쓸 수 없나요?', answer: 'Claude.ai 유료 플랜의 공식 Notion 커넥터나 Notion AI를 쓰면 터미널 설정 없이 브라우저에서 바로 연동됩니다.' },
    ],
    fileStructure: ['mcp-config.json'],
    skillMdPreview: `{
  "mcpServers": {
    "notionApi": {
      "command": "npx",
      "args": ["-y", "@notionhq/notion-mcp-server"],
      "env": { "NOTION_TOKEN": "ntn_..." }
    }
  }
}`,
    webAlternative: {
      title: '설치 없이 Notion AI 또는 Claude 공식 커넥터 쓰기',
      description: '비개발자라면 터미널에 MCP를 설치하는 대신 Notion 내장 AI나 Claude 웹 커넥터를 사용하는 것이 훨씬 빠르고 안전합니다.',
      recommendedTools: ['notion-ai', 'claude'],
      guideSlug: 'guide-mcp-for-office-workers',
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['notion-ai', 'claude', 'cursor'],
  },
  {
    slug: 'mcp-github-official',
    title: 'GitHub Official MCP (이슈·PR·코드 검색 연동 MCP)',
    summary:
      'GitHub 저장소의 이슈, Pull Request, 커밋 이력, 워크플로 상태를 에이전트에서 직접 조회하고 관리하는 공식 GitHub MCP 서버입니다.',
    sourceUrl: 'https://github.com/github/github-mcp-server',
    sourceName: 'GitHub',
    isFeatured: false,
    domains: ['planning-slides', 'research'],
    aiUses: ['automation-workflow', 'search-analysis'],
    tags: ['에이전트-스킬-mcp', 'mcp', 'github', '이슈관리'],
    skillKind: SkillKind.MCP,
    skillSlug: 'github-mcp',
    authorName: 'GitHub',
    license: 'MIT',
    repositoryUrl: 'https://github.com/github/github-mcp-server',
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.PRACTICAL,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Antigravity', 'Claude Code', 'Cursor', 'Codex'],
    overview:
      '여러 저장소에 흩어진 이슈와 PR 코멘트, 릴리스 노트를 한 번에 파악하고 싶은 팀 리드·개발자·PM을 위한 공식 MCP 연동입니다.',
    useCases: [
      '이번 주 머지된 PR 목록을 자동으로 모아 릴리스 노트나 주간 공유 문서를 만들 때',
      '열려 있는 이슈 중 우선순위가 높은 버그와 관련 커밋을 빠르게 추적할 때',
    ],
    beforeAfter: {
      beforeItems: ['GitHub 웹 탭을 수십 개 열어 PR 변경 내역을 일일이 확인해야 했다.'],
      afterItems: ['에이전트가 PR diff와 이슈 코멘트를 직접 읽어 요약과 리뷰 초안을 만든다.'],
    },
    workflowSteps: [
      { step: 1, title: 'GitHub PAT 또는 OAuth 인증', description: '필요한 저장소 범위(repo/read)만 지정해 연결합니다.' },
      { step: 2, title: '이슈·PR·코드 검색', description: '라벨, 마일스톤, 작성자 기준으로 항목을 조회합니다.' },
      { step: 3, title: '요약 및 후속 작업', description: '릴리스 노트 작성 또는 이슈 코멘트 초안을 생성합니다.' },
    ],
    prerequisites: [
      { name: 'GitHub 계정 & 최소 권한 PAT', required: true, description: '대상 저장소 접근 권한이 있는 토큰이 필요합니다.' },
    ],
    installPrompt: '공식 GitHub MCP 서버를 연결하고 현재 저장소의 열린 이슈 목록을 조회할 수 있는지 확인해줘.',
    installGuides: [
      {
        environment: 'cursor',
        label: 'Cursor / Claude Code',
        steps: ['GitHub 공식 MCP 서버 설정을 추가하고 읽기 권한 토큰을 연결합니다.'],
        invokeExample: '이번 주 main에 머지된 PR 10개를 기능/버그수정으로 분류해 릴리스 노트 초안을 써줘.',
      },
    ],
    examplePrompts: [
      { label: '릴리스 요약', prompt: '최근 7일간 머지된 PR을 사용자 관점의 변경사항으로 요약해줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '주간 변경사항·릴리스 노트', description: '이슈 번호와 링크가 포함된 정리본' },
    ],
    postRunChecklist: ['공개 저장소와 비공개 저장소 토큰 권한이 섞이지 않았는지 확인합니다.'],
    tips: ['이슈 생성·머지 같은 쓰기 작업은 항상 사람 확인 후 실행하도록 지침을 두세요.'],
    cautions: 'Fine-grained PAT를 사용해 대상 저장소와 만료일을 최소한으로 제한하세요.',
    faq: [
      { question: 'gh CLI가 이미 있으면 굳이 MCP가 필요한가요?', answer: '로컬 터미널이 없는 환경이나 여러 저장소를 횡단 검색할 때 MCP가 특히 유용합니다.' },
    ],
    fileStructure: ['mcp-config.json'],
    skillMdPreview: `{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN", "ghcr.io/github/github-mcp-server"]
    }
  }
}`,
    webAlternative: {
      title: '설치 없이 GitHub Copilot 웹 / ChatGPT GitHub 커넥터 쓰기',
      description: 'GitHub 웹 화면에서 Copilot Chat을 열거나 ChatGPT/Claude 공식 GitHub 연동을 사용하면 로컬 MCP 설정 없이도 이슈·PR을 요약할 수 있습니다.',
      recommendedTools: ['microsoft-copilot', 'chatgpt', 'claude'],
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['microsoft-copilot', 'chatgpt', 'claude', 'cursor'],
  },
];

export const SEED_SKILLS: SeedSkillInput[] = [
  ...BASE_SEED_SKILLS,
  ...EXTRA_SEED_SKILLS,
  ...CAREER_SEED_SKILLS,
];

export interface ToolEnrichmentInput {
  pricingPlans: Array<{ name: string; price: string; target: string; highlights: string }>;
  useCases: string[];
  gettingStartedSteps: Array<{ step: number; title: string; description: string }>;
  examplePrompts: Array<{ title: string; prompt: string }>;
  faq: Array<{ question: string; answer: string }>;
}

export const TOOL_ENRICHMENT_DEFAULTS: Record<string, Partial<ToolEnrichmentInput>> = {
  chatgpt: {
    pricingPlans: [
      { name: 'Free', price: '$0/월', target: '가벼운 입문·테스트', highlights: '기본 대화·웹 검색·파일 업로드(횟수 제한)' },
      { name: 'Plus', price: '$20/월', target: '개인 실무 직장인', highlights: '상위 추론 모델·데이터 분석·Custom GPTs 제작' },
      { name: 'Team', price: '$25~30/인/월', target: '팀·부서 협업', highlights: '입력 데이터 학습 제외 기본 적용·팀 워크스페이스 공유' },
    ],
    useCases: [
      '주간 보고서, 이메일 초안, 회의록 요약 등 범용 문서 업무를 빠르게 처리할 때',
      '엑셀/CSV 파일을 올려 추세 요약과 차트 초안을 뽑아볼 때',
      '반복 업무 프롬프트를 Custom GPTs로 저장해 팀원과 링크로 공유할 때',
    ],
    gettingStartedSteps: [
      { step: 1, title: '역할과 출력 형식 먼저 지정하기', description: '질문 첫 줄에 "신사업 기획팀 대리 관점, 표 형태"처럼 역할과 형식을 못 박습니다.' },
      { step: 2, title: '사내 기밀은 마스킹 후 파일 첨부', description: '개인 플랜에서는 설정 → 데이터 제어에서 모델 학습 제외를 켜거나 실명을 가립니다.' },
      { step: 3, title: '초안 받은 뒤 수정 조건 1개씩 추가', description: '한 번에 완벽한 결과를 기대하기보다 "분량 절반으로", "근거 수치 강조"로 다듬습니다.' },
    ],
    examplePrompts: [
      { title: '보고서 구조화', prompt: '아래 메모를 [핵심 결론 / 진행 현황 / 리스크 / 다음 주 계획] 4개 항목의 개조식 보고서로 정리해줘.' },
      { title: 'CSV 데이터 요약', prompt: '첨부한 매출 CSV에서 전월 대비 증감률이 가장 큰 상위 3개 카테고리와 이상치를 표로 뽑아줘.' },
    ],
    faq: [
      { question: '무료 플랜만으로도 실무에 쓸 수 있나요?', answer: '하루 몇 건의 메일·요약 업무는 충분하지만, 파일 분석과 장문 작업을 자주 한다면 Plus 이상이 안정적입니다.' },
      { question: '회사 문서를 올려도 학습에 쓰이지 않나요?', answer: 'Team/Enterprise 플랜은 기본 학습 제외이며, 개인 플랜도 설정에서 "모두를 위해 모델 개선" 옵션을 끌 수 있습니다.' },
    ],
  },
  claude: {
    pricingPlans: [
      { name: 'Free', price: '$0/월', target: '문서 요약 체험', highlights: '기본 대화·Artifacts 미리보기(사용량 제한)' },
      { name: 'Pro', price: '$20/월', target: '기획·작성 집중 실무자', highlights: 'Claude Projects·긴 컨텍스트·Claude Code 연동' },
      { name: 'Team', price: '$25~30/인/월', target: '부서 공동 작업', highlights: '팀 Projects 공유·관리자 제어·높은 사용량' },
    ],
    useCases: [
      '과장되지 않고 자연스러운 한국어 비즈니스 문체로 보고서·제안서를 쓸 때',
      '수십 페이지 계약서·RFP PDF를 통째로 올려 조항별 리스크를 검토할 때',
      'Claude Projects에 사내 양식을 넣어두고 팀 표준 문서를 반복 생성할 때',
    ],
    gettingStartedSteps: [
      { step: 1, title: 'Project 생성 및 참고 문서 고정', description: '자주 쓰는 사내 가이드나 양식 PDF를 Project 지식에 올려 둡니다.' },
      { step: 2, title: 'Artifacts로 결과물 분리 편집', description: '긴 보고서나 HTML 표는 Artifacts 창에서 부분 수정 요청으로 다듬습니다.' },
      { step: 3, title: '원문 근거 인용 요구하기', description: '"반드시 첨부 문서의 몇 페이지 조항인지 함께 표기해"라고 지시합니다.' },
    ],
    examplePrompts: [
      { title: '계약서 독소조항 점검', prompt: '첨부한 계약서에서 을(수탁자)에게 불리한 위약금·지식재산권·해지 조항만 조항 번호와 함께 표로 정리해줘.' },
    ],
    faq: [
      { question: 'ChatGPT와 가장 큰 차이는 무엇인가요?', answer: '한국어 문체가 과장 없이 담백하고 긴 문서의 앞뒤 문맥을 끝까지 놓치지 않는 편입니다. 반면 이미지 생성은 지원하지 않습니다.' },
    ],
  },
  gemini: {
    pricingPlans: [
      { name: 'Free', price: '$0/월', target: '개인 검색·요약', highlights: 'Google 검색 연계 대화·멀티모달 입력' },
      { name: 'Google One AI Premium', price: '$19.99/월', target: '개인 Workspace 사용자', highlights: 'Gmail·Docs·Sheets 내 사이드 패널 통합·2TB 스토리지' },
    ],
    useCases: [
      'Gmail·Google Drive에 흩어진 메일과 문서를 찾아 바로 답장·요약을 만들 때',
      '긴 회의 영상·오디오 파일이나 대용량 문서를 한 번에 입력해 핵심을 뽑을 때',
    ],
    gettingStartedSteps: [
      { step: 1, title: 'Google Workspace 확장 연결 확인', description: '설정에서 Google Drive·Gmail 연동을 허용합니다.' },
      { step: 2, title: '@멘션으로 사내 자료 호출', description: '"@Google Drive에서 4분기 기획안 찾아 요약해줘"처럼 바로 지목합니다.' },
    ],
    examplePrompts: [
      { title: '메일·문서 교차 요약', prompt: '@Gmail에서 이번 주 김팀장님과 주고받은 일정 조율 메일 핵심만 3줄로 정리해줘.' },
    ],
    faq: [
      { question: 'Google Workspace 회사 계정에서도 되나요?', answer: '회사 관리자가 Workspace AI 부가 기능(Gemini for Workspace)을 활성화한 계정에서 앱 내 통합 기능을 쓸 수 있습니다.' },
    ],
  },
  perplexity: {
    pricingPlans: [
      { name: 'Free', price: '$0/월', target: '일반 출처 검색', highlights: '무제한 기본 검색·일부 Pro Search 체험' },
      { name: 'Pro', price: '$20/월', target: '리서치·기획 실무자', highlights: 'Deep Research·학술/웹 소스 필터·모델 선택' },
    ],
    useCases: [
      '시장 규모, 경쟁사 동향, 최신 정책 발표를 출처 링크와 함께 5분 안에 조사할 때',
      '보고서에 넣을 통계 수치가 실제 어느 기관 발표인지 1차 출처를 역추적할 때',
    ],
    gettingStartedSteps: [
      { step: 1, title: 'Focus(소스 범위) 먼저 고르기', description: '일반 웹, 학술(Academic) 등 목적에 맞는 검색 범위를 선택합니다.' },
      { step: 2, title: '인용 번호 [1][2] 직접 클릭 검수', description: '답변에 달린 각주 링크를 눌러 발행일과 원문 수치가 맞는지 반드시 확인합니다.' },
    ],
    examplePrompts: [
      { title: '경쟁사 비교 리서치', prompt: '국내 B2B SaaS 협업툴 상위 3개사의 2026년 기준 요금제와 주요 타깃을 공식 가격 페이지 출처와 함께 표로 정리해줘.' },
    ],
    faq: [
      { question: '환각이 전혀 없나요?', answer: '일반 챗봇보다 훨씬 적지만, 출처 문서를 잘못 요약하는 경우는 있으므로 보고서 인용 전 원문 링크를 꼭 클릭해 확인하세요.' },
    ],
  },
  notebooklm: {
    pricingPlans: [
      { name: 'Free', price: '$0/월', target: '개인 자료 리서치', highlights: '노트북별 다수 PDF·웹·유튜브 소스 기반 질의응답 및 Audio Overview' },
      { name: 'NotebookLM Plus', price: 'Workspace / One 포함', target: '팀 공유 및 대용량', highlights: '노트북 공유·더 많은 소스 및 오디오 생성 한도' },
    ],
    useCases: [
      '외부 추측 없이 내가 올린 PDF·논문·사내 매뉴얼 5~10개 안에서만 정확한 답을 찾을 때',
      '긴 산업 보고서를 이동 중 들을 수 있는 음성 요약(Audio Overview)으로 바꿀 때',
    ],
    gettingStartedSteps: [
      { step: 1, title: '새 노트북 만들고 소스 업로드', description: '비교할 PDF, 웹 링크, Google Docs를 한 노트북에 모읍니다.' },
      { step: 2, title: '인용 번호로 원문 문단 바로 점프', description: '답변 옆 숫자 배지를 클릭해 원문 어느 쪽에서 가져온 내용인지 즉시 검증합니다.' },
    ],
    examplePrompts: [
      { title: '다중 보고서 교차 비교', prompt: '업로드한 3개 기관 보고서에서 공통으로 지적하는 리스크 3가지와 기관별 전망 차이를 출처와 함께 비교해줘.' },
    ],
    faq: [
      { question: '인터넷 최신 검색도 되나요?', answer: '기본적으로는 내가 올린 소스 안에서만 답하도록 설계되어 있어 환각이 적고, 필요한 웹 자료는 소스로 추가하면 됩니다.' },
    ],
  },
};

export function buildDefaultToolEnrichment(tool: {
  title: string;
  pricingSummary: string;
  hasFreePlan: boolean;
  strengths: string[];
}): ToolEnrichmentInput {
  return {
    pricingPlans: [
      {
        name: tool.hasFreePlan ? '무료 플랜' : '기본 유료 플랜',
        price: tool.pricingSummary,
        target: '일반 실무 사용자',
        highlights: tool.strengths[0] ?? '공식 사이트에서 최신 세부 한도 확인',
      },
    ],
    useCases:
      tool.strengths.length > 0
        ? tool.strengths
        : [`${tool.title}의 핵심 기능을 실무 문서·자동화 흐름에 바로 적용할 때`],
    gettingStartedSteps: [
      {
        step: 1,
        title: '공식 사이트 접속 및 무료 체험 확인',
        description: `${tool.title} 공식 페이지에서 무료 플랜 범위와 로그인 방식을 확인합니다.`,
      },
      {
        step: 2,
        title: '작은 샘플 업무 1건으로 테스트',
        description: '실제 사내 기밀 대신 공개된 샘플 자료로 출력 품질과 한국어 지원 수준을 점검합니다.',
      },
    ],
    examplePrompts: [
      {
        title: `${tool.title} 기본 실무 요청`,
        prompt: `${tool.title}에서 처리할 업무 목표, 입력 자료, 원하는 출력 형식을 3줄로 나눠 입력해 보세요.`,
      },
    ],
    faq: [
      {
        question: `${tool.title}의 최신 요금과 무료 한도는 어디서 확인하나요?`,
        answer: '요금 정책은 수시로 변경되므로 상단 "공식 사이트에서 바로 쓰기" 링크에서 최종 플랜 조건을 확인하는 것이 가장 정확합니다.',
      },
    ],
  };
}
