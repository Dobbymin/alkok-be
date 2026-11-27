import {
  DifficultyLevel,
  PricingModel,
  SkillExecutionVerification,
  SkillKind,
} from '@prisma/client';
import { DEFAULT_SKILL_TOC, type SeedSkillInput } from './skills-seed';

export const EXTRA_SEED_SKILLS: SeedSkillInput[] = [
  // 1. Anthropic Official Skills (6)
  {
    slug: 'skill-anthropic-pptx',
    title: 'Anthropic PPTX (프레젠테이션 생성·편집·분석 스킬)',
    summary:
      'PowerPoint(.pptx/.potx) 슬라이드 덱을 새로 생성하거나 기존 템플릿 레이아웃·발표자 노트·텍스트를 구조적으로 편집·추출하는 Anthropic 공식 스킬입니다.',
    sourceUrl: 'https://github.com/anthropics/skills',
    sourceName: 'Anthropic Official Skills',
    isFeatured: true,
    domains: ['planning-slides', 'docs-reports'],
    aiUses: ['writing-summary', 'automation-workflow'],
    tags: ['에이전트-스킬-mcp', 'pptx', '발표자료', 'claude-skills'],
    skillKind: SkillKind.SKILL,
    skillSlug: 'pptx',
    authorName: 'Anthropic',
    license: 'Source-Available (LICENSE.txt)',
    repositoryUrl: 'https://github.com/anthropics/skills',
    sourceFileUrl: 'https://github.com/anthropics/skills/blob/main/skills/pptx/SKILL.md',
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.PRACTICAL,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code', 'Claude.ai', 'Codex', 'Cursor'],
    overview:
      '기획안이나 보고서를 매번 수동으로 슬라이드에 옮겨 붙이는 대신, `pptxgenjs` 기반 구조화 슬라이드 생성과 `.pptx` 내부 XML(slideN.xml) 직접 편집을 통해 발표 자료 제작과 기존 덱 텍스트 추출을 자동화합니다.',
    useCases: [
      '기획 문서나 회의 메모를 바탕으로 일관된 레이아웃의 제안서·피치덱(.pptx)을 만들 때',
      '기존 회사 .pptx 템플릿의 서식과 마스터 슬라이드를 유지한 채 내용만 교체할 때',
      '수십 장짜리 발표 자료에서 발표자 노트와 본문 텍스트를 빠르게 추출해 요약할 때',
    ],
    beforeAfter: {
      beforeItems: [
        'AI가 써준 목차를 보고 PowerPoint에서 슬라이드 한 장씩 수동으로 복붙·정렬한다.',
        '기존 .pptx 파일에서 텍스트와 노트를 꺼내 요약하려면 일일이 열어야 한다.',
      ],
      afterItems: [
        '구조화된 슬라이드 덱(.pptx) 파일 자체를 스크립트로 생성해 바로 열어볼 수 있다.',
        'slide_text.py와 thumbnail.py로 기존 덱의 텍스트와 시각 그리드를 즉시 분석한다.',
      ],
    },
    workflowSteps: [
      { step: 1, title: '작업 유형 판별 (생성/편집/추출)', description: '새 덱 생성인지 기존 .pptx 템플릿 편집·텍스트 추출인지 분기합니다.' },
      { step: 2, title: '스크립트 기반 생성 또는 XML 언팩', description: '새 덱은 pptxgenjs로, 기존 템플릿 편집은 slideN.xml 수정 후 재압축합니다.' },
      { step: 3, title: '썸네일 시각 검수', description: 'thumbnail.py로 슬라이드 그리드를 렌더링해 텍스트 겹침·여백을 점검합니다.' },
    ],
    prerequisites: [
      { name: '스킬 지원 에이전트', required: true, description: 'Claude Code, Claude.ai 또는 로컬 스크립트 실행이 가능한 에이전트가 필요합니다.' },
      { name: 'Node.js(pptxgenjs) / Python', required: false, description: '로컬 환경에서 실제 .pptx 파일을 빌드·변환할 때 필요합니다.' },
    ],
    installPrompt:
      'https://github.com/anthropics/skills 저장소의 skills/pptx 스킬을 현재 에이전트 스킬 폴더에 설치하고 SKILL.md 및 scripts 폴더 구성을 확인해줘.',
    installGuides: [
      {
        environment: 'claude-code',
        label: 'Claude Code',
        steps: [
          'anthropics/skills 저장소의 skills/pptx 폴더를 ~/.claude/skills/pptx/에 배치합니다.',
          '작업 폴더에서 .pptx 생성 또는 분석을 요청합니다.',
        ],
        invokeExample: '/pptx 첨부한 제안서 요약본으로 10장짜리 고객 발표용 .pptx 파일을 만들어줘.',
      },
      {
        environment: 'claude-web',
        label: 'Claude.ai 웹/앱',
        steps: ['Claude.ai 유료 플랜의 파일 생성·스킬 기능에서 바로 .pptx 파일 생성을 요청합니다.'],
      },
    ],
    examplePrompts: [
      { label: '새 발표자료 생성', prompt: '이 분기 실적 메모를 바탕으로 경영진 보고용 8장짜리 .pptx 슬라이드를 만들어줘.' },
      { label: '기존 덱 추출', prompt: '업로드한 deck.pptx에서 슬라이드별 핵심 메시지와 발표자 노트만 추출해줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '편집 가능한 .pptx 파일', description: '제목·표·요약 불릿이 배치된 PowerPoint 파일' },
      { order: '02', title: '시각 검수 통과 확인', description: '텍스트 잘림이나 레이아웃 겹침 점검 결과' },
    ],
    postRunChecklist: [
      '생성된 .pptx를 PowerPoint/Keynote에서 열어 한글 폰트 줄바꿈과 표 여백이 깨지지 않았는지 확인합니다.',
    ],
    tips: ['회사 로고나 컬러 가이드가 있다면 16진수 색상 코드와 폰트명을 함께 알려주세요.'],
    cautions: '복잡한 커스텀 차트나 애니메이션은 생성 후 PowerPoint에서 최종 손보는 편이 빠릅니다.',
    faq: [
      { question: '비개발자가 설치 없이 쓰려면 어떻게 하나요?', answer: 'Gamma나 Canva Magic Studio에 개요를 붙여넣거나 Claude.ai 웹의 파일 생성 기능을 쓰는 것이 가장 간편합니다.' },
    ],
    fileStructure: ['SKILL.md', 'LICENSE.txt', 'scripts/slide_text.py', 'scripts/thumbnail.py'],
    skillMdPreview: `---
name: pptx
description: Use this skill any time a .pptx or .potx file is involved in any way — creating, reading, editing slide decks.
---
# PPTX creation, editing, and analysis
- Create: pptxgenjs script 기반 구조화 덱 생성
- Edit: unpack -> edit ppt/slides/slideN.xml -> zip
- Read: python scripts/slide_text.py deck.pptx`,
    webAlternative: {
      title: '설치 없이 Gamma / Canva Magic Studio로 10분 완성하기',
      description: '로컬 스크립트 실행이 부담스럽다면 Claude로 슬라이드 개요를 만든 뒤 Gamma나 Canva에 붙여넣어 디자인을 자동 생성하는 방법이 가장 빠릅니다.',
      recommendedTools: ['gamma', 'canva-magic-studio', 'claude'],
      guideSlug: 'guide-proposal-deck-in-30min',
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['claude', 'gamma', 'canva-magic-studio'],
  },
  {
    slug: 'skill-anthropic-xlsx',
    title: 'Anthropic XLSX (엑셀·CSV 수식·차트·데이터 정제 스킬)',
    summary:
      '엑셀(.xlsx/.xlsm)과 CSV/TSV 파일을 읽고 수식·서식·차트를 유지한 채 생성·수정하거나 지저분한 표 데이터를 깔끔하게 정제하는 Anthropic 공식 스킬입니다.',
    sourceUrl: 'https://github.com/anthropics/skills',
    sourceName: 'Anthropic Official Skills',
    isFeatured: true,
    domains: ['data-sheets', 'docs-reports'],
    aiUses: ['search-analysis', 'automation-workflow'],
    tags: ['에이전트-스킬-mcp', 'xlsx', '엑셀', '데이터정제'],
    skillKind: SkillKind.SKILL,
    skillSlug: 'xlsx',
    authorName: 'Anthropic',
    license: 'Source-Available (LICENSE.txt)',
    repositoryUrl: 'https://github.com/anthropics/skills',
    sourceFileUrl: 'https://github.com/anthropics/skills/blob/main/skills/xlsx/SKILL.md',
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.PRACTICAL,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code', 'Claude.ai', 'Codex', 'Cursor'],
    overview:
      'openpyxl과 pandas를 상황에 맞게 조합해, 수식이 깨지지 않는 엑셀 시트를 생성하고 잘못된 헤더·공백·중복 행이 섞인 CSV/엑셀 파일을 실무용 표로 정리합니다.',
    useCases: [
      '여러 시트에 흩어진 매출 CSV를 합치고 SUMIFS·피벗 집계 시트를 추가할 때',
      '기존 .xlsx 모델의 수식(formula)과 계산된 값(value)을 모두 확인하며 오류를 수정할 때',
    ],
    beforeAfter: {
      beforeItems: ['AI에게 엑셀 수정을 시키면 기존 수식이 하드코딩 숫자로 덮어씌워진다.'],
      afterItems: ['수식 모드와 값 모드를 이중으로 읽어 기존 계산 로직을 보존한 채 수정한다.'],
    },
    workflowSteps: [
      { step: 1, title: '시트 구조 및 수식 파악', description: 'markitdown 또는 openpyxl 2-pass 로드로 시트 구조와 수식을 확인합니다.' },
      { step: 2, title: '정제·집계 및 서식 적용', description: 'pandas/openpyxl로 데이터 정제, 수식 삽입, 열 너비·숫자 포맷을 적용합니다.' },
      { step: 3, title: '수식 오류(#REF!, #VALUE!) 검증', description: '저장 전 수식 참조 오류와 합계 일치 여부를 점검합니다.' },
    ],
    prerequisites: [
      { name: '스킬 지원 에이전트 & Python(openpyxl/pandas)', required: true, description: 'Claude Code 또는 Python 파일 실행 환경에서 동작합니다.' },
    ],
    installPrompt:
      'https://github.com/anthropics/skills 저장소의 skills/xlsx 스킬을 현재 에이전트 스킬 폴더에 설치해줘.',
    installGuides: [
      {
        environment: 'claude-code',
        label: 'Claude Code',
        steps: ['~/.claude/skills/xlsx/에 배치하고 작업 폴더의 .xlsx/.csv 파일 경로를 전달합니다.'],
        invokeExample: '/xlsx ./sales_raw.csv 파일의 결측치를 정리하고 월별 합계 시트가 포함된 .xlsx로 만들어줘.',
      },
    ],
    examplePrompts: [
      { label: '지저분한 CSV 정제', prompt: '이 CSV의 깨진 날짜 형식과 중복 행을 정리해서 깔끔한 .xlsx 표로 저장해줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '수식이 살아있는 .xlsx 파일', description: 'SUM/AVERAGE 등 동적 수식과 숫자 서식이 적용된 통합 문서' },
    ],
    postRunChecklist: ['생성된 엑셀 파일을 열어 수식 셀에 #REF! 또는 #NAME? 오류가 없는지 확인합니다.'],
    tips: ['금액 단위가 원인지 천원인지 명확히 알려주면 표 헤더와 서식이 정확해집니다.'],
    cautions: '사내 급여·인사 등 민감한 엑셀 파일은 로컬 환경에서만 처리하고 외부 클라우드 전송에 주의하세요.',
    faq: [
      { question: '매크로(.xlsm)도 다룰 수 있나요?', answer: '읽기와 데이터 추출은 가능하지만 VBA 매크로 코드 자체를 실행하지는 않습니다.' },
    ],
    fileStructure: ['SKILL.md', 'LICENSE.txt'],
    skillMdPreview: `---
name: xlsx
description: Use this skill any time a spreadsheet file (.xlsx, .xlsm, .csv, .tsv) is the primary input or output.
---
# XLSX creation, editing, and analysis
- Create/edit with formulas/formatting: openpyxl
- Bulk data in or out: pandas
- Quick look: markitdown file.xlsx`,
    webAlternative: {
      title: '웹 ChatGPT 데이터 분석 / Microsoft Copilot으로 대체하기',
      description: '설치 없이 ChatGPT(Plus)에 CSV/엑셀을 올리거나 Excel 내 Microsoft Copilot을 사용하면 수식 추천과 차트 요약을 바로 받을 수 있습니다.',
      recommendedTools: ['chatgpt', 'microsoft-copilot'],
      guideSlug: 'guide-excel-formula-and-csv-cleaning',
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['claude', 'chatgpt', 'microsoft-copilot'],
  },
  {
    slug: 'skill-anthropic-pdf',
    title: 'Anthropic PDF (PDF 텍스트·표 추출·병합·양식 채우기 스킬)',
    summary:
      'PDF 파일에서 텍스트와 표를 정확히 추출하고, 여러 PDF를 병합·분할·회전하거나 양식(Form) 채우기, 워터마크·스캔 OCR까지 처리하는 Anthropic 공식 스킬입니다.',
    sourceUrl: 'https://github.com/anthropics/skills',
    sourceName: 'Anthropic Official Skills',
    isFeatured: false,
    domains: ['docs-reports', 'research'],
    aiUses: ['writing-summary', 'search-analysis'],
    tags: ['에이전트-스킬-mcp', 'pdf', '문서추출', 'ocr'],
    skillKind: SkillKind.SKILL,
    skillSlug: 'pdf',
    authorName: 'Anthropic',
    license: 'Source-Available (LICENSE.txt)',
    repositoryUrl: 'https://github.com/anthropics/skills',
    sourceFileUrl: 'https://github.com/anthropics/skills/blob/main/skills/pdf/SKILL.md',
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.BEGINNER,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code', 'Claude.ai', 'Codex', 'Cursor'],
    overview:
      'pypdf·pdfplumber·OCR 도구 등을 상황에 맞게 조합해, 일반 복붙으로 표가 깨지는 PDF를 구조화된 데이터로 뽑아내거나 여러 PDF 문서를 실무용으로 편집합니다.',
    useCases: [
      '산업 보고서나 제안서 PDF 안의 복잡한 재무표·통계표를 CSV/Markdown으로 추출할 때',
      '계약서 여러 부를 하나로 합치거나 특정 페이지만 분할·회전·워터마크 처리할 때',
    ],
    beforeAfter: {
      beforeItems: ['PDF 표를 마우스로 드래그해 복사하면 열과 행이 뒤섞여 다시 타이핑해야 한다.'],
      afterItems: ['표 추출 스크립트로 행·열 구조를 보존한 채 바로 CSV나 요약표로 변환한다.'],
    },
    workflowSteps: [
      { step: 1, title: 'PDF 유형 확인 (텍스트/스캔/양식)', description: '일반 텍스트 PDF인지 스캔 이미지 또는 입력 폼인지 판별합니다.' },
      { step: 2, title: '작업 실행 (추출·병합·폼 작성)', description: 'pypdf, pdfplumber 또는 OCR 파이프라인으로 변환을 수행합니다.' },
      { step: 3, title: '페이지별 누락 검증', description: '원본 페이지 수와 추출된 표·텍스트 일치 여부를 확인합니다.' },
    ],
    prerequisites: [
      { name: '스킬 지원 에이전트', required: true, description: 'Claude Code, Codex, Cursor 등에서 실행할 수 있습니다.' },
    ],
    installPrompt:
      'https://github.com/anthropics/skills 저장소의 skills/pdf 스킬을 현재 에이전트 스킬 폴더에 설치해줘.',
    installGuides: [
      {
        environment: 'claude-code',
        label: 'Claude Code',
        steps: ['~/.claude/skills/pdf/에 스킬 폴더를 배치하고 PDF 파일 경로를 전달합니다.'],
        invokeExample: '/pdf ./2026_report.pdf 12~18페이지에 있는 표만 추출해서 CSV로 저장해줘.',
      },
    ],
    examplePrompts: [
      { label: '표 추출', prompt: '이 PDF 파일의 모든 표를 추출해서 엑셀에서 열 수 있는 CSV로 저장해줘.' },
      { label: '문서 병합', prompt: 'A.pdf와 B.pdf를 합치고 각 페이지 하단에 페이지 번호를 넣어줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '추출된 표(CSV/MD) 또는 편집된 PDF', description: '원본 열 정렬이 유지된 데이터 또는 병합/분할 결과 파일' },
    ],
    postRunChecklist: ['다단(2단) 레이아웃 PDF의 경우 좌우 문단 순서가 섞이지 않았는지 확인합니다.'],
    tips: ['10페이지가 넘는 대용량 PDF는 필요한 페이지 범위를 지정하면 훨씬 빠르고 정확합니다.'],
    cautions: '암호화된 PDF는 비밀번호 없이는 열 수 없으며, 개인정보가 담긴 스캔본 처리 시 보안에 유의하세요.',
    faq: [
      { question: 'PDF 요약만 필요하다면 설치가 꼭 필요한가요?', answer: '단순 요약과 질의응답만 원한다면 NotebookLM이나 Claude 웹에 PDF를 바로 올리는 것이 훨씬 간편합니다.' },
    ],
    fileStructure: ['SKILL.md', 'LICENSE.txt', 'REFERENCE.md', 'FORMS.md'],
    skillMdPreview: `---
name: pdf
description: Use this skill whenever the user wants to do anything with PDF files (extract, merge, split, forms, OCR).
---
# PDF Processing Guide
- Read/Extract text & tables (pypdf / pdfplumber)
- Merge, split, rotate, watermark
- Fill PDF forms (FORMS.md)`,
    webAlternative: {
      title: '설치 없이 NotebookLM / Claude로 PDF 분석하기',
      description: '편집·병합이 아니라 내용 요약과 표 질의가 목적이라면 Google NotebookLM에 PDF를 업로드해 출처 인용과 함께 질문하는 것이 가장 빠릅니다.',
      recommendedTools: ['notebooklm', 'claude'],
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['notebooklm', 'claude', 'chatgpt'],
  },
  {
    slug: 'skill-anthropic-docx',
    title: 'Anthropic DOCX (Word 문서 생성·변경추적·서식 편집 스킬)',
    summary:
      'Microsoft Word(.docx/.dotx) 문서를 새로 작성하거나 기존 문서의 목차·머리글·표·변경 내용 추적(Tracked Changes)을 유지한 채 편집하는 Anthropic 공식 스킬입니다.',
    sourceUrl: 'https://github.com/anthropics/skills',
    sourceName: 'Anthropic Official Skills',
    isFeatured: false,
    domains: ['docs-reports', 'planning-slides'],
    aiUses: ['writing-summary', 'automation-workflow'],
    tags: ['에이전트-스킬-mcp', 'docx', '워드', '계약서검토'],
    skillKind: SkillKind.SKILL,
    skillSlug: 'docx',
    authorName: 'Anthropic',
    license: 'Source-Available (LICENSE.txt)',
    repositoryUrl: 'https://github.com/anthropics/skills',
    sourceFileUrl: 'https://github.com/anthropics/skills/blob/main/skills/docx/SKILL.md',
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.PRACTICAL,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code', 'Claude.ai', 'Codex', 'Cursor'],
    overview:
      '단순 마크다운이 아니라 실제 회사에 제출해야 하는 .docx 파일(목차, 페이지 번호, 머리글/바닥글, 표, 코멘트·변경 추적)을 정교하게 생성·수정해야 할 때 사용하는 스킬입니다.',
    useCases: [
      '기존 계약서나 규약(.docx)에 수정 사항을 "변경 내용 추적(Redline)"으로 남기며 고칠 때',
      'Markdown 초안을 표지와 목차가 갖춰진 공식 Word 보고서(.docx)로 변환할 때',
    ],
    beforeAfter: {
      beforeItems: ['AI 채팅 결과를 복붙해 Word에서 제목 스타일·목차·표를 처음부터 다시 맞춘다.'],
      afterItems: ['표준 Word 스타일·목차·코멘트가 적용된 .docx 파일로 바로 출력한다.'],
    },
    workflowSteps: [
      { step: 1, title: '문서 구조·XML 분석', description: '기존 .docx의 스타일과 단락·표 XML 구조를 파악합니다.' },
      { step: 2, title: '생성 또는 변경 추적 편집', description: 'docx 라이브러리 또는 OOXML 편집으로 본문·코멘트·수정 이력을 반영합니다.' },
      { step: 3, title: '레이아웃 검수', description: '페이지 넘김과 표 폭이 정상인지 확인합니다.' },
    ],
    prerequisites: [
      { name: '스킬 지원 에이전트', required: true, description: 'Claude Code, Claude.ai 등에서 활용할 수 있습니다.' },
    ],
    installPrompt:
      'https://github.com/anthropics/skills 저장소의 skills/docx 스킬을 현재 에이전트 스킬 폴더에 설치해줘.',
    installGuides: [
      {
        environment: 'claude-code',
        label: 'Claude Code',
        steps: ['~/.claude/skills/docx/에 배치하고 편집할 .docx 파일 경로를 전달합니다.'],
        invokeExample: '/docx ./contract.docx에서 5조 지체상금 문구를 수정하고 변경 내용 추적으로 남겨줘.',
      },
    ],
    examplePrompts: [
      { label: '공식 보고서 생성', prompt: '이 기획안을 목차와 요약 표가 포함된 깔끔한 .docx 파일로 만들어줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '서식이 적용된 .docx 파일', description: 'Word에서 바로 열어 인쇄·공유 가능한 문서' },
    ],
    postRunChecklist: ['Word에서 "변경 내용 추적" 표시 상태와 자동 목차 업데이트(F9)를 확인합니다.'],
    tips: ['회사 공문서 템플릿(.dotx/.docx)이 있다면 함께 제공해 스타일을 맞추세요.'],
    cautions: '법적 효력이 있는 계약서 수정본은 반드시 법무 담당자의 최종 확인을 거쳐야 합니다.',
    faq: [
      { question: '한컴오피스 HWP 파일도 이 스킬로 되나요?', answer: '아닙니다. .hwp/.hwpx는 HWP/HWPX Document Parser 스킬을 사용해야 합니다.' },
    ],
    fileStructure: ['SKILL.md', 'LICENSE.txt'],
    skillMdPreview: `---
name: docx
description: Use this skill whenever the user wants to create, read, edit, or manipulate Word documents (.docx, .dotx).
---
# DOCX Creation & Tracked Changes
- Professional formatting: TOC, headings, page numbers, letterheads
- Redlining / Tracked changes & comments`,
    webAlternative: {
      title: '설치 없이 Microsoft Copilot / Claude Artifacts 활용하기',
      description: 'Word 내 Microsoft Copilot을 쓰거나 Claude에서 만든 구조화 초안을 Google Docs/Word로 내보내기하면 별도 설치 없이 바로 쓸 수 있습니다.',
      recommendedTools: ['microsoft-copilot', 'claude'],
      guideSlug: 'guide-contract-proposal-review',
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['microsoft-copilot', 'claude'],
  },
  {
    slug: 'skill-anthropic-doc-coauthoring',
    title: 'Anthropic Doc Co-Authoring (기획서·PRD·제안서 공동 집필 스킬)',
    summary:
      '컨텍스트 수집 → 섹션별 구조화 초안 작성 → 독자 시점 블라인드 테스트 3단계 워크플로로 완성도 높은 실무 문서를 함께 쓰는 Anthropic 공식 스킬입니다.',
    sourceUrl: 'https://github.com/anthropics/skills',
    sourceName: 'Anthropic Official Skills',
    isFeatured: false,
    domains: ['docs-reports', 'planning-slides'],
    aiUses: ['writing-summary'],
    tags: ['에이전트-스킬-mcp', '기획서작성', 'prd', '공동집필'],
    skillKind: SkillKind.SKILL,
    skillSlug: 'doc-coauthoring',
    authorName: 'Anthropic',
    license: 'Source-Available (LICENSE.txt)',
    repositoryUrl: 'https://github.com/anthropics/skills',
    sourceFileUrl: 'https://github.com/anthropics/skills/blob/main/skills/doc-coauthoring/SKILL.md',
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.BEGINNER,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code', 'Claude.ai', 'Codex', 'Cursor'],
    overview:
      'AI에게 "기획서 써줘"라고 한 번에 시키면 뻔하고 빈약한 초안이 나옵니다. 이 스킬은 AI가 먼저 질문으로 배경·제약·독자를 좁힌 뒤, 섹션별로 번갈아 가며 초안을 다듬고, 마지막에 처음 읽는 독자 관점으로 논리 구멍을 찾아줍니다.',
    useCases: [
      '제품 요구사항 정의서(PRD), 기술 설계서(RFC), 임원 보고용 전략 문서를 쓸 때',
      '혼자 문서를 쓰다 보니 배경 설명이 빠져 팀원이 이해하기 어려울까 걱정될 때',
    ],
    beforeAfter: {
      beforeItems: ['한 줄 요청으로 긴 문서를 한 번에 생성해 현실성 없는 내용만 가득하다.'],
      afterItems: ['질의응답으로 실제 맥락을 채운 뒤 섹션별 합의와 독자 검증까지 마친다.'],
    },
    workflowSteps: [
      { step: 1, title: 'Stage 1: 컨텍스트 수집', description: '대상 독자, 문서 목적, 제약 조건, 참고 자료를 인터뷰로 수집합니다.' },
      { step: 2, title: 'Stage 2: 섹션별 정교화', description: '목차를 확정한 뒤 섹션마다 브레인스토밍 → 선별 → 초안 → 피드백을 반복합니다.' },
      { step: 3, title: 'Stage 3: 독자 테스트 (Reader Testing)', description: '배경지식이 없는 독자 관점에서 애매한 문장이나 누락된 전제를 점검합니다.' },
    ],
    prerequisites: [
      { name: '스킬 지원 에이전트', required: true, description: 'Claude.ai, Claude Code, Codex 등 대화형 에이전트 어디서나 쓸 수 있습니다.' },
    ],
    installPrompt:
      'https://github.com/anthropics/skills 저장소의 skills/doc-coauthoring 스킬을 현재 에이전트 스킬 폴더에 설치해줘.',
    installGuides: [
      {
        environment: 'claude-code',
        label: 'Claude Code / Claude.ai',
        steps: ['스킬을 활성화하고 작성할 문서 주제와 대상 독자를 말합니다.'],
        invokeExample: '/doc-coauthoring 신규 B2B 온보딩 개선 PRD를 같이 작성하고 싶어.',
      },
    ],
    examplePrompts: [
      { label: 'PRD 공동 작성', prompt: '신규 알림 기능 기획서를 쓸 거야. Stage 1 질문부터 시작해서 단계별로 같이 작성하자.' },
    ],
    expectedOutputs: [
      { order: '01', title: '독자 검증까지 마친 최종 문서', description: '논리적 비약과 모호한 표현이 제거된 실무 기획서' },
    ],
    postRunChecklist: ['Reader Testing 단계에서 지적된 전제 조건 누락이 모두 보완되었는지 확인합니다.'],
    tips: ['초기 배경 자료(슬랙 대화, 회의록)를 한꺼번에 붙여넣으면 Stage 1이 훨씬 빨라집니다.'],
    cautions: 'AI가 임의로 채운 일정이나 KPI 수치는 실제 팀 합의치로 반드시 교체하세요.',
    faq: [
      { question: '영어로 된 스킬인데 한국어 문서도 잘 되나요?', answer: '워크플로 지침이 언어 중립적이어서 한국어로 요청하면 질문과 초안 모두 한국어로 진행됩니다.' },
    ],
    fileStructure: ['SKILL.md', 'LICENSE.txt'],
    skillMdPreview: `---
name: doc-coauthoring
description: Guide users through a structured workflow for co-authoring documentation (Context Gathering -> Refinement -> Reader Testing).
---
1. Stage 1: Context Gathering
2. Stage 2: Refinement & Structure (section by section)
3. Stage 3: Reader Testing`,
    webAlternative: {
      title: '설치 없이 Claude Projects 지침에 3단계 넣기',
      description: 'Claude Projects 또는 ChatGPT 맞춤 지침에 "한 번에 쓰지 말고 1) 질문으로 맥락 수집 → 2) 섹션별 초안 합의 → 3) 처음 읽는 독자 관점 검토 순으로 진행하라"고 적으면 똑같이 동작합니다.',
      recommendedTools: ['claude', 'chatgpt'],
      guideSlug: 'guide-prd-and-user-flow-design',
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['claude', 'chatgpt', 'notion-ai'],
  },
  {
    slug: 'skill-anthropic-skill-creator',
    title: 'Anthropic Skill Creator (나만의 에이전트 스킬 제작·벤치마크 스킬)',
    summary:
      '우리 팀의 반복 업무를 AI 에이전트 스킬(SKILL.md)로 새로 만들거나 기존 스킬의 트리거 정확도·품질을 평가(Eval)해 개선하는 Anthropic 공식 메타 스킬입니다.',
    sourceUrl: 'https://github.com/anthropics/skills',
    sourceName: 'Anthropic Official Skills',
    isFeatured: false,
    domains: ['planning-slides', 'docs-reports'],
    aiUses: ['automation-workflow'],
    tags: ['에이전트-스킬-mcp', 'skill-creator', '스킬제작', '평가자동화'],
    skillKind: SkillKind.SKILL,
    skillSlug: 'skill-creator',
    authorName: 'Anthropic',
    license: 'Source-Available (LICENSE.txt)',
    repositoryUrl: 'https://github.com/anthropics/skills',
    sourceFileUrl: 'https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md',
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.ADVANCED,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code', 'Claude.ai', 'Codex', 'Antigravity'],
    overview:
      '팀에서 매주 반복하는 보고서·코드 리뷰·QA 절차를 `SKILL.md`로 패키징하고 싶을 때, 감으로 프롬프트를 적는 대신 테스트 프롬프트로 결과를 비교·평가하며 스킬 설명(description)과 지침을 고도화해 줍니다.',
    useCases: [
      '사내 반복 업무 매뉴얼을 Claude Code·Codex용 팀 공용 스킬로 만들 때',
      '만들어 둔 스킬이 엉뚱한 상황에서 켜지거나 안 켜질 때 트리거 description을 최적화할 때',
    ],
    beforeAfter: {
      beforeItems: ['프롬프트 몇 줄 적어두고 실제 사례에서 잘 동작하는지 체계적으로 검증하지 못한다.'],
      afterItems: ['테스트 케이스(eval) 실행과 전후 비교 뷰어로 품질을 수치화해 개선한다.'],
    },
    workflowSteps: [
      { step: 1, title: '목적 및 트리거 범위 정의', description: '스킬이 해결할 작업과 호출 조건을 인터뷰로 정리합니다.' },
      { step: 2, title: 'SKILL.md 초안 작성', description: '지침, 예시, 참조 파일 구조를 생성합니다.' },
      { step: 3, title: '테스트 프롬프트 평가(Eval) 및 반복 개선', description: '정성·정량 지표로 결과를 검토하고 지침을 다듬습니다.' },
    ],
    prerequisites: [
      { name: '스킬 지원 에이전트', required: true, description: 'Claude Code 또는 스킬 폴더 편집이 가능한 에이전트가 필요합니다.' },
    ],
    installPrompt:
      'https://github.com/anthropics/skills 저장소의 skills/skill-creator 스킬을 현재 에이전트 스킬 폴더에 설치해줘.',
    installGuides: [
      {
        environment: 'claude-code',
        label: 'Claude Code',
        steps: ['~/.claude/skills/skill-creator/에 배치하고 만들고 싶은 업무 자동화 주제를 설명합니다.'],
        invokeExample: '/skill-creator 우리 팀 주간 CS 리포트 양식에 맞는 새 스킬을 만들어줘.',
      },
    ],
    examplePrompts: [
      { label: '신규 스킬 설계', prompt: '회의 녹취록에서 결정사항과 지라 티켓 초안을 뽑는 팀 전용 SKILL.md를 설계해줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '완성된 SKILL.md 및 테스트 시나리오', description: '바로 팀에 배포 가능한 스킬 패키지' },
    ],
    postRunChecklist: ['다른 유사 작업과 트리거가 겹치지 않도록 description의 포함/제외 조건을 확인합니다.'],
    tips: ['초안은 간결하게 유지하고, 긴 참고 규칙은 references/ 하위 파일로 분리하세요.'],
    cautions: '사내 보안 규칙이나 API 키 예시가 스킬 공개 저장소에 포함되지 않도록 주의하세요.',
    faq: [
      { question: '비개발자도 나만의 스킬을 만들 수 있나요?', answer: 'Claude.ai의 Projects나 ChatGPT Custom GPTs 지침서를 만들 때도 동일한 구조화 질문을 그대로 활용할 수 있습니다.' },
    ],
    fileStructure: ['SKILL.md', 'eval-viewer/generate_review.py'],
    skillMdPreview: `---
name: skill-creator
description: Create new skills, modify and improve existing skills, and measure skill performance with evals.
---
- Decide what the skill should do
- Write draft SKILL.md
- Run test prompts & evaluate qualitatively/quantitatively
- Iterate based on feedback`,
    webAlternative: {
      title: '설치 없이 Claude Projects / Custom GPTs 지침서 생성기로 쓰기',
      description: 'Claude 웹에서 "반복 업무 지침서(Custom Instructions)를 역할·입력·절차·금지사항 4파트로 설계해줘"라고 요청하면 설치 없이 동일한 효과를 얻습니다.',
      recommendedTools: ['claude', 'chatgpt'],
      guideSlug: 'guide-claude-skills-vs-web-alternatives',
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['claude', 'chatgpt'],
  },

  // 2. Korean Specialized Skills (5)
  {
    slug: 'skill-korean-style-guide',
    title: 'Korean Style Guide (한국어 문서 스타일 일관성 검사 스킬)',
    summary:
      '맞춤법이 아니라 문서 전체의 어조(경어체/반말), 용어 통일(사용자 vs 유저), 숫자·날짜·목록·따옴표 표기 일관성을 검사해 통일해 주는 한국어 스킬입니다.',
    sourceUrl: 'https://github.com/DaleSeo/korean-skills',
    sourceName: 'DaleSeo/korean-skills',
    isFeatured: true,
    domains: ['docs-reports', 'content-design'],
    aiUses: ['writing-summary'],
    tags: ['에이전트-스킬-mcp', '스타일가이드', '용어통일', '문서검수'],
    skillKind: SkillKind.SKILL,
    skillSlug: 'style-guide',
    authorName: 'DaleSeo',
    license: 'MIT',
    repositoryUrl: 'https://github.com/DaleSeo/korean-skills',
    sourceFileUrl: 'https://github.com/DaleSeo/korean-skills/blob/main/skills/style-guide/SKILL.md',
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.BEGINNER,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code', 'Codex', 'Cursor', 'Antigravity', 'Claude.ai'],
    overview:
      '여러 팀원이 함께 작성한 매뉴얼이나 제품 가이드를 보면 한 문서 안에서 "사용자"와 "유저", "~합니다"와 "~함", "1,000원"과 "1000원"이 뒤섞여 있습니다. 이 스킬은 맞춤법이 아닌 **작성 스타일의 일관성**만 전문으로 진단하고 단일 기준으로 통일해 줍니다.',
    useCases: [
      '여러 담당자가 나눠 쓴 사내 위키, 제품 도움말, 제안서의 어조와 용어를 한 사람 글처럼 맞출 때',
      '브랜드 톤앤매너와 숫자·날짜·따옴표 표기 규칙을 문서 전체에 일괄 적용할 때',
    ],
    beforeAfter: {
      beforeItems: ['한 문서 안에서 "로그인하세요"와 "로그인한다", "사용자"와 "고객"이 뒤섞여 산만하다.'],
      afterItems: ['문서 내 불일치 항목을 6가지 축으로 찾아내어 단일 표준안으로 통일한다.'],
    },
    workflowSteps: [
      { step: 1, title: '문서 스타일 프로파일 파악', description: '어조, 주요 용어, 숫자·목록 형식을 스캔합니다.' },
      { step: 2, title: '불일치 지점 탐지', description: '혼용된 표현과 위치(줄/문단)를 목록화합니다.' },
      { step: 3, title: '단일 기준 통일안 적용', description: '선택된 표준 스타일에 맞춰 일관되게 교정합니다.' },
    ],
    prerequisites: [
      { name: '스킬 지원 에이전트', required: true, description: 'Claude Code, Codex, Cursor, Claude.ai 등에서 바로 사용할 수 있습니다.' },
    ],
    installPrompt:
      'https://github.com/DaleSeo/korean-skills 저장소의 skills/style-guide 스킬을 현재 에이전트 스킬 폴더에 설치해줘.',
    installGuides: [
      {
        environment: 'claude-code',
        label: 'Claude Code / Cursor',
        steps: ['~/.claude/skills/style-guide/에 설치한 뒤 검수할 문서나 docs 폴더를 지정합니다.'],
        invokeExample: '/style-guide docs/ 폴더의 모든 마크다운 문서에서 용어(사용자/유저)와 어조 일관성을 점검해줘.',
      },
    ],
    examplePrompts: [
      { label: '용어·어조 통일', prompt: '이 문서에서 혼용된 어조와 용어, 숫자/날짜 표기 불일치를 표로 뽑고 한 가지 기준으로 통일해줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '스타일 불일치 진단표 및 통일본', description: '어조·용어·기호별 불일치 목록과 수정안' },
    ],
    postRunChecklist: ['사내 공식 용어집(Glossary)과 다른 방향으로 통일되지 않았는지 확인합니다.'],
    tips: ['원하는 기준(예: "합쇼체 고정, 사용자 사용")을 먼저 주면 수정 왕복이 줄어듭니다.'],
    cautions: '문맥상 의도적으로 다르게 쓴 인용문까지 일괄 치환되지 않도록 검토하세요.',
    faq: [
      { question: 'DaleSeo/korean-skills의 다른 스킬과 같이 쓰면 좋나요?', answer: '네, grammar-checker(맞춤법) → style-guide(일관성) → humanizer(자연스러움) 순으로 연계하면 문서 품질이 크게 올라갑니다.' },
    ],
    fileStructure: ['skills/style-guide/SKILL.md', 'LICENSE'],
    skillMdPreview: `---
name: style-guide
description: 문서 내부 또는 프로젝트 전체에서 일관된 작성 스타일을 유지하도록 돕는 검사기.
license: MIT
---
# style-guide: 한국어 문서 스타일 일관성 검사기
- 어조(경어체/반말), 용어(사용자/유저), 숫자 형식, 목록 스타일, 따옴표, 날짜/시간 형식 일관성 점검`,
    webAlternative: {
      title: '설치 없이 Claude / ChatGPT에 6축 체크리스트 복붙하기',
      description: '웹 AI에 "맞춤법 말고 1)어조 2)용어 3)숫자 4)목록 5)따옴표 6)날짜 형식의 불일치만 찾아 표로 정리해"라고 지시하면 바로 쓸 수 있습니다.',
      recommendedTools: ['claude', 'chatgpt'],
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['claude', 'chatgpt', 'cursor'],
  },
  {
    slug: 'skill-k-dart',
    title: 'K-DART (금융감독원 전자공시·재무제표 조회 스킬)',
    summary:
      '금융감독원 전자공시시스템(DART) OpenAPI를 통해 국내 상장·비상장 기업의 공시 목록, 기업개황, 재무제표, 주요사항보고서를 에이전트가 직접 조회하는 한국 특화 스킬입니다.',
    sourceUrl: 'https://github.com/NomaDamas/k-skill',
    sourceName: 'NomaDamas/k-skill',
    isFeatured: true,
    domains: ['research', 'data-sheets'],
    aiUses: ['search-analysis'],
    tags: ['에이전트-스킬-mcp', 'k-skill', 'dart', '기업분석', '재무제표'],
    skillKind: SkillKind.SKILL,
    skillSlug: 'k-dart',
    authorName: 'NomaDamas / K-Skill',
    license: 'MIT',
    repositoryUrl: 'https://github.com/NomaDamas/k-skill',
    sourceFileUrl: 'https://github.com/NomaDamas/k-skill/blob/main/k-dart/SKILL.md',
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.PRACTICAL,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code', 'Codex', 'Antigravity', 'Cursor'],
    overview:
      '경쟁사나 고객사 재무 현황을 조사할 때 DART 웹사이트에서 매번 사업보고서를 내려받아 숫자를 찾을 필요 없이, DART 공식 OpenAPI로 최신 공시와 매출·영업이익·주요사항보고서를 바로 조회해 요약합니다.',
    useCases: [
      'B2B 영업·제휴 미팅 전 상대 기업의 최근 3년 매출·영업이익·부채비율을 빠르게 확인할 때',
      '경쟁사나 관심 상장사의 신규 유상증자·합병·계약 체결 공시 내역을 추적할 때',
    ],
    beforeAfter: {
      beforeItems: ['DART 사이트에 접속해 회사 검색 → 보고서 열기 → 재무제표 탭을 일일이 찾아본다.'],
      afterItems: ['에이전트에게 회사명과 연도를 말하면 공식 DART API 수치로 바로 비교표를 만든다.'],
    },
    workflowSteps: [
      { step: 1, title: '기업 고유번호 및 개황 조회', description: '회사명으로 DART 고유번호와 상장 구분·대표자 정보를 찾습니다.' },
      { step: 2, title: '공시·재무제표 OpenAPI 호출', description: '연결/별도 재무제표 및 주요사항보고서를 조회합니다.' },
      { step: 3, title: '핵심 지표 요약', description: '매출·영업이익·당기순이익 추이와 특이 공시를 정리합니다.' },
    ],
    prerequisites: [
      { name: 'DART OpenAPI 인증키 (API_K_DART)', required: true, description: '금융감독원 전자공시 오픈API(opendart.fss.or.kr)에서 무료 발급한 키를 환경변수로 설정해야 합니다.' },
    ],
    installPrompt:
      'https://github.com/NomaDamas/k-skill 저장소의 k-dart 스킬을 설치하고 API_K_DART 환경변수 설정 방법을 안내해줘.',
    installGuides: [
      {
        environment: 'claude-code',
        label: 'Claude Code / Antigravity',
        steps: [
          'NomaDamas/k-skill에서 k-dart 스킬을 설치합니다.',
          'opendart.fss.or.kr에서 무료 API 키를 발급받아 API_K_DART 환경변수에 등록합니다.',
        ],
        invokeExample: '/k-dart 삼성전자와 SK하이닉스의 최근 2개년 연결 매출과 영업이익을 비교해줘.',
      },
    ],
    examplePrompts: [
      { label: '재무 요약', prompt: '카카오 최근 사업보고서 기준 매출, 영업이익, 주요 종속회사 현황을 요약해줘.' },
      { label: '공시 검색', prompt: '최근 3개월 내 네이버의 주요사항보고서 공시 목록을 날짜순으로 정리해줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '공식 DART 기반 기업·재무 요약표', description: '단위(원/억원)와 기준 연도가 명시된 공식 수치 요약' },
    ],
    postRunChecklist: ['연결재무제표 기준인지 별도재무제표 기준인지와 금액 단위(백만원/억원)를 확인합니다.'],
    tips: ['경쟁사 2~3곳을 한 번에 비교 요청하면 시장 조사 보고서 초안이 바로 완성됩니다.'],
    cautions: '발급받은 개인 DART API 키를 공개 GitHub 저장소나 공유 문서에 커밋하지 마세요.',
    faq: [
      { question: 'API 키 발급은 유료인가요?', answer: '아니요, opendart.fss.or.kr에서 개인·기업 누구나 무료로 발급받을 수 있습니다.' },
    ],
    fileStructure: ['k-dart/SKILL.md'],
    skillMdPreview: `---
name: k-dart
description: 금융감독원 전자공시시스템(DART) OpenAPI로 공시검색, 기업개황, 재무제표, 주요사항보고서를 조회한다. 사용자의 API_K_DART 환경변수를 직접 사용한다.
license: MIT
---
# k-dart`,
    webAlternative: {
      title: '설치 없이 DART PDF + NotebookLM / Perplexity 활용하기',
      description: 'API 설정이 어렵다면 DART에서 사업보고서 PDF를 내려받아 NotebookLM에 올리거나 Perplexity로 공시 요약을 검색하는 방식으로 대체할 수 있습니다.',
      recommendedTools: ['notebooklm', 'perplexity'],
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['claude', 'notebooklm', 'perplexity'],
  },
  {
    slug: 'skill-korean-law-search',
    title: 'Korean Law Search (한국 법령·조문·판례·신구조문대비표 스킬)',
    summary:
      '국가법령정보 기반 한국 법령, 조문, 판례, 법령해석, 자치법규를 조회하고 개정 전후 신·구조문대비표 초안까지 작성하는 한국 특화 스킬입니다.',
    sourceUrl: 'https://github.com/NomaDamas/k-skill',
    sourceName: 'NomaDamas/k-skill',
    isFeatured: false,
    domains: ['docs-reports', 'research'],
    aiUses: ['search-analysis', 'writing-summary'],
    tags: ['에이전트-스킬-mcp', 'k-skill', '법령검색', '판례'],
    skillKind: SkillKind.SKILL,
    skillSlug: 'korean-law-search',
    authorName: 'NomaDamas / K-Skill',
    license: 'MIT',
    repositoryUrl: 'https://github.com/NomaDamas/k-skill',
    sourceFileUrl: 'https://github.com/NomaDamas/k-skill/blob/main/korean-law-search/SKILL.md',
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.BEGINNER,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code', 'Codex', 'Antigravity', 'Cursor'],
    overview:
      '일반 AI에게 한국 법률 조문을 물으면 폐지된 옛날 조항이나 없는 조문 번호를 지어내는 경우가 많습니다. 이 스킬은 k-skill-proxy를 통해 실제 현행 법령·조문·판례 원문을 조회해 정확한 근거를 바탕으로 답변합니다.',
    useCases: [
      '근로기준법, 개인정보보호법, 전자상거래법 등 실무 관련 현행 조문 원문을 빠르게 확인할 때',
      '사내 규정이나 약관 개정 시 법령 개정 전후 신·구조문대비표 초안이 필요할 때',
    ],
    beforeAfter: {
      beforeItems: ['AI가 기억에 의존해 오래된 법령이나 틀린 조항 번호를 인용한다.'],
      afterItems: ['실제 법령 원문과 시행일자를 조회한 뒤 조문 번호와 함께 인용한다.'],
    },
    workflowSteps: [
      { step: 1, title: '법령명·키워드 검색', description: '법령, 판례, 해석례 중 대상 범위를 지정해 조회합니다.' },
      { step: 2, title: '조문 원문 확인', description: '현행 시행 중인 정확한 조·항·호 텍스트를 가져옵니다.' },
      { step: 3, title: '실무 요약 또는 대비표 생성', description: '핵심 의무사항 요약 또는 신·구조문대비표를 작성합니다.' },
    ],
    prerequisites: [
      { name: '스킬 지원 에이전트 & k-skill 환경', required: true, description: 'NomaDamas/k-skill 패키지가 설치된 에이전트에서 동작합니다.' },
    ],
    installPrompt:
      'https://github.com/NomaDamas/k-skill 저장소의 korean-law-search 스킬을 설치해줘.',
    installGuides: [
      {
        environment: 'claude-code',
        label: 'Claude Code / Codex',
        steps: ['k-skill 셋업 후 관련 법령명이나 조문 키워드로 질문합니다.'],
        invokeExample: '/korean-law-search 개인정보 보호법 제29조(안전조치의무) 현행 조문을 조회해줘.',
      },
    ],
    examplePrompts: [
      { label: '조문 조회', prompt: '근로기준법상 연차유급휴가 관련 현행 조문과 핵심 기준을 조회해서 요약해줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '현행 법령 조문 및 출처 링크', description: '조항 원문과 시행일자가 명시된 요약' },
    ],
    postRunChecklist: ['조회된 법령의 시행일자와 최신 개정 여부를 국가법령정보센터(law.go.kr)에서 최종 확인합니다.'],
    tips: ['법령명과 함께 찾고 싶은 핵심 단어(예: "위약금", "청약철회")를 같이 적어주세요.'],
    cautions: '본 스킬의 조회 결과는 법률 자문이 아니며, 분쟁·계약 판단은 반드시 변호사·노무사 등 전문가 검토를 받으세요.',
    faq: [
      { question: '별도 API 키 발급이 필요한가요?', answer: 'k-skill-proxy 경유 경로를 사용하므로 사용자가 별도로 공공데이터 키를 발급받지 않아도 조회할 수 있습니다.' },
    ],
    fileStructure: ['korean-law-search/SKILL.md'],
    skillMdPreview: `---
name: korean-law-search
description: Search Korean statutes, articles, precedents, interpretations, and local ordinances via k-skill-proxy, and draft 신･구조문대비표.
license: MIT
---
# korean-law-search`,
    webAlternative: {
      title: '설치 없이 국가법령정보센터 + Perplexity 활용하기',
      description: 'law.go.kr에서 해당 법령 조문을 복사해 Claude에 붙여넣고 해석을 요청하거나 Perplexity에서 site:law.go.kr로 검색하면 설치 없이도 정확히 확인할 수 있습니다.',
      recommendedTools: ['perplexity', 'claude'],
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['perplexity', 'claude'],
  },
  {
    slug: 'skill-real-estate-search',
    title: 'Real Estate Search (국토부 아파트·오피스텔·빌라 실거래가 조회 스킬)',
    summary:
      '국토교통부 실거래가 공공데이터를 바탕으로 지역·단지·기간별 아파트, 오피스텔, 연립다세대, 단독주택 매매 및 전월세 실거래 내역을 조회하는 스킬입니다.',
    sourceUrl: 'https://github.com/NomaDamas/k-skill',
    sourceName: 'NomaDamas/k-skill',
    isFeatured: false,
    domains: ['research', 'data-sheets'],
    aiUses: ['search-analysis'],
    tags: ['에이전트-스킬-mcp', 'k-skill', '부동산실거래가', '공공데이터'],
    skillKind: SkillKind.SKILL,
    skillSlug: 'real-estate-search',
    authorName: 'NomaDamas / K-Skill',
    license: 'MIT',
    repositoryUrl: 'https://github.com/NomaDamas/k-skill',
    sourceFileUrl: 'https://github.com/NomaDamas/k-skill/blob/main/real-estate-search/SKILL.md',
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.BEGINNER,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code', 'Codex', 'Antigravity', 'Cursor'],
    overview:
      '부동산 앱에서 일일이 필터를 눌러 시세를 확인하는 대신, 지역명과 월(YYYYMM)을 말하면 국토부 실거래가 데이터를 불러와 평형별 거래가·전세가율·거래 추이를 표로 정리해 줍니다.',
    useCases: [
      '이사·임차·매수 검토 지역 아파트의 최근 3개월 실거래가 추이를 표로 비교할 때',
      '오피스텔·빌라의 매매가 대비 전세 보증금 시세를 빠르게 점검할 때',
    ],
    beforeAfter: {
      beforeItems: ['여러 단지의 실거래가를 일일이 검색해 엑셀에 옮겨 적어야 한다.'],
      afterItems: ['자치구·기간 조건으로 공식 실거래 목록을 불러와 바로 비교표를 만든다.'],
    },
    workflowSteps: [
      { step: 1, title: '법정동 코드 및 대상 유형 확인', description: '시군구명과 아파트/오피스텔/빌라 유형을 매핑합니다.' },
      { step: 2, title: '실거래 API 조회', description: '지정된 월 단위의 매매 및 전월세 거래 건을 가져옵니다.' },
      { step: 3, title: '면적별 시세 비교표 생성', description: '전용면적·층·거래일·금액을 보기 쉽게 정리합니다.' },
    ],
    prerequisites: [
      { name: '스킬 지원 에이전트 & k-skill 환경', required: true, description: 'NomaDamas/k-skill 패키지가 필요합니다.' },
    ],
    installPrompt:
      'https://github.com/NomaDamas/k-skill 저장소의 real-estate-search 스킬을 설치해줘.',
    installGuides: [
      {
        environment: 'claude-code',
        label: 'Claude Code / Antigravity',
        steps: ['k-skill 설치 후 시군구명, 주택 유형, 조회 연월을 지정해 요청합니다.'],
        invokeExample: '/real-estate-search 서울 마포구 아파트 2026년 10월 매매 실거래가 상위 10건을 정리해줘.',
      },
    ],
    examplePrompts: [
      { label: '전월세 시세 비교', prompt: '성남시 분당구 전용 84㎡ 아파트 최근 전세 실거래가 분포를 정리해줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '단지·면적별 실거래 요약표', description: '거래일자, 층수, 전용면적, 거래금액 목록' },
    ],
    postRunChecklist: ['직거래 여부나 해제(취소) 거래가 포함되지 않았는지 비고란을 확인합니다.'],
    tips: ['특정 단지명이 있다면 자치구와 함께 적어 정확도를 높이세요.'],
    cautions: '계약 체결 전에는 반드시 등기부등본과 국토부 실거래가 공개시스템 원문을 직접 확인하세요.',
    faq: [
      { question: '상가나 토지 실거래가도 조회되나요?', answer: '주로 아파트·오피스텔·연립다세대·단독다가구 주거용 실거래 조회에 맞춰져 있습니다.' },
    ],
    fileStructure: ['real-estate-search/SKILL.md'],
    skillMdPreview: `---
name: real-estate-search
description: Korean apartment/officetel/villa/single-house real transaction price and rent lookups via k-skill-proxy.
license: MIT
---
# real-estate-search`,
    webAlternative: {
      title: '웹에서 국토부 실거래가 CSV 받아 ChatGPT로 분석하기',
      description: 'rt.molit.go.kr에서 관심 지역의 실거래 CSV를 내려받아 ChatGPT나 Claude에 올리면 설치 없이도 동일한 비교표와 차트를 만들 수 있습니다.',
      recommendedTools: ['chatgpt', 'claude'],
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['chatgpt', 'claude'],
  },
  {
    slug: 'skill-naver-news-search',
    title: 'Naver News Search (네이버 뉴스 키워드 수집·요약 스킬)',
    summary:
      '네이버 검색 Open API(news.json)를 k-skill-proxy 경유로 호출해 별도 API 키 발급 없이 최신 국내 뉴스 제목·발행시각·링크·요약을 정리하는 한국 특화 스킬입니다.',
    sourceUrl: 'https://github.com/NomaDamas/k-skill',
    sourceName: 'NomaDamas/k-skill',
    isFeatured: false,
    domains: ['research', 'meetings-comms'],
    aiUses: ['search-analysis', 'writing-summary'],
    tags: ['에이전트-스킬-mcp', 'k-skill', '네이버뉴스', '뉴스클리핑'],
    skillKind: SkillKind.SKILL,
    skillSlug: 'naver-news-search',
    authorName: 'NomaDamas / K-Skill',
    license: 'MIT',
    repositoryUrl: 'https://github.com/NomaDamas/k-skill',
    sourceFileUrl: 'https://github.com/NomaDamas/k-skill/blob/main/naver-news-search/SKILL.md',
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.BEGINNER,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code', 'Codex', 'Antigravity', 'Cursor'],
    overview:
      '아침마다 자사·경쟁사·업계 키워드 뉴스를 스크랩해 보고하는 데 시간을 쓰는 대신, 네이버 뉴스 검색 결과를 발행시각과 원문 링크와 함께 깔끔한 데일리 브리핑 표로 정리해 줍니다.',
    useCases: [
      '매일 아침 자사 브랜드, 경쟁사, 규제 이슈 관련 최신 국내 기사 클리핑 초안을 만들 때',
      '특정 산업 키워드에 대한 최근 언론 보도 흐름을 링크와 함께 빠르게 파악할 때',
    ],
    beforeAfter: {
      beforeItems: ['네이버 뉴스 탭을 여러 개 열어 기사 제목과 링크를 수동 복사한다.'],
      afterItems: ['키워드별 최신 기사를 발행시각·링크·핵심 요약으로 1분 만에 정리한다.'],
    },
    workflowSteps: [
      { step: 1, title: '검색 키워드 및 정렬 지정', description: '최신순(date) 또는 관련도순(sim)으로 기사를 조회합니다.' },
      { step: 2, title: '중복 기사 제거 및 필터링', description: '동일 보도자료 중복을 줄이고 핵심 매체 기사를 추립니다.' },
      { step: 3, title: '브리핑 리스트 출력', description: '제목, 발행시각, 원문 링크, 한 줄 요약을 정리합니다.' },
    ],
    prerequisites: [
      { name: '스킬 지원 에이전트 & k-skill 환경', required: true, description: 'NomaDamas/k-skill 패키지가 필요합니다.' },
    ],
    installPrompt:
      'https://github.com/NomaDamas/k-skill 저장소의 naver-news-search 스킬을 설치해줘.',
    installGuides: [
      {
        environment: 'claude-code',
        label: 'Claude Code / Antigravity',
        steps: ['k-skill 설치 후 검색할 키워드와 기간/건수를 요청합니다.'],
        invokeExample: '/naver-news-search "생성형 AI 규제" 키워드 최신 뉴스 10건을 요약해줘.',
      },
    ],
    examplePrompts: [
      { label: '모닝 뉴스 클리핑', prompt: '오늘자 "AI 에이전트" 관련 네이버 최신 뉴스를 매체명, 시각, 원문 링크와 함께 5건만 정리해줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '뉴스 클리핑 브리핑', description: '제목·발행시각·원문 URL·핵심 요약 목록' },
    ],
    postRunChecklist: ['사내 공유 전 링크가 정상 열리는지, 광고성/단순 배포 기사는 제외되었는지 확인합니다.'],
    tips: ['복수 키워드를 묶어 "A사, B사 뉴스 각각 3건씩"처럼 요청하면 경쟁사 모니터링에 좋습니다.'],
    cautions: '뉴스 요약문만 보고 판단하지 말고 중요한 수치는 반드시 원문 기사 링크를 열어 확인하세요.',
    faq: [
      { question: '네이버 개발자 센터 API 키가 필요한가요?', answer: 'k-skill-proxy를 경유하므로 별도 키 발급 없이 바로 조회할 수 있습니다.' },
    ],
    fileStructure: ['naver-news-search/SKILL.md'],
    skillMdPreview: `---
name: naver-news-search
description: 네이버 검색 Open API 뉴스 검색(news.json)을 k-skill-proxy 경유로 조회해 최신 뉴스 기사 제목·발행시각·링크·요약을 보수적으로 정리한다.
license: MIT
---
# naver-news-search`,
    webAlternative: {
      title: '설치 없이 Perplexity / Gemini 실시간 뉴스 검색 쓰기',
      description: 'Perplexity나 Gemini 웹에서 "최근 24시간 한국 뉴스 기준 [키워드] 요약과 기사 링크 5개"를 요청하면 설치 없이 비슷하게 활용할 수 있습니다.',
      recommendedTools: ['perplexity', 'gemini'],
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['perplexity', 'gemini', 'claude'],
  },

  // 3. Engineering & Design Skills (4)
  {
    slug: 'skill-vercel-react-best-practices',
    title: 'Vercel React Best Practices (React·Next.js 성능 최적화 스킬)',
    summary:
      '워터폴 제거, 번들 크기 축소, 서버 컴포넌트 캐싱, 리렌더링 방지 등 Vercel 엔지니어링 팀의 React/Next.js 실전 성능 규칙 40+가지를 적용하는 공식 스킬입니다.',
    sourceUrl: 'https://github.com/vercel-labs/agent-skills',
    sourceName: 'Vercel Labs',
    isFeatured: true,
    domains: ['content-design', 'research'],
    aiUses: ['automation-workflow'],
    tags: ['에이전트-스킬-mcp', 'react', 'nextjs', '성능최적화'],
    skillKind: SkillKind.SKILL,
    skillSlug: 'react-best-practices',
    authorName: 'Vercel Labs',
    license: 'Vercel Agent Skills',
    repositoryUrl: 'https://github.com/vercel-labs/agent-skills',
    sourceFileUrl: 'https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/SKILL.md',
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.ADVANCED,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code', 'Cursor', 'Codex', 'Antigravity'],
    overview:
      'Next.js App Router나 React 앱을 개발할 때 흔히 발생하는 직렬 데이터 패칭(Waterfall), 불필요한 클라이언트 번들 비대화, 과도한 리렌더링을 영향도 순위(CRITICAL -> LOW)에 따라 체계적으로 진단·수정합니다.',
    useCases: [
      'Next.js 페이지 로딩이 느릴 때 async 워터폴과 dynamic import 누락을 점검할 때',
      '신규 React 컴포넌트 작성이나 PR 리뷰 시 Vercel 표준 성능 가이드를 자동 적용할 때',
    ],
    beforeAfter: {
      beforeItems: ['useEffect 연쇄 호출과 무거운 라이브러리 전체 import로 초기 로딩이 느리다.'],
      afterItems: ['Promise.all 병렬화, RSC 경계 분리, 번들 최적화를 우선순위별로 적용한다.'],
    },
    workflowSteps: [
      { step: 1, title: '코드베이스 영향도 스캔', description: 'Waterfall(최우선) → Bundle Size → Server/Client 성능을 점검합니다.' },
      { step: 2, title: '규칙 기반 리팩토링', description: 'Promise.all, React.cache, barrel import 제거 등을 적용합니다.' },
      { step: 3, title: '타입체크·빌드·회귀 검증', description: '최적화 후 기존 테스트와 프로덕션 빌드를 확인합니다.' },
    ],
    prerequisites: [
      { name: '코딩 AI 에이전트 & React/Next.js 프로젝트', required: true, description: 'Claude Code, Cursor, Codex 등에서 프로젝트 파일을 읽고 수정할 수 있어야 합니다.' },
    ],
    installPrompt:
      'npx skills add vercel-labs/agent-skills --skill react-best-practices 또는 저장소에서 skills/react-best-practices를 설치해줘.',
    installGuides: [
      {
        environment: 'claude-code',
        label: 'skills CLI / Claude Code',
        steps: ['npx skills add vercel-labs/agent-skills 명령으로 설치하거나 .claude/skills/에 복사합니다.'],
        command: 'npx skills add vercel-labs/agent-skills --skill react-best-practices',
        invokeExample: '/react-best-practices src/views/ 경로에서 데이터 패칭 워터폴과 번들 최적화 포인트를 점검해줘.',
      },
    ],
    examplePrompts: [
      { label: '성능 감사', prompt: '이 Next.js 페이지의 직렬 await 워터폴과 불필요한 "use client" 경계를 찾아 개선해줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '우선순위별 성능 개선 패치', description: 'CRITICAL/HIGH 항목 중심의 리팩토링 내역' },
    ],
    postRunChecklist: ['최적화 후 pnpm typecheck 및 pnpm build가 정상 통과하는지 확인합니다.'],
    tips: ['작성 단계보다 PR 전 코드 리뷰 단계에서 한 번씩 돌리면 효과가 큽니다.'],
    cautions: '과도한 메모이제이션(useMemo/useCallback 남발)은 오히려 가독성을 해칠 수 있으니 측정 후 적용하세요.',
    faq: [
      { question: 'Pages Router 프로젝트에도 도움이 되나요?', answer: '네, 번들 최적화와 클라이언트 리렌더링 규칙은 Pages Router에도 그대로 적용됩니다.' },
    ],
    fileStructure: ['skills/react-best-practices/SKILL.md', 'skills/react-best-practices/rules/'],
    skillMdPreview: `---
name: react-best-practices
description: React and Next.js performance optimization guidelines from Vercel Engineering.
---
1. Eliminating Waterfalls (CRITICAL)
2. Bundle Size Optimization (CRITICAL)
3. Server-Side Performance (HIGH)
4. Re-render Optimization (MEDIUM)`,
    webAlternative: {
      title: '설치 없이 웹 Claude/ChatGPT에 컴포넌트 코드 붙여넣고 점검받기',
      description: '단일 페이지 파일만 빠르게 점검받고 싶다면 코드를 복사해 "Promise.all 병렬화, 클라이언트 번들 크기, 불필요한 리렌더링 관점에서 리뷰해줘"라고 요청하세요.',
      recommendedTools: ['claude', 'chatgpt', 'cursor'],
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['cursor', 'claude', 'chatgpt'],
  },
  {
    slug: 'skill-anthropic-frontend-design',
    title: 'Anthropic Frontend Design (고품질 웹 UI 디자인·구현 스킬)',
    summary:
      '뻔한 "AI 느낌(보라색 그라데이션, 획일적 카드)"을 피하고 대담한 타이포그래피, 명확한 미적 방향, 세련된 모션과 레이아웃을 갖춘 프로덕션 UI를 설계하는 Anthropic 공식 스킬입니다.',
    sourceUrl: 'https://github.com/anthropics/skills',
    sourceName: 'Anthropic Official Skills',
    isFeatured: true,
    domains: ['content-design', 'planning-slides'],
    aiUses: ['image-video', 'automation-workflow'],
    tags: ['에이전트-스킬-mcp', '프론트엔드', 'ui디자인', 'claude-skills'],
    skillKind: SkillKind.SKILL,
    skillSlug: 'frontend-design',
    authorName: 'Anthropic',
    license: 'Source-Available (LICENSE.txt)',
    repositoryUrl: 'https://github.com/anthropics/skills',
    sourceFileUrl: 'https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md',
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.PRACTICAL,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code', 'Claude.ai', 'Cursor', 'Antigravity'],
    overview:
      'AI에게 랜딩 페이지나 대시보드를 시키면 매번 똑같은 제네릭 템플릿을 만들어 냅니다. 이 스킬은 프로젝트의 목적·사용자에 맞는 고유한 미적 컨셉(에디토리얼, 브루탈리스트, 미니멀 등)을 먼저 확정한 뒤 타이포·여백·색상 위계를 정교하게 구현합니다.',
    useCases: [
      '제품 소개 랜딩 페이지, 인터랙티브 대시보드, 포트폴리오 웹 UI를 처음부터 설계할 때',
      '기존 화면의 밋밋한 AI 템플릿 느낌을 걷어내고 개성 있는 브랜드 톤을 입힐 때',
    ],
    beforeAfter: {
      beforeItems: ['모든 웹페이지가 똑같은 중앙 정렬 히어로 + 3열 카드 + 보라색 그라데이션으로 나온다.'],
      afterItems: ['도메인 성격에 맞는 명확한 레이아웃 위계, 대비, 타이포그래피로 차별화된다.'],
    },
    workflowSteps: [
      { step: 1, title: '미적 방향(Aesthetic Direction) 확정', description: '목적·타깃·톤에 맞는 시각적 컨셉과 차별화 포인트를 정합니다.' },
      { step: 2, title: '타이포·색상·공간 설계', description: '과감한 폰트 대비, CSS 변수 기반 팔레트, 비대칭/그리드 배치를 구성합니다.' },
      { step: 3, title: '프로덕션 코드 구현', description: '반응형·접근성·마이크로 인터랙션까지 동작하는 코드로 완성합니다.' },
    ],
    prerequisites: [
      { name: '스킬 지원 에이전트', required: true, description: 'Claude.ai Artifacts, Claude Code, Cursor 등에서 사용할 수 있습니다.' },
    ],
    installPrompt:
      'https://github.com/anthropics/skills 저장소의 skills/frontend-design 스킬을 현재 에이전트 스킬 폴더에 설치해줘.',
    installGuides: [
      {
        environment: 'claude-code',
        label: 'Claude Code / Cursor',
        steps: ['~/.claude/skills/frontend-design/에 배치하고 구현할 페이지의 목적과 타깃을 설명합니다.'],
        invokeExample: '/frontend-design B2B AI 분석 대시보드의 첫 화면을 에디토리얼 톤으로 설계·구현해줘.',
      },
    ],
    examplePrompts: [
      { label: '랜딩 페이지 디자인', prompt: '뻔한 AI 그라데이션 없이, 신뢰감 있는 에디토리얼 매거진 톤으로 제품 소개 페이지를 만들어줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '완성도 높은 반응형 UI 코드', description: '모바일·데스크톱 모두 대응하는 HTML/React 컴포넌트' },
    ],
    postRunChecklist: ['모바일(390px) 가로 스크롤이 없는지, 텍스트 명도 대비가 충분한지 확인합니다.'],
    tips: ['기존 프로젝트의 DESIGN.md나 CSS 토큰이 있다면 함께 언급해 기존 시스템과 충돌을 막으세요.'],
    cautions: '디자인 시스템이 엄격한 기존 서비스에 적용할 때는 신규 색상 추가 대신 기존 토큰을 우선 사용하도록 지시하세요.',
    faq: [
      { question: 'Claude.ai 웹에서도 바로 쓸 수 있나요?', answer: '네, Claude.ai에서 프론트엔드 디자인 스킬을 켜면 Artifacts로 바로 시각적 결과를 미리 볼 수 있습니다.' },
    ],
    fileStructure: ['SKILL.md', 'LICENSE.txt'],
    skillMdPreview: `---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality.
---
- Define bold aesthetic direction (avoid generic AI slop)
- Intentional typography, color variables, spatial composition, and motion`,
    webAlternative: {
      title: '설치 없이 Claude Artifacts에서 미적 방향 지정하기',
      description: 'Claude.ai 대화에서 "일반적인 AI 보라색 그라데이션과 3열 뻔한 카드를 금지하고, 에디토리얼 톤과 명확한 타이포 위계로 Artifact를 만들어줘"라고 요청하세요.',
      recommendedTools: ['claude', 'figma-ai'],
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['claude', 'figma-ai', 'cursor'],
  },
  {
    slug: 'skill-superpowers-tdd',
    title: 'Superpowers TDD (테스트 주도 개발 규율 스킬)',
    summary:
      '구현 코드를 쓰기 전에 실패하는 테스트를 먼저 작성(RED → GREEN → REFACTOR)하도록 에이전트를 강제해 회귀 버그와 과잉 설계를 막는 개발 방법론 스킬입니다.',
    sourceUrl: 'https://github.com/obra/superpowers',
    sourceName: 'obra/superpowers',
    isFeatured: false,
    domains: ['planning-slides', 'research'],
    aiUses: ['automation-workflow'],
    tags: ['에이전트-스킬-mcp', 'tdd', '테스트자동화', 'superpowers'],
    skillKind: SkillKind.SKILL,
    skillSlug: 'test-driven-development',
    authorName: 'Jesse Vincent (obra)',
    license: 'MIT',
    repositoryUrl: 'https://github.com/obra/superpowers',
    sourceFileUrl: 'https://github.com/obra/superpowers/blob/main/skills/test-driven-development/SKILL.md',
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.PRACTICAL,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code', 'Codex', 'Cursor', 'Antigravity'],
    overview:
      '에이전트에게 기능 구현을 맡기면 코드부터 쭉 짜고 테스트는 대충 통과하도록 맞추는 경우가 많습니다. 이 스킬은 "실패하는 테스트 없이는 프로덕션 코드를 단 한 줄도 쓰지 않는다"는 Iron Law로 신뢰성 있는 구현을 보장합니다.',
    useCases: [
      '결제·권한·파싱 등 버그가 치명적인 핵심 비즈니스 로직을 구현할 때',
      '버그 수정 시 재발을 막는 회귀 테스트를 먼저 확보하고 싶을 때',
    ],
    beforeAfter: {
      beforeItems: ['구현 후 테스트를 끼워 맞춰 테스트가 실제로 실패하는지 검증되지 않는다.'],
      afterItems: ['RED(실패 확인) → GREEN(최소 구현 통과) → REFACTOR 사이클을 엄격히 밟는다.'],
    },
    workflowSteps: [
      { step: 1, title: 'RED: 실패하는 테스트 작성 및 실행', description: '요구사항을 검증하는 최소 테스트를 작성하고 예상대로 실패하는지 확인합니다.' },
      { step: 2, title: 'GREEN: 최소한의 구현으로 통과', description: '테스트를 통과시키는 가장 단순한 코드를 작성하고 재실행합니다.' },
      { step: 3, title: 'REFACTOR: 중복 제거 및 정리', description: '테스트가 초록불인 상태를 유지하며 코드를 깔끔하게 다듬습니다.' },
    ],
    prerequisites: [
      { name: '코딩 에이전트 & 테스트 러너', required: true, description: 'Jest, Vitest, Pytest 등 테스트 명령을 실행할 수 있는 환경이 필요합니다.' },
    ],
    installPrompt:
      'https://github.com/obra/superpowers 저장소의 skills/test-driven-development 스킬을 설치해줘.',
    installGuides: [
      {
        environment: 'claude-code',
        label: 'Claude Code / Cursor',
        steps: ['obra/superpowers 플러그인 또는 test-driven-development 스킬을 설치합니다.'],
        invokeExample: '/test-driven-development 할인 쿠폰 만료 검증 로직을 TDD 사이클로 구현해줘.',
      },
    ],
    examplePrompts: [
      { label: '버그 회귀 방지', prompt: '이 버그를 재현하는 실패 테스트를 먼저 만들고, 통과시킨 뒤 리팩토링해줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '실증된 단위 테스트 + 최소 구현', description: '실패·통과 로그가 확인된 테스트와 코드' },
    ],
    postRunChecklist: ['테스트가 목(Mock)만 검증하지 않고 실제 경계 조건을 다루는지 확인합니다.'],
    tips: ['작은 함수 단위로 쪼개어 요청할수록 TDD 속도가 빨라집니다.'],
    cautions: '단순 CSS 스타일 조정이나 탐색용 프로토타입에는 생략하는 편이 효율적입니다.',
    faq: [
      { question: 'obra/superpowers 전체를 깔아야 하나요?', answer: '원하는 개별 스킬(test-driven-development 등)만 골라 설치해도 정상 동작합니다.' },
    ],
    fileStructure: ['skills/test-driven-development/SKILL.md'],
    skillMdPreview: `---
name: test-driven-development
description: Use when implementing any feature or bugfix, before writing implementation code.
license: MIT
---
# Test-Driven Development (TDD)
The Iron Law: NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
- RED -> Verify Red -> GREEN -> Verify Green -> REFACTOR`,
    webAlternative: {
      title: '웹 AI에게 테스트 코드부터 먼저 요구하기',
      description: 'ChatGPT나 Claude에 "구현 코드 바로 주지 말고, 먼저 경계 조건을 포함한 Vitest/Jest 실패 테스트 케이스부터 작성해줘"라고 두 단계로 나눠 요청하세요.',
      recommendedTools: ['claude', 'chatgpt', 'cursor'],
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['cursor', 'claude', 'chatgpt'],
  },
  {
    slug: 'skill-superpowers-systematic-debugging',
    title: 'Superpowers Systematic Debugging (체계적 원인 분석 디버깅 스킬)',
    summary:
      '원인을 추측해 코드 여기저기를 무작정 고치는 대신, 증상 재현 → 데이터 흐름 추적 → 단일 가설 검증 순서로 근본 원인을 찾는 디버깅 스킬입니다.',
    sourceUrl: 'https://github.com/obra/superpowers',
    sourceName: 'obra/superpowers',
    isFeatured: false,
    domains: ['research', 'planning-slides'],
    aiUses: ['search-analysis', 'automation-workflow'],
    tags: ['에이전트-스킬-mcp', '디버깅', '근본원인분석', 'superpowers'],
    skillKind: SkillKind.SKILL,
    skillSlug: 'systematic-debugging',
    authorName: 'Jesse Vincent (obra)',
    license: 'MIT',
    repositoryUrl: 'https://github.com/obra/superpowers',
    sourceFileUrl: 'https://github.com/obra/superpowers/blob/main/skills/systematic-debugging/SKILL.md',
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.PRACTICAL,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code', 'Codex', 'Cursor', 'Antigravity'],
    overview:
      '에러가 나면 AI가 추측으로 여러 곳을 동시에 수정하다가 새로운 버그를 만드는 악순환을 막기 위해, 4단계 근본 원인 조사(Root Cause Investigation)를 통과하기 전에는 수정안을 적용하지 못하게 합니다.',
    useCases: [
      '원인이 불분명한 간헐적 테스트 실패나 배포 환경 500 에러를 추적할 때',
      '이전 수정 시도가 실패한 뒤 코드를 더 망가뜨리지 않고 정확히 고치고 싶을 때',
    ],
    beforeAfter: {
      beforeItems: ['증상만 보고 임의의 try-catch나 null 체크를 덕지덕지 붙인다.'],
      afterItems: ['호출 스택과 입력 데이터를 역추적해 정확한 원인 지점 한 곳만 고친다.'],
    },
    workflowSteps: [
      { step: 1, title: '근본 원인 조사', description: '에러 로그 전체 확인, 안정적 재현, 최근 변경점(git diff) 대조를 수행합니다.' },
      { step: 2, title: '패턴 비교', description: '정상 동작하는 유사 코드와 차이점을 비교합니다.' },
      { step: 3, title: '단일 가설 검증', description: '한 번에 한 가지 변수만 바꿔 가설을 입증합니다.' },
      { step: 4, title: '수정 및 재발 방지 테스트', description: '근본 원인을 수정하고 회귀 테스트로 고정합니다.' },
    ],
    prerequisites: [
      { name: '코딩 에이전트', required: true, description: 'Claude Code, Cursor, Codex 등에서 로그·코드를 조회할 수 있어야 합니다.' },
    ],
    installPrompt:
      'https://github.com/obra/superpowers 저장소의 skills/systematic-debugging 스킬을 설치해줘.',
    installGuides: [
      {
        environment: 'claude-code',
        label: 'Claude Code / Cursor',
        steps: ['systematic-debugging 스킬을 설치하고 재현되는 에러 로그를 전달합니다.'],
        invokeExample: '/systematic-debugging 이 API 500 에러를 추측으로 고치지 말고 근본 원인부터 추적해줘.',
      },
    ],
    examplePrompts: [
      { label: '원인 추적', prompt: '테스트가 간헐적으로 실패하는데, 수정 코드 전에 먼저 실패 원인 가설과 근거를 정리해줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '근본 원인 분석 리포트 및 최소 수정', description: '재현 근거가 입증된 단일 원인 수정안' },
    ],
    postRunChecklist: ['3번 이상 수정이 빗나가면 아키텍처 가정을 재검토합니다.'],
    tips: ['스택 트레이스 첫 줄만 주지 말고 전체 로그와 최근 수정 파일을 함께 제공하세요.'],
    cautions: '운영 DB나 라이브 서버에서 직접 재현 실험을 하지 않도록 주의하세요.',
    faq: [
      { question: '단순 오타 에러에도 써야 하나요?', answer: '원인이 자명한 컴파일 에러는 바로 고치고, 원인이 안 보이는 런타임·비동기·배포 버그에 특히 효과적입니다.' },
    ],
    fileStructure: ['skills/systematic-debugging/SKILL.md'],
    skillMdPreview: `---
name: systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes.
license: MIT
---
Iron Law: NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
1. Root Cause Investigation
2. Pattern Analysis
3. Hypothesis and Testing
4. Implementation`,
    webAlternative: {
      title: '웹 AI에게 "수정 코드 금지, 원인 가설 3개부터" 요청하기',
      description: '에러 로그와 관련 함수를 붙여넣고 "바로 고친 코드 주지 말고, 가능한 근본 원인 가설과 확인 방법부터 알려줘"라고 하면 같은 효과를 냅니다.',
      recommendedTools: ['claude', 'chatgpt', 'cursor'],
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['cursor', 'claude', 'chatgpt'],
  },

  // 4. Plugins & Ecosystem CLIs (2)
  {
    slug: 'plugin-claude-code-templates',
    title: 'Claude Code Templates (서브에이전트·커맨드·훅·스킬 2,000+ 허브)',
    summary:
      'Claude Code용 서브에이전트, 슬래시 커맨드, 훅(Hook), 스킬, MCP 설정을 한 줄 CLI 명령어로 프로젝트에 바로 설치할 수 있는 오픈소스 레지스트리(aitmpl.com)입니다.',
    sourceUrl: 'https://www.aitmpl.com/',
    sourceName: 'davila7 / aitmpl.com',
    isFeatured: true,
    domains: ['planning-slides', 'docs-reports'],
    aiUses: ['automation-workflow'],
    tags: ['에이전트-스킬-mcp', '플러그인', 'claude-code', '템플릿허브'],
    skillKind: SkillKind.PLUGIN,
    skillSlug: 'claude-code-templates',
    authorName: 'Daniel Avila (davila7)',
    license: 'MIT',
    repositoryUrl: 'https://github.com/davila7/claude-code-templates',
    sourceFileUrl: 'https://github.com/davila7/claude-code-templates/blob/main/README.md',
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.BEGINNER,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code'],
    overview:
      'Claude Code를 처음 셋업할 때 어떤 `.claude/agents`, 커맨드, 훅, MCP를 넣어야 할지 막막합니다. `aitmpl.com` 웹 UI에서 직무·스택별 컴포넌트를 골라 복사한 `npx claude-code-templates` 명령 한 줄로 즉시 설치할 수 있습니다.',
    useCases: [
      '새 프로젝트에 코드 리뷰 에이전트, 커밋 훅, 보안 점검 커맨드를 한 번에 구성할 때',
      '다른 팀들이 검증해 공유한 Claude Code 설정 패턴을 참고할 때',
    ],
    beforeAfter: {
      beforeItems: ['서브에이전트와 훅 설정 파일을 매번 블로그를 찾아보며 수동으로 작성한다.'],
      afterItems: ['aitmpl.com에서 필요한 컴포넌트만 골라 CLI 한 줄로 설치한다.'],
    },
    workflowSteps: [
      { step: 1, title: '카탈로그 탐색 (aitmpl.com)', description: '에이전트·커맨드·스킬·훅·MCP 카테고리에서 원하는 구성을 찾습니다.' },
      { step: 2, title: 'CLI 한 줄 설치', description: 'npx claude-code-templates 명령으로 현재 프로젝트에 추가합니다.' },
      { step: 3, title: '상태·보안 점검', description: '설치된 파일의 허용 도구와 훅 스크립트를 검토한 뒤 사용합니다.' },
    ],
    prerequisites: [
      { name: 'Node.js & Claude Code', required: true, description: 'npx 실행 환경과 Claude Code가 설치되어 있어야 합니다.' },
    ],
    installPrompt:
      'https://github.com/davila7/claude-code-templates 에서 현재 프로젝트 스택에 어울리는 컴포넌트 조합을 추천해줘.',
    installGuides: [
      {
        environment: 'claude-code',
        label: 'CLI (npx)',
        steps: ['프로젝트 루트 터미널에서 npx claude-code-templates@latest를 실행해 대화형으로 선택합니다.'],
        command: 'npx claude-code-templates@latest',
        invokeExample: 'aitmpl.com에서 고른 에이전트/스킬 설치 명령어를 붙여넣어 실행합니다.',
      },
    ],
    examplePrompts: [
      { label: '스택별 추천', prompt: 'Next.js + NestJS 풀스택 프로젝트에 어울리는 Claude Code 에이전트와 훅 구성을 추천해줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '.claude/ 컴포넌트 설치 완료', description: '프로젝트에 바로 적용된 에이전트·커맨드·훅 파일' },
    ],
    postRunChecklist: ['외부 커뮤니티 훅(Hook) 스크립트가 셸 명령을 자동 실행하지 않는지 내용을 한 번 읽어보세요.'],
    tips: ['전체 팩을 한꺼번에 깔기보다 꼭 필요한 2~3개 컴포넌트부터 시작하면 컨텍스트 낭비를 막을 수 있습니다.'],
    cautions: '서드파티 훅과 MCP는 실행 전 권한 범위를 반드시 확인하세요.',
    faq: [
      { question: '무료로 쓸 수 있나요?', answer: 'MIT 라이선스 오픈소스 프로젝트로 무료로 탐색·설치할 수 있습니다.' },
    ],
    fileStructure: ['.claude/agents/', '.claude/commands/', '.claude/skills/', '.claude/settings.json'],
    skillMdPreview: `# Claude Code Templates (aitmpl.com)
Open-source registry and CLI for Claude Code components:
- Agents, Commands, Skills, Hooks, MCPs, Settings
Quick start:
  npx claude-code-templates@latest`,
    webAlternative: {
      title: '설치 없이 aitmpl.com에서 프롬프트·지침 텍스트만 복사하기',
      description: 'CLI를 실행하지 않고도 aitmpl.com 웹페이지에서 각 에이전트·커맨드의 마크다운 원문을 확인해 Claude Projects 지침으로 복사할 수 있습니다.',
      recommendedTools: ['claude'],
      guideSlug: 'guide-claude-skills-vs-web-alternatives',
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['claude', 'cursor'],
  },
  {
    slug: 'plugin-skills-cli',
    title: 'skills.sh CLI (npx skills add 멀티 에이전트 스킬 패키지 매니저)',
    summary:
      '에이전트 스킬계의 npm 역할을 하는 Vercel Labs 오픈소스 CLI(`npx skills`)로, GitHub의 `SKILL.md`를 Claude Code·Cursor·Codex·Antigravity 등에 한 번에 설치·업데이트합니다.',
    sourceUrl: 'https://skills.sh/',
    sourceName: 'Vercel Labs (skills.sh)',
    isFeatured: true,
    domains: ['planning-slides', 'research'],
    aiUses: ['automation-workflow'],
    tags: ['에이전트-스킬-mcp', '플러그인', 'skills-sh', '패키지매니저'],
    skillKind: SkillKind.PLUGIN,
    skillSlug: 'skills',
    authorName: 'Vercel Labs',
    license: 'MIT',
    repositoryUrl: 'https://github.com/vercel-labs/skills',
    sourceFileUrl: 'https://github.com/vercel-labs/skills/blob/main/README.md',
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.BEGINNER,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code', 'Codex', 'Cursor', 'Antigravity'],
    overview:
      '에이전트마다 스킬 폴더 경로(`~/.claude/skills`, `~/.codex/skills`, `.agents/skills` 등)가 달라 수동 복사가 번거롭습니다. `npx skills add <owner/repo>` 한 줄이면 원하는 에이전트 경로를 자동 감지해 연결·관리해 줍니다.',
    useCases: [
      'GitHub에서 찾은 공식/커뮤니티 스킬을 여러 AI 에이전트에 한 번에 설치·업데이트할 때',
      'skills.sh 디렉토리에서 인기 순위·설치 수가 검증된 스킬을 빠르게 찾아 도입할 때',
    ],
    beforeAfter: {
      beforeItems: ['저장소를 클론해 스킬 폴더를 찾아 에이전트별 숨김 디렉토리에 일일이 복사한다.'],
      afterItems: ['npx skills add <저장소> 한 줄로 설치·목록 확인·업데이트를 관리한다.'],
    },
    workflowSteps: [
      { step: 1, title: 'skills.sh에서 스킬 탐색', description: '설치 수와 출처 저장소를 확인하고 스킬을 고릅니다.' },
      { step: 2, title: 'npx skills add 실행', description: '대상 에이전트(Claude Code/Cursor/Codex 등)를 선택해 설치합니다.' },
      { step: 3, title: 'skills list / update 관리', description: '설치된 스킬 목록을 확인하고 최신 버전으로 유지합니다.' },
    ],
    prerequisites: [
      { name: 'Node.js (npx)', required: true, description: '터미널에서 npx 명령을 실행할 수 있어야 합니다.' },
    ],
    installPrompt:
      'npx skills CLI를 이용해 원하는 GitHub 저장소의 스킬을 현재 프로젝트/전역 에이전트에 설치하는 방법을 알려줘.',
    installGuides: [
      {
        environment: 'claude-code',
        label: '터미널 (npx skills)',
        steps: [
          '터미널에서 npx skills add <owner/repo> 를 실행합니다.',
          '설치할 스킬과 대상 에이전트를 선택하면 자동으로 스킬 폴더에 링크됩니다.',
        ],
        command: 'npx skills add anthropics/skills --skill pptx',
        invokeExample: 'npx skills list',
      },
    ],
    examplePrompts: [
      { label: '스킬 설치', prompt: 'npx skills add 명령으로 vercel-labs/agent-skills의 특정 스킬만 전역 설치하는 명령을 알려줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '에이전트별 스킬 자동 배치 완료', description: 'Claude Code·Codex·Cursor 등 선택 경로에 즉시 인식' },
    ],
    postRunChecklist: ['비공식 서드파티 스킬을 설치할 때는 skills.sh 페이지에서 원본 GitHub 저장소와 SKILL.md 내용을 먼저 확인하세요.'],
    tips: ['-g 옵션을 주면 모든 프로젝트에서 쓰는 전역 스킬로, 생략하면 현재 프로젝트 전용으로 설치됩니다.'],
    cautions: '누구나 저장소를 등록할 수 있는 공개 레지스트리이므로 신뢰할 수 있는 제작자(Anthropic, Vercel 등)인지 확인 후 설치하세요.',
    faq: [
      { question: 'Claude.ai 웹 사용자도 쓸 수 있나요?', answer: 'skills CLI는 로컬 에이전트용입니다. Claude.ai 웹 사용자는 GitHub에서 SKILL.md를 내려받아 설정 → 기능 → 스킬에 업로드해야 합니다.' },
    ],
    fileStructure: ['.agents/skills/', '.claude/skills/', 'skills-lock.json'],
    skillMdPreview: `# skills.sh — The open agent skills CLI
Install skills from any GitHub repo across Claude Code, Cursor, Codex, Antigravity:
  npx skills add <owner/repo>
  npx skills list
  npx skills update`,
    webAlternative: {
      title: '설치 없이 skills.sh 웹에서 SKILL.md 원문만 참고하기',
      description: 'CLI를 쓰지 않아도 skills.sh 상세 페이지에서 원문 지침을 읽고 핵심 규칙만 복사해 웹 AI 프로젝트 지침으로 활용할 수 있습니다.',
      recommendedTools: ['claude', 'chatgpt'],
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['claude', 'cursor', 'chatgpt'],
  },

  // 5. MCP Servers (3)
  {
    slug: 'mcp-playwright-official',
    title: 'Playwright MCP (Microsoft 공식 브라우저 자동화·테스트 MCP)',
    summary:
      'Microsoft가 공식 제공하는 Playwright MCP 서버로, 스크린샷 비전이 아닌 접근성 트리(Accessibility Snapshot) 기반으로 AI가 실제 웹 브라우저를 클릭·입력·검증합니다.',
    sourceUrl: 'https://github.com/microsoft/playwright-mcp',
    sourceName: 'Microsoft',
    isFeatured: true,
    domains: ['research', 'content-design'],
    aiUses: ['automation-workflow', 'search-analysis'],
    tags: ['에이전트-스킬-mcp', 'mcp', 'playwright', '브라우저자동화'],
    skillKind: SkillKind.MCP,
    skillSlug: 'playwright-mcp',
    authorName: 'Microsoft',
    license: 'Apache-2.0',
    repositoryUrl: 'https://github.com/microsoft/playwright-mcp',
    sourceFileUrl: 'https://github.com/microsoft/playwright-mcp/blob/main/README.md',
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.PRACTICAL,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code', 'Cursor', 'Codex', 'Antigravity'],
    overview:
      '기존 브라우저 자동화는 픽셀 좌표를 추측하거나 스크린샷 토큰을 많이 소비했습니다. Microsoft 공식 Playwright MCP는 웹페이지의 구조화된 접근성 트리를 읽어 정확하고 빠르게 페이지 이동, 폼 입력, E2E 검증을 수행합니다.',
    useCases: [
      '배포된 웹 서비스의 회원가입·검색·장바구니 흐름이 실제 브라우저에서 깨지지 않는지 자동 점검할 때',
      '자바스크립트로 렌더링되는 웹페이지나 사내 어드민 화면의 UI 상태를 확인할 때',
    ],
    beforeAfter: {
      beforeItems: ['curl로는 JS 렌더링 화면을 못 보고, 수동 E2E 테스트는 매번 손으로 클릭해야 한다.'],
      afterItems: ['에이전트가 실제 브라우저를 열어 버튼을 클릭하고 콘솔 에러·화면을 직접 확인한다.'],
    },
    workflowSteps: [
      { step: 1, title: 'MCP 서버 등록', description: 'npx @playwright/mcp@latest를 에이전트 MCP 설정에 연결합니다.' },
      { step: 2, title: '페이지 이동 및 스냅샷 탐색', description: '접근성 트리 기반으로 버튼·입력창을 식별해 조작합니다.' },
      { step: 3, title: '결과 검증', description: '화면 텍스트, 네트워크 응답, 콘솔 에러 유무를 리포트합니다.' },
    ],
    prerequisites: [
      { name: 'Node.js & MCP 지원 에이전트', required: true, description: '로컬 브라우저 실행이 가능한 환경과 Node.js가 필요합니다.' },
    ],
    installPrompt:
      'https://github.com/microsoft/playwright-mcp 공식 MCP 서버를 현재 에이전트에 연결하고 동작을 확인해줘.',
    installGuides: [
      {
        environment: 'cursor',
        label: 'Cursor / Claude Code',
        steps: ['MCP 설정에 @playwright/mcp@latest 서버를 추가합니다.'],
        command: 'npx @playwright/mcp@latest',
        invokeExample: 'https://example.com 에 접속해서 모바일 뷰포트(390x844) 레이아웃과 콘솔 에러를 점검해줘.',
      },
    ],
    examplePrompts: [
      { label: 'UI 점검', prompt: '로컬 서버(localhost:3000)의 로그인 폼에 잘못된 비밀번호를 넣었을 때 에러 메시지가 뜨는지 확인해줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '브라우저 동작 검증 결과', description: '방문 URL, 클릭/입력 결과, 콘솔·네트워크 오류 요약' },
    ],
    postRunChecklist: ['운영 서비스 결제·삭제 버튼 등 파괴적 액션을 자동 클릭하지 않도록 범위를 제한하세요.'],
    tips: ['헤드리스 모드(--headless)와 일반 UI 모드를 상황에 맞게 전환하면 디버깅이 편리합니다.'],
    cautions: 'CAPTCHA가 걸린 사이트나 타인 계정의 비인가 자동화에는 사용하지 마세요.',
    faq: [
      { question: 'Chrome DevTools MCP와 무엇이 다른가요?', answer: 'Playwright MCP는 크로스 브라우저 E2E 자동화·조작에 강점이 있고, Chrome DevTools MCP는 성능 트레이스·메모리 힙 분석에 강점이 있습니다.' },
    ],
    fileStructure: ['mcp-config.json (@playwright/mcp)'],
    skillMdPreview: `{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}`,
    webAlternative: {
      title: '설치 없이 Perplexity / ChatGPT 브라우징으로 공개 페이지 확인하기',
      description: '버튼 클릭이나 로그인이 필요 없는 공개 문서 요약이라면 Perplexity나 ChatGPT 웹 검색 기능만으로 충분합니다.',
      recommendedTools: ['perplexity', 'chatgpt'],
      guideSlug: 'guide-mcp-for-office-workers',
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['cursor', 'claude', 'perplexity'],
  },
  {
    slug: 'mcp-sequential-thinking',
    title: 'Sequential Thinking MCP (단계별 구조화 추론 공식 MCP)',
    summary:
      '복잡한 의사결정, 아키텍처 설계, 다단계 문제 해결 시 AI가 성급히 결론 내리지 않고 가설·수정·분기 과정을 단계별로 기록하며 추론하도록 돕는 공식 MCP 서버입니다.',
    sourceUrl: 'https://github.com/modelcontextprotocol/servers',
    sourceName: 'Model Context Protocol Official',
    isFeatured: false,
    domains: ['planning-slides', 'research'],
    aiUses: ['search-analysis'],
    tags: ['에이전트-스킬-mcp', 'mcp', '추론', '의사결정'],
    skillKind: SkillKind.MCP,
    skillSlug: 'sequential-thinking',
    authorName: 'Anthropic / MCP Contributors',
    license: 'MIT',
    repositoryUrl: 'https://github.com/modelcontextprotocol/servers',
    sourceFileUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking',
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.BEGINNER,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code', 'Cursor', 'Codex', 'Antigravity'],
    overview:
      '복합적인 기획·트러블슈팅 과제를 한 번에 답하게 하면 중간 전제를 빠뜨리기 쉽습니다. 공식 `sequential-thinking` MCP는 사고 단계를 명시적으로 분해하고 중간에 잘못된 가정을 되돌아 수정(revision)할 수 있는 도구를 제공합니다.',
    useCases: [
      '여러 제약 조건이 얽힌 신규 서비스 IA 설계나 DB 마이그레이션 전략을 세울 때',
      '트레이드오프가 큰 기술·비즈니스 선택지 3가지를 빠짐없이 비교 검토할 때',
    ],
    beforeAfter: {
      beforeItems: ['첫 번째 떠오른 답으로 바로 결론을 내려 엣지 케이스를 놓친다.'],
      afterItems: ['단계별 생각 번호·총 예상 단계·가정 수정을 거친 뒤 최종 결론을 낸다.'],
    },
    workflowSteps: [
      { step: 1, title: '문제 분해', description: '제약 조건과 목표를 단계별 사고 단위로 나눕니다.' },
      { step: 2, title: '가설 검토 및 분기/수정', description: '모순이 발견되면 이전 단계를 수정(isRevision)하며 대안을 탐색합니다.' },
      { step: 3, title: '최종 실행안 도출', description: '검증된 근거를 바탕으로 결론을 제시합니다.' },
    ],
    prerequisites: [
      { name: 'Node.js & MCP 지원 에이전트', required: true, description: 'npx 실행이 가능한 MCP 호환 에이전트가 필요합니다.' },
    ],
    installPrompt:
      '공식 @modelcontextprotocol/server-sequential-thinking MCP 서버를 연결해줘.',
    installGuides: [
      {
        environment: 'cursor',
        label: 'Cursor / Claude Code',
        steps: ['MCP 설정에 @modelcontextprotocol/server-sequential-thinking을 등록합니다.'],
        command: 'npx -y @modelcontextprotocol/server-sequential-thinking',
        invokeExample: 'sequential-thinking 도구를 써서 우리 결제 시스템 장애 복구 시나리오의 빈틈을 단계별로 점검해줘.',
      },
    ],
    examplePrompts: [
      { label: '트레이드오프 분석', prompt: '모놀리스 유지 vs 마이크로서비스 분리 결정을 sequential thinking으로 장단점과 리스크를 단계별 검증해줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '단계별 검증을 거친 의사결정안', description: '가정 수정과 대안 비교가 포함된 결론' },
    ],
    postRunChecklist: ['AI가 세운 핵심 가정이 실제 우리 팀의 예산·일정 제약과 맞는지 확인합니다.'],
    tips: ['간단한 요약에는 끄고, 아키텍처·전략 수립 같은 고난도 작업에만 쓰면 토큰과 시간을 아낄 수 있습니다.'],
    cautions: '추론 단계가 길어질수록 응답 시간이 늘어나므로 단순 작업에는 불필요합니다.',
    faq: [
      { question: '무료로 쓸 수 있나요?', answer: '네, 오픈소스 MIT 라이선스 공식 레퍼런스 서버로 별도 API 키 없이 로컬에서 바로 실행됩니다.' },
    ],
    fileStructure: ['mcp-config.json (@modelcontextprotocol/server-sequential-thinking)'],
    skillMdPreview: `{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}`,
    webAlternative: {
      title: '설치 없이 웹 AI에서 단계별 사고 유도하기',
      description: 'ChatGPT(o-시리즈)나 Claude 확장 사고(Extended Thinking)를 켜거나 "결론 내기 전에 전제→반론→수정→최종안 4단계로 먼저 따져봐"라고 지시하면 설치 없이 비슷하게 쓸 수 있습니다.',
      recommendedTools: ['claude', 'chatgpt'],
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['claude', 'chatgpt', 'cursor'],
  },
  {
    slug: 'mcp-prompts-chat',
    title: 'prompts.chat MCP (오픈소스 프롬프트 라이브러리 연동 MCP)',
    summary:
      '세계 최대 오픈소스 프롬프트 허브인 `prompts.chat`(구 Awesome ChatGPT Prompts)의 검증된 프롬프트·페르소나를 에이전트 안에서 바로 검색하고 불러오는 공식 MCP 서버입니다.',
    sourceUrl: 'https://prompts.chat/',
    sourceName: 'prompts.chat',
    isFeatured: false,
    domains: ['docs-reports', 'meetings-comms', 'content-design'],
    aiUses: ['writing-summary', 'search-analysis'],
    tags: ['에이전트-스킬-mcp', 'mcp', '프롬프트라이브러리', 'prompts-chat'],
    skillKind: SkillKind.MCP,
    skillSlug: 'prompts-chat',
    authorName: 'Fatih Kadir Akın & Contributors',
    license: 'CC0-1.0',
    repositoryUrl: 'https://github.com/f/prompts.chat',
    sourceFileUrl: 'https://github.com/f/prompts.chat/blob/main/README.md',
    executionVerification: SkillExecutionVerification.SOURCE_CHECKED,
    difficulty: DifficultyLevel.BEGINNER,
    pricingModel: PricingModel.FREE,
    compatibleAgents: ['Claude Code', 'Cursor', 'Codex', 'Antigravity'],
    overview:
      '매번 브라우저에서 프롬프트 사이트를 뒤지는 대신, `prompts.chat` MCP 서버를 연결해 두면 에이전트가 직무·상황에 맞는 검증된 프롬프트 템플릿을 직접 검색해 내 작업에 적용해 줍니다.',
    useCases: [
      '마케팅 카피, 면접관 페르소나, SQL 튜닝 등 검증된 글로벌 프롬프트 레퍼런스를 즉시 찾을 때',
      '우리 팀의 프롬프트 초안을 작성할 때 참고할 만한 역할 지침(System Prompt)을 검색할 때',
    ],
    beforeAfter: {
      beforeItems: ['프롬프트 사이트 여러 곳을 돌아다니며 복붙하고 다시 한국어로 고쳐 쓴다.'],
      afterItems: ['에이전트 대화창에서 바로 prompts.chat 템플릿을 검색해 내 업무 변수로 적용한다.'],
    },
    workflowSteps: [
      { step: 1, title: '원격/로컬 MCP 연결', description: 'prompts.chat 공식 MCP 엔드포인트 또는 패키지를 등록합니다.' },
      { step: 2, title: '키워드·역할 검색', description: '원하는 직무나 작업 유형으로 프롬프트를 조회합니다.' },
      { step: 3, title: '한국어·실무 맥락 맞게 현지화', description: '가져온 템플릿을 우리 업무 조건에 맞춰 바로 실행합니다.' },
    ],
    prerequisites: [
      { name: 'MCP 지원 에이전트', required: true, description: 'Claude Code, Cursor, Codex 등에서 MCP를 등록할 수 있어야 합니다.' },
    ],
    installPrompt:
      'https://prompts.chat/ 공식 프롬프트 허브를 MCP로 연결하고 마케팅/기획 관련 프롬프트를 검색하는 방법을 알려줘.',
    installGuides: [
      {
        environment: 'cursor',
        label: 'Cursor / Claude Code',
        steps: ['prompts.chat 공식 MCP 서버(npx prompts.chat mcp 등) 또는 원격 MCP URL을 설정에 추가합니다.'],
        invokeExample: 'prompts.chat에서 "Tech Writer" 또는 "Product Manager" 관련 프롬프트를 찾아 한국어로 적용해줘.',
      },
    ],
    examplePrompts: [
      { label: '프롬프트 검색 및 적용', prompt: 'prompts.chat에서 UX 리서치 인터뷰 설계 프롬프트를 찾아서 우리 앱 온보딩 조사에 맞게 바꿔줘.' },
    ],
    expectedOutputs: [
      { order: '01', title: '검색된 템플릿 + 한국어 맞춤 프롬프트', description: '원본 출처와 실무 적용 버전' },
    ],
    postRunChecklist: ['영문 기반 프롬프트를 한국어로 옮길 때 한국 비즈니스 톤앤매너에 맞는지 다듬어 주세요.'],
    tips: ['CC0 퍼블릭 도메인 프롬프트가 많아 사내 가이드나 팀 템플릿으로 자유롭게 변형하기 좋습니다.'],
    cautions: '커뮤니티 기여 프롬프트 중 오래된 모델 기준 지침은 최신 모델에 맞게 불필요한 제약을 줄여 쓰세요.',
    faq: [
      { question: '웹사이트에서 바로 검색해도 되나요?', answer: '네, 비개발자라면 https://prompts.chat/ 웹사이트에서 직접 검색해 복사하는 것이 가장 빠릅니다.' },
    ],
    fileStructure: ['mcp-config.json (prompts.chat)'],
    skillMdPreview: `# prompts.chat MCP
Open-source prompt hub (CC0-1.0) with MCP integration for Claude Code, Cursor, Codex.
Web directory: https://prompts.chat/`,
    webAlternative: {
      title: '설치 없이 prompts.chat / 알콕 가이드에서 바로 복사하기',
      description: '개발 도구가 없다면 https://prompts.chat/ 또는 알콕의 업무 활용 가이드에서 검증된 프롬프트를 원클릭 복사해 웹 AI에 붙여넣으세요.',
      recommendedTools: ['chatgpt', 'claude'],
    },
    toc: DEFAULT_SKILL_TOC,
    compatibleToolSlugs: ['chatgpt', 'claude', 'cursor'],
  },
];
