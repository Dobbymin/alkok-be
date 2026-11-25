import {
  ContentType,
  DifficultyLevel,
  KoreanSupportLevel,
  PricingModel,
  Prisma,
  PrismaClient,
  PublishStatus,
  SourceType,
  ToolKind,
  VerificationStatus,
} from '@prisma/client';
import { uuidv7 } from '../../src/common/utils/uuidv7';

interface SeedToolInput {
  slug: string;
  title: string;
  summary: string;
  sourceUrl: string;
  sourceName: string;
  isFeatured?: boolean;
  domains: string[];
  aiUses: string[];
  tags: string[];
  toolKind: ToolKind;
  providerName: string;
  officialUrl: string;
  pricingModel: PricingModel;
  hasFreePlan: boolean;
  pricingSummary: string;
  koreanSupport: KoreanSupportLevel;
  platforms: string[];
  strengths: string[];
  limitations: string[];
}

interface SeedGuideInput {
  slug: string;
  title: string;
  summary: string;
  sourceUrl: string;
  sourceName: string;
  isFeatured?: boolean;
  domains: string[];
  aiUses: string[];
  tags: string[];
  difficulty: DifficultyLevel;
  estimatedMinutes: number;
  pricingModel: PricingModel;
  markdownBody: string;
  prompts: Array<{
    id: string;
    title: string;
    prompt: string;
    variables?: string[];
    expectedOutput?: string;
    tips?: string;
  }>;
  cautions: string;
  toc: Array<{ id: string; text: string; level: number }>;
  recommendedToolSlugs: string[];
}

interface SeedNewsInput {
  slug: string;
  title: string;
  summary: string;
  sourceType: SourceType;
  sourceUrl: string;
  sourceName: string;
  isFeatured?: boolean;
  domains: string[];
  aiUses: string[];
  tags: string[];
  keyPoints: string[];
  workImpact: string;
  daysAgo: number;
}

const SEED_TOOLS: SeedToolInput[] = [
  {
    slug: 'chatgpt',
    title: 'ChatGPT',
    summary: '문서 작성, 데이터 분석, 음성 대화, 웹 검색까지 폭넓은 범용 업무를 지원하는 대표 AI 어시스턴트입니다.',
    sourceUrl: 'https://chatgpt.com',
    sourceName: 'OpenAI',
    isFeatured: true,
    domains: ['docs-reports', 'planning-slides', 'research'],
    aiUses: ['writing-summary', 'search-analysis', 'automation-workflow'],
    tags: ['범용AI', '문서작성', '데이터분석'],
    toolKind: ToolKind.TOOL,
    providerName: 'OpenAI',
    officialUrl: 'https://chatgpt.com',
    pricingModel: PricingModel.FREEMIUM,
    hasFreePlan: true,
    pricingSummary: '무료 플랜 제공 / Plus 월 $20 / Team 월 $25~30',
    koreanSupport: KoreanSupportLevel.FULL,
    platforms: ['Web', 'iOS', 'Android', 'macOS', 'Windows'],
    strengths: ['한국어 자연어 생성과 요약 품질 우수', '파일 업로드 및 표·차트 분석 지원', 'Custom GPTs로 반복 업무 템플릿화 가능'],
    limitations: ['무료 플랜은 최신 모델 사용량 제한 존재', '사내 기밀 문서는 엔터프라이즈·팀 플랜 학습 제외 설정 필요'],
  },
  {
    slug: 'claude',
    title: 'Claude',
    summary: '긴 문서 독해와 정교한 한국어 문체, 구조화된 보고서·기획안 작성에 강점을 지닌 AI 어시스턴트입니다.',
    sourceUrl: 'https://www.anthropic.com/claude',
    sourceName: 'Anthropic',
    isFeatured: true,
    domains: ['docs-reports', 'planning-slides', 'content-design'],
    aiUses: ['writing-summary', 'search-analysis'],
    tags: ['장문요약', '보고서', '한국어문체'],
    toolKind: ToolKind.TOOL,
    providerName: 'Anthropic',
    officialUrl: 'https://www.anthropic.com/claude',
    pricingModel: PricingModel.FREEMIUM,
    hasFreePlan: true,
    pricingSummary: '무료 플랜 제공 / Pro 월 $20 / Team 월 $25~30',
    koreanSupport: KoreanSupportLevel.FULL,
    platforms: ['Web', 'iOS', 'Android', 'macOS', 'Windows'],
    strengths: ['자연스럽고 과장 없는 한국어 비즈니스 문체', '대용량 PDF·계약서·기획서 문맥 유지력 우수', 'Projects 및 Artifacts로 문서 초안 반복 편집 편리'],
    limitations: ['이미지 생성 기능 미지원', '무료 플랜 대화 길이 제한 시 대기 시간 발생'],
  },
  {
    slug: 'gemini',
    title: 'Gemini',
    summary: 'Google Workspace(Docs, Gmail, Sheets, Drive)와 연동되어 메일·문서·시트 업무를 빠르게 보조하는 AI입니다.',
    sourceUrl: 'https://deepmind.google/technologies/gemini/',
    sourceName: 'Google',
    isFeatured: true,
    domains: ['docs-reports', 'data-sheets', 'meetings-comms'],
    aiUses: ['writing-summary', 'search-analysis', 'image-video'],
    tags: ['Google연동', '대용량컨텍스트', '멀티모달'],
    toolKind: ToolKind.TOOL,
    providerName: 'Google',
    officialUrl: 'https://deepmind.google/technologies/gemini/',
    pricingModel: PricingModel.FREEMIUM,
    hasFreePlan: true,
    pricingSummary: '무료 플랜 제공 / Google One AI Premium 월 $19.99',
    koreanSupport: KoreanSupportLevel.FULL,
    platforms: ['Web', 'iOS', 'Android'],
    strengths: ['Google 검색·Drive·Gmail과 자연스러운 연동', '긴 문서·영상·오디오 멀티모달 입력 처리', '한국어 실시간 검색 반영 응답'],
    limitations: ['Workspace 부가 기능은 유료 플랜 필요', '세부 톤앤매너 제어는 프롬프트 구체화 필요'],
  },
  {
    slug: 'perplexity',
    title: 'Perplexity',
    summary: '모든 답변에 실시간 출처 링크를 함께 제시해 시장 조사와 팩트체크 속도를 높이는 AI 검색 엔진입니다.',
    sourceUrl: 'https://www.perplexity.ai',
    sourceName: 'Perplexity AI',
    isFeatured: true,
    domains: ['research', 'planning-slides'],
    aiUses: ['search-analysis'],
    tags: ['출처기반검색', '시장조사', '팩트체크'],
    toolKind: ToolKind.TOOL,
    providerName: 'Perplexity AI',
    officialUrl: 'https://www.perplexity.ai',
    pricingModel: PricingModel.FREEMIUM,
    hasFreePlan: true,
    pricingSummary: '무료 플랜 제공 / Pro 월 $20',
    koreanSupport: KoreanSupportLevel.FULL,
    platforms: ['Web', 'iOS', 'Android', 'macOS'],
    strengths: ['문장 단위 출처 링크 제공으로 검증 시간 단축', 'Deep Research 모드로 다중 웹 문서 종합 리포트 생성', '학술·뉴스·웹 소스 필터링 지원'],
    limitations: ['국내 폐쇄형 커뮤니티·비공개 문서 검색 불가', '원문 출처의 최신성·신뢰도는 직접 클릭 확인 권장'],
  },
  {
    slug: 'microsoft-copilot',
    title: 'Microsoft Copilot',
    summary: 'Word, Excel, PowerPoint, Outlook, Teams 등 Microsoft 365 업무 환경에 통합된 업무용 AI입니다.',
    sourceUrl: 'https://copilot.microsoft.com',
    sourceName: 'Microsoft',
    isFeatured: true,
    domains: ['docs-reports', 'data-sheets', 'planning-slides', 'meetings-comms'],
    aiUses: ['writing-summary', 'automation-workflow'],
    tags: ['오피스연동', '엑셀', '파워포인트'],
    toolKind: ToolKind.TOOL,
    providerName: 'Microsoft',
    officialUrl: 'https://copilot.microsoft.com',
    pricingModel: PricingModel.FREEMIUM,
    hasFreePlan: true,
    pricingSummary: '웹 무료 제공 / M365 Copilot 추가 라이선스 유료',
    koreanSupport: KoreanSupportLevel.FULL,
    platforms: ['Web', 'Windows', 'macOS', 'iOS', 'Android'],
    strengths: ['Word 초안으로 PowerPoint 슬라이드 자동 구성', 'Teams 회의 요약 및 후속 작업 추출', '엔터프라이즈 테넌트 보안 정책 준수'],
    limitations: ['앱 내부 통합 기능은 유료 M365 애드온 필요', '복잡한 Excel 매크로는 검수 필수'],
  },
  {
    slug: 'notion-ai',
    title: 'Notion AI',
    summary: 'Notion 워크스페이스 내 회의록, 위키, 프로젝트 문서를 기반으로 질문·요약·초안 작성을 수행합니다.',
    sourceUrl: 'https://www.notion.com/product/ai',
    sourceName: 'Notion',
    isFeatured: true,
    domains: ['docs-reports', 'meetings-comms', 'planning-slides'],
    aiUses: ['writing-summary', 'search-analysis'],
    tags: ['노션', '사내위키', '회의록요약'],
    toolKind: ToolKind.TOOL,
    providerName: 'Notion',
    officialUrl: 'https://www.notion.com/product/ai',
    pricingModel: PricingModel.PAID,
    hasFreePlan: false,
    pricingSummary: '체험 제한 제공 / Notion AI 애드온 유료',
    koreanSupport: KoreanSupportLevel.FULL,
    platforms: ['Web', 'macOS', 'Windows', 'iOS', 'Android'],
    strengths: ['기존 Notion 데이터베이스·문서 컨텍스트 즉시 활용', '표 속성 자동 채우기 및 액션 아이템 추출', '별도 창 전환 없이 문서 편집기 내 바로 실행'],
    limitations: ['Notion을 쓰지 않는 팀은 도입 효용 낮음', '워크스페이스 권한 설정에 따라 답변 범위 달라짐'],
  },
  {
    slug: 'notebooklm',
    title: 'NotebookLM',
    summary: '사용자가 업로드한 PDF·웹문서·유튜브 자료만을 근거로 답변과 음성 요약을 만드는 리서치 노트북입니다.',
    sourceUrl: 'https://notebooklm.google.com',
    sourceName: 'Google',
    isFeatured: true,
    domains: ['research', 'docs-reports'],
    aiUses: ['search-analysis', 'audio-meetings'],
    tags: ['자료기반질문', 'PDF요약', '환각최소화'],
    toolKind: ToolKind.TOOL,
    providerName: 'Google',
    officialUrl: 'https://notebooklm.google.com',
    pricingModel: PricingModel.FREEMIUM,
    hasFreePlan: true,
    pricingSummary: '기본 무료 제공 / NotebookLM Plus 유료 플랜',
    koreanSupport: KoreanSupportLevel.FULL,
    platforms: ['Web'],
    strengths: ['업로드 소스 기반 인용 번호 제시로 환각 최소화', '다수 보고서 교차 비교 및 스터디 가이드 생성', 'Audio Overview로 이동 중 핵심 청취 가능'],
    limitations: ['외부 실시간 웹 검색은 별도 소스 추가 필요', '이미지 중심 스캔 PDF는 텍스트 인식률 편차'],
  },
  {
    slug: 'clova-note',
    title: 'CLOVA Note',
    summary: '한국어 회의 녹음을 높은 정확도로 텍스트 변환하고 화자 분리 및 핵심 요약을 제공하는 회의록 도구입니다.',
    sourceUrl: 'https://clovanote.naver.com',
    sourceName: 'NAVER Cloud',
    domains: ['meetings-comms'],
    aiUses: ['audio-meetings', 'writing-summary'],
    tags: ['한국어음성인식', '회의록', '화자분리'],
    toolKind: ToolKind.TOOL,
    providerName: 'NAVER Cloud',
    officialUrl: 'https://clovanote.naver.com',
    pricingModel: PricingModel.FREEMIUM,
    hasFreePlan: true,
    pricingSummary: '월 무료 녹음 시간 제공 / 유료 플랜 확장',
    koreanSupport: KoreanSupportLevel.FULL,
    platforms: ['Web', 'iOS', 'Android'],
    strengths: ['한국어·전문 용어·혼용 발화 인식률 우수', '화자 구분 및 타임스탬프 북마크 편리', '회의 후 AI 요약·주요 키워드 자동 추출'],
    limitations: ['마이크 거리나 잡음이 심하면 오탈자 발생', '사내 보안 규정상 외부 클라우드 녹음 반출 확인 필요'],
  },
  {
    slug: 'deepl',
    title: 'DeepL',
    summary: '비즈니스 이메일, 제안서, 매뉴얼 번역에서 자연스러운 한국어·영어 문맥을 유지하는 번역 도구입니다.',
    sourceUrl: 'https://www.deepl.com',
    sourceName: 'DeepL',
    domains: ['meetings-comms', 'docs-reports'],
    aiUses: ['writing-summary'],
    tags: ['비즈니스번역', '용어집', '영문메일'],
    toolKind: ToolKind.TOOL,
    providerName: 'DeepL',
    officialUrl: 'https://www.deepl.com',
    pricingModel: PricingModel.FREEMIUM,
    hasFreePlan: true,
    pricingSummary: '웹 무료 제한 제공 / Pro 유료 플랜',
    koreanSupport: KoreanSupportLevel.FULL,
    platforms: ['Web', 'macOS', 'Windows', 'iOS', 'Android'],
    strengths: ['직역 투가 적은 자연스러운 비즈니스 문장', '단어 클릭으로 대체 표현 즉시 선택', '용어집(Glossary)으로 사내 고유명사 일관 유지'],
    limitations: ['무료 버전은 텍스트 길이 및 문서 번역 횟수 제한', '은어·최신 유행어는 문맥 설명 필요'],
  },
  {
    slug: 'gamma',
    title: 'Gamma',
    summary: '기획 개요나 문서 텍스트를 입력하면 레이아웃이 잡힌 발표용 슬라이드와 웹 문서를 빠르게 생성합니다.',
    sourceUrl: 'https://help.gamma.app/en/',
    sourceName: 'Gamma',
    domains: ['planning-slides', 'content-design'],
    aiUses: ['writing-summary', 'image-video'],
    tags: ['발표자료', '슬라이드초안', '기획서'],
    toolKind: ToolKind.TOOL,
    providerName: 'Gamma',
    officialUrl: 'https://help.gamma.app/en/',
    pricingModel: PricingModel.FREEMIUM,
    hasFreePlan: true,
    pricingSummary: '가입 시 무료 크레딧 제공 / Plus·Pro 월간 구독',
    koreanSupport: KoreanSupportLevel.FULL,
    platforms: ['Web'],
    strengths: ['목차·카드 기반 슬라이드 구조 자동 생성', 'PPTX·PDF 내보내기 지원으로 후속 편집 용이', '비주얼 템플릿 완성도가 높아 초안 시간 단축'],
    limitations: ['기업 브랜드 폰트·세밀한 마스터 슬라이드는 PowerPoint 재가공 필요', '무료 크레딧 소진 후 재생성 제한'],
  },
  {
    slug: 'canva-magic-studio',
    title: 'Canva Magic Studio',
    summary: '마케팅 배너, 카드뉴스, 제안서 표지 등 비디자이너도 바로 쓸 수 있는 AI 이미지·레이아웃 편집 도구입니다.',
    sourceUrl: 'https://www.canva.dev/',
    sourceName: 'Canva',
    domains: ['content-design', 'planning-slides'],
    aiUses: ['image-video'],
    tags: ['카드뉴스', '배너디자인', '비주얼제작'],
    toolKind: ToolKind.TOOL,
    providerName: 'Canva',
    officialUrl: 'https://www.canva.dev/',
    pricingModel: PricingModel.FREEMIUM,
    hasFreePlan: true,
    pricingSummary: '무료 플랜 제공 / Canva Pro 유료',
    koreanSupport: KoreanSupportLevel.FULL,
    platforms: ['Web', 'macOS', 'Windows', 'iOS', 'Android'],
    strengths: ['풍부한 한국어 폰트와 SNS·발표 템플릿', '배경 제거·크기 자동 변환 등 실무 편집 기능', '팀 브랜드 키트 공유 가능'],
    limitations: ['고급 AI 생성·일부 스톡 에셋은 Pro 플랜 필요', '복잡한 인쇄물 조판에는 한계'],
  },
  {
    slug: 'zapier',
    title: 'Zapier',
    summary: 'Slack, Gmail, Notion, Google Sheets 등 수천 개 업무 앱을 코드 없이 연결하고 AI 단계를 끼워 자동화합니다.',
    sourceUrl: 'https://zapier.com',
    sourceName: 'Zapier',
    domains: ['data-sheets', 'meetings-comms'],
    aiUses: ['automation-workflow'],
    tags: ['노코드자동화', '워크플로우', '앱연동'],
    toolKind: ToolKind.TOOL,
    providerName: 'Zapier',
    officialUrl: 'https://zapier.com',
    pricingModel: PricingModel.FREEMIUM,
    hasFreePlan: true,
    pricingSummary: '월 100 태스크 무료 / Starter·Pro 유료',
    koreanSupport: KoreanSupportLevel.PARTIAL,
    platforms: ['Web'],
    strengths: ['가장 많은 SaaS 앱 커넥터 보유', '자연어로 자동화 흐름 초안 생성 지원', '비개발자도 트리거-액션 설정 쉬움'],
    limitations: ['태스크 실행량이 늘면 구독 비용 상승', '인터페이스 주로 영문 제공'],
  },
  {
    slug: 'make',
    title: 'Make',
    summary: '조건 분기, 반복문, HTTP API 호출 등 복잡한 업무 자동화 시나리오를 시각적으로 설계하는 플랫폼입니다.',
    sourceUrl: 'https://www.make.com',
    sourceName: 'Make',
    domains: ['data-sheets', 'meetings-comms'],
    aiUses: ['automation-workflow'],
    tags: ['시나리오자동화', 'API연동', '비용효율'],
    toolKind: ToolKind.TOOL,
    providerName: 'Make',
    officialUrl: 'https://www.make.com',
    pricingModel: PricingModel.FREEMIUM,
    hasFreePlan: true,
    pricingSummary: '월 1,000 오퍼레이션 무료 / Core 월 $9부터',
    koreanSupport: KoreanSupportLevel.PARTIAL,
    platforms: ['Web'],
    strengths: ['복잡한 분기·배열 처리에 강한 캔버스 UI', '동일 작업량 대비 가격 경쟁력 우수', 'OpenAI·Claude 등 LLM 모듈 조합 용이'],
    limitations: ['초기 데이터 매핑 학습 곡선 존재', '한국어 공식 UI 미지원'],
  },
  {
    slug: 'n8n',
    title: 'n8n',
    summary: '셀프 호스팅과 클라우드를 모두 지원해 사내 보안 환경에서도 AI 에이전트 워크플로우를 구축할 수 있습니다.',
    sourceUrl: 'https://n8n.io',
    sourceName: 'n8n',
    domains: ['data-sheets', 'research'],
    aiUses: ['automation-workflow'],
    tags: ['셀프호스팅', 'AI에이전트', '워크플로우'],
    toolKind: ToolKind.TOOL,
    providerName: 'n8n',
    officialUrl: 'https://n8n.io',
    pricingModel: PricingModel.FREEMIUM,
    hasFreePlan: true,
    pricingSummary: '커뮤니티 셀프호스팅 무료 / 클라우드 유료',
    koreanSupport: KoreanSupportLevel.PARTIAL,
    platforms: ['Web', 'Docker'],
    strengths: ['사내 서버 구축 시 민감 데이터 외부 반출 최소화', 'JavaScript/Python 코드 노드와 AI 노드 결합', '스케줄·웹훅 기반 자동 리포트 파이프라인 적합'],
    limitations: ['셀프 호스팅 시 Docker·서버 운영 지식 필요', 'UI 영문 기반'],
  },
  {
    slug: 'cursor',
    title: 'Cursor',
    summary: '문서·데이터 스크립트·업무 자동화 코드 작성 시 프로젝트 전체 문맥을 이해하고 수정안을 제안하는 AI 에디터입니다.',
    sourceUrl: 'https://www.cursor.com',
    sourceName: 'Anysphere',
    domains: ['data-sheets', 'research'],
    aiUses: ['automation-workflow', 'writing-summary'],
    tags: ['스크립트작성', '자동화코드', '생산성'],
    toolKind: ToolKind.TOOL,
    providerName: 'Anysphere',
    officialUrl: 'https://www.cursor.com',
    pricingModel: PricingModel.FREEMIUM,
    hasFreePlan: true,
    pricingSummary: '무료 Hobby 플랜 / Pro 월 $20',
    koreanSupport: KoreanSupportLevel.FULL,
    platforms: ['macOS', 'Windows', 'Linux'],
    strengths: ['한국어 지시만으로 CSV 정제·크롤링 스크립트 작성', '여러 파일 동시 수정 및 오류 자동 진단', 'VS Code 확장 프로그램 그대로 호환'],
    limitations: ['개발 환경에 익숙하지 않은 사용자에겐 초기 진입 장벽', '생성된 스크립트 실행 전 검증 필수'],
  },
  {
    slug: 'wrtn',
    title: '뤼튼 (Wrtn)',
    summary: '한국어 직장인·마케팅·기획 템플릿과 다양한 최신 AI 모델을 무료 중심으로 묶어 제공하는 국내 AI 포털입니다.',
    sourceUrl: 'https://wrtn.ai',
    sourceName: '뤼튼테크놀로지스',
    domains: ['docs-reports', 'content-design'],
    aiUses: ['writing-summary', 'image-video'],
    tags: ['국산AI', '한국어특화', '무료접근성'],
    toolKind: ToolKind.TOOL,
    providerName: '뤼튼테크놀로지스',
    officialUrl: 'https://wrtn.ai',
    pricingModel: PricingModel.FREE,
    hasFreePlan: true,
    pricingSummary: '핵심 채팅·도구 기능 무료 제공 (일부 유료 상품 별도)',
    koreanSupport: KoreanSupportLevel.FULL,
    platforms: ['Web', 'iOS', 'Android'],
    strengths: ['한국 정서와 비즈니스 포맷에 맞춘 인터페이스', '별도 영문 결제 없이 최신 모델 체험 가능', '간단한 보고서·메일·블로그 초안 작성 빠름'],
    limitations: ['사내 기밀 문서 분석용 엔터프라이즈 제어 기능 제한적', '고급 워크플로우 자동화 연동 미약'],
  },
  {
    slug: 'adobe-firefly',
    title: 'Adobe Firefly',
    summary: '상업적 안전성을 고려한 학습 데이터 기반으로 키비주얼, 배너, 브로슈어 이미지를 생성·편집하는 이미지 AI 모델입니다.',
    sourceUrl: 'https://www.adobe.com/products/firefly.html',
    sourceName: 'Adobe',
    domains: ['content-design'],
    aiUses: ['image-video'],
    tags: ['이미지생성', '상업적이용', '키비주얼'],
    toolKind: ToolKind.MODEL,
    providerName: 'Adobe',
    officialUrl: 'https://www.adobe.com/products/firefly.html',
    pricingModel: PricingModel.FREEMIUM,
    hasFreePlan: true,
    pricingSummary: '무료 크레딧 제공 / Creative Cloud·Firefly Standard 유료',
    koreanSupport: KoreanSupportLevel.FULL,
    platforms: ['Web', 'Photoshop'],
    strengths: ['상업적 라이선스 우려가 낮은 공식 학습 데이터셋', 'Photoshop 생성형 채우기와 자연스러운 연동', '한국어 프롬프트 입력 및 텍스트 효과 지원'],
    limitations: ['고해상도 대량 생성 시 생성 크레딧 소모', 'Creative Cloud 미사용 팀은 단독 플랜 검토 필요'],
  },
  {
    slug: 'runway',
    title: 'Runway',
    summary: '텍스트나 정지 이미지를 짧은 홍보·시안 영상으로 변환하고 배경 제거·편집을 지원하는 AI 영상 제작 플랫폼입니다.',
    sourceUrl: 'https://runwayml.com',
    sourceName: 'Runway',
    domains: ['content-design', 'planning-slides'],
    aiUses: ['image-video'],
    tags: ['영상생성', '홍보시안', '모션'],
    toolKind: ToolKind.TOOL,
    providerName: 'Runway',
    officialUrl: 'https://runwayml.com',
    pricingModel: PricingModel.FREEMIUM,
    hasFreePlan: true,
    pricingSummary: '가입 시 무료 크레딧 제공 / Standard 월 $12~15',
    koreanSupport: KoreanSupportLevel.PARTIAL,
    platforms: ['Web', 'iOS'],
    strengths: ['제품 소개용 짧은 B-roll·모션 시안 빠른 제작', '카메라 무빙 및 모션 브러시 제어 가능', '브라우저 기반 편집 환경 제공'],
    limitations: ['긴 러닝타임 영상 일관성 유지는 반복 생성 필요', '고화질 대량 생성 시 크레딧 소모 빠름'],
  },
  {
    slug: 'elevenlabs',
    title: 'ElevenLabs',
    summary: '다국어 내레이션, 교육 영상 더빙, 사내 온보딩 오디오를 자연스러운 한국어 음성으로 합성합니다.',
    sourceUrl: 'https://elevenlabs.io',
    sourceName: 'ElevenLabs',
    domains: ['content-design', 'meetings-comms'],
    aiUses: ['audio-meetings'],
    tags: ['음성합성', '다국어더빙', '내레이션'],
    toolKind: ToolKind.TOOL,
    providerName: 'ElevenLabs',
    officialUrl: 'https://elevenlabs.io',
    pricingModel: PricingModel.FREEMIUM,
    hasFreePlan: true,
    pricingSummary: '월 10,000자 무료 / Starter 월 $5',
    koreanSupport: KoreanSupportLevel.FULL,
    platforms: ['Web'],
    strengths: ['자연스러운 한국어 억양과 감정 표현', '동일 화자 톤으로 29개 이상 언어 더빙 지원', '교육·홍보 영상 성우 녹음 비용·시간 절감'],
    limitations: ['전문 고유명사 발음은 음절 표기 보정 필요', '상업적 음성 복제는 동의·라이선스 확인 필수'],
  },
  {
    slug: 'figma-ai',
    title: 'Figma',
    summary: '기획 와이어프레임, UI 시안 제작, 디자인 시스템 정리와 AI 기반 레이어·텍스트 채우기를 지원합니다.',
    sourceUrl: 'https://www.figma.com',
    sourceName: 'Figma',
    domains: ['content-design', 'planning-slides'],
    aiUses: ['image-video', 'writing-summary'],
    tags: ['UI기획', '와이어프레임', '협업디자인'],
    toolKind: ToolKind.TOOL,
    providerName: 'Figma',
    officialUrl: 'https://www.figma.com',
    pricingModel: PricingModel.FREEMIUM,
    hasFreePlan: true,
    pricingSummary: 'Starter 무료 플랜 / Professional 유료',
    koreanSupport: KoreanSupportLevel.PARTIAL,
    platforms: ['Web', 'macOS', 'Windows'],
    strengths: ['실시간 공동 편집 및 코멘트 기반 리뷰', 'FigJam AI로 워크숍·플로우차트 자동 정리', '디자인-개발 핸드오프 표준 도구'],
    limitations: ['초보자는 오토레이아웃 적응 시간 필요', '일부 AI 기능은 유료 시트에서 점진 확대'],
  },
];

const SEED_GUIDES: SeedGuideInput[] = [
  // 1. docs-reports (2)
  {
    slug: 'guide-weekly-report-automation',
    title: '흩어진 업무 메모로 10분 만에 주간 보고서 초안 완성하기',
    summary: '메신저·노트에 흩어진 주간 업무 기록을 성과·이슈·다음 주 계획 구조의 보고서로 정리하는 실전 가이드입니다.',
    sourceUrl: 'https://www.anthropic.com/claude',
    sourceName: '알콕 에디터',
    isFeatured: true,
    domains: ['docs-reports'],
    aiUses: ['writing-summary'],
    tags: ['주간보고서', '문서작성', '요약'],
    difficulty: DifficultyLevel.BEGINNER,
    estimatedMinutes: 10,
    pricingModel: PricingModel.FREEMIUM,
    toc: [
      { id: 'prep', text: '1. 원재료 메모 모으기', level: 2 },
      { id: 'prompt', text: '2. 보고서 구조화 프롬프트 실행', level: 2 },
      { id: 'review', text: '3. 수치·일정 팩트체크', level: 2 },
    ],
    markdownBody: `## 1. 원재료 메모 모으기\n\n금요일 오후마다 한 주간 한 일을 기억해내느라 시간을 쓰지 않으려면, Slack·메일·메모장에 적은 단편 기록을 그대로 복사해 입력 재료로 삼는 것이 가장 빠릅니다.\n\n## 2. 보고서 구조화 프롬프트 실행\n\n역할, 독자(팀장/임원), 필수 섹션(핵심 성과·진행 중 이슈·차주 계획)을 지정하면 AI가 중복 항목을 묶고 보고용 문장으로 다듬어 줍니다.\n\n## 3. 수치·일정 팩트체크\n\nAI가 임의로 수치를 보간하지 않도록 원문에 없는 퍼센트나 날짜는 반드시 \`[확인 필요]\`로 남기게 지시한 뒤 최종 검토합니다.`,
    prompts: [
      {
        id: 'weekly-report-1',
        title: '주간 업무 보고서 구조화 프롬프트',
        prompt: '당신은 {{직무}} 팀의 실무자입니다. 아래 이번 주 업무 메모를 바탕으로 팀장 보고용 주간 보고서를 작성하세요.\n\n[작성 규칙]\n1. 섹션: 1) 이번 주 핵심 성과(3줄 이내) 2) 업무별 진행 현황 3) 이슈 및 리스크 4) 다음 주 계획\n2. 개조식(~함, ~완료)으로 간결하게 작성\n3. 메모에 없는 수치나 일정은 절대 추측하지 말고 [확인 필요]로 표시\n\n[업무 메모]\n{{업무_메모_붙여넣기}}',
        variables: ['직무', '업무_메모_붙여넣기'],
        expectedOutput: '개조식 4단 구성의 주간 보고서 초안',
        tips: '고객사명이나 개인정보는 익명 코드(A사, 담당자 B)로 치환한 뒤 입력하세요.',
      },
    ],
    cautions: '사내 대외비 매출 수치나 고객 개인정보는 반드시 마스킹한 뒤 프롬프트에 입력하세요.',
    recommendedToolSlugs: ['claude', 'chatgpt', 'notion-ai'],
  },
  {
    slug: 'guide-contract-proposal-review',
    title: '긴 제안서·계약서 핵심 조항과 리스크 1차 검토하기',
    summary: '수십 페이지 분량의 제안요청서(RFP)나 계약서 PDF에서 일정·위약금·책임 조항을 빠르게 추출하는 방법입니다.',
    sourceUrl: 'https://notebooklm.google.com',
    sourceName: '알콕 에디터',
    domains: ['docs-reports'],
    aiUses: ['writing-summary', 'search-analysis'],
    tags: ['RFP분석', '계약서검토', 'PDF요약'],
    difficulty: DifficultyLevel.PRACTICAL,
    estimatedMinutes: 15,
    pricingModel: PricingModel.FREE,
    toc: [
      { id: 'upload', text: '1. 원문 근거 기반 도구 선택', level: 2 },
      { id: 'checklist', text: '2. 필수 점검 조항 추출', level: 2 },
    ],
    markdownBody: `## 1. 원문 근거 기반 도구 선택\n\n문서 검토에서는 없는 내용을 지어내는 환각을 막는 것이 핵심입니다. NotebookLM이나 Claude에 PDF를 직접 첨부하고 반드시 조항 번호와 페이지를 함께 인용하도록 요구하세요.\n\n## 2. 필수 점검 조항 추출\n\n납기, 대금 지급 조건, 지식재산권 귀속, 해지·손해배상 조건을 표로 뽑아두면 법무·재무팀과 협의할 때 커뮤니케이션 비용이 크게 줄어듭니다.`,
    prompts: [
      {
        id: 'rfp-review-1',
        title: 'RFP / 계약서 핵심 조건 추출 표',
        prompt: '첨부한 문서만을 근거로 아래 항목을 표로 정리하세요. 문서에 명시되지 않은 내용은 "명시 없음"으로 적고, 각 항목마다 원문 조항 번호 또는 페이지를 함께 인용하세요.\n\n[점검 항목]\n- 목적 및 범위\n- 납기 / 주요 마일스톤\n- 대금 지급 조건\n- 지체상금 / 위약금 조항\n- 지식재산권 귀속\n- 모호하거나 추가 확인이 필요한 독소 조항 후보',
        variables: [],
        expectedOutput: '조항 번호가 인용된 6개 항목 비교표',
      },
    ],
    cautions: 'AI 요약은 실무 1차 스크리닝 용도이며, 최종 법률 판단은 반드시 법무 담당자 검토를 거치세요.',
    recommendedToolSlugs: ['notebooklm', 'claude'],
  },
  // 2. meetings-comms (2)
  {
    slug: 'guide-meeting-minutes-action-items',
    title: '회의 녹음 파일로 결정 사항·담당자·마감일 회의록 자동 정리하기',
    summary: '1시간짜리 회의 녹취록에서 잡담을 걷어내고 합의된 결정 사항과 Action Item 표만 깔끔하게 뽑아냅니다.',
    sourceUrl: 'https://clovanote.naver.com',
    sourceName: '알콕 에디터',
    isFeatured: true,
    domains: ['meetings-comms'],
    aiUses: ['audio-meetings', 'writing-summary'],
    tags: ['회의록', '액션아이템', '음성인식'],
    difficulty: DifficultyLevel.BEGINNER,
    estimatedMinutes: 10,
    pricingModel: PricingModel.FREEMIUM,
    toc: [
      { id: 'stt', text: '1. 한국어 녹취 텍스트 변환', level: 2 },
      { id: 'extract', text: '2. 결정 사항과 할 일 분리', level: 2 },
    ],
    markdownBody: `## 1. 한국어 녹취 텍스트 변환\n\nCLOVA Note로 회의 음성을 텍스트로 변환하면 화자별 발언이 시간순으로 정리됩니다.\n\n## 2. 결정 사항과 할 일 분리\n\n녹취록 전체를 그대로 공유하면 아무도 읽지 않습니다. 논의 배경 3줄, 최종 결정 사항, 담당자·마감일이 포함된 Action Item 표 형태로 재가공해 슬랙이나 노션에 올리세요.`,
    prompts: [
      {
        id: 'meeting-action-1',
        title: '회의 녹취록 Action Item 추출 프롬프트',
        prompt: '아래 회의 녹취록을 읽고 다음 형식으로 공유용 회의록을 작성하세요.\n\n1. 회의 한 줄 요약\n2. 확정된 결정 사항 (번호 목록)\n3. Action Items 표 (할 일 | 담당자 | 목표 기한 | 비고)\n4. 다음 회의 전 추가 확인이 필요한 미결 사항\n\n담당자나 기한이 대화에서 명확히 정해지지 않았으면 [미정]으로 표기하세요.\n\n[녹취록]\n{{녹취록_텍스트}}',
        variables: ['녹취록_텍스트'],
        expectedOutput: '결정 사항과 담당자별 Action Item 표',
      },
    ],
    cautions: '회의 참석자에게 녹음 사실을 사전 고지하고 사내 보안 정책을 준수하세요.',
    recommendedToolSlugs: ['clova-note', 'notion-ai', 'claude'],
  },
  {
    slug: 'guide-english-business-email',
    title: '톤앤매너 실수 없는 영문 비즈니스 메일·거절 답장 작성하기',
    summary: '해외 파트너·벤더에게 정중하면서도 의도가 분명하게 전달되는 영문 이메일을 3가지 톤으로 비교 작성합니다.',
    sourceUrl: 'https://www.deepl.com',
    sourceName: '알콕 에디터',
    domains: ['meetings-comms'],
    aiUses: ['writing-summary'],
    tags: ['영문메일', '비즈니스영어', '협업'],
    difficulty: DifficultyLevel.BEGINNER,
    estimatedMinutes: 8,
    pricingModel: PricingModel.FREE,
    toc: [
      { id: 'draft', text: '1. 한국어 핵심 의도 먼저 정리', level: 2 },
      { id: 'tone', text: '2. 3가지 톤 비교 및 역번역 검증', level: 2 },
    ],
    markdownBody: `## 1. 한국어 핵심 의도 먼저 정리\n\n처음부터 영어로 쓰려 하면 핵심 조건이 빠지기 쉽습니다. 먼저 한국어로 목적, 요청/거절 사유, 대안, 회신 희망 기한을 적으세요.\n\n## 2. 3가지 톤 비교 및 역번역 검증\n\nDeepL이나 ChatGPT로 영문 초안을 뽑은 뒤, 과도하게 공격적이거나 모호한 표현이 없는지 한국어로 역번역해 확인하면 오해를 줄일 수 있습니다.`,
    prompts: [
      {
        id: 'biz-email-1',
        title: '상황별 영문 비즈니스 메일 3종 생성',
        prompt: '아래 한국어 의도를 바탕으로 상대방({{상대방_관계}})에게 보낼 영문 이메일을 작성하세요.\n- 버전 A: 정중하고 격식 있는 톤\n- 버전 B: 간결하고 실무적인 톤\n각 버전 아래에 한국어 직역 요약을 함께 제공하세요.\n\n[전달할 핵심 내용]\n{{한국어_내용}}',
        variables: ['상대방_관계', '한국어_내용'],
        expectedOutput: '격식/실무형 영문 메일 2종 및 한국어 의미 검증',
      },
    ],
    cautions: '계약 조건 변경이나 견적 확정은 반드시 숫자와 날짜 단위를 재확인하세요.',
    recommendedToolSlugs: ['deepl', 'chatgpt', 'claude'],
  },
  // 3. research (2)
  {
    slug: 'guide-competitor-market-research',
    title: '출처 링크 검증으로 30분 만에 경쟁사·시장 동향 리서치 끝내기',
    summary: 'Perplexity의 출처 기반 검색과 NotebookLM의 문서 교차 비교를 결합해 신뢰할 수 있는 시장 조사표를 만듭니다.',
    sourceUrl: 'https://www.perplexity.ai',
    sourceName: '알콕 에디터',
    isFeatured: true,
    domains: ['research'],
    aiUses: ['search-analysis'],
    tags: ['시장조사', '경쟁사분석', '팩트체크'],
    difficulty: DifficultyLevel.PRACTICAL,
    estimatedMinutes: 20,
    pricingModel: PricingModel.FREEMIUM,
    toc: [
      { id: 'search', text: '1. Perplexity로 최신 공식 자료 탐색', level: 2 },
      { id: 'matrix', text: '2. 비교 매트릭스 구성 및 원문 확인', level: 2 },
    ],
    markdownBody: `## 1. Perplexity로 최신 공식 자료 탐색\n\n일반 챗봇에게 시장 규모나 경쟁사 가격을 물으면 옛날 학습 데이터를 답할 수 있습니다. Perplexity에 연도와 공식 홈페이지 기준을 명시해 출처 링크를 먼저 모으세요.\n\n## 2. 비교 매트릭스 구성 및 원문 확인\n\n수집한 3~5개 경쟁사의 공식 요금제 페이지·보도자료를 NotebookLM에 모아 비교표를 만들면 팀 내 공유용 리서치 문서가 완성됩니다.`,
    prompts: [
      {
        id: 'market-research-1',
        title: '경쟁사 3종 비교 조사 프롬프트',
        prompt: '{{산업_분야}} 분야의 주요 서비스 {{서비스_목록}}를 아래 기준으로 비교해 주세요. 공식 홈페이지 또는 최근 1년 내 공식 발표 자료를 우선 출처로 삼고, 확인되지 않은 항목은 "확인 불가"로 표기하세요.\n\n비교 항목: 핵심 타깃, 대표 기능 3가지, 요금 구조(무료 플랜 유무), 한국어/국내 지원 여부, 최근 주요 업데이트',
        variables: ['산업_분야', '서비스_목록'],
        expectedOutput: '출처 링크가 포함된 경쟁사 비교표',
      },
    ],
    cautions: '가격과 무료 한도는 자주 바뀌므로 인용된 공식 요금제 링크를 반드시 한 번 열어 확인하세요.',
    recommendedToolSlugs: ['perplexity', 'notebooklm', 'gemini'],
  },
  {
    slug: 'guide-paper-industry-report-digest',
    title: '영문 백서·논문 5편 한 번에 읽고 사내 공유용 1페이지 요약 만들기',
    summary: '긴 영문 PDF 리포트를 한 편씩 번역하지 않고, 여러 문서를 동시에 올려 공통 인사이트와 차이점을 뽑아냅니다.',
    sourceUrl: 'https://notebooklm.google.com',
    sourceName: '알콕 에디터',
    domains: ['research'],
    aiUses: ['search-analysis', 'writing-summary'],
    tags: ['영문백서', '논문요약', '인사이트'],
    difficulty: DifficultyLevel.PRACTICAL,
    estimatedMinutes: 15,
    pricingModel: PricingModel.FREE,
    toc: [
      { id: 'collect', text: '1. NotebookLM 노트북에 소스 일괄 추가', level: 2 },
      { id: 'synthesize', text: '2. 교차 질문으로 1페이지 브리프 생성', level: 2 },
    ],
    markdownBody: `## 1. NotebookLM 노트북에 소스 일괄 추가\n\nPDF 파일이나 웹 아티클 URL을 하나의 노트북에 최대 수십 개까지 묶으면 전체 문서를 한 맥락으로 질문할 수 있습니다.\n\n## 2. 교차 질문으로 1페이지 브리프 생성\n\n"세 보고서가 공통으로 지적하는 리스크와 우리 팀에 적용할 수 있는 시사점"을 물으면 단순 번역을 넘어 의사결정에 쓸 수 있는 요약을 얻습니다.`,
    prompts: [
      {
        id: 'paper-digest-1',
        title: '복수 영문 리포트 교차 요약 프롬프트',
        prompt: '업로드된 모든 자료를 종합해 우리 {{우리_팀_역할}} 팀을 위한 한국어 1페이지 브리프를 작성하세요.\n1. 자료 간 공통 합의점 3가지\n2. 서로 상충하거나 다른 관점\n3. 우리 업무에 즉시 검토할 만한 시사점 2가지\n모든 주장은 반드시 출처 문서명과 인용 번호를 명시하세요.',
        variables: ['우리_팀_역할'],
        expectedOutput: '인용 번호가 붙은 1페이지 한국어 리서치 브리프',
      },
    ],
    cautions: '그래프·도표 안의 작은 수치는 PDF 텍스트 추출에서 누락될 수 있으니 원문 도표를 확인하세요.',
    recommendedToolSlugs: ['notebooklm', 'claude', 'perplexity'],
  },
  // 4. data-sheets (2)
  {
    slug: 'guide-excel-formula-and-csv-cleaning',
    title: '복잡한 엑셀 수식·피벗 대신 AI로 데이터 정제와 수식 한 번에 얻기',
    summary: 'XLOOKUP, SUMIFS 조건부 집계부터 지저분한 텍스트 컬럼 분리까지 샘플 행 몇 줄로 정확한 엑셀 수식을 생성합니다.',
    sourceUrl: 'https://chatgpt.com',
    sourceName: '알콕 에디터',
    isFeatured: true,
    domains: ['data-sheets'],
    aiUses: ['automation-workflow', 'search-analysis'],
    tags: ['엑셀수식', '구글시트', '데이터정제'],
    difficulty: DifficultyLevel.BEGINNER,
    estimatedMinutes: 12,
    pricingModel: PricingModel.FREEMIUM,
    toc: [
      { id: 'schema', text: '1. 열 이름과 샘플 3행만 전달하기', level: 2 },
      { id: 'verify', text: '2. 예외 케이스(빈칸·오류값) 방어 수식 요청', level: 2 },
    ],
    markdownBody: `## 1. 열 이름과 샘플 3행만 전달하기\n\n원본 고객 데이터를 통째로 올릴 필요는 없습니다. 열 제목(A열: 날짜, B열: 부서, C열: 금액)과 가상의 샘플 3행만 알려줘도 정확한 수식을 얻을 수 있습니다.\n\n## 2. 예외 케이스 방어 수식 요청\n\n\`IFERROR\` 처리와 엑셀/구글시트 호환 여부를 함께 요청하면 실무 적용 시 \`#N/A\` 오류를 예방할 수 있습니다.`,
    prompts: [
      {
        id: 'excel-formula-1',
        title: '맞춤 엑셀/구글시트 수식 생성 프롬프트',
        prompt: '아래 시트 구조에서 원하는 결과를 얻는 {{도구_Excel_또는_GoogleSheets}} 수식을 작성해 주세요. 빈 셀이나 일치 값이 없을 때 오류가 나지 않도록 IFERROR 처리도 포함하고, 수식 각 부분의 역할을 1줄씩 설명해 주세요.\n\n[시트 구조]\n{{열_구조_및_샘플}}\n\n[원하는 결과]\n{{계산_목표}}',
        variables: ['도구_Excel_또는_GoogleSheets', '열_구조_및_샘플', '계산_목표'],
        expectedOutput: '복사 가능한 수식과 예외 처리 설명',
      },
    ],
    cautions: '수식 적용 후 반드시 2~3개 행을 손계산과 대조해 기준이 맞는지 검증하세요.',
    recommendedToolSlugs: ['chatgpt', 'microsoft-copilot', 'gemini'],
  },
  {
    slug: 'guide-nocode-daily-report-automation',
    title: 'Make·Zapier로 매일 아침 매출·문의 요약 슬랙 자동 알림 만들기',
    summary: '구글 시트나 폼에 쌓이는 고객 문의·일일 지표를 매일 정해진 시간에 AI가 요약해 팀 채널로 보내는 자동화 흐름입니다.',
    sourceUrl: 'https://www.make.com',
    sourceName: '알콕 에디터',
    domains: ['data-sheets', 'meetings-comms'],
    aiUses: ['automation-workflow'],
    tags: ['업무자동화', 'Make', '슬랙알림'],
    difficulty: DifficultyLevel.ADVANCED,
    estimatedMinutes: 25,
    pricingModel: PricingModel.FREEMIUM,
    toc: [
      { id: 'trigger', text: '1. 스케줄 트리거와 시트 조회 연결', level: 2 },
      { id: 'llm', text: '2. AI 요약 모듈 및 Slack 발송', level: 2 },
    ],
    markdownBody: `## 1. 스케줄 트리거와 시트 조회 연결\n\nMake에서 매일 오전 8시 30분 스케줄을 걸고 Google Sheets의 전날 행만 필터링해 가져옵니다.\n\n## 2. AI 요약 모듈 및 Slack 발송\n\n가져온 행 데이터를 JSON 또는 텍스트로 묶어 LLM 모듈에 전달해 "총 건수·주요 유형·긴급 대응 필요 건"을 5줄로 요약한 뒤 Slack 채널에 게시합니다.`,
    prompts: [
      {
        id: 'daily-digest-1',
        title: '자동화 파이프라인용 일일 요약 시스템 프롬프트',
        prompt: '당신은 운영 리포트 봇입니다. 아래 전일 고객 문의 데이터를 읽고 Slack 공지용 요약을 작성하세요.\n- 총 문의 건수와 전일 대비 특이사항\n- 상위 문의 카테고리 3개\n- 즉시 확인이 필요한 긴급 건(있을 경우만)\n길이는 모바일에서 한눈에 보이도록 300자 이내로 유지하세요.\n\n{{시트_데이터}}',
        variables: ['시트_데이터'],
        expectedOutput: '300자 이내의 Slack 일일 리포트 메시지',
      },
    ],
    cautions: '자동 발송 채널에는 개인 연락처·이메일 등 PII가 그대로 노출되지 않도록 필드를 제외하세요.',
    recommendedToolSlugs: ['make', 'zapier', 'n8n'],
  },
  // 5. planning-slides (2)
  {
    slug: 'guide-proposal-deck-in-30min',
    title: '기획 문서에서 발표용 슬라이드 초안까지 30분 워크플로우',
    summary: 'Claude로 탄탄한 스토리라인을 먼저 잡고 Gamma로 시각화한 뒤 PowerPoint에서 최종 마감하는 실무 조합입니다.',
    sourceUrl: 'https://help.gamma.app/en/',
    sourceName: '알콕 에디터',
    isFeatured: true,
    domains: ['planning-slides', 'docs-reports'],
    aiUses: ['writing-summary', 'image-video'],
    tags: ['발표자료', '기획안', '슬라이드'],
    difficulty: DifficultyLevel.BEGINNER,
    estimatedMinutes: 20,
    pricingModel: PricingModel.FREEMIUM,
    toc: [
      { id: 'outline', text: '1. 슬라이드별 핵심 메시지(1장 1메시지) 설계', level: 2 },
      { id: 'gamma', text: '2. Gamma 변환 후 PPTX 내보내기', level: 2 },
    ],
    markdownBody: `## 1. 슬라이드별 핵심 메시지 설계\n\n바로 슬라이드 툴에 긴 글을 넣으면 텍스트만 가득한 장표가 나옵니다. 먼저 AI로 8~10장 분량의 장표별 제목(결론형 문장)과 핵심 불릿 3개씩을 뽑으세요.\n\n## 2. Gamma 변환 후 PPTX 내보내기\n\n구조화된 개요를 Gamma에 붙여넣어 레이아웃을 생성한 뒤, PPTX로 내보내 회사 로고와 폰트만 맞추면 발표 준비 시간이 절반 이하로 줄어듭니다.`,
    prompts: [
      {
        id: 'deck-outline-1',
        title: '10장 발표 자료 스토리라인 설계 프롬프트',
        prompt: '주제 "{{발표_주제}}"에 대해 {{청중}}을 설득하는 10장 분량 발표 자료 아웃라인을 작성하세요.\n각 슬라이드마다 다음을 포함하세요:\n- 슬라이드 번호 및 결론형 헤드라인(1문장)\n- 본문 핵심 포인트 3개(각 20자 이내)\n- 추천 시각 요소(표, 비교 차트, 프로세스 도식 중 택1)',
        variables: ['발표_주제', '청중'],
        expectedOutput: '10장 구성의 결론형 슬라이드 아웃라인',
      },
    ],
    cautions: '자동 생성된 장표의 시장 통계나 예시 수치는 발표 전 실제 출처 데이터로 교체하세요.',
    recommendedToolSlugs: ['gamma', 'claude', 'microsoft-copilot'],
  },
  {
    slug: 'guide-prd-and-user-flow-design',
    title: '신규 기능 기획서(PRD)와 예외 케이스 체크리스트 한 번에 잡기',
    summary: '아이디어 메모를 바탕으로 문제 정의, 핵심 유저 플로우, MVP 범위, 놓치기 쉬운 엣지 케이스를 구조화합니다.',
    sourceUrl: 'https://www.notion.com/product/ai',
    sourceName: '알콕 에디터',
    domains: ['planning-slides'],
    aiUses: ['writing-summary', 'search-analysis'],
    tags: ['PRD', '서비스기획', '예외케이스'],
    difficulty: DifficultyLevel.PRACTICAL,
    estimatedMinutes: 20,
    pricingModel: PricingModel.FREEMIUM,
    toc: [
      { id: 'scope', text: '1. 문제 정의와 비목표(Non-goals) 설정', level: 2 },
      { id: 'edge', text: '2. QA·개발 리뷰 전 예외 케이스 도출', level: 2 },
    ],
    markdownBody: `## 1. 문제 정의와 비목표 설정\n\n좋은 기획서는 무엇을 할지뿐 아니라 이번에 무엇을 안 할지(Non-goals)가 분명해야 합니다.\n\n## 2. QA·개발 리뷰 전 예외 케이스 도출\n\n초안을 AI에게 리뷰어로 넘겨 "권한 오류, 빈 상태, 중복 클릭, 동시 수정 시나리오에서 빠진 정책"을 질문하면 개발 착수 후 재작업을 줄일 수 있습니다.`,
    prompts: [
      {
        id: 'prd-review-1',
        title: 'PRD 초안 & 예외 케이스 리뷰 프롬프트',
        prompt: '당신은 시니어 PM입니다. 아래 기능 아이디어를 바탕으로 간결한 PRD 초안을 작성하고, 개발·QA 리뷰에서 지적받을 만한 예외 케이스 5가지를 도출하세요.\n\n[아이디어]\n{{기능_아이디어}}',
        variables: ['기능_아이디어'],
        expectedOutput: '목표/비목표/유저플로우 포함 PRD 및 예외 케이스 5종',
      },
    ],
    cautions: '기존 시스템 정책이나 결제·개인정보 규정은 팀 내부 최신 기준과 대조해 확정하세요.',
    recommendedToolSlugs: ['claude', 'notion-ai', 'figma-ai'],
  },
  // 6. content-design (2)
  {
    slug: 'guide-sns-cardnews-and-banner',
    title: '카피라이팅부터 카드뉴스·배너 시안까지 1인 마케팅 제작 루틴',
    summary: '타깃 독자에 맞는 훅(Hook) 카피를 뽑고 Canva Magic Studio로 채널별 배너 비율까지 한 번에 맞춥니다.',
    sourceUrl: 'https://www.canva.dev/',
    sourceName: '알콕 에디터',
    isFeatured: true,
    domains: ['content-design'],
    aiUses: ['writing-summary', 'image-video'],
    tags: ['카드뉴스', '마케팅카피', '배너제작'],
    difficulty: DifficultyLevel.BEGINNER,
    estimatedMinutes: 15,
    pricingModel: PricingModel.FREEMIUM,
    toc: [
      { id: 'copy', text: '1. 채널 규격에 맞춘 짧은 카피 5종 생성', level: 2 },
      { id: 'visual', text: '2. Canva 템플릿 적용 및 리사이징', level: 2 },
    ],
    markdownBody: `## 1. 채널 규격에 맞춘 짧은 카피 5종 생성\n\n인스타그램 캐러셀이나 블로그 썸네일은 첫 장 15자 이내의 문구가 클릭률을 좌우합니다. 타깃의 페인포인트를 짚는 훅 문장을 5개 뽑아 비교하세요.\n\n## 2. Canva 템플릿 적용 및 리사이징\n\nCanva에서 한국어 가독성이 좋은 템플릿을 골라 카피를 채운 뒤, 유튜브 썸네일·블로그 배너·인스타 정방형으로 빠르게 변환합니다.`,
    prompts: [
      {
        id: 'marketing-copy-1',
        title: '카드뉴스 5장 구성 & 훅 카피 생성',
        prompt: '타깃 독자 "{{타깃_독자}}"를 대상으로 "{{홍보_주제}}"에 대한 인스타그램 카드뉴스 5장 카피를 작성하세요.\n- 1장(표지): 시선을 끄는 제목 15자 이내 + 부제 1줄 (훅 버전 3개 제안)\n- 2~4장: 핵심 문제/해결책/실제 혜택 (장당 40자 이내)\n- 5장: 행동 유도(CTA) 문구',
        variables: ['타깃_독자', '홍보_주제'],
        expectedOutput: '5장 구성 카드뉴스 카피 및 표지 훅 3안',
      },
    ],
    cautions: '상업적 광고 집행 시 폰트·스톡 이미지의 상업 이용 라이선스와 과장 광고 여부를 확인하세요.',
    recommendedToolSlugs: ['canva-magic-studio', 'wrtn', 'adobe-firefly'],
  },
  {
    slug: 'guide-promo-video-and-narration',
    title: '별도 촬영 없이 제품 소개 시안 영상과 한국어 내레이션 만들기',
    summary: '제품 스크린샷과 대본만으로 Runway 모션 시안과 ElevenLabs 한국어 성우 내레이션을 조합하는 방법입니다.',
    sourceUrl: 'https://runwayml.com',
    sourceName: '알콕 에디터',
    domains: ['content-design'],
    aiUses: ['image-video', 'audio-meetings'],
    tags: ['시안영상', '내레이션', '홍보콘텐츠'],
    difficulty: DifficultyLevel.ADVANCED,
    estimatedMinutes: 25,
    pricingModel: PricingModel.FREEMIUM,
    toc: [
      { id: 'script', text: '1. 30초 컷별 대본 및 화면 지문 작성', level: 2 },
      { id: 'voice', text: '2. 음성 합성 후 모션 클립 결합', level: 2 },
    ],
    markdownBody: `## 1. 30초 컷별 대본 및 화면 지문 작성\n\n영상 AI를 바로 돌리기 전에 5초 단위로 장면 설명과 15~20자 내레이션을 먼저 맞추면 크레딧 낭비를 막을 수 있습니다.\n\n## 2. 음성 합성 후 모션 클립 결합\n\nElevenLabs에서 한국어 화자 톤을 통일해 음성을 추출하고, Runway로 만든 짧은 배경 클립에 얹어 내부 리뷰용 시안을 빠르게 완성합니다.`,
    prompts: [
      {
        id: 'video-script-1',
        title: '30초 제품 소개 컷별 콘티 & 대본 생성',
        prompt: '"{{제품_또는_서비스}}"의 핵심 장점을 알리는 30초 세로형 홍보 영상 콘티를 6컷(컷당 5초) 표로 작성하세요.\n열 구성: 컷 번호 | 화면 묘사(영문 이미지/영상 프롬프트 키워드) | 한국어 내레이션(18자 이내) | 자막 문구',
        variables: ['제품_또는_서비스'],
        expectedOutput: '6컷 30초 영상 콘티 및 영문 생성 키워드',
      },
    ],
    cautions: '외부 공개용 영상에는 AI 생성 이미지/음성 사용 고지 여부와 초상권 이슈를 점검하세요.',
    recommendedToolSlugs: ['runway', 'elevenlabs', 'canva-magic-studio'],
  },
];

const SEED_NEWS: SeedNewsInput[] = [
  {
    slug: 'news-openai-enterprise-workflow-update',
    title: 'OpenAI, 업무용 문서·파일 분석 및 팀 협업 워크스페이스 기능 확대',
    summary: 'ChatGPT 업무 환경에서 대용량 문서 비교와 공유 프롬프트 템플릿 관리 기능이 강화되었습니다.',
    sourceType: SourceType.OFFICIAL,
    sourceUrl: 'https://openai.com/news/',
    sourceName: 'OpenAI News',
    isFeatured: true,
    domains: ['docs-reports', 'research'],
    aiUses: ['writing-summary', 'search-analysis'],
    tags: ['OpenAI', '업무협업', '문서분석'],
    keyPoints: [
      '팀 워크스페이스 내 반복 업무용 프롬프트·지침 공유 편의 개선',
      '스프레드시트·PDF 혼합 파일 분석 정확도 및 표 출력 안정성 향상',
      '엔터프라이즈·팀 요금제 기준 입력 데이터 모델 학습 제외 기본 적용',
    ],
    workImpact: '기획·운영팀에서 매주 반복 작성하는 주간 보고서와 데이터 요약 템플릿을 팀 공용 자산으로 표준화하기 쉬워졌습니다.',
    daysAgo: 1,
  },
  {
    slug: 'news-anthropic-claude-long-context-office',
    title: 'Anthropic, Claude Projects 기반 사내 문서 문맥 유지 및 편집 경험 고도화',
    summary: '여러 문서를 프로젝트 단위로 묶어 일관된 톤앤매너로 보고서·제안서를 다듬는 기능이 강화되었습니다.',
    sourceType: SourceType.OFFICIAL,
    sourceUrl: 'https://www.anthropic.com/news',
    sourceName: 'Anthropic News',
    isFeatured: true,
    domains: ['docs-reports', 'planning-slides'],
    aiUses: ['writing-summary'],
    tags: ['Anthropic', 'Claude', '장문편집'],
    keyPoints: [
      '프로젝트별 참고 문서·문체 가이드를 상시 참조해 초안 일관성 유지',
      'Artifacts 분할 화면으로 문서 특정 단락만 선택해 부분 수정 가능',
      '한국어 비즈니스 보고서 및 제안서 문맥 이해력 지속 개선',
    ],
    workImpact: '장문 제안서나 정책 문서를 작성할 때 매번 배경 설명을 다시 입력하지 않아도 팀 톤앤매너를 유지할 수 있습니다.',
    daysAgo: 2,
  },
  {
    slug: 'news-google-workspace-gemini-integration',
    title: 'Google, Workspace 내 Gemini 사이드패널로 Docs·Sheets·Gmail 연동 강화',
    summary: '별도 탭 전환 없이 드라이브 문서를 참조해 메일 답장과 시트 수식을 바로 생성할 수 있습니다.',
    sourceType: SourceType.OFFICIAL,
    sourceUrl: 'https://blog.google/technology/ai/',
    sourceName: 'Google AI Blog',
    isFeatured: true,
    domains: ['docs-reports', 'data-sheets', 'meetings-comms'],
    aiUses: ['writing-summary', 'automation-workflow'],
    tags: ['Google', 'Gemini', 'Workspace'],
    keyPoints: [
      'Gmail·Docs·Sheets 우측 사이드패널에서 드라이브 파일 즉시 참조',
      '다수 이메일 스레드 핵심 요약 및 후속 회신 초안 자동 생성',
      'Google Sheets 내 조건부 집계·표 정리 수식 자연어 제안 확대',
    ],
    workImpact: 'Google Workspace 중심 조직에서는 별도 외부 툴로 문서를 복사해 옮기는 보안·번거로움 없이 AI 보조를 받을 수 있습니다.',
    daysAgo: 3,
  },
  {
    slug: 'news-notebooklm-research-audio-expansion',
    title: 'NotebookLM, 다국어 소스 종합 분석 및 오디오 요약 활용성 확대',
    summary: '업로드한 PDF와 웹 자료만을 근거로 인용 번호를 붙이는 NotebookLM의 실무 리서치 활용이 늘고 있습니다.',
    sourceType: SourceType.OFFICIAL,
    sourceUrl: 'https://blog.google/technology/ai/',
    sourceName: 'Google AI Blog',
    domains: ['research'],
    aiUses: ['search-analysis', 'audio-meetings'],
    tags: ['NotebookLM', '리서치', '출처인용'],
    keyPoints: [
      '업로드된 원문 자료 기반 인용 링크 제공으로 환각 위험 최소화',
      '대량 보고서·규정집을 한 노트북에 모아 교차 질의 지원',
      '브리핑 문서·FAQ·스터디 가이드 원클릭 변환 기능 제공',
    ],
    workImpact: '외부 일반 검색이 아니라 사내 매뉴얼·입찰 문서·학술 자료를 근거로 정확한 Q&A를 해야 하는 리서치 업무에 즉시 활용 가능합니다.',
    daysAgo: 4,
  },
  {
    slug: 'news-microsoft-copilot-excel-powerpoint',
    title: 'Microsoft 365 Copilot, Word 문서 기반 PowerPoint 초안 및 Excel 분석 강화',
    summary: '기존 Word 기획서를 바탕으로 슬라이드 구조와 발표자 노트를 자동 생성하는 오피스 연계가 고도화되었습니다.',
    sourceType: SourceType.OFFICIAL,
    sourceUrl: 'https://blogs.microsoft.com/ai/',
    sourceName: 'Microsoft AI Blog',
    domains: ['planning-slides', 'data-sheets'],
    aiUses: ['writing-summary', 'automation-workflow'],
    tags: ['Microsoft', 'Copilot', '오피스자동화'],
    keyPoints: [
      'Word 문서를 참조해 기업 템플릿에 맞춘 PowerPoint 초안 생성',
      'Teams 회의록에서 미결 과제·담당자 자동 추출',
      'Excel 표 데이터 이상치 탐지 및 요약 차트 생성 지원',
    ],
    workImpact: '대기업·중견기업의 M365 표준 환경에서 문서→발표자료→회의 공유로 이어지는 전환 시간을 단축할 수 있습니다.',
    daysAgo: 5,
  },
  {
    slug: 'news-notion-ai-database-autofill',
    title: 'Notion AI, 프로젝트 데이터베이스 자동 요약 및 Q&A 검색 범위 확장',
    summary: '팀 위키와 태스크 DB에 쌓인 문서를 자연어로 질의하고 표 속성을 자동 채우는 활용이 확산되고 있습니다.',
    sourceType: SourceType.OFFICIAL,
    sourceUrl: 'https://www.notion.com/releases',
    sourceName: 'Notion Releases',
    domains: ['meetings-comms', 'planning-slides'],
    aiUses: ['search-analysis', 'writing-summary'],
    tags: ['Notion', '사내위키', '지식관리'],
    keyPoints: [
      '수백 개 위키 페이지를 횡단 검색해 담당자·정책 즉시 답변',
      '회의록 DB의 요약·키워드·액션 아이템 속성 자동 채우기',
      '연동된 외부 문서 컨텍스트까지 함께 참조하는 검색 지원',
    ],
    workImpact: '신규 입사자 온보딩이나 사내 규정 확인 시 담당자에게 일일이 물어보지 않고 위키에서 바로 답을 찾는 빈도가 높아집니다.',
    daysAgo: 6,
  },
  {
    slug: 'news-huggingface-open-korean-eval-trend',
    title: 'Hugging Face 오픈 모델 생태계, 경량 로컬 모델과 한국어 처리 성능 경쟁 가속',
    summary: '사내 서버에서 직접 구동할 수 있는 경량 오픈 모델의 요약·분류 성능이 실무 투입 수준으로 올라오고 있습니다.',
    sourceType: SourceType.OFFICIAL,
    sourceUrl: 'https://huggingface.co/blog',
    sourceName: 'Hugging Face Blog',
    domains: ['research', 'data-sheets'],
    aiUses: ['search-analysis', 'automation-workflow'],
    tags: ['오픈모델', '경량LLM', '온프레미스'],
    keyPoints: [
      '중소형 파라미터 모델의 다국어·한국어 추론 효율 향상',
      'JSON 구조화 출력 안정성 개선으로 실무 파이프라인 적합도 증가',
      '민감 데이터 외부 반출이 어려운 환경의 자체 호스팅 대안 확대',
    ],
    workImpact: '보안 규정상 외부 상용 API에 문서를 보내기 어려운 조직에서도 분류·요약 자동화 도입을 검토할 선택지가 넓어졌습니다.',
    daysAgo: 7,
  },
  {
    slug: 'news-vercel-ai-sdk-workflow-agents',
    title: 'Vercel, 실무형 AI 웹 앱과 구조화 출력(Structured Output) 개발 패턴 공개',
    summary: '자유 텍스트 응답 대신 검증 가능한 JSON 스키마 기반 AI 워크플로우 구축 사례가 늘고 있습니다.',
    sourceType: SourceType.OFFICIAL,
    sourceUrl: 'https://vercel.com/blog',
    sourceName: 'Vercel Blog',
    domains: ['data-sheets', 'planning-slides'],
    aiUses: ['automation-workflow'],
    tags: ['워크플로우', '구조화출력', '웹앱'],
    keyPoints: [
      '스키마 검증을 통과한 AI 응답만 업무 DB에 저장하는 패턴 확산',
      '다단계 에이전트 호출과 비용·실패율 모니터링 중요성 강조',
      '비정형 문서에서 표·체크리스트를 안정적으로 추출하는 기법 공유',
    ],
    workImpact: '단순 채팅을 넘어 사내 승인 대시보드나 자동 분류 시스템에 AI를 연결할 때 오류율을 크게 낮출 수 있습니다.',
    daysAgo: 8,
  },
  {
    slug: 'news-geeknews-ai-productivity-workflows',
    title: '개발·기획 실무자들의 AI 활용, 단발성 질문에서 반복 워크플로우 결합으로 이동',
    summary: '최근 실무 커뮤니티에서는 챗봇 한 번 묻고 끝내는 대신 템플릿·체크리스트·노코드 자동화를 묶는 사례가 주목받고 있습니다.',
    sourceType: SourceType.COMMUNITY,
    sourceUrl: 'https://news.hada.io',
    sourceName: 'GeekNews',
    domains: ['docs-reports', 'data-sheets'],
    aiUses: ['automation-workflow', 'writing-summary'],
    tags: ['실무트렌드', '프롬프트템플릿', '자동화'],
    keyPoints: [
      '긴 원문 입력과 명확한 출력 포맷 지정이 품질을 좌우한다는 공감대 형성',
      'AI 초안 생성 후 사람 검증(Human-in-the-loop) 단계 필수 배치',
      '자주 쓰는 프롬프트를 팀 내 표준 자산으로 축적하는 문화 확산',
    ],
    workImpact: '개인별 감에 의존하던 AI 활용을 팀 공통 가이드와 복사 가능한 프롬프트 블록으로 표준화할 필요가 커졌습니다.',
    daysAgo: 9,
  },
  {
    slug: 'news-techcrunch-ai-search-citation-standard',
    title: 'AI 검색 서비스 경쟁 핵심, 답변 속도에서 출처 투명성과 검증 정확도로 이동',
    summary: '주요 AI 검색·어시스턴트들이 비즈니스 사용자 신뢰를 확보하기 위해 원문 인용과 최신성 표시를 강화하고 있습니다.',
    sourceType: SourceType.MEDIA,
    sourceUrl: 'https://techcrunch.com/category/artificial-intelligence/',
    sourceName: 'TechCrunch AI',
    domains: ['research'],
    aiUses: ['search-analysis'],
    tags: ['AI검색', '출처투명성', '신뢰성'],
    keyPoints: [
      '문장별 원문 링크와 발행일 표시가 업무용 AI 선택의 핵심 기준으로 부상',
      '요금제·기능 변경 등 변동이 잦은 정보의 최신성 관리 수요 증가',
      '기업 도입 시 오정보 리스크를 줄이는 검증 프로세스 중요성 확대',
    ],
    workImpact: '리서치나 기획서 작성 시 AI 답변을 그대로 인용하지 않고 출처 URL과 최종 검증일을 함께 확인하는 습관이 중요합니다.',
    daysAgo: 10,
  },
];

async function refreshSearchVector(client: PrismaClient, contentId: string): Promise<void> {
  await client.$executeRaw`
    UPDATE contents c
    SET search_vector = (
      setweight(to_tsvector('simple', coalesce(c.title, '')), 'A') ||
      setweight(
        to_tsvector(
          'simple',
          coalesce(c.summary, '') || ' ' || coalesce(
            (SELECT string_agg(t.name, ' ')
             FROM content_tags ct
             JOIN tags t ON t.id = ct.tag_id
             WHERE ct.content_id = c.id),
            ''
          )
        ),
        'B'
      ) ||
      setweight(
        to_tsvector(
          'simple',
          coalesce((SELECT gd.markdown_body FROM guide_details gd WHERE gd.content_id = c.id), '') || ' ' ||
          coalesce((SELECT array_to_string(td.strengths, ' ') FROM tool_details td WHERE td.content_id = c.id), '') || ' ' ||
          coalesce((SELECT nd.work_impact FROM news_details nd WHERE nd.content_id = c.id), '')
        ),
        'C'
      )
    )
    WHERE c.id = ${contentId}::uuid
  `;
}

function toTagSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9가-힣_-]/g, '');
}

async function syncCategoriesAndTags(
  client: PrismaClient,
  contentId: string,
  categoryMap: Map<string, string>,
  categorySlugs: string[],
  tagNames: string[],
): Promise<void> {
  await client.contentCategory.deleteMany({ where: { contentId } });
  const uniqueCategoryIds = [
    ...new Set(
      categorySlugs
        .map((slug) => categoryMap.get(slug))
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  if (uniqueCategoryIds.length > 0) {
    await client.contentCategory.createMany({
      data: uniqueCategoryIds.map((categoryId) => ({ contentId, categoryId })),
      skipDuplicates: true,
    });
  }

  await client.contentTag.deleteMany({ where: { contentId } });
  for (const name of tagNames) {
    const slug = toTagSlug(name);
    if (!slug) continue;
    const tag = await client.tag.upsert({
      where: { slug },
      update: { name },
      create: { id: uuidv7(), slug, name },
      select: { id: true },
    });
    await client.contentTag.create({
      data: { contentId, tagId: tag.id },
    });
  }
}

export async function seedContents(client: PrismaClient): Promise<void> {
  const categories = await client.category.findMany({
    select: { id: true, slug: true },
  });
  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]));
  const now = new Date();
  const contentIdBySlug = new Map<string, string>();
  const seededContentIds: string[] = [];

  for (const tool of SEED_TOOLS) {
    const existing = await client.content.findUnique({
      where: { slug: tool.slug },
      select: { id: true },
    });
    const contentId = existing?.id ?? uuidv7();

    await client.content.upsert({
      where: { slug: tool.slug },
      update: {
        type: ContentType.TOOL,
        title: tool.title,
        summary: tool.summary,
        publishStatus: PublishStatus.PUBLISHED,
        verificationStatus: VerificationStatus.VALID,
        verifiedAt: now,
        publishedAt: now,
        sourceType: SourceType.OFFICIAL,
        sourceUrl: tool.sourceUrl,
        sourceName: tool.sourceName,
        isFeatured: Boolean(tool.isFeatured),
        deletedAt: null,
      },
      create: {
        id: contentId,
        type: ContentType.TOOL,
        slug: tool.slug,
        title: tool.title,
        summary: tool.summary,
        publishStatus: PublishStatus.PUBLISHED,
        verificationStatus: VerificationStatus.VALID,
        verifiedAt: now,
        publishedAt: now,
        sourceType: SourceType.OFFICIAL,
        sourceUrl: tool.sourceUrl,
        sourceName: tool.sourceName,
        isFeatured: Boolean(tool.isFeatured),
      },
    });

    await client.toolDetail.upsert({
      where: { contentId },
      update: {
        toolKind: tool.toolKind,
        providerName: tool.providerName,
        officialUrl: tool.officialUrl,
        pricingModel: tool.pricingModel,
        hasFreePlan: tool.hasFreePlan,
        pricingSummary: tool.pricingSummary,
        koreanSupport: tool.koreanSupport,
        platforms: tool.platforms,
        strengths: tool.strengths,
        limitations: tool.limitations,
      },
      create: {
        contentId,
        toolKind: tool.toolKind,
        providerName: tool.providerName,
        officialUrl: tool.officialUrl,
        pricingModel: tool.pricingModel,
        hasFreePlan: tool.hasFreePlan,
        pricingSummary: tool.pricingSummary,
        koreanSupport: tool.koreanSupport,
        platforms: tool.platforms,
        strengths: tool.strengths,
        limitations: tool.limitations,
      },
    });

    await syncCategoriesAndTags(
      client,
      contentId,
      categoryMap,
      [...tool.domains, ...tool.aiUses],
      tool.tags,
    );
    contentIdBySlug.set(tool.slug, contentId);
    seededContentIds.push(contentId);
  }

  for (const guide of SEED_GUIDES) {
    const existing = await client.content.findUnique({
      where: { slug: guide.slug },
      select: { id: true },
    });
    const contentId = existing?.id ?? uuidv7();

    await client.content.upsert({
      where: { slug: guide.slug },
      update: {
        type: ContentType.GUIDE,
        title: guide.title,
        summary: guide.summary,
        publishStatus: PublishStatus.PUBLISHED,
        verificationStatus: VerificationStatus.VALID,
        verifiedAt: now,
        publishedAt: now,
        sourceType: SourceType.OFFICIAL,
        sourceUrl: guide.sourceUrl,
        sourceName: guide.sourceName,
        isFeatured: Boolean(guide.isFeatured),
        deletedAt: null,
      },
      create: {
        id: contentId,
        type: ContentType.GUIDE,
        slug: guide.slug,
        title: guide.title,
        summary: guide.summary,
        publishStatus: PublishStatus.PUBLISHED,
        verificationStatus: VerificationStatus.VALID,
        verifiedAt: now,
        publishedAt: now,
        sourceType: SourceType.OFFICIAL,
        sourceUrl: guide.sourceUrl,
        sourceName: guide.sourceName,
        isFeatured: Boolean(guide.isFeatured),
      },
    });

    await client.guideDetail.upsert({
      where: { contentId },
      update: {
        difficulty: guide.difficulty,
        estimatedMinutes: guide.estimatedMinutes,
        pricingModel: guide.pricingModel,
        markdownBody: guide.markdownBody,
        prompts: guide.prompts as unknown as Prisma.InputJsonValue,
        cautions: guide.cautions,
        toc: guide.toc as unknown as Prisma.InputJsonValue,
      },
      create: {
        contentId,
        difficulty: guide.difficulty,
        estimatedMinutes: guide.estimatedMinutes,
        pricingModel: guide.pricingModel,
        markdownBody: guide.markdownBody,
        prompts: guide.prompts as unknown as Prisma.InputJsonValue,
        cautions: guide.cautions,
        toc: guide.toc as unknown as Prisma.InputJsonValue,
      },
    });

    await syncCategoriesAndTags(
      client,
      contentId,
      categoryMap,
      [...guide.domains, ...guide.aiUses],
      guide.tags,
    );

    await client.contentRelation.deleteMany({
      where: { fromContentId: contentId, relationType: 'RECOMMENDED_TOOL' },
    });
    const relTargets = guide.recommendedToolSlugs
      .map((slug, index) => ({
        toContentId: contentIdBySlug.get(slug),
        sortOrder: index + 1,
      }))
      .filter((item): item is { toContentId: string; sortOrder: number } => Boolean(item.toContentId));
    if (relTargets.length > 0) {
      await client.contentRelation.createMany({
        data: relTargets.map((item) => ({
          fromContentId: contentId,
          toContentId: item.toContentId,
          relationType: 'RECOMMENDED_TOOL',
          sortOrder: item.sortOrder,
        })),
        skipDuplicates: true,
      });
    }

    contentIdBySlug.set(guide.slug, contentId);
    seededContentIds.push(contentId);
  }

  for (const news of SEED_NEWS) {
    const existing = await client.content.findUnique({
      where: { slug: news.slug },
      select: { id: true },
    });
    const contentId = existing?.id ?? uuidv7();
    const publishedAt = new Date(now.getTime() - news.daysAgo * 24 * 60 * 60 * 1000);

    await client.content.upsert({
      where: { slug: news.slug },
      update: {
        type: ContentType.NEWS,
        title: news.title,
        summary: news.summary,
        publishStatus: PublishStatus.PUBLISHED,
        verificationStatus: VerificationStatus.VALID,
        verifiedAt: now,
        publishedAt,
        sourceType: news.sourceType,
        sourceUrl: news.sourceUrl,
        sourceName: news.sourceName,
        isFeatured: Boolean(news.isFeatured),
        deletedAt: null,
      },
      create: {
        id: contentId,
        type: ContentType.NEWS,
        slug: news.slug,
        title: news.title,
        summary: news.summary,
        publishStatus: PublishStatus.PUBLISHED,
        verificationStatus: VerificationStatus.VALID,
        verifiedAt: now,
        publishedAt,
        sourceType: news.sourceType,
        sourceUrl: news.sourceUrl,
        sourceName: news.sourceName,
        isFeatured: Boolean(news.isFeatured),
      },
    });

    await client.newsDetail.upsert({
      where: { contentId },
      update: {
        keyPoints: news.keyPoints,
        workImpact: news.workImpact,
        originalPublishedAt: publishedAt,
      },
      create: {
        contentId,
        keyPoints: news.keyPoints,
        workImpact: news.workImpact,
        originalPublishedAt: publishedAt,
      },
    });

    await syncCategoriesAndTags(
      client,
      contentId,
      categoryMap,
      [...news.domains, ...news.aiUses],
      news.tags,
    );
    seededContentIds.push(contentId);
  }

  for (const contentId of seededContentIds) {
    await refreshSearchVector(client, contentId);
  }
}
