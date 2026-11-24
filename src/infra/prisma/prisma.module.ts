import { Global, Module } from '@nestjs/common';
import { DB_HEALTH_CHECKER } from '../../modules/health/health.constants';
import { PrismaService } from './prisma.service';
import { SearchVectorService } from './search-vector.service';

@Global()
@Module({
  providers: [
    PrismaService,
    SearchVectorService,
    {
      provide: DB_HEALTH_CHECKER,
      useExisting: PrismaService,
    },
  ],
  exports: [PrismaService, SearchVectorService, DB_HEALTH_CHECKER],
})
export class PrismaModule {}
