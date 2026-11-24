import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import type { DiscordWebhookNotifier } from '../notify/discord-webhook.notifier';
import type { PrismaService } from '../prisma/prisma.service';
import type { AiProviderClient } from './ai-provider.interface';
import { AiRouterService } from './ai-router.service';

describe('AiRouterService Circuit Breaker & Cost Guardrails', () => {
  const schema = z.object({ ok: z.boolean() });

  function createDeps() {
    const hermes: AiProviderClient = {
      name: 'hermes',
      generateRawJson: jest.fn(),
    };
    const gemini: AiProviderClient = {
      name: 'gemini',
      generateRawJson: jest.fn(),
    };
    const prisma = {
      aiUsageLog: {
        count: jest.fn().mockResolvedValue(0),
        aggregate: jest.fn().mockResolvedValue({
          _sum: { inputTokens: 0, outputTokens: 0, estimatedCostUsd: 0 },
        }),
        create: jest.fn().mockResolvedValue({ id: 'log-1' }),
      },
    } as unknown as PrismaService;
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'AI_PRIMARY_PROVIDER') return 'hermes';
        if (key === 'AI_MONTHLY_BUDGET_USD') return 15;
        return undefined;
      }),
    } as unknown as ConfigService;
    const discordNotifier = {
      sendAlert: jest.fn().mockResolvedValue(undefined),
    } as unknown as DiscordWebhookNotifier;

    const router = new AiRouterService(hermes, gemini, prisma, configService, discordNotifier);
    return { hermes, gemini, prisma, discordNotifier, router };
  }

  it('bypasses primary for 10m after 3 consecutive primary failures', async () => {
    const { hermes, gemini, router } = createDeps();
    (hermes.generateRawJson as jest.Mock).mockRejectedValue(new Error('hermes timeout'));
    (gemini.generateRawJson as jest.Mock).mockResolvedValue({
      rawJson: { ok: true },
      usage: {
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        inputTokens: 10,
        outputTokens: 10,
        estimatedCostUsd: 0.001,
      },
      latencyMs: 50,
    });

    for (let i = 0; i < 3; i += 1) {
      const res = await router.generateJsonWithGuardrails(
        { systemPrompt: 's', userPrompt: 'u', schema },
        { taskType: 'PASS1_SCREEN' },
      );
      expect(res.usage.provider).toBe('gemini');
    }
    expect(hermes.generateRawJson).toHaveBeenCalledTimes(3);

    // 4th call should go straight to gemini without calling hermes
    await router.generateJsonWithGuardrails(
      { systemPrompt: 's', userPrompt: 'u', schema },
      { taskType: 'PASS1_SCREEN' },
    );
    expect(hermes.generateRawJson).toHaveBeenCalledTimes(3);
    expect(gemini.generateRawJson).toHaveBeenCalledTimes(4);
  });

  it('pauses worker and sends Discord alert after 5 combined consecutive failures', async () => {
    const { hermes, gemini, discordNotifier, router } = createDeps();
    (hermes.generateRawJson as jest.Mock).mockRejectedValue(new Error('hermes down'));
    (gemini.generateRawJson as jest.Mock).mockRejectedValue(new Error('gemini down'));

    const pauseSpy = jest.fn();
    router.onWorkerPause(pauseSpy);

    // 3 calls x 2 providers = 6 combined failures (>= 5 on 3rd call)
    for (let i = 0; i < 3; i += 1) {
      await expect(
        router.generateJsonWithGuardrails(
          { systemPrompt: 's', userPrompt: 'u', schema },
          { taskType: 'PASS2_DRAFT' },
        ),
      ).rejects.toThrow();
    }

    expect(router.isWorkerPaused()).toBe(true);
    expect(pauseSpy).toHaveBeenCalledTimes(1);
    expect(discordNotifier.sendAlert).toHaveBeenCalledWith(
      'AI_DRAFT 워커 일시 정지',
      expect.any(String),
      'error',
    );
  });

  it('enforces daily 30-item automatic cap while allowing manual URL bypass', async () => {
    const { hermes, prisma, router } = createDeps();
    (prisma.aiUsageLog.count as jest.Mock).mockResolvedValue(30);
    (hermes.generateRawJson as jest.Mock).mockResolvedValue({
      rawJson: { ok: true },
      usage: {
        provider: 'hermes',
        model: 'hermes-default',
        inputTokens: 10,
        outputTokens: 10,
        estimatedCostUsd: 0,
      },
      latencyMs: 20,
    });

    await expect(
      router.generateJsonWithGuardrails(
        { systemPrompt: 's', userPrompt: 'u', schema },
        { taskType: 'PASS2_DRAFT', isManual: false },
      ),
    ).rejects.toMatchObject({ errorCode: 'AI_DAILY_CAP_REACHED' });

    const manualRes = await router.generateJsonWithGuardrails(
      { systemPrompt: 's', userPrompt: 'u', schema },
      { taskType: 'PASS2_DRAFT', isManual: true },
    );
    expect(manualRes.data.ok).toBe(true);
  });

  it('blocks automatic calls and sends Discord alert when monthly $15 hard cap is reached', async () => {
    const { prisma, discordNotifier, router } = createDeps();
    (prisma.aiUsageLog.aggregate as jest.Mock).mockResolvedValue({
      _sum: { inputTokens: 1000, outputTokens: 1000, estimatedCostUsd: 15.0 },
    });

    await expect(
      router.generateJsonWithGuardrails(
        { systemPrompt: 's', userPrompt: 'u', schema },
        { taskType: 'PASS2_DRAFT', isManual: false },
      ),
    ).rejects.toMatchObject({ errorCode: 'AI_MONTHLY_BUDGET_EXCEEDED' });

    expect(discordNotifier.sendAlert).toHaveBeenCalledWith(
      '월간 AI 비용 하드캡 도달',
      expect.any(String),
      'error',
    );
  });
});
