import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException } from '../../common/exceptions/app.exception';
import { uuidv7 } from '../../common/utils/uuidv7';
import { DiscordWebhookNotifier } from '../notify/discord-webhook.notifier';
import { PrismaService } from '../prisma/prisma.service';
import {
  type AiJsonRequest,
  type AiJsonResponse,
  type AiProviderClient,
  GEMINI_PROVIDER,
  HERMES_PROVIDER,
} from './ai-provider.interface';

const DAILY_AUTO_DRAFT_CAP = 30;
const PRIMARY_BYPASS_MS = 10 * 60 * 1000;

@Injectable()
export class AiRouterService {
  private readonly logger = new Logger(AiRouterService.name);
  private consecutivePrimaryFailures = 0;
  private consecutiveTotalFailures = 0;
  private primaryBypassUntil = 0;
  private workerPaused = false;
  private warnedMonthKey: string | null = null;
  private onPauseCallback?: () => void;

  constructor(
    @Inject(HERMES_PROVIDER) private readonly hermesProvider: AiProviderClient,
    @Inject(GEMINI_PROVIDER) private readonly geminiProvider: AiProviderClient,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly discordNotifier: DiscordWebhookNotifier,
  ) {}

  onWorkerPause(cb: () => void): void {
    this.onPauseCallback = cb;
  }

  isWorkerPaused(): boolean {
    return this.workerPaused;
  }

  resetCircuitBreaker(): void {
    this.consecutivePrimaryFailures = 0;
    this.consecutiveTotalFailures = 0;
    this.primaryBypassUntil = 0;
    this.workerPaused = false;
  }

  async getMonthlyUsageSummary() {
    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const agg = await this.prisma.aiUsageLog.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        estimatedCostUsd: true,
      },
    });

    const budgetUsd = this.configService.get<number>('AI_MONTHLY_BUDGET_USD') ?? 15;
    const estimatedCostUsd = Number(agg._sum.estimatedCostUsd ?? 0);
    return {
      inputTokens: agg._sum.inputTokens ?? 0,
      outputTokens: agg._sum.outputTokens ?? 0,
      estimatedCostUsd,
      budgetUsd,
      usagePercent: budgetUsd > 0 ? Math.round((estimatedCostUsd / budgetUsd) * 1000) / 10 : 0,
    };
  }

  async generateJsonWithGuardrails<T>(
    request: AiJsonRequest<T>,
    options: { taskType: string; jobRunId?: string; isManual?: boolean },
  ): Promise<AiJsonResponse<T>> {
    const isManual = options.isManual ?? false;

    if (!isManual) {
      if (this.workerPaused) {
        throw new AppException(
          HttpStatus.SERVICE_UNAVAILABLE,
          'AI_WORKER_PAUSED',
          'AI 파이프라인 연속 실패로 자동 생성이 일시 정지되었습니다.',
        );
      }

      await this.assertDailyAutoCap();
      await this.assertMonthlyBudgetCap();
    }

    const primaryName = this.configService.get<string>('AI_PRIMARY_PROVIDER') ?? 'hermes';
    const primary = primaryName === 'gemini' ? this.geminiProvider : this.hermesProvider;
    const secondary = primaryName === 'gemini' ? this.hermesProvider : this.geminiProvider;

    const useSecondaryFirst = Date.now() < this.primaryBypassUntil;
    const order = useSecondaryFirst ? [secondary, primary] : [primary, secondary];

    let rawResult: Awaited<ReturnType<AiProviderClient['generateRawJson']>> | null = null;
    let lastError: unknown = null;

    for (const provider of order) {
      try {
        rawResult = await provider.generateRawJson({
          systemPrompt: request.systemPrompt,
          userPrompt: request.userPrompt,
          temperature: request.temperature,
          maxTokens: request.maxTokens,
          timeoutMs: request.timeoutMs ?? 45_000,
        });

        this.consecutiveTotalFailures = 0;
        if (provider.name === primary.name) {
          this.consecutivePrimaryFailures = 0;
          this.primaryBypassUntil = 0;
        }
        break;
      } catch (err) {
        lastError = err;
        this.consecutiveTotalFailures += 1;
        if (provider.name === primary.name) {
          this.consecutivePrimaryFailures += 1;
          if (this.consecutivePrimaryFailures >= 3 && Date.now() >= this.primaryBypassUntil) {
            this.primaryBypassUntil = Date.now() + PRIMARY_BYPASS_MS;
            this.logger.warn(
              `Primary AI (${primary.name}) failed 3 times consecutively; bypassing to ${secondary.name} for 10m`,
            );
          }
        }
      }
    }

    if (!rawResult) {
      if (this.consecutiveTotalFailures >= 5 && !this.workerPaused) {
        this.workerPaused = true;
        this.onPauseCallback?.();
        await this.discordNotifier.sendAlert(
          'AI_DRAFT 워커 일시 정지',
          '1·2차 AI Provider가 5회 연속 실패하여 자동 초안 생성 워커를 일시 정지했습니다.',
          'error',
        );
      }
      throw lastError instanceof Error ? lastError : new Error('All AI providers failed');
    }

    await this.prisma.aiUsageLog.create({
      data: {
        id: uuidv7(),
        jobRunId: options.jobRunId ?? null,
        provider: rawResult.usage.provider,
        model: rawResult.usage.model,
        taskType: options.taskType,
        inputTokens: rawResult.usage.inputTokens,
        outputTokens: rawResult.usage.outputTokens,
        estimatedCostUsd: rawResult.usage.estimatedCostUsd,
      },
    });

    const parsed = request.schema.parse(rawResult.rawJson);
    return {
      data: parsed,
      usage: rawResult.usage,
      latencyMs: rawResult.latencyMs,
    };
  }

  private async assertDailyAutoCap(): Promise<void> {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const todayDrafts = await this.prisma.aiUsageLog.count({
      where: {
        taskType: 'PASS2_DRAFT',
        createdAt: { gte: startOfDay },
      },
    });

    if (todayDrafts >= DAILY_AUTO_DRAFT_CAP) {
      throw new AppException(
        HttpStatus.TOO_MANY_REQUESTS,
        'AI_DAILY_CAP_REACHED',
        `일일 자동 AI 초안 상한(${DAILY_AUTO_DRAFT_CAP}건)에 도달했습니다.`,
      );
    }
  }

  private async assertMonthlyBudgetCap(): Promise<void> {
    const summary = await this.getMonthlyUsageSummary();
    const budget = summary.budgetUsd;
    const warnThreshold = budget * 0.8;
    const monthKey = new Date().toISOString().slice(0, 7);

    if (summary.estimatedCostUsd >= budget) {
      await this.discordNotifier.sendAlert(
        '월간 AI 비용 하드캡 도달',
        `당월 AI 추정 비용($${summary.estimatedCostUsd.toFixed(2)})이 상한($${budget.toFixed(2)})에 도달해 자동 AI 호출을 차단했습니다.`,
        'error',
      );
      throw new AppException(
        HttpStatus.TOO_MANY_REQUESTS,
        'AI_MONTHLY_BUDGET_EXCEEDED',
        '월간 AI 비용 상한에 도달했습니다.',
      );
    }

    if (summary.estimatedCostUsd >= warnThreshold && this.warnedMonthKey !== monthKey) {
      this.warnedMonthKey = monthKey;
      await this.discordNotifier.sendAlert(
        '월간 AI 비용 80% 경고',
        `당월 AI 추정 비용($${summary.estimatedCostUsd.toFixed(2)})이 예산($${budget.toFixed(2)})의 80%를 초과했습니다.`,
        'warn',
      );
    }
  }
}
