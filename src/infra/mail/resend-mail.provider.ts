import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { MailProvider } from './mail.interface';

@Injectable()
export class ResendMailProvider implements MailProvider {
  private readonly logger = new Logger(ResendMailProvider.name);
  private readonly apiKey: string;
  private readonly mailFrom: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('RESEND_API_KEY') ?? '';
    this.mailFrom = this.configService.get<string>('MAIL_FROM') ?? 'noreply@alkok.dobbymin.cloud';
  }

  async sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
    await this.send({
      to,
      subject: '[알콕] 이메일 주소를 인증해 주세요',
      html: `<p>아래 링크를 클릭해 알콕 이메일 인증을 완료해 주세요 (24시간 유효):</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    });
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    await this.send({
      to,
      subject: '[알콕] 비밀번호 재설정 안내',
      html: `<p>아래 링크를 클릭해 새 비밀번호를 설정해 주세요 (30분 유효):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });
  }

  private async send(payload: { to: string; subject: string; html: string }): Promise<void> {
    if (!this.apiKey) {
      this.logger.warn(`RESEND_API_KEY is missing; skipped sending email to ${payload.to}`);
      return;
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.mailFrom,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Resend API failed (${res.status}): ${body}`);
    }
  }
}
