import { Global, Module } from '@nestjs/common';
import { DiscordWebhookNotifier } from './discord-webhook.notifier';

@Global()
@Module({
  providers: [DiscordWebhookNotifier],
  exports: [DiscordWebhookNotifier],
})
export class NotifyModule {}
