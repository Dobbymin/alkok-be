import { Injectable, Logger } from '@nestjs/common';
import type { MailProvider } from './mail.interface';

@Injectable()
export class ConsoleMailProvider implements MailProvider {
  private readonly logger = new Logger(ConsoleMailProvider.name);

  sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
    this.logger.log(`[console-mail] verification email queued for ${to}: ${verifyUrl}`);
    return Promise.resolve();
  }

  sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    this.logger.log(`[console-mail] password reset email queued for ${to}: ${resetUrl}`);
    return Promise.resolve();
  }
}
