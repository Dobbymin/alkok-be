export interface FeaturedTopicPreset {
  slug: string;
  name: string;
  description: string;
  tagSlugs: string[];
}

export const FEATURED_TOPICS: FeaturedTopicPreset[] = [
  {
    slug: 'agent-skills-mcp',
    name: '에이전트·스킬·MCP',
    description: '설치 없이 이해하는 AI 에이전트·MCP 개념과 비개발자 웹 AI 대안 비교',
    tagSlugs: ['에이전트-스킬-mcp', 'mcp', 'ai-에이전트', 'claude-skills', '웹-대안-비교'],
  },
];
