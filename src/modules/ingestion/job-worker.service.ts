import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JobStatus, JobType, Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

export interface ClaimedJob {
  id: string;
  type: JobType;
  status: JobStatus;
  payload: Prisma.JsonValue;
  attempts: number;
  max_attempts: number;
  started_at: Date;
}

export type JobHandler = (job: {
  id: string;
  type: JobType;
  payload: Record<string, unknown>;
  attempts: number;
}) => Promise<void>;

const BACKOFF_MS = [60_000, 5 * 60_000, 15 * 60_000];

@Injectable()
export class JobWorkerService {
  private readonly logger = new Logger(JobWorkerService.name);
  private readonly handlers = new Map<JobType, JobHandler>();
  private isProcessing = false;
  private aiDraftPaused = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  registerHandler(type: JobType, handler: JobHandler): void {
    this.handlers.set(type, handler);
  }

  pauseAiDraft(): void {
    this.aiDraftPaused = true;
    this.logger.error('Automatic AI_DRAFT processing paused due to circuit breaker');
  }

  resumeAiDraft(): void {
    this.aiDraftPaused = false;
  }

  isAiDraftPaused(): boolean {
    return this.aiDraftPaused;
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async scheduledPoll(): Promise<void> {
    if (!this.configService.get<boolean>('ENABLE_SCHEDULER')) {
      return;
    }
    await this.processNextJob();
  }

  async processNextJob(): Promise<boolean> {
    if (this.isProcessing) {
      return false;
    }
    this.isProcessing = true;

    try {
      const excludedTypes = this.aiDraftPaused ? [JobType.AI_DRAFT] : [];
      const rows =
        excludedTypes.length > 0
          ? await this.prisma.$queryRaw<ClaimedJob[]>`
              UPDATE job_runs
              SET status = 'RUNNING'::"JobStatus",
                  locked_at = NOW(),
                  started_at = NOW(),
                  attempts = attempts + 1
              WHERE id = (
                SELECT id FROM job_runs
                WHERE status = 'PENDING'::"JobStatus"
                  AND next_run_at <= NOW()
                  AND type <> 'AI_DRAFT'::"JobType"
                ORDER BY next_run_at ASC
                FOR UPDATE SKIP LOCKED
                LIMIT 1
              )
              RETURNING id, type, status, payload, attempts, max_attempts, started_at
            `
          : await this.prisma.$queryRaw<ClaimedJob[]>`
              UPDATE job_runs
              SET status = 'RUNNING'::"JobStatus",
                  locked_at = NOW(),
                  started_at = NOW(),
                  attempts = attempts + 1
              WHERE id = (
                SELECT id FROM job_runs
                WHERE status = 'PENDING'::"JobStatus"
                  AND next_run_at <= NOW()
                ORDER BY next_run_at ASC
                FOR UPDATE SKIP LOCKED
                LIMIT 1
              )
              RETURNING id, type, status, payload, attempts, max_attempts, started_at
            `;

      if (rows.length === 0) {
        return false;
      }

      const job = rows[0];
      const startedMs = Date.now();
      const handler = this.handlers.get(job.type);

      try {
        if (!handler) {
          throw new Error(`No handler registered for JobType ${job.type}`);
        }
        const payload =
          typeof job.payload === 'object' && job.payload !== null && !Array.isArray(job.payload)
            ? (job.payload as Record<string, unknown>)
            : {};

        await handler({
          id: job.id,
          type: job.type,
          payload,
          attempts: job.attempts,
        });

        await this.prisma.jobRun.update({
          where: { id: job.id },
          data: {
            status: JobStatus.SUCCEEDED,
            finishedAt: new Date(),
            durationMs: Date.now() - startedMs,
            errorMessage: null,
          },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const isDead = job.attempts >= job.max_attempts;
        const backoffMs = BACKOFF_MS[Math.min(job.attempts - 1, BACKOFF_MS.length - 1)];

        await this.prisma.jobRun.update({
          where: { id: job.id },
          data: {
            status: isDead ? JobStatus.DEAD_LETTER : JobStatus.PENDING,
            nextRunAt: isDead ? new Date() : new Date(Date.now() + backoffMs),
            lockedAt: null,
            finishedAt: isDead ? new Date() : null,
            durationMs: Date.now() - startedMs,
            errorMessage: message.slice(0, 1000),
          },
        });
        this.logger.warn(
          `Job ${job.id} (${job.type}) failed (attempt ${job.attempts}/${job.max_attempts}): ${message}`,
        );
      }

      return true;
    } finally {
      this.isProcessing = false;
    }
  }
}
