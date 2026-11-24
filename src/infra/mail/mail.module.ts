import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MAIL_PROVIDER } from './mail.interface';
import { MailpitMailProvider } from './mailpit-mail.provider';
import { ResendMailProvider } from './resend-mail.provider';

@Global()
@Module({
  providers: [
    MailpitMailProvider,
    ResendMailProvider,
    {
      provide: MAIL_PROVIDER,
      inject: [ConfigService, MailpitMailProvider, ResendMailProvider],
      useFactory: (
        configService: ConfigService,
        mailpit: MailpitMailProvider,
        resend: ResendMailProvider,
      ) => {
        const provider = configService.get<string>('MAIL_PROVIDER');
        return provider === 'resend' ? resend : mailpit;
      },
    },
  ],
  exports: [MAIL_PROVIDER],
})
export class MailModule {}
