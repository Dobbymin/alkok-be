import { ContentType, PublishStatus, SourceType, VerificationStatus } from '@prisma/client';
import type { AiRouterService } from '../../infra/ai/ai-router.service';
import type { PrismaService } from '../../infra/prisma/prisma.service';
import type { SearchVectorService } from '../../infra/prisma/search-vector.service';
import { AGENT_MCP_PRIMARY_TAG } from './agent-mcp-prompts';
import { AiDraftService } from './ai-draft.service';
import type { JobWorkerService } from './job-worker.service';

describe('AiDraftService (agent/MCP topic pipeline)', () => {
  const createMockSetup = () => {
    const createdContents: Array<Record<string, unknown>> = [];
    const createdTags: string[] = [];

    const tx = {
      content: {
        create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
          createdContents.push(data);
          return Promise.resolve(data);
        }),
      },
      newsDetail: { create: jest.fn().mockResolvedValue({}) },
      toolDetail: { create: jest.fn().mockResolvedValue({}) },
      guideDetail: { create: jest.fn().mockResolvedValue({}) },
      category: { findMany: jest.fn().mockResolvedValue([]) },
      contentCategory: { createMany: jest.fn().mockResolvedValue({}) },
      tag: {
        upsert: jest.fn(({ where }: { where: { slug: string } }) => {
          createdTags.push(where.slug);
          return Promise.resolve({ id: `tag-${where.slug}`, slug: where.slug, name: where.slug });
        }),
      },
      contentTag: { create: jest.fn().mockResolvedValue({}) },
    };

    const prisma = {
      content: { findUnique: jest.fn().mockResolvedValue(null) },
      rawDocument: { findUnique: jest.fn() },
      $transaction: jest.fn((cb: (client: typeof tx) => Promise<unknown>) => cb(tx)),
    } as unknown as PrismaService;

    const aiRouterService = {
      onWorkerPause: jest.fn(),
      generateJsonWithGuardrails: jest.fn(),
    } as unknown as jest.Mocked<AiRouterService>;

    const jobWorkerService = {
      registerHandler: jest.fn(),
      pauseAiDraft: jest.fn(),
    } as unknown as JobWorkerService;

    const searchVectorService = {
      refresh: jest.fn().mockResolvedValue(undefined),
    } as unknown as SearchVectorService;

    const service = new AiDraftService(
      prisma,
      aiRouterService,
      jobWorkerService,
      searchVectorService,
    );

    return { service, prisma, aiRouterService, createdContents, createdTags };
  };

  it('applies non-technical translation prompts and tags for RSS agent/MCP documents', async () => {
    const { service, prisma, aiRouterService, createdContents, createdTags } = createMockSetup();
    (prisma.rawDocument.findUnique as jest.Mock).mockResolvedValue({
      id: 'raw-mcp-1',
      url: 'https://blog.modelcontextprotocol.io/posts/mcp-turns-two/',
      title: 'Two Years of MCP Builders',
      rawText: 'Model Context Protocol enables AI agents to connect with tools.',
      publishedAt: new Date(),
      meta: {},
      source: { name: 'Model Context Protocol Blog', sourceType: SourceType.OFFICIAL },
    });

    aiRouterService.generateJsonWithGuardrails
      .mockResolvedValueOnce({
        data: {
          relevanceScore: 4,
          recommendedType: ContentType.NEWS,
          workDomains: ['docs-reports'],
          aiUses: ['automation-workflow'],
          suggestedTags: ['mcp', 'ai-에이전트'],
        },
        usage: {
          provider: 'hermes',
          model: 'hermes',
          inputTokens: 100,
          outputTokens: 50,
          estimatedCostUsd: 0,
        },
        latencyMs: 10,
      })
      .mockResolvedValueOnce({
        data: {
          title: 'MCP 생태계 확장: 비개발자 실무 영향',
          summary: '설치형 MCP와 웹 AI 대안을 비교합니다.',
          workDomains: ['docs-reports'],
          aiUses: ['automation-workflow'],
          tags: ['mcp'],
          evidenceNotes: ['원문 근거 1'],
          unverifiedFields: [],
          keyPoints: ['요약 1', '요약 2', '요약 3'],
          workImpact:
            '한 줄 개념: USB-C 포트처럼 도구를 연결합니다. 도입 난이도: 웹 커넥터는 즉시 사용. 대안: Claude Projects와 Zapier.',
        },
        usage: {
          provider: 'hermes',
          model: 'hermes',
          inputTokens: 150,
          outputTokens: 100,
          estimatedCostUsd: 0,
        },
        latencyMs: 12,
      });

    const res = await service.processRawDocument('raw-mcp-1');
    expect(res.screenedOut).toBe(false);
    expect(aiRouterService.generateJsonWithGuardrails).toHaveBeenCalledTimes(2);

    const pass1Req = aiRouterService.generateJsonWithGuardrails.mock.calls[0][0];
    const pass2Req = aiRouterService.generateJsonWithGuardrails.mock.calls[1][0];
    expect(pass1Req.systemPrompt).toContain(AGENT_MCP_PRIMARY_TAG);
    expect(pass2Req.systemPrompt).toContain('대안 웹 AI 서비스 비교');

    expect(createdContents[0].publishStatus).toBe(PublishStatus.IN_REVIEW);
    expect(createdContents[0].verificationStatus).toBe(VerificationStatus.VALID);
    expect(createdContents[0].aiMetadata).toMatchObject({ topicTrack: 'agent-skills-mcp' });
    expect(createdTags).toContain(AGENT_MCP_PRIMARY_TAG);
  });

  it('applies non-technical translation prompts for manual URL ingestion (skipScreening: true)', async () => {
    const { service, prisma, aiRouterService, createdContents, createdTags } = createMockSetup();
    (prisma.rawDocument.findUnique as jest.Mock).mockResolvedValue({
      id: 'raw-skill-1',
      url: 'https://www.anthropic.com/engineering/claude-skills',
      title: 'Building with Claude Skills',
      rawText: 'How SKILL.md packages prompts and scripts for Claude Code.',
      publishedAt: null,
      meta: { manual: true },
      source: null,
    });

    aiRouterService.generateJsonWithGuardrails.mockResolvedValueOnce({
      data: {
        title: 'Claude Skills 비개발자 실무 번역',
        summary: '설치 없이 Claude Projects로 대체하는 방법을 정리합니다.',
        workDomains: ['docs-reports'],
        aiUses: ['automation-workflow'],
        tags: ['claude-skills'],
        evidenceNotes: ['원문 근거'],
        unverifiedFields: [],
        keyPoints: ['핵심 1', '핵심 2', '핵심 3'],
        workImpact: '한 줄 개념 · 도입 난이도 · 웹 대안 비교',
      },
      usage: {
        provider: 'hermes',
        model: 'hermes',
        inputTokens: 120,
        outputTokens: 80,
        estimatedCostUsd: 0,
      },
      latencyMs: 10,
    });

    await service.processRawDocument('raw-skill-1', { skipScreening: true });
    expect(aiRouterService.generateJsonWithGuardrails).toHaveBeenCalledTimes(1);
    const pass2Req = aiRouterService.generateJsonWithGuardrails.mock.calls[0][0];
    expect(pass2Req.systemPrompt).toContain('비개발자 도입 난이도');
    expect(createdTags).toContain(AGENT_MCP_PRIMARY_TAG);
    expect(createdContents[0].aiMetadata).toMatchObject({ topicTrack: 'agent-skills-mcp' });
  });
});
