import { Module } from '@nestjs/common';
import { IngestionModule } from '../ingestion/ingestion.module';
import { VaultPreviewService } from './vault-preview.service';
import { VaultController } from './vault.controller';
import { VaultRepository } from './vault.repository';
import { VaultService } from './vault.service';

@Module({
  imports: [IngestionModule],
  controllers: [VaultController],
  providers: [VaultService, VaultRepository, VaultPreviewService],
  exports: [VaultService, VaultRepository, VaultPreviewService],
})
export class VaultModule {}
