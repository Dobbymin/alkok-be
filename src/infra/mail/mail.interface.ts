export const MAIL_PROVIDER = Symbol('MAIL_PROVIDER');

export interface MailProvider {
  sendVerificationEmail(to: string, verifyUrl: string): Promise<void>;
  sendPasswordResetEmail(to: string, resetUrl: string): Promise<void>;
}
