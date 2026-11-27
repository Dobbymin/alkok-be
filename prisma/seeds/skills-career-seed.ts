import {
  DifficultyLevel,
  PricingModel,
  SkillExecutionVerification,
  SkillKind,
} from '@prisma/client';
import { DEFAULT_SKILL_TOC, type SeedSkillInput } from './skills-seed';

const JOBSTACK_REPO = 'https://github.com/thesun4sky/jobstack';
const TECHEER_REPO = 'https://github.com/techeer-sv/Career-Skills';
const TECHEER_SKILL_BLOB = `${TECHEER_REPO}/blob/main/skills`;

export const CAREER_SEED_SKILLS: SeedSkillInput[] = [
  {
    slug: 'plugin-jobstack',
    title: 'jobstack (한국 취업·이직 통합 코칭 플러그인)',
    summary:
      '기업분석, 이력서·자기소개서 첨삭, 공기업 NCS 매핑, 연봉 실수령 계산, 모의면접, 지원 현황 추적까지 16개 취업 스킬을 하나로 묶은 MIT 오픈소스 플러그인입니다.',
    sourceUrl: JOBSTACK_REPO,
    sourceName: 'thesun4sky',
    isFeatured: true,
    domains: ['career', 'docs-reports', 'research'],
    aiUses: ['writing-summary', 'search-analysis', 'automation-workflow'],
    tags: ['에이전트-스킬-mcp', '취업·이직', 'claude-skills'],
    skillKind: SkillKind.PLUGIN,
    skillSlug: 'jobstack',
    authorName: 'thesun4sky',
    license: 'MIT',
    repositoryUrl: JOBSTACK_REPO,
    sourceFileUrl: `${JOBSTACK_REPO}/blob/main/.claude-plugin/plugin.json`,
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.PRACTICAL,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code', 'Claude.ai', 'Codex', 'Cursor'],
    overview:
      '취업·이직 준비 과정에서 기업 조사, 이력서, 자소서, 포트폴리오, 모의면접, 지원 일정 관리가 따로 놀지 않도록 7단계 워크플로우로 통합한 Claude Code 플러그인입니다. `/jobstack:auto` 한 번으로 현재 폴더의 이력서·자소서·공고 파일을 스캔해 다음 단계(`/strategy`, `/company-research`, `/resume`, `/cover-letter`, `/review`, `/mock-interview`, `/retro`)로 연결합니다.',
    useCases: [
      '지원 직무 전략 수립부터 기업 분석, 이력서·자소서 작성, 모의면접까지 한 흐름으로 준비할 때',
      '공기업 NCS 직업기초능력(7영역) 매핑이나 4대보험 기반 세전·소득세 전 실수령 연봉을 비교할 때',
      '여러 회사의 지원 현황(`/tracker`)과 면접 후 회고(`/retro`)를 로컬 파일로 누적 관리할 때',
    ],
    beforeAfter: {
      beforeItems: [
        '기업 조사, 이력서 수정, 자소서 작성, 면접 대비를 매번 새 대화에서 처음부터 설명해야 한다.',
        '서류마다 다른 경험과 수치가 적혀 있어 면접에서 일관성이 흔들리기 쉽다.',
      ],
      afterItems: [
        '경험 뱅크(`/experience-bank`)와 프로필을 중심으로 16개 스킬이 맥락을 공유하며 동작한다.',
        '인성·PT·토론·기술·AI 면접 모의 연습과 지원 추적(`/tracker`)까지 단일 플러그인으로 이어진다.',
      ],
    },
    workflowSteps: [
      {
        step: 1,
        title: '플러그인 설치 및 파일 자동 스캔',
        description:
          'Claude Code 마켓플레이스 또는 `./install.sh`로 설치한 뒤 `/jobstack:auto`를 실행해 현재 폴더의 이력서·자소서·공고·포트폴리오를 인식합니다.',
        badge: '/auto',
      },
      {
        step: 2,
        title: '전략 수립 및 기업·채용공고 분석',
        description:
          '`/strategy`, `/company-research`, `/job-search`, `/ncs`, `/salary`로 지원 포지션과 회사 요구 역량·보상 조건을 정리합니다.',
        badge: '리서치',
      },
      {
        step: 3,
        title: '이력서·자소서·포트폴리오 작성 및 통합 리뷰',
        description:
          '`/resume`, `/cover-letter`, `/career-history`, `/portfolio`, `/scout-profile` 작성 후 `/review`로 서류 일관성을 점검합니다.',
        badge: '서류',
      },
      {
        step: 4,
        title: '5종 모의면접, 지원 추적 및 회고',
        description:
          '`/mock-interview`(인성·PT·토론·기술·AI)로 실전 연습하고 `/tracker`와 `/retro`로 다음 지원에 피드백을 반영합니다.',
        badge: '면접·추적',
      },
    ],
    prerequisites: [
      {
        name: 'Claude Code 2.1+ 또는 스킬 지원 에이전트',
        required: true,
        description: '마켓플레이스 플러그인 설치는 Claude Code 2.1 이상에서 바로 지원됩니다.',
      },
      {
        name: 'Node.js / Python (선택)',
        required: false,
        description: '`/job-search` Node 의존성이나 차단 사이트 어댑터(`--with-insane-search`) 사용 시 필요합니다.',
      },
    ],
    installPrompt:
      'https://github.com/thesun4sky/jobstack 저장소를 클론하거나 Claude Code에서 `/plugin marketplace add thesun4sky/jobstack` 후 `/plugin install jobstack@jobstack`으로 설치하고 16개 스킬 목록을 확인해줘.',
    installGuides: [
      {
        environment: 'claude-code',
        label: 'Claude Code (플러그인 마켓플레이스)',
        steps: [
          'Claude Code에서 마켓플레이스 등록 후 `jobstack` 플러그인을 설치합니다.',
          '작업 디렉터리에서 `/jobstack:auto` 또는 개별 네임스페이스 명령(`/jobstack:cover-letter` 등)을 실행합니다.',
        ],
        command: '/plugin marketplace add thesun4sky/jobstack\n/plugin install jobstack@jobstack',
        invokeExample: '/jobstack:auto 현재 폴더의 이력서와 채용공고를 스캔해서 준비 순서를 잡아줘.',
      },
      {
        environment: 'claude-code-local',
        label: '로컬 클론 설치 (install.sh)',
        steps: [
          '저장소를 클론하고 `./install.sh`를 실행하면 `~/.claude/skills/`에 심링크가 연결됩니다.',
        ],
        command: 'git clone https://github.com/thesun4sky/jobstack.git && cd jobstack && ./install.sh',
        invokeExample: '/auto 내 이력서 기준으로 오늘 할 취업 준비 단계를 추천해줘.',
      },
    ],
    examplePrompts: [
      {
        label: '전체 자동 시작',
        prompt: '/jobstack:auto 이 폴더에 있는 이력서.pdf와 지원 공고를 읽고 부족한 부분부터 순서대로 진행해줘.',
      },
      {
        label: '기업분석 & 자소서',
        prompt: '/jobstack:company-research OO회사 최근 제품 업데이트와 사업 방향을 조사해 /jobstack:cover-letter 초안에 연결해줘.',
      },
      {
        label: '실수령 연봉 계산',
        prompt: '/jobstack:salary 제안 연봉 5,500만 원의 4대보험 공제 기준 월 예상액(소득세 전)과 최저임금 하한을 계산해줘.',
      },
    ],
    expectedOutputs: [
      {
        order: '01',
        title: '통합 프로필 및 경험 뱅크',
        description: '직무·경력·성과 에피소드를 재사용 가능한 구조로 정리한 마크다운 자산',
      },
      {
        order: '02',
        title: '기업분석·첨삭·리뷰 리포트',
        description: '핵심 결론·수치·예상 면접 포인트를 반영한 서류 개선안 및 통합 리뷰 결과',
      },
      {
        order: '03',
        title: '모의면접 피드백 및 지원 현황 트래커',
        description: '면접 유형별 평가와 회사별 지원 상태·회고 기록',
      },
    ],
    postRunChecklist: [
      '생성된 이력서·자소서에 실제 경험과 다른 과장 수치나 존재하지 않는 프로젝트가 포함되지 않았는지 확인합니다.',
      '`/salary` 결과는 소득세를 제외한 4대보험 기준 계산이므로 최종 실수령액은 국세청 간이세액표로 확인합니다.',
    ],
    tips: [
      '처음 시작할 때는 개별 명령을 외우기보다 `/jobstack:auto`를 실행해 현재 보유 파일에 맞는 다음 스킬을 추천받는 편이 빠릅니다.',
      '번들 스킬 16개: `auto`, `strategy`, `tracker`, `company-research`, `portfolio`, `job-search`, `ncs`, `salary`, `retro`, `experience-bank`, `resume`, `cover-letter`, `career-history`, `scout-profile`, `mock-interview`, `review`.',
    ],
    cautions:
      '개인 이력서·연봉·연락처 등 민감한 개인정보를 다루므로 공용 PC나 외부 학습 허용 설정이 켜진 계정에서는 민감 정보를 마스킹하고 사용하세요.',
    faq: [
      {
        question: '플러그인 설치와 install.sh 설치의 차이는 무엇인가요?',
        answer:
          '플러그인 설치(`/plugin install jobstack@jobstack`)는 `/jobstack:cover-letter`처럼 네임스페이스 하이픈 표기를 쓰고 `claude plugin update jobstack`으로 업데이트합니다. 로컬 `./install.sh`는 언더스코어 alias(`/cover_letter`)도 함께 생성합니다.',
      },
      {
        question: '상업적 프로젝트나 팀 스터디에서도 자유롭게 사용할 수 있나요?',
        answer: 'MIT 라이선스이므로 출처와 라이선스 고지를 유지하면 자유롭게 사용·수정·공유할 수 있습니다.',
      },
    ],
    fileStructure: [
      '.claude-plugin/plugin.json',
      '.claude-plugin/marketplace.json',
      'agents/researcher.md',
      'auto/',
      'strategy/',
      'company-research/',
      'job-search/',
      'ncs/',
      'salary/',
      'resume/',
      'cover-letter/',
      'career-history/',
      'portfolio/',
      'scout-profile/',
      'review/',
      'mock-interview/',
      'tracker/',
      'retro/',
      'experience-bank/',
      'bin/',
      'install.sh',
    ],
    skillMdPreview: `{
  "name": "jobstack",
  "displayName": "jobstack — 한국 취업 통합 엑셀러레이터",
  "version": "1.1.1",
  "license": "MIT",
  "skills": [
    "./auto", "./strategy", "./tracker",
    "./company-research", "./portfolio", "./job-search", "./ncs", "./salary", "./retro", "./experience-bank",
    "./resume", "./cover-letter", "./career-history", "./scout-profile",
    "./mock-interview", "./review"
  ]
}`,
    webAlternative: {
      title: '설치 없이 Claude Projects로 취업 코칭 워크스페이스 구성하기',
      description:
        '터미널 설치가 어렵다면 Claude Projects에 내 이력서·경험 정리 문서·지원 공고 PDF를 올려두고, 단계별로 기업분석 → 서류 첨삭 → 모의면접 순으로 대화를 이어가면 핵심 흐름을 재현할 수 있습니다.',
      recommendedTools: ['claude', 'chatgpt', 'notion-ai'],
      guideSlug: 'guide-claude-skills-vs-web-alternatives',
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['claude', 'chatgpt', 'notion-ai', 'cursor'],
  },
  {
    slug: 'skill-hiring-prep-doc-feedback',
    title: 'Hiring Prep Doc Feedback (이력서·자소서·포폴 구조화 피드백)',
    summary:
      '이력서, 자기소개서, 포트폴리오를 채용 공고와 연결해 리서치 기반 기준에 따라 강점·보완점·구체적 개선 제안을 제공합니다.',
    sourceUrl: TECHEER_REPO,
    sourceName: 'techeer-sv',
    isFeatured: true,
    domains: ['career', 'docs-reports'],
    aiUses: ['writing-summary', 'search-analysis'],
    tags: ['에이전트-스킬-mcp', '취업·이직', '이력서점검', 'claude-skills'],
    skillKind: SkillKind.SKILL,
    skillSlug: 'hiring-prep-doc-feedback',
    authorName: 'techeer-sv',
    license: 'MIT',
    repositoryUrl: TECHEER_REPO,
    sourceFileUrl: `${TECHEER_SKILL_BLOB}/hiring-prep-doc-feedback/SKILL.md`,
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.BEGINNER,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code', 'Codex', 'Cursor', 'Antigravity'],
    overview:
      '특정 인물의 말투를 흉내 내기보다 검증된 채용 실무 기준에 맞춰 이력서·자기소개서·포트폴리오를 항목별로 진단하는 피드백 스킬입니다. PDF·Markdown·TXT 문서 경로를 받아 직무 요구사항과 연결되지 않는 서술, 추상적인 성과 표현, 보완이 시급한 섹션을 순서대로 짚어줍니다.',
    useCases: [
      '초안 단계의 이력서·자소서·포트폴리오에서 어디부터 고쳐야 할지 막막할 때',
      '합격/불합격 판정보다 문단별 구체적인 수정 방향과 근거 질문이 필요할 때',
      '지원 공고의 핵심 역량이 서류 전반에 고르게 드러나는지 점검할 때',
    ],
    beforeAfter: {
      beforeItems: [
        'AI에게 서류를 보여주면 원론적인 칭찬과 모호한 수정 조언만 반복된다.',
        '이력서·자소서·포트폴리오 중 어떤 문서 기준의 피드백인지 섞여 나온다.',
      ],
      afterItems: [
        '문서 유형(이력서·자소서·포트폴리오)에 맞는 평가 축으로 구조화된 피드백을 받는다.',
        '공고 요구사항 대비 부족한 근거와 바로 고칠 문장 개선안을 구분해 확인할 수 있다.',
      ],
    },
    workflowSteps: [
      {
        step: 1,
        title: '문서 유형 및 파일 경로 수집',
        description: '피드백받을 PDF·Markdown·TXT 문서와 선택적으로 지원 공고를 입력받습니다.',
        badge: '입력',
      },
      {
        step: 2,
        title: '직무·문서 기준 구조 분석',
        description: '경력/성과, 지원 동기/스토리, 프로젝트 결과물 등 문서 성격에 맞게 항목을 분해합니다.',
      },
      {
        step: 3,
        title: '항목별 개선안 및 근거 보완 질문 제시',
        description: '설득력이 약한 구간의 원인을 짚고 실제 경험으로 채울 수 있는 수정 가이드를 출력합니다.',
      },
    ],
    prerequisites: [
      {
        name: '스킬 지원 에이전트',
        required: true,
        description: 'Claude Code, Codex, Cursor, Antigravity 중 하나가 필요합니다.',
      },
      {
        name: 'PDF / Markdown / TXT 형식의 취업 서류',
        required: true,
        description: 'DOCX 파일은 직접 읽을 수 없으므로 PDF 또는 TXT로 변환해 준비하세요.',
      },
    ],
    installPrompt:
      'https://github.com/techeer-sv/Career-Skills 저장소의 skills/hiring-prep-doc-feedback 스킬을 설치하고 SKILL.md를 확인해줘.',
    installGuides: [
      {
        environment: 'claude-code',
        label: 'Claude Code / Codex',
        steps: [
          'techeer-sv/Career-Skills 저장소의 `skills/hiring-prep-doc-feedback` 폴더를 `~/.claude/skills/` 또는 `~/.codex/skills/`에 복사합니다.',
          '문서 경로와 함께 피드백을 요청합니다.',
        ],
        invokeExample: '/hiring-prep-doc-feedback ./resume.pdf 백엔드 신입 공고 기준으로 피드백해줘.',
      },
    ],
    examplePrompts: [
      {
        label: '이력서 구조 피드백',
        prompt: './resume.md 파일을 읽고 프로젝트 성과 서술이 설득력 있는지 항목별로 피드백해줘.',
      },
      {
        label: '자소서 문항 점검',
        prompt: './cover-letter.txt를 아래 채용공고의 인재상·직무 역량과 연결해 개선점을 정리해줘.',
      },
    ],
    expectedOutputs: [
      { order: '01', title: '문서 유형별 진단 요약', description: '강점과 우선 보완이 필요한 핵심 영역 정리' },
      { order: '02', title: '항목별 구체적 개선 제안', description: '모호한 표현을 근거·성과 중심으로 바꾸는 방향 제시' },
    ],
    postRunChecklist: [
      'DOCX 대신 PDF/TXT/MD 파일로 입력했는지 확인합니다.',
      '제안된 수정 문장에 본인이 실제 수행하지 않은 수치나 기술이 섞이지 않았는지 검수합니다.',
    ],
    tips: [
      '지원 공고 본문이나 URL을 함께 주면 직무 적합성 관점의 피드백이 훨씬 구체적이 됩니다.',
    ],
    cautions: 'DOCX 파일은 직접 파싱하지 않으므로 PDF 또는 TXT로 변환 후 전달해야 합니다.',
    faq: [
      {
        question: 'hiring-sim-resume-review와 무엇이 다른가요?',
        answer:
          '`hiring-sim-resume-review`가 ATS/리크루터 합격 시뮬레이션 중심이라면, `hiring-prep-doc-feedback`은 이력서·자소서·포트폴리오 초안을 항목별로 다듬는 코칭에 초점을 둡니다.',
      },
    ],
    fileStructure: ['SKILL.md'],
    skillMdPreview: `---
name: hiring-prep-doc-feedback
description: 이력서, 자기소개서, 포트폴리오에 대해 리서치 기반의 구조화된 피드백을 제공합니다.
user-invocable: true
---
# 취업 서류 피드백 (Hiring Doc Feedback)
- 지원 문서: 이력서 / 자기소개서 / 포트폴리오 (PDF, Markdown, TXT)`,
    webAlternative: {
      title: '설치 없이 Claude / ChatGPT로 서류 구조 피드백 받기',
      description: '이력서·자소서 텍스트와 채용공고를 함께 붙여넣고 "지원 문서 항목별로 강점, 근거 부족 구간, 수정 질문을 나눠 정리해줘"라고 요청하면 유사한 결과를 얻을 수 있습니다.',
      recommendedTools: ['claude', 'chatgpt'],
      guideSlug: 'guide-claude-skills-vs-web-alternatives',
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['claude', 'chatgpt', 'cursor'],
  },
  {
    slug: 'skill-hiring-prep-interview',
    title: 'Hiring Prep Interview (공고·면접후기 기반 예상 질문 생성)',
    summary:
      '채용공고와 실제 면접 후기·회사 정보를 병렬 리서치로 수집해 직무별 기술·CS·시스템 설계·인성 면접 예상 질문과 답변 가이드를 생성합니다.',
    sourceUrl: TECHEER_REPO,
    sourceName: 'techeer-sv',
    domains: ['career', 'research', 'meetings-comms'],
    aiUses: ['search-analysis', 'writing-summary'],
    tags: ['에이전트-스킬-mcp', '취업·이직', 'claude-skills'],
    skillKind: SkillKind.SKILL,
    skillSlug: 'hiring-prep-interview',
    authorName: 'techeer-sv',
    license: 'MIT',
    repositoryUrl: TECHEER_REPO,
    sourceFileUrl: `${TECHEER_SKILL_BLOB}/hiring-prep-interview/SKILL.md`,
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.PRACTICAL,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code', 'Codex', 'Cursor', 'Antigravity'],
    overview:
      '지원 회사의 채용공고(URL 또는 본문)를 분석하고, 병렬 리서치 에이전트로 잡플래닛·잡코리아·캐치·블라인드 등의 면접 후기와 기업 정보를 수집해 직무 유형(백엔드·프론트엔드·DevOps·데이터·AI/ML·보안 등)에 맞춘 자기완결형 면접 대비 마크다운 문서를 만듭니다. 이력서나 자소서를 함께 제공하면 PARL 프레임워크 기반 프로젝트 딥다이브 질문과 `<details>` 펼침형 답변 가이드까지 포함합니다.',
    useCases: [
      '면접 직전 지원 회사의 실제 면접 후기와 직무 기술 질문을 한 문서로 모아 정리할 때',
      '내 이력서·포트폴리오 프로젝트에서 어떤 딥다이브 꼬리질문이 나올지 미리 뽑아볼 때',
      '시스템 설계·CS 기초·컬처핏 질문별 답변 뼈대를 한 번에 준비할 때',
    ],
    beforeAfter: {
      beforeItems: [
        '공고, 면접 후기, 회사 기술 블로그를 따로 검색하느라 시간이 오래 걸린다.',
        '질문만 뽑아주면 어떤 방향으로 답해야 할지 핵심 포인트가 비어 있다.',
      ],
      afterItems: [
        '4개 리서치 스테이지를 병렬 실행해 공고·후기·직무 질문을 빠르게 통합한다.',
        '펼침형(`<details>`) 답변 가이드가 포함된 자기완결형 마크다운 1문서로 완성된다.',
      ],
    },
    workflowSteps: [
      {
        step: 1,
        title: '채용공고 및 이력서(선택) 입력',
        description: '공고 URL 또는 본문을 받고, 이력서·자소서가 있으면 함께 읽어 직무와 경험을 매칭합니다.',
      },
      {
        step: 2,
        title: '병렬 면접 후기·회사 정보 리서치',
        description: '전형 특징, 회사 동향, 실제 면접 후기, 직무 핵심 기술을 동시에 수집합니다.',
        badge: '병렬 리서치',
      },
      {
        step: 3,
        title: '맞춤형 예상 질문·답변 가이드 문서 생성',
        description: '이력서 딥다이브(PARL), 직무 기술, CS, 시스템 설계, 인성·컬처핏 질문과 답변 가이드를 작성합니다.',
      },
    ],
    prerequisites: [
      {
        name: '웹 검색/병렬 서브에이전트 지원 환경',
        required: true,
        description: '웹 검색 도구와 서브에이전트를 지원하는 에이전트에서 가장 잘 동작합니다.',
      },
    ],
    installPrompt:
      'https://github.com/techeer-sv/Career-Skills 저장소의 skills/hiring-prep-interview 스킬을 설치하고 SKILL.md를 확인해줘.',
    installGuides: [
      {
        environment: 'claude-code',
        label: 'Claude Code / Codex',
        steps: [
          'techeer-sv/Career-Skills 저장소의 `skills/hiring-prep-interview`를 스킬 디렉터리에 설치합니다.',
          '채용공고 URL과 내 이력서 경로를 전달합니다.',
        ],
        invokeExample: '/hiring-prep-interview 공고 URL: https://... 내 이력서: ./resume.pdf',
      },
    ],
    examplePrompts: [
      {
        label: '공고 + 이력서 맞춤 질문집',
        prompt: '이 백엔드 채용공고와 ./resume.md를 바탕으로 기술·시스템 설계·컬처핏 예상 질문 문서를 만들어줘.',
      },
    ],
    expectedOutputs: [
      { order: '01', title: '직무·회사 맞춤형 예상 질문집(.md)', description: '카테고리별 질문과 `<details>` 답변 가이드가 담긴 완결형 문서' },
    ],
    postRunChecklist: [
      '리서치된 면접 후기 출처와 최신 연도를 확인해 오래된 전형 정보가 섞이지 않았는지 점검합니다.',
    ],
    tips: [
      '이력서를 같이 넘기면 일반론 질문 대신 내 프로젝트 수치·트레이드오프를 겨냥한 질문 비율이 높아집니다.',
    ],
    cautions: '외부 커뮤니티 면접 후기는 작성 시점에 따라 현재 전형과 다를 수 있으므로 최신 공고 안내를 우선 확인하세요.',
    faq: [
      {
        question: '모의면접 시뮬레이션(hiring-sim-interview)과는 어떻게 연계하나요?',
        answer: '이 스킬로 예상 질문 문서를 먼저 정리해 학습한 뒤, `hiring-sim-interview`로 실전 Q&A와 루브릭 채점을 진행하는 순서가 효과적입니다.',
      },
    ],
    fileStructure: ['SKILL.md'],
    skillMdPreview: `---
name: hiring-prep-interview
description: 채용공고를 분석하고 병렬 리서치 에이전트를 통해 면접 후기·기술 질문·회사 정보를 동시에 수집하여 직무별 맞춤형 면접 대비 예상 질문 문서를 생성합니다.
user-invocable: true
---`,
    webAlternative: {
      title: '설치 없이 Perplexity + Claude로 예상 질문집 만들기',
      description: 'Perplexity로 지원 회사의 최신 면접 후기와 기술 스택 이슈를 조사한 뒤, 결과를 Claude에 넣고 이력서와 함께 예상 질문 15개를 뽑아달라고 요청하세요.',
      recommendedTools: ['perplexity', 'claude'],
      guideSlug: 'guide-competitor-market-research',
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['claude', 'perplexity', 'chatgpt'],
  },
  {
    slug: 'skill-hiring-prep-coding-test',
    title: 'Hiring Prep Coding Test (회사 맞춤 코딩테스트 대비 가이드)',
    summary:
      '지원 회사의 코딩테스트 플랫폼, 라이브 코딩 여부, 난이도, 빈출 유형, 허용 언어를 조사해 프로그래머스·리트코드 실전 문제 링크와 학습 플랜을 생성합니다.',
    sourceUrl: TECHEER_REPO,
    sourceName: 'techeer-sv',
    domains: ['career', 'research'],
    aiUses: ['search-analysis', 'automation-workflow'],
    tags: ['에이전트-스킬-mcp', '취업·이직', 'claude-skills'],
    skillKind: SkillKind.SKILL,
    skillSlug: 'hiring-prep-coding-test',
    authorName: 'techeer-sv',
    license: 'MIT',
    repositoryUrl: TECHEER_REPO,
    sourceFileUrl: `${TECHEER_SKILL_BLOB}/hiring-prep-coding-test/SKILL.md`,
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.PRACTICAL,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code', 'Codex', 'Cursor', 'Antigravity'],
    overview:
      '회사마다 코딩테스트 플랫폼(프로그래머스·백준·해커랭크·자체 플랫폼), 라이브 코딩 여부, 허용 언어(Python 미제공 사례 등), 빈출 유형이 다릅니다. 이 스킬은 `hiring-common/interview-research.md` 방법론으로 회사의 최신 코테 출제 경향을 조사해, 불필요한 유형은 빼고 출제 확률이 높은 유형 위주로 문제 링크·학습 플랜·시험 당일 전략 문서를 만들어줍니다.',
    useCases: [
      '특정 기업 코딩테스트를 1~2주 앞두고 어떤 플랫폼·유형에 집중해야 할지 정리할 때',
      '공채형(프로그래머스 등)과 라이브 코딩 전형 여부를 구분해 대비 전략을 세울 때',
    ],
    beforeAfter: {
      beforeItems: [
        '지원 회사에 거의 나오지 않는 알고리즘 유형까지 무작정 풀다가 시간이 부족해진다.',
        '허용 언어나 SQL 포함 여부를 시험 직전에야 확인해 당황한다.',
      ],
      afterItems: [
        '플랫폼·문항 수·시간·허용 언어·빈출/비출제 유형이 한 표로 정리된다.',
        '프로그래머스 중심 + 리트코드 보강 문제 링크와 D-day 학습 계획까지 바로 얻는다.',
      ],
    },
    workflowSteps: [
      {
        step: 1,
        title: '회사·공고 URL·직무·경력 구분 입력',
        description: '공고에 명시된 전형 단계, 허용 언어, 코테 안내를 우선 확인합니다.',
      },
      {
        step: 2,
        title: '플랫폼·형식·난이도·빈출 유형 리서치',
        description: '라이브 여부, 문항 수, 시간, 알고리즘/SQL/구현 비중, 투자 금지 유형을 판별합니다.',
      },
      {
        step: 3,
        title: '문제 큐레이션 및 학습 플랜 문서화',
        description: '유형별 추천 문제 링크와 시험 당일 체크리스트가 담긴 마크다운을 생성합니다.',
      },
    ],
    prerequisites: [
      {
        name: '웹 검색 지원 에이전트 & hiring-common',
        required: false,
        description: '함께 제공되는 `hiring-common/interview-research.md`를 참조하면 리서치 정확도가 높아집니다.',
      },
    ],
    installPrompt:
      'https://github.com/techeer-sv/Career-Skills 저장소의 skills/hiring-prep-coding-test와 skills/hiring-common을 함께 설치해줘.',
    installGuides: [
      {
        environment: 'claude-code',
        label: 'Claude Code / Codex',
        steps: [
          'techeer-sv/Career-Skills의 `skills/hiring-prep-coding-test`와 `skills/hiring-common`을 스킬 폴더에 배치합니다.',
          '"OO회사 백엔드 신입 코테 준비해줘"처럼 회사명·직무를 전달합니다.',
        ],
        invokeExample: '/hiring-prep-coding-test OO회사 백엔드 신입 코딩테스트 준비 문서 만들어줘.',
      },
    ],
    examplePrompts: [
      {
        label: '회사 맞춤 코테 커리큘럼',
        prompt: 'OO테크 프론트엔드 경력 공고(URL) 기준으로 코딩테스트 유형과 2주 학습 플랜을 만들어줘.',
      },
    ],
    expectedOutputs: [
      { order: '01', title: '회사 코테 스펙 요약표', description: '플랫폼, 라이브 여부, 문항 수, 허용 언어, 난이도 좌표' },
      { order: '02', title: '유형별 추천 문제 & 학습 계획', description: '프로그래머스·리트코드 실전 링크 및 당일 전략' },
    ],
    postRunChecklist: [
      '실제 시험 안내 메일에 적힌 플랫폼·허용 언어·외부 검색 허용 규정을 최종 대조합니다.',
    ],
    tips: [
      '회사 정보가 공개되지 않은 곳이라면 직무·기술스택을 함께 적어 일반 커리큘럼으로 전환하세요.',
    ],
    cautions: '기업별 코테 방식은 기수·채용 시즌마다 바뀔 수 있으므로 최신 채용 안내 메일이 최우선입니다.',
    faq: [
      {
        question: '문제 풀이 연습까지 바로 하려면 어떤 스킬을 쓰나요?',
        answer: '`hiring-sim-coding-test`를 호출하면 해당 회사 스타일의 모의 문제를 출제받고 제출 코드를 채점받을 수 있습니다.',
      },
    ],
    fileStructure: ['SKILL.md'],
    skillMdPreview: `---
name: hiring-prep-coding-test
description: 특정 회사의 코딩테스트를 리서치해 플랫폼·형식·난이도·빈출 유형·허용 언어를 파악하고 회사 맞춤 코테 준비 문서를 생성합니다.
user-invocable: true
triggers: ["코딩테스트 준비", "코테 준비", "코테 대비"]
---`,
    webAlternative: {
      title: '설치 없이 Perplexity로 회사 코테 경향 조사하기',
      description: 'Perplexity에 "OO회사 2026 백엔드 코딩테스트 플랫폼 허용언어 후기"를 검색하고, 나온 빈출 유형으로 프로그래머스 문제를 추려달라고 요청하세요.',
      recommendedTools: ['perplexity', 'claude', 'chatgpt'],
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['claude', 'perplexity', 'chatgpt'],
  },
  {
    slug: 'skill-hiring-sim-interview',
    title: 'Hiring Sim Interview (면접 시뮬레이션 & 루브릭 평가)',
    summary:
      '지원 회사의 면접 후기와 내 이력서·포트폴리오를 바탕으로 기술·인성·회사 가치 면접을 1:1로 시뮬레이션하고 6단계 루브릭으로 판정합니다.',
    sourceUrl: TECHEER_REPO,
    sourceName: 'techeer-sv',
    isFeatured: true,
    domains: ['career', 'meetings-comms'],
    aiUses: ['writing-summary', 'search-analysis'],
    tags: ['에이전트-스킬-mcp', '취업·이직', 'claude-skills'],
    skillKind: SkillKind.SKILL,
    skillSlug: 'hiring-sim-interview',
    authorName: 'techeer-sv',
    license: 'MIT',
    repositoryUrl: TECHEER_REPO,
    sourceFileUrl: `${TECHEER_SKILL_BLOB}/hiring-sim-interview/SKILL.md`,
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.PRACTICAL,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code', 'Codex', 'Cursor', 'Antigravity'],
    overview:
      '단순히 예상 질문을 나열하는 데 그치지 않고 실제 면접관처럼 꼬리질문을 던지며 답변을 검증하는 모의면접 스킬입니다. 회사 면접 후기를 리서치해 전형 라운드를 재현하거나 이력서·공고 기반으로 폴백하며, 기술 면접(Strong Hire ~ Strong Reject 6단계), 인성 면접(5개 역량 1~5점), 회사 가치 면접 기준으로 `[PASS]`/`[REJECT]`와 보완 포인트를 제공합니다.',
    useCases: [
      '실제 면접 전 내 프로젝트 설명이 꼬리질문 3단계까지 버틸 수 있는지 실전 테스트할 때',
      '인성·컬처핏 답변이 두루뭉술하지 않고 구체적 행동·결과 근거를 담았는지 점검할 때',
    ],
    beforeAfter: {
      beforeItems: [
        '머릿속으로만 답변을 정리하다가 예상치 못한 압박 꼬리질문에 막힌다.',
        '내 답변이 합격 수준인지 감으로만 판단하게 된다.',
      ],
      afterItems: [
        '이력서 수치와 의사결정을 파고드는 실시간 꼬리질문 세션을 경험한다.',
        '6단계 기술 루브릭과 5영역 인성 점수로 약한 답변을 즉시 교정할 수 있다.',
      ],
    },
    workflowSteps: [
      { step: 1, title: '회사·공고·이력서 및 면접 유형 선택', description: '기술·인성·임원(회사 가치) 중 진행할 라운드와 회사 정보를 입력합니다.' },
      { step: 2, title: '면접 후기 기반 질문 및 꼬리질문 진행', description: '지원자 답변의 근거·트레이드오프를 확인하는 후속 질문을 이어갑니다.' },
      { step: 3, title: '루브릭 채점 및 개선 답변 가이드 출력', description: 'PASS/REJECT 판정과 약했던 답변의 모범 구조화 예시를 제공합니다.' },
    ],
    prerequisites: [
      { name: '스킬 지원 에이전트 & 이력서/공고', required: true, description: '이력서 또는 포트폴리오가 있어야 프로젝트 기반 딥다이브 질문이 정확해집니다.' },
    ],
    installPrompt:
      'https://github.com/techeer-sv/Career-Skills 저장소의 skills/hiring-sim-interview 스킬을 설치해줘.',
    installGuides: [
      {
        environment: 'claude-code',
        label: 'Claude Code / Codex',
        steps: [
          'techeer-sv/Career-Skills의 `skills/hiring-sim-interview`를 스킬 폴더에 설치합니다.',
          '지원 회사와 이력서 경로를 주고 모의면접을 시작합니다.',
        ],
        invokeExample: '/hiring-sim-interview ./resume.pdf 기반으로 백엔드 기술 면접 5문항 시뮬레이션해줘.',
      },
    ],
    examplePrompts: [
      { label: '기술 면접 시뮬레이션', prompt: '내 이력서의 트래픽 최적화 프로젝트를 중심으로 기술 면접 1라운드를 진행하고 루브릭으로 평가해줘.' },
      { label: '인성·컬처핏 연습', prompt: 'OO회사 핵심 가치 기준으로 인성 면접 시뮬레이션을 해주고 5개 영역 점수를 매겨줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '문답 세션 및 꼬리질문 로그', description: '실제 면접 흐름과 유사한 1:1 질의응답' },
      { order: '02', title: '루브릭 기반 PASS/REJECT 리포트', description: '역량별 점수, 감점 사유, 답변 개선 예시' },
    ],
    postRunChecklist: [
      '감점된 답변은 실제 내 경험에서 누락된 수치를 보충해 다시 1회 재시도해 보세요.',
    ],
    tips: [
      '한 번에 모든 질문을 달라고 하지 말고 "한 질문씩 던지고 내 답변을 들은 뒤 꼬리질문해줘"라고 진행하면 실전감이 높아집니다.',
    ],
    cautions: '모의 평가 점수는 연습용 루브릭 기준이며 실제 기업의 최종 합격을 보장하지 않습니다.',
    faq: [
      {
        question: '음성이 아니라 텍스트로만 연습해도 효과가 있나요?',
        answer: '결론-근거-트레이드오프 구조를 텍스트로 먼저 압축해 두면 실제 구두 면접에서 횡설수설하는 빈도가 크게 줄어듭니다.',
      },
    ],
    fileStructure: ['SKILL.md'],
    skillMdPreview: `---
name: hiring-sim-interview
description: 실제 면접 후기와 이력서를 기반으로 기술/인성/임원 면접을 FAANG 스타일 루브릭으로 시뮬레이션합니다.
user-invocable: true
---`,
    webAlternative: {
      title: '설치 없이 Claude / ChatGPT로 1:1 모의면접하기',
      description: '이력서를 붙여넣고 "시니어 면접관 역할로 한 번에 한 질문씩 내고, 내 답변마다 꼬리질문 2개 후 6단계 점수를 매겨줘"라고 프롬프트를 지정하세요.',
      recommendedTools: ['claude', 'chatgpt'],
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['claude', 'chatgpt'],
  },
  {
    slug: 'skill-hiring-sim-portfolio-review',
    title: 'Hiring Sim Portfolio Review (포트폴리오 품질·정합성 평가)',
    summary:
      '채용 담당자와 기술 리드 관점에서 포트폴리오의 프로젝트 품질·기술 의사결정·직무 정렬도를 채점하고, 표·대시보드·캡션의 수치 정합성까지 대조합니다.',
    sourceUrl: TECHEER_REPO,
    sourceName: 'techeer-sv',
    domains: ['career', 'planning-slides', 'docs-reports'],
    aiUses: ['search-analysis', 'writing-summary'],
    tags: ['에이전트-스킬-mcp', '취업·이직', 'claude-skills'],
    skillKind: SkillKind.SKILL,
    skillSlug: 'hiring-sim-portfolio-review',
    authorName: 'techeer-sv',
    license: 'MIT',
    repositoryUrl: TECHEER_REPO,
    sourceFileUrl: `${TECHEER_SKILL_BLOB}/hiring-sim-portfolio-review/SKILL.md`,
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.PRACTICAL,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code', 'Codex', 'Cursor', 'Antigravity'],
    overview:
      '포트폴리오를 기술 리드 시선으로 리뷰해 프로젝트 품질 3개 영역과 포지션 정렬도를 `[PASS]`/`[REJECT]`로 판정하는 스킬입니다. 특히 본문에 적은 성과 수치가 첨부된 표, 모니터링 대시보드, 캡션과 실제로 일치하는지 대조하는 정합성 감사(Consistency & Evidence Audit)를 포함합니다.',
    useCases: [
      '포트폴리오 제출 전 기술적 의사결정의 설득력과 직무 적합도를 객관적으로 채점받고 싶을 때',
      '장표의 성과 수치와 첨부 스크린샷·그래프 간 불일치(🔴 결함)를 미리 걸러내고 싶을 때',
    ],
    beforeAfter: {
      beforeItems: [
        '디자인만 깔끔하고 "왜 이 기술을 선택했는지"와 "수치 근거"가 비어 있는지 모르고 제출한다.',
      ],
      afterItems: [
        '프로젝트별 품질 평가, 포지션 정렬도, 수치 정합성 감사 결과와 개선안을 함께 얻는다.',
      ],
    },
    workflowSteps: [
      { step: 1, title: '평가 프레임워크 및 포트폴리오 입력', description: 'PDF/HTML/Markdown 포트폴리오와 지원 직무 공고를 입력받습니다.' },
      { step: 2, title: '프로젝트 품질·의사결정·수치 정합성 감사', description: '주장한 수치와 표·대시보드·캡션 근거를 대조하고 `[검증됨/가정/불명]`으로 점검합니다.' },
      { step: 3, title: 'PASS/REJECT 판정 및 수정 우선순위 제시', description: '프로젝트별 합격/보류 판정과 보완 가이드를 출력합니다.' },
    ],
    prerequisites: [
      { name: '스킬 지원 에이전트 & 포트폴리오 파일', required: true, description: 'PDF·HTML·Markdown 형식의 포트폴리오가 필요합니다.' },
    ],
    installPrompt:
      'https://github.com/techeer-sv/Career-Skills 저장소의 skills/hiring-sim-portfolio-review 스킬을 설치해줘.',
    installGuides: [
      {
        environment: 'claude-code',
        label: 'Claude Code / Codex',
        steps: [
          'techeer-sv/Career-Skills의 `skills/hiring-sim-portfolio-review`를 스킬 디렉터리에 설치합니다.',
          '포트폴리오 파일과 지원 직무를 전달합니다.',
        ],
        invokeExample: '/hiring-sim-portfolio-review ./portfolio.pdf 백엔드 엔지니어 포지션 기준으로 평가해줘.',
      },
    ],
    examplePrompts: [
      { label: '포트폴리오 정합성·품질 리뷰', prompt: './portfolio.pdf의 프로젝트 3개를 기술 리드 관점에서 채점하고 수치 정합성 오류가 있는지 감사해줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: 'PASS/REJECT 판정표', description: '프로젝트 품질 3영역, 포지션 정렬도, 정합성 감사 결과' },
      { order: '02', title: '근거 불일치 및 개선안 목록', description: '수정해야 할 장표·캡션·의사결정 설명 포인트' },
    ],
    postRunChecklist: [
      '정합성 감사에서 🔴로 지적된 수치나 캡션 불일치는 원본 로그·측정 자료를 다시 확인해 수정합니다.',
    ],
    tips: [
      '합격 판정보다 훨씬 날카로운 면접관 감점 포인트를 찾고 싶다면 `hiring-sim-portfolio-redteam`을 연달아 실행하세요.',
    ],
    cautions: '이미지 안에만 있는 작은 그래프 숫자는 PDF 해상도에 따라 인식이 부정확할 수 있으므로 고해상도 파일 사용을 권장합니다.',
    faq: [
      {
        question: 'hiring-sim-portfolio-redteam과 차이가 뭔가요?',
        answer: '이 스킬은 PASS/REJECT 종합 채점과 개선안 제공이 목적이고, `redteam`은 합격 여부 대신 면접관이 파고들 감점 포인트 적발에 특화돼 있습니다.',
      },
    ],
    fileStructure: ['SKILL.md'],
    skillMdPreview: `---
name: hiring-sim-portfolio-review
description: 포트폴리오의 프로젝트 품질, 기술적 의사결정, 실무 역량과 표·대시보드·캡션의 수치 정합성을 평가합니다.
user-invocable: true
---`,
    webAlternative: {
      title: '설치 없이 Claude에 포트폴리오 PDF 올려 검수하기',
      description: '포트폴리오 PDF를 Claude에 첨부하고 "각 프로젝트의 기술 선택 근거와 장표 내 수치·그래프 간 모순이 있는지 표로 짚어줘"라고 요청하세요.',
      recommendedTools: ['claude', 'gemini'],
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['claude', 'gemini', 'chatgpt'],
  },
  {
    slug: 'skill-hiring-sim-coding-test',
    title: 'Hiring Sim Coding Test (모의 코딩테스트 출제 & 코드 채점)',
    summary:
      '지원 회사·포지션 스타일에 맞춘 코딩테스트 문제(알고리즘·SQL·실무 코딩·사전과제)를 출제하고 제출한 코드를 4개 차원 루브릭으로 채점합니다.',
    sourceUrl: TECHEER_REPO,
    sourceName: 'techeer-sv',
    domains: ['career', 'data-sheets'],
    aiUses: ['search-analysis', 'automation-workflow'],
    tags: ['에이전트-스킬-mcp', '취업·이직', 'claude-skills'],
    skillKind: SkillKind.SKILL,
    skillSlug: 'hiring-sim-coding-test',
    authorName: 'techeer-sv',
    license: 'MIT',
    repositoryUrl: TECHEER_REPO,
    sourceFileUrl: `${TECHEER_SKILL_BLOB}/hiring-sim-coding-test/SKILL.md`,
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.PRACTICAL,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code', 'Codex', 'Cursor', 'Antigravity'],
    overview:
      '특정 회사의 코테 유형(알고리즘·SQL·실무 코딩·사전 과제)을 재현해 오프라인 문제를 출제하고, 지원자가 제출한 코드를 **정확성 · 시간/공간 복잡도 · 코드 품질 · 견고성**(각 1~4점, 평균 2.5점 이상 PASS)으로 채점하는 스킬입니다. 구두 라이브 코딩 대신 코드 제출 기반 모의 평가에 최적화되어 있습니다.',
    useCases: [
      '회사별 예상 난이도에 맞춰 시간 안에 코드를 작성하고 즉각적인 복잡도·엣지케이스 리뷰를 받고 싶을 때',
      '사전 과제(take-home) 스타일 요구사항 구현 후 설계·테스트·문서화 수준을 점검받고 싶을 때',
    ],
    beforeAfter: {
      beforeItems: [
        '문제를 풀고 통과만 하면 코드 가독성, 엣지 케이스 방어, 복잡도 개선 여지를 놓친다.',
      ],
      afterItems: [
        '4차원 루브릭(정확성·효율성·품질·견고성)으로 실전 서류·과제 평가처럼 채점받는다.',
      ],
    },
    workflowSteps: [
      { step: 1, title: '회사/포지션/스택 및 유형 지정', description: '알고리즘·SQL·실무 코딩·사전 과제 중 원하는 모드를 정합니다.' },
      { step: 2, title: '맞춤형 문제 출제', description: '회사 리서치 또는 포지션 난이도에 맞는 제약 조건과 테스트 케이스를 제시합니다.' },
      { step: 3, title: '제출 코드 4차원 채점 및 피드백', description: '반례·복잡도 병목·리팩터링 포인트를 짚고 PASS/REJECT를 판정합니다.' },
    ],
    prerequisites: [
      { name: '스킬 지원 에이전트', required: true, description: 'Claude Code, Codex, Cursor, Antigravity에서 코드 파일이나 스니펫을 주고받습니다.' },
    ],
    installPrompt:
      'https://github.com/techeer-sv/Career-Skills 저장소의 skills/hiring-sim-coding-test 스킬을 설치해줘.',
    installGuides: [
      {
        environment: 'claude-code',
        label: 'Claude Code / Cursor',
        steps: [
          'techeer-sv/Career-Skills의 `skills/hiring-sim-coding-test`를 스킬 폴더에 설치합니다.',
          '포지션·언어·유형을 알려주고 문제를 출제받은 뒤 답안 코드를 제출합니다.',
        ],
        invokeExample: '/hiring-sim-coding-test 백엔드 Python 실무 코딩 모의 문제 1개 출제해줘.',
      },
    ],
    examplePrompts: [
      { label: '실무 코딩 모의', prompt: '백엔드 주니어 포지션 기준으로 동시성/재고 차감 관련 실무 코딩 문제 하나 내주고 내가 푼 코드를 채점해줘.' },
      { label: 'SQL 모의 테스트', prompt: '데이터 분석가 포지션 스타일 SQL 문제 2개를 내주고 내 쿼리의 성능과 엣지 케이스를 평가해줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '회사 스타일 모의 문제 & 제약 조건', description: '입출력 명세와 평가 기준' },
      { order: '02', title: '4차원 루브릭 채점표', description: '정확성·효율성·품질·견고성 점수 및 반례 피드백' },
    ],
    postRunChecklist: [
      '지적된 반례와 엣지 케이스를 로컬 테스트로 직접 실행해 통과 여부를 확인합니다.',
    ],
    tips: [
      '구두 설명이 필요한 라이브 코딩 대비라면 답안을 낼 때 "접근법과 시간복잡도 설명"도 3줄 함께 적어 피드백을 받으세요.',
    ],
    cautions: '음성(STT) 기반 실시간 구두 라이브 코딩은 지원하지 않는 오프라인 코드 제출 시뮬레이션입니다.',
    faq: [
      {
        question: '실제 코드 실행 테스트도 해주나요?',
        answer: '로컬 에이전트(Claude Code·Cursor 등) 환경에서는 작성한 코드와 테스트 케이스를 직접 실행해 검증까지 요청할 수 있습니다.',
      },
    ],
    fileStructure: ['SKILL.md'],
    skillMdPreview: `---
name: hiring-sim-coding-test
description: 특정 회사의 코딩테스트를 리서치해 문제를 출제하고 제출한 코드를 정확성·시간복잡도·코드 품질·견고성으로 채점합니다.
user-invocable: true
---`,
    webAlternative: {
      title: '설치 없이 Cursor / Claude로 코드 리뷰형 코테 연습하기',
      description: '풀이한 알고리즘·SQL 코드를 붙여넣고 "정확성, 시간복잡도, 엣지 케이스, 가독성 각 4점 만점으로 채점하고 반례를 찾아줘"라고 요청하세요.',
      recommendedTools: ['cursor', 'claude', 'chatgpt'],
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['cursor', 'claude', 'chatgpt'],
  },
  {
    slug: 'skill-hiring-sim-pipeline',
    title: 'Hiring Sim Pipeline (서류→코테→면접 통합 채용 시뮬레이션)',
    summary:
      '채용공고를 분석해 회사별 맞춤 전형(서류→코딩테스트→면접)을 순서대로 시뮬레이션하며, 어느 단계에서든 REJECT 시 즉시 멈추고 개선 피드백을 제공합니다.',
    sourceUrl: TECHEER_REPO,
    sourceName: 'techeer-sv',
    domains: ['career', 'meetings-comms', 'docs-reports'],
    aiUses: ['automation-workflow', 'search-analysis'],
    tags: ['에이전트-스킬-mcp', '취업·이직', 'claude-skills'],
    skillKind: SkillKind.SKILL,
    skillSlug: 'hiring-sim-pipeline',
    authorName: 'techeer-sv',
    license: 'MIT',
    repositoryUrl: TECHEER_REPO,
    sourceFileUrl: `${TECHEER_SKILL_BLOB}/hiring-sim-pipeline/SKILL.md`,
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.ADVANCED,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code', 'Codex', 'Cursor', 'Antigravity'],
    overview:
      '실제 채용 전형처럼 서류, 코딩테스트, 기술/인성 면접을 하나의 연속 파이프라인으로 묶어 시뮬레이션하는 오케스트레이션 스킬입니다. 각 단계 결과를 파일로 저장해 세션이 끊겨도 이어서 진행할 수 있으며, 중간 단계에서 `REJECT` 판정이 나오면 즉시 중단하고 원인을 보완한 뒤 재도전하도록 설계되었습니다.',
    useCases: [
      '가고 싶은 회사의 공고 하나로 서류부터 최종 면접까지 전체 통과 가능성을 점검하고 싶을 때',
      '여러 날에 걸쳐 단계별 결과를 파일에 저장하며 채용 리허설을 진행할 때',
    ],
    beforeAfter: {
      beforeItems: [
        '서류·코테·면접을 따로 연습해 이전 단계에서 지적된 약점이 다음 단계로 이어지지 않는다.',
      ],
      afterItems: [
        '공고에 맞춘 전체 전형 파이프라인이 자동 구성되고 단계별 PASS/REJECT 게이트로 약점을 즉시 보완한다.',
      ],
    },
    workflowSteps: [
      { step: 1, title: '채용공고 분석 및 전형 파이프라인 확정', description: '공고 기반 회사 맞춤 전형 또는 일반 전형(서류→코테→면접)을 사용자 확인 후 확정합니다.' },
      { step: 2, title: '단계별 PASS/REJECT 시뮬레이션 실행', description: '서류·코테·면접을 순차 실행하며 REJECT 시 즉시 중단하고 피드백을 제공합니다.' },
      { step: 3, title: '단계 결과 파일 저장 및 재도전 연계', description: '각 라운드 기록을 로컬 파일로 남겨 다음 세션에서 이어서 완주합니다.' },
    ],
    prerequisites: [
      { name: 'Career-Skills 하위 sim 스킬 함께 설치 권장', required: true, description: '이력서·코테·면접 시뮬레이션 스킬들과 함께 설치하면 가장 매끄럽게 동작합니다.' },
    ],
    installPrompt:
      'https://github.com/techeer-sv/Career-Skills 저장소의 skills/hiring-sim-pipeline 및 관련 sim 스킬들을 설치해줘.',
    installGuides: [
      {
        environment: 'claude-code',
        label: 'Claude Code / Codex',
        steps: [
          'techeer-sv/Career-Skills 저장소를 클론하거나 `skills/hiring-sim-*` 스킬들을 `~/.claude/skills/`에 설치합니다.',
          '채용공고와 이력서를 입력해 파이프라인을 시작합니다.',
        ],
        invokeExample: '/hiring-sim-pipeline 이 공고와 ./resume.pdf로 전체 채용 전형 시뮬레이션 시작해줘.',
      },
    ],
    examplePrompts: [
      { label: '전체 전형 리허설', prompt: '아래 채용공고에 맞춰 서류→코테→면접 프로세스를 확정하고 1단계 서류부터 시뮬레이션해줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '회사 맞춤 전형 로드맵', description: '확정된 단계별 통과 기준과 순서' },
      { order: '02', title: '단계별 PASS/REJECT 결과 파일', description: '이어하기 가능한 로컬 리포트 및 최종 합격/보완 피드백' },
    ],
    postRunChecklist: [
      '중간 단계에서 REJECT를 받으면 해당 피드백을 반영해 서류나 풀이를 수정한 뒤 재도전하세요.',
    ],
    tips: [
      '한 번에 끝내려 하기보다 하루에 한 단계씩 파일 저장 기능을 활용해 집중 연습하는 것을 권장합니다.',
    ],
    cautions: '단계 수가 많은 만큼 전체 완주까지 대화 길이와 토큰 사용량이 큽니다.',
    faq: [
      {
        question: '코딩테스트가 없는 직무(기획·디자인 등)도 쓸 수 있나요?',
        answer: 'Step 1에서 공고에 맞는 전형(예: 서류 → 과제/포트폴리오 리뷰 → 직무 면접)으로 사용자 확인 후 조정할 수 있습니다.',
      },
    ],
    fileStructure: ['SKILL.md'],
    skillMdPreview: `---
name: hiring-sim-pipeline
description: 채용 공고를 분석하여 해당 회사에 맞는 채용 프로세스를 시뮬레이션합니다. 어느 한 단계에서 REJECT되면 중단하고 개선 피드백을 제공합니다.
user-invocable: true
---`,
    webAlternative: {
      title: '설치 없이 단계별 프롬프트로 전형 리허설하기',
      description: 'Claude Projects에 공고와 이력서를 고정해두고 1일차 서류, 2일차 과제/코테, 3일차 면접 순으로 세션을 나눠 진행하세요.',
      recommendedTools: ['claude', 'chatgpt'],
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['claude', 'chatgpt'],
  },
  {
    slug: 'skill-hiring-sim-portfolio-redteam',
    title: 'Hiring Sim Portfolio Redteam (포트폴리오 감점 포인트 적발)',
    summary:
      '가장 비판적인 면접관 시선으로 포트폴리오의 수치 정합성(표·대시보드·캡션), 서사-근거 불일치, 용어 인플레·인과 과장을 포렌식 수준으로 적발합니다.',
    sourceUrl: TECHEER_REPO,
    sourceName: 'techeer-sv',
    domains: ['career', 'planning-slides'],
    aiUses: ['search-analysis'],
    tags: ['에이전트-스킬-mcp', '취업·이직', 'claude-skills'],
    skillKind: SkillKind.SKILL,
    skillSlug: 'hiring-sim-portfolio-redteam',
    authorName: 'techeer-sv',
    license: 'MIT',
    repositoryUrl: TECHEER_REPO,
    sourceFileUrl: `${TECHEER_SKILL_BLOB}/hiring-sim-portfolio-redteam/SKILL.md`,
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.ADVANCED,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code', 'Codex', 'Cursor', 'Antigravity'],
    overview:
      '합격/탈락 점수 대신 "라이브 면접에서 어디를 파고들려 감점될지"만 골라내는 레드팀 리뷰 스킬입니다. 데카르트적 방법적 회의(Cartesian doubt)를 적용해 표와 대시보드 숫자가 어긋나는지, 캡션이 그래프를 부풀렸는지, 측정 대상을 바꿔치기한 성능 개선 주장이 있는지 직접 대조합니다.',
    useCases: [
      '성능 개선 수치와 모니터링 대시보드 캡처가 많은 개발자 포트폴리오의 최종 허점을 찾을 때',
      '면접관이 가장 날카롭게 공격할 만한 과장·비약 표현을 제출 전에 미리 제거하고 싶을 때',
    ],
    beforeAfter: {
      beforeItems: [
        '"응답속도 80% 개선" 같은 문구가 첨부 그래프나 테스트 조건과 안 맞는 줄 모르고 발표한다.',
      ],
      afterItems: [
        '모순·과장·측정 조건 누락 지점을 심각도별 감점 리스트와 면접 압박 질문으로 미리 확인한다.',
      ],
    },
    workflowSteps: [
      { step: 1, title: '포트폴리오 및 프로젝트 디렉터리 스캔', description: 'HTML/PDF 포트폴리오와 첨부 이미지·자료를 입력받습니다.' },
      { step: 2, title: '표·대시보드·캡션·서사 교차 포렌식 대조', description: '수치 불일치, 인과 과장, 용어 인플레를 방법적 회의로 검증합니다.' },
      { step: 3, title: '면접관 감점 포인트 및 검증 질문 산출', description: '어디서 감점되고 면접에서 어떤 반증 질문이 들어올지 정리합니다.' },
    ],
    prerequisites: [
      { name: '검증할 수치·근거가 포함된 포트폴리오', required: true, description: '초안 뼈대만 있는 단계라면 `hiring-prep-doc-feedback`을 먼저 사용하세요.' },
    ],
    installPrompt:
      'https://github.com/techeer-sv/Career-Skills 저장소의 skills/hiring-sim-portfolio-redteam 스킬을 설치해줘.',
    installGuides: [
      {
        environment: 'claude-code',
        label: 'Claude Code / Codex',
        steps: [
          'techeer-sv/Career-Skills의 `skills/hiring-sim-portfolio-redteam`을 스킬 폴더에 설치합니다.',
          '"포트폴리오 레드팀 리뷰해줘"와 함께 파일 경로를 전달합니다.',
        ],
        invokeExample: '/hiring-sim-portfolio-redteam ./portfolio.pdf 수치 정합성과 과장된 표현만 적발해줘.',
      },
    ],
    examplePrompts: [
      { label: '제출 전 포폴 레드팀', prompt: './portfolio.html을 비판적인 기술 면접관 관점에서 레드팀 리뷰해 감점 포인트만 뽑아줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '감점 포인트 & 모순 적발 리스트', description: '수치·캡션·서사 불일치 항목과 예상 압박 질문' },
    ],
    postRunChecklist: [
      '지적된 수치 비약은 측정 조건(동시접속자, 데이터 건수, 비교 기준)을 장표 캡션에 명시해 보완합니다.',
    ],
    tips: [
      '멘탈이 흔들릴 수 있을 만큼 비판적인 톤이므로 서류 마감 전날보다 3~4일 전에 돌려 수정 시간을 확보하세요.',
    ],
    cautions: 'PASS/REJECT 합격 판정을 내리지 않으며, 초안 단계 문서에는 적합하지 않습니다.',
    faq: [
      {
        question: '내 포트폴리오가 아닌 타인의 공개 포폴도 검증할 수 있나요?',
        answer: '네, 면접관/평가자 시점으로 설계되어 있어 지원자 자료 검증이나 스터디 상호 리뷰에도 활용할 수 있습니다.',
      },
    ],
    fileStructure: ['SKILL.md'],
    skillMdPreview: `---
name: hiring-sim-portfolio-redteam
description: 면접관 관점에서 포트폴리오의 수치 정합성 대조, 서사-근거 불일치, 과장·용어 인플레를 찾아내는 비판적 레드팀 리뷰입니다.
user-invocable: true
triggers: ["포트폴리오 감점", "포트폴리오 레드팀", "포폴 모순"]
---`,
    webAlternative: {
      title: '설치 없이 Claude로 레드팀 셀프 검수하기',
      description: '포트폴리오 PDF를 올리고 "칭찬은 빼고, 면접관이 수치·대시보드·기술 주장에서 꼬투리 잡을 모순과 과장만 심각도 순으로 뽑아줘"라고 지시하세요.',
      recommendedTools: ['claude', 'chatgpt'],
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['claude', 'chatgpt'],
  },
  {
    slug: 'skill-hiring-sim-resume-redteam',
    title: 'Hiring Sim Resume Redteam (이력서 수치·GitHub·블로그 교차 검증)',
    summary:
      '이력서에 적힌 수치, 첨부된 GitHub 레포지토리 코드, 기술 블로그 글과 지원 직군 기대 역량을 외부 근거로 직접 대조해 면접관 감점 포인트를 적발합니다.',
    sourceUrl: TECHEER_REPO,
    sourceName: 'techeer-sv',
    domains: ['career', 'docs-reports'],
    aiUses: ['search-analysis'],
    tags: ['에이전트-스킬-mcp', '취업·이직', '이력서점검', 'claude-skills'],
    skillKind: SkillKind.SKILL,
    skillSlug: 'hiring-sim-resume-redteam',
    authorName: 'techeer-sv',
    license: 'MIT',
    repositoryUrl: TECHEER_REPO,
    sourceFileUrl: `${TECHEER_SKILL_BLOB}/hiring-sim-resume-redteam/SKILL.md`,
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.ADVANCED,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code', 'Codex', 'Cursor', 'Antigravity'],
    overview:
      '글 기반 이력서는 문서 내부만 봐서는 과장 여부를 알기 어렵기 때문에, 첨부된 GitHub 저장소의 실제 코드 품질·보안·구현 여부와 기술 블로그 글, 규모 추정 리서치까지 외부에서 끌어와 이력서 주장과 대조합니다. 백엔드·프론트엔드·풀스택·AI·임베디드·로보틱스 등 직군별 최신 채용 기대 역량 대비 공백까지 심각도별로 짚어줍니다.',
    useCases: [
      'GitHub·블로그 링크가 포함된 개발자 이력서를 제출하기 전 실제 코드와 주장이 일치하는지 검증할 때',
      '지원 직군(백엔드·프론트엔드·AI 등)의 최신 기대 역량 중 내 이력서에 비어 있는 공백을 찾을 때',
    ],
    beforeAfter: {
      beforeItems: [
        '이력서에는 "대규모 트래픽 처리"라고 적었는데 링크된 GitHub 코드는 기본 CRUD만 남아 있다.',
      ],
      afterItems: [
        '실제 코드·블로그·규모 추정 근거로 이력서와의 괴리를 사전에 적발해 수정하거나 방어 논리를 준비한다.',
      ],
    },
    workflowSteps: [
      { step: 1, title: '이력서 및 첨부 GitHub·블로그 링크 추출', description: '이력서 내 주장·수치와 외부 검증 링크를 수집합니다.' },
      { step: 2, title: '코드·블로그·직군 기대 역량 대조', description: '실제 구현·보안·테스트 상태와 직군별 필수 역량 공백을 교차 확인합니다.' },
      { step: 3, title: '심각도별 감점 포인트 및 검증 질문 출력', description: '면접관이 파고들 지점과 확인·반증 질문을 정리합니다.' },
    ],
    prerequisites: [
      { name: '네트워크/GitHub 열람 가능 에이전트 & 기술 이력서', required: true, description: 'GitHub·블로그 링크를 직접 읽어 대조할 수 있는 환경에서 진가를 발휘합니다.' },
    ],
    installPrompt:
      'https://github.com/techeer-sv/Career-Skills 저장소의 skills/hiring-sim-resume-redteam을 references/ 포함해 설치해줘.',
    installGuides: [
      {
        environment: 'claude-code',
        label: 'Claude Code / Codex',
        steps: [
          'techeer-sv/Career-Skills의 `skills/hiring-sim-resume-redteam`(내부 `references/` 포함)을 스킬 폴더에 배치합니다.',
          '이력서 파일 경로와 지원 직군을 전달합니다.',
        ],
        invokeExample: '/hiring-sim-resume-redteam ./resume.pdf 백엔드 지원자 기준으로 GitHub 링크까지 교차 검증해줘.',
      },
    ],
    examplePrompts: [
      { label: '이력서 + GitHub 교차 검증', prompt: './resume.md에 적힌 성과 수치와 첨부된 GitHub 레포 코드가 실제로 일치하는지 레드팀 리뷰해줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '수치·코드·블로그 대조 리포트', description: '이력서 주장과 실제 근거의 불일치 항목' },
      { order: '02', title: '직군 역량 공백 및 면접 압박 질문', description: '부족한 깊이와 라이브 검증 질문 목록' },
    ],
    postRunChecklist: [
      '이력서에 링크한 GitHub 저장소에 민감한 키, 미완성 README, 죽은 데모 URL이 남아 있지 않은지 정리합니다.',
    ],
    tips: [
      '합격/불합격 스크리닝을 원하면 `hiring-sim-resume-review`, 최종 허점 포렌식 검증은 이 스킬을 쓰세요.',
    ],
    cautions: '비공개(Private) GitHub 저장소는 외부에서 검증할 수 없으므로 공개 여부나 설명 보완이 필요합니다.',
    faq: [
      {
        question: '어떤 직군까지 역량 공백을 체크해주나요?',
        answer: '스킬 명세 및 `references/` 기준 백엔드·프론트엔드·풀스택·AI·임베디드·로보틱스 직군을 지원합니다.',
      },
    ],
    fileStructure: ['SKILL.md', 'references/'],
    skillMdPreview: `---
name: hiring-sim-resume-redteam
description: 이력서 수치 검증, 첨부된 GitHub 코드 및 블로그 대조, 지원 직군 기대 역량 공백까지 찾아 감점 포인트를 산출합니다.
user-invocable: true
triggers: ["이력서 감점", "이력서 레드팀", "이력서 검증"]
---`,
    webAlternative: {
      title: '설치 없이 GitHub README와 이력서 직접 대조하기',
      description: '이력서 텍스트와 대표 GitHub 레포의 README·핵심 코드를 함께 붙여넣고 "이력서 주장이 코드로 증명되지 않는 지점을 찾아줘"라고 요청하세요.',
      recommendedTools: ['claude', 'cursor', 'chatgpt'],
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['claude', 'cursor', 'chatgpt'],
  },
  {
    slug: 'skill-kevin-feedback',
    title: 'Kevin Feedback (케빈 스타일 이력서 직설 피드백)',
    summary:
      '저장소에 내장된 스타일 프로파일(kevin-style-profile)을 기반으로 이력서의 문장, 구성, 어필 포인트에 대한 직접적이고 구체적인 피드백을 제공합니다.',
    sourceUrl: TECHEER_REPO,
    sourceName: 'techeer-sv',
    domains: ['career', 'docs-reports'],
    aiUses: ['writing-summary'],
    tags: ['에이전트-스킬-mcp', '취업·이직', '이력서점검', 'claude-skills'],
    skillKind: SkillKind.SKILL,
    skillSlug: 'kevin-feedback',
    authorName: 'techeer-sv',
    license: 'MIT',
    repositoryUrl: TECHEER_REPO,
    sourceFileUrl: `${TECHEER_SKILL_BLOB}/kevin-feedback/SKILL.md`,
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.BEGINNER,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code', 'Codex', 'Cursor', 'Antigravity'],
    overview:
      'Techeer 커뮤니티의 Kevin 멘토링 피드백 스타일을 프로파일 문서로 정리해, 이력서를 읽고 돌려 말하지 않는 실전 톤으로 개선점을 짚어주는 스킬입니다. `references/learned/kevin-style-profile.v2.public.md` 등 공개 스타일 프로파일을 먼저 읽어 일관된 기준과 말투로 문장·구성을 점검합니다.',
    useCases: [
      '일반적인 AI의 두루뭉술한 칭찬 대신 멘토가 직접 짚어주는 듯한 직설적인 이력서 피드백을 받고 싶을 때',
      '이력서 상단 요약, 프로젝트 나열 순서, 문장 전달력을 빠르게 다듬고 싶을 때',
    ],
    beforeAfter: {
      beforeItems: [
        'AI 피드백이 너무 공손하고 일반적이어서 내 이력서의 진짜 약점이 안 와닿는다.',
      ],
      afterItems: [
        '정해진 멘토링 스타일 프로파일에 따라 군더더기 문장과 약한 근거를 바로 짚어준다.',
      ],
    },
    workflowSteps: [
      { step: 1, title: '스타일 프로파일 로딩', description: '`references/learned/kevin-style-profile.v2.public.md` 등 우선순위 파일에서 피드백 톤과 기준을 읽습니다.' },
      { step: 2, title: '이력서 문장·구성 검토', description: '대상 이력서 파일을 분석해 어필되지 않는 문장과 구조적 개선점을 도출합니다.' },
      { step: 3, title: '케빈 톤 피드백 출력', description: '섹션별 지적 사항과 수정 방향을 직관적으로 전달합니다.' },
    ],
    prerequisites: [
      { name: '스킬 디렉터리 내 references/ 폴더 포함 설치', required: true, description: '`SKILL.md`만 복사하지 말고 `references/` 폴더를 반드시 함께 배치해야 스타일 프로파일이 로드됩니다.' },
    ],
    installPrompt:
      'https://github.com/techeer-sv/Career-Skills 저장소의 skills/kevin-feedback 폴더 전체(references/ 포함)를 설치해줘.',
    installGuides: [
      {
        environment: 'claude-code',
        label: 'Claude Code / Codex',
        steps: [
          'techeer-sv/Career-Skills의 `skills/kevin-feedback` 전체 디렉터리를 `~/.claude/skills/kevin-feedback/`에 복사합니다.',
          '`$kevin-feedback [파일경로]` 형식으로 호출합니다.',
        ],
        invokeExample: '$kevin-feedback ./resume.md',
      },
    ],
    examplePrompts: [
      { label: '케빈 스타일 이력서 리뷰', prompt: '$kevin-feedback ./resume.pdf 전체 구성과 프로젝트 설명 위주로 솔직하게 피드백해줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '문장·구성 직설 피드백', description: '군더더기 제거와 핵심 성과 부각을 위한 섹션별 코멘트' },
    ],
    postRunChecklist: [
      '피드백을 반영한 뒤 `hiring-sim-resume-review`로 지원 공고와의 키워드 매칭도 함께 점검해 보세요.',
    ],
    tips: [
      '객관적인 리서치 기반 피드백을 원하면 `hiring-prep-doc-feedback`을, 직설적인 멘토 톤을 원하면 `kevin-feedback`을 선택하세요.',
    ],
    cautions: '직설적인 피드백 톤을 사용하며, `references/` 폴더가 빠지면 스타일 프로파일을 읽지 못합니다.',
    faq: [
      {
        question: '냉정 모드($kevin-feedback-cold)도 지원하나요?',
        answer: '원본 `SKILL.md` 기준 `$kevin-feedback-cold`는 개발 예정 상태로 안내되어 있으며 기본 `$kevin-feedback` 모드를 사용합니다.',
      },
    ],
    fileStructure: ['SKILL.md', 'README.md', 'resume.md', 'references/'],
    skillMdPreview: `---
name: kevin-feedback
description: Kevin의 말투로 이력서 피드백을 제공합니다. 사용 예: "$kevin-feedback [파일경로]"
triggers: ["$kevin-feedback"]
---`,
    webAlternative: {
      title: '설치 없이 직설 리뷰 프롬프트로 이력서 점검하기',
      description: 'Claude나 ChatGPT에 이력서를 올리고 "미사여구나 위로는 빼고, 채용 실무자 시선에서 30초 안에 안 읽히는 문장과 불필요한 경력 나열만 콕 집어줘"라고 요청하세요.',
      recommendedTools: ['claude', 'chatgpt'],
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['claude', 'chatgpt'],
  },
  {
    slug: 'skill-portfolio-build',
    title: 'Portfolio Build (근거 중심 HTML 슬라이드 포트폴리오 제작)',
    summary:
      '이력서·기존 포폴(PDF/HTML)·아키텍처 이미지·GitHub 저장소에서 내용과 이미지를 추출하고 디자인 레퍼런스를 적용해 자기완결형 HTML 슬라이드 포트폴리오를 제작합니다.',
    sourceUrl: TECHEER_REPO,
    sourceName: 'techeer-sv',
    domains: ['career', 'planning-slides', 'content-design'],
    aiUses: ['writing-summary', 'automation-workflow'],
    tags: ['에이전트-스킬-mcp', '취업·이직', 'claude-skills'],
    skillKind: SkillKind.SKILL,
    skillSlug: 'portfolio-build',
    authorName: 'techeer-sv',
    license: 'MIT',
    repositoryUrl: TECHEER_REPO,
    sourceFileUrl: `${TECHEER_SKILL_BLOB}/portfolio-build/SKILL.md`,
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.PRACTICAL,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code', 'Codex', 'Cursor', 'Antigravity'],
    overview:
      '빈 슬라이드에서 시작하지 않고 `references/`에 포함된 디자인 무드 템플릿 중 하나를 골라, 사용자의 이력서·PDF·이미지·GitHub 자료에서 추출한 실제 내용과 아키텍처 이미지를 채워 자기완결형 HTML 덱을 생성하는 스킬입니다. `structure-guide.md`의 수치 정합 체크리스트와 `scripts/extract_pdf_images.py`를 활용해 근거가 있는 슬라이드만 남깁니다.',
    useCases: [
      '이력서와 GitHub 레포, 아키텍처 이미지만 있고 깔끔한 슬라이드형 포트폴리오가 아직 없을 때',
      '기존 PDF 포트폴리오의 디자인을 리뉴얼하거나 웹에서 바로 넘겨보는 HTML 덱으로 바꾸고 싶을 때',
    ],
    beforeAfter: {
      beforeItems: [
        'Figma나 PPT에서 장표 레이아웃을 잡느라 며칠을 쓰고 정작 프로젝트 근거 정리가 밀린다.',
      ],
      afterItems: [
        '선택한 디자인 무드에 실제 프로젝트 내용·이미지가 채워진 단일 HTML 슬라이드 덱을 빠르게 완성한다.',
      ],
    },
    workflowSteps: [
      { step: 1, title: '디자인 무드 및 보유 자료 입력', description: '`references/README.md`의 무드를 고르거나 자동 선택하고 이력서·PDF·이미지·GitHub를 전달합니다.' },
      { step: 2, title: '자료 및 PDF 이미지 추출', description: '`scripts/extract_pdf_images.py` 등으로 기존 자료에서 텍스트와 아키텍처 이미지를 추출합니다.' },
      { step: 3, title: '슬라이드 구성 및 수치 정합성 점검', description: '`structure-guide.md` 원칙에 따라 근거 있는 슬라이드만 배치해 완결형 HTML을 생성합니다.' },
    ],
    prerequisites: [
      { name: '스킬 디렉터리 전체(references, scripts, structure-guide.md) & Python', required: true, description: 'PDF에서 이미지를 추출하려면 Python 환경과 번들 파일 전체가 필요합니다.' },
    ],
    installPrompt:
      'https://github.com/techeer-sv/Career-Skills 저장소의 skills/portfolio-build 폴더 전체를 설치하고 references/README.md를 확인해줘.',
    installGuides: [
      {
        environment: 'claude-code',
        label: 'Claude Code / Cursor',
        steps: [
          'techeer-sv/Career-Skills의 `skills/portfolio-build` 전체(`references/`, `scripts/`, `structure-guide.md`)를 스킬 폴더에 배치합니다.',
          '원하는 디자인 무드와 이력서·이미지·GitHub 링크를 전달합니다.',
        ],
        invokeExample: '/portfolio-build ./resume.pdf ./images/ GitHub: https://github.com/... 디자인은 자동으로 맞춰서 HTML 포폴 만들어줘.',
      },
    ],
    examplePrompts: [
      { label: '이력서 기반 HTML 포폴 제작', prompt: './resume.md와 ./diagrams 폴더의 이미지를 바탕으로 백엔드 개발자용 슬라이드 포트폴리오 HTML을 만들어줘.' },
      { label: '기존 PDF 리디자인', prompt: './old-portfolio.pdf에서 이미지와 프로젝트를 추출해서 더 깔끔한 톤의 HTML 슬라이드 덱으로 리디자인해줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '자기완결형 HTML 슬라이드 포트폴리오', description: '브라우저에서 열어 바로 발표·PDF 인쇄 가능한 슬라이드 덱' },
    ],
    postRunChecklist: [
      '생성된 HTML을 브라우저로 열어 이미지 깨짐, 폰트 줄바꿈, 모바일/인쇄 여백을 확인합니다.',
      '완성 후 `hiring-sim-portfolio-review`로 수치 정합성과 기술 의사결정 설득력을 최종 점검합니다.',
    ],
    tips: [
      '아키텍처 다이어그램이나 성능 측정 스크린샷 폴더를 함께 주면 텍스트 위주의 밋밋한 슬라이드를 피할 수 있습니다.',
    ],
    cautions: '근거 없는 성과 수치는 자동으로 지어내지 않도록 주의하고, 생성된 HTML의 인쇄(PDF 저장) 레이아웃을 반드시 확인하세요.',
    faq: [
      {
        question: 'HTML 결과물을 PDF로도 제출할 수 있나요?',
        answer: '네, 브라우저에서 열어 인쇄 → PDF로 저장을 선택하면 슬라이드 비율에 맞춘 PDF로 변환해 제출할 수 있습니다.',
      },
    ],
    fileStructure: ['SKILL.md', 'structure-guide.md', 'references/', 'scripts/extract_pdf_images.py'],
    skillMdPreview: `---
name: portfolio-build
description: 개발자 슬라이드 포트폴리오(자기완결형 HTML 덱)를 제작한다. references/의 디자인 레퍼런스를 골라 사용자 자료에서 내용과 이미지를 추출해 채운다.
user-invocable: true
triggers: ["포트폴리오 제작", "포트폴리오 만들", "포폴 제작"]
---`,
    webAlternative: {
      title: '설치 없이 Gamma / Claude Artifacts로 슬라이드 포폴 만들기',
      description: '이력서와 프로젝트 요약을 Claude Artifacts로 HTML 슬라이드로 만들거나 Gamma에 개요를 붙여넣어 디자인된 웹 프레젠테이션으로 변환할 수 있습니다.',
      recommendedTools: ['gamma', 'claude', 'canva-magic-studio'],
      guideSlug: 'guide-proposal-deck-in-30min',
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['claude', 'gamma', 'canva-magic-studio', 'cursor'],
  },
];
