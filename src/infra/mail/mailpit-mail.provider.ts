import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { MailProvider } from './mail.interface';

@Injectable()
export class MailpitMailProvider implements MailProvider {
  private readonly logger = new Logger(MailpitMailProvider.name);
  private readonly transporter: Transporter;
  private readonly mailFrom: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST') ?? 'localhost';
    const port = this.configService.get<number>('SMTP_PORT') ?? 1025;
    this.mailFrom = this.configService.get<string>('MAIL_FROM') ?? 'noreply@alkok.dobbymin.cloud';
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: false,
    });
  }

  async sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
    await this.transporter.sendMail({
      from: this.mailFrom,
      to,
      subject: '[알콕] 이메일 주소를 인증해 주세요',
      text: `아래 링크를 클릭해 알콕 이메일 인증을 완료해 주세요 (24시간 유효):\n${verifyUrl}`,
      html: `<p>아래 링크를 클릭해 알콕 이메일 인증을 완료해 주세요 (24시간 유효):</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    });
    this.logger.debug(`Verification email sent via Mailpit to ${to}`);
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    await this.transporter.sendMail({
      from: this.mailFrom,
      to,
      subject: '[알콕] 비밀번호 재설정 안내',
      text: `아래 링크를 클릭해 새 비밀번호를 설정해 주세요 (30분 유효):\n${resetUrl}`,
      html: `<p>아래 링크를 클릭해 새 비밀번호를 설정해 주세요 (30분 유효):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });
    this.logger.debug(`Password reset email sent via Mailpit to ${to}`);
  }
}
