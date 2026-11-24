import { Global, Module } from '@nestjs/common';
import { GEMINI_PROVIDER, HERMES_PROVIDER } from './ai-provider.interface';
import { AiRouterService } from './ai-router.service';
import { GeminiProvider } from './gemini.provider';
import { HermesProvider } from './hermes.provider';

@Global()
@Module({
  providers: [
    HermesProvider,
    GeminiProvider,
    {
      provide: HERMES_PROVIDER,
      useExisting: HermesProvider,
    },
    {
      provide: GEMINI_PROVIDER,
      useExisting: GeminiProvider,
    },
    AiRouterService,
  ],
  exports: [AiRouterService, HERMES_PROVIDER, GEMINI_PROVIDER],
})
export class AiModule {}
