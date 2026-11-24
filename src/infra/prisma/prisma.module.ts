import { Global, Module } from '@nestjs/common';
import { DB_HEALTH_CHECKER } from '../../modules/health/health.constants';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [
    PrismaService,
    {
      provide: DB_HEALTH_CHECKER,
      useExisting: PrismaService,
    },
  ],
  exports: [PrismaService, DB_HEALTH_CHECKER],
})
export class PrismaModule {}
