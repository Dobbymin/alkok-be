import { Module } from '@nestjs/common';
import { DB_HEALTH_CHECKER } from './health.constants';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  controllers: [HealthController],
  providers: [
    HealthService,
    {
      provide: DB_HEALTH_CHECKER,
      useValue: { ping: () => Promise.resolve('up' as const) },
    },
  ],
  exports: [HealthService],
})
export class HealthModule {}
