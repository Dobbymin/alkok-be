import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DiscordWebhookNotifier {
  private readonly logger = new Logger(DiscordWebhookNotifier.name);

  constructor(private readonly configService: ConfigService) {}

  async sendAlert(
    title: string,
    message: string,
    level: 'info' | 'warn' | 'error' = 'warn',
  ): Promise<void> {
    const webhookUrl = this.configService.get<string>('DISCORD_WEBHOOK_URL')?.trim();
    if (!webhookUrl) {
      this.logger.warn(`[DiscordWebhook skipped - no URL] ${title}: ${message}`);
      return;
    }

    const color = level === 'error' ? 0xdc2626 : level === 'warn' ? 0xf59e0b : 0x2563eb;
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [
            {
              title: `[Alkok] ${title}`,
              description: message,
              color,
              timestamp: new Date().toISOString(),
            },
          ],
        }),
        signal: AbortSignal.timeout(4000),
      });
    } catch (err) {
      this.logger.warn(
        `Discord webhook send failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
