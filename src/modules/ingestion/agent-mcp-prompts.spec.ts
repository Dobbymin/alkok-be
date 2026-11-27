import { ContentType } from '@prisma/client';
import {
  AGENT_MCP_PRIMARY_TAG,
  buildPass1SystemPrompt,
  buildPass2SystemPrompt,
  isAgentOrMcpTopic,
} from './agent-mcp-prompts';

describe('agent-mcp-prompts', () => {
  it('detects agent/skills/MCP topics from title, url, or rawText', () => {
    expect(
      isAgentOrMcpTopic({
        title: 'Two Years of MCP Builders',
        url: 'https://blog.modelcontextprotocol.io/posts/mcp-turns-two/',
        rawText: 'Model Context Protocol remote servers and apps.',
      }),
    ).toBe(true);

    expect(
      isAgentOrMcpTopic({
        title: 'Claude Skills로 보고서 자동화하기',
        url: 'https://example.com/post',
        rawText: 'SKILL.md 지침서를 활용한 AI 에이전트 워크플로우',
      }),
    ).toBe(true);

    expect(
      isAgentOrMcpTopic({
        title: '엑셀 SUMIFS 수식 정리',
        url: 'https://example.com/excel',
        rawText: '매출 합계를 조건별로 구하는 스프레드시트 함수 안내입니다.',
      }),
    ).toBe(false);
  });

  it('adds non-technical translation rules to Pass 1 and Pass 2 prompts only for agent/MCP topics', () => {
    const pass1Agent = buildPass1SystemPrompt(true);
    expect(pass1Agent).toContain(AGENT_MCP_PRIMARY_TAG);
    expect(pass1Agent).toContain('3점 이상');

    const pass1Normal = buildPass1SystemPrompt(false);
    expect(pass1Normal).not.toContain(AGENT_MCP_PRIMARY_TAG);

    const pass2NewsAgent = buildPass2SystemPrompt(ContentType.NEWS, true);
    expect(pass2NewsAgent).toContain('한 줄 개념 설명');
    expect(pass2NewsAgent).toContain('비개발자 도입 난이도');
    expect(pass2NewsAgent).toContain('대안 웹 AI 서비스 비교');
    expect(pass2NewsAgent).toContain('workImpact');

    const pass2NewsNormal = buildPass2SystemPrompt(ContentType.NEWS, false);
    expect(pass2NewsNormal).not.toContain('비개발자 도입 난이도');

    const pass2SkillAgent = buildPass2SystemPrompt(ContentType.SKILL, true);
    expect(pass2SkillAgent).toContain('skillKind');
    expect(pass2SkillAgent).toContain('webAlternative');
  });
});
