import { Module } from '@nestjs/common';
import { EngagementController } from './engagement.controller';
import { EngagementRepository } from './engagement.repository';
import { EngagementService } from './engagement.service';

@Module({
  controllers: [EngagementController],
  providers: [EngagementService, EngagementRepository],
  exports: [EngagementService, EngagementRepository],
})
export class EngagementModule {}
