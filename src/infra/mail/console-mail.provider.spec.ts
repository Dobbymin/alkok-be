import { ConsoleMailProvider } from './console-mail.provider';

describe('ConsoleMailProvider', () => {
  it('completes verification and reset email calls without external SMTP', async () => {
    const provider = new ConsoleMailProvider();
    await expect(
      provider.sendVerificationEmail('user@example.com', 'https://alkok.dobbymin.cloud/verify?t=1'),
    ).resolves.toBeUndefined();
    await expect(
      provider.sendPasswordResetEmail('user@example.com', 'https://alkok.dobbymin.cloud/reset?t=2'),
    ).resolves.toBeUndefined();
  });
});
