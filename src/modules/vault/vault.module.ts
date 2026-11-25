import { Module } from '@nestjs/common';
import { VaultController } from './vault.controller';
import { VaultRepository } from './vault.repository';
import { VaultService } from './vault.service';

@Module({
  controllers: [VaultController],
  providers: [VaultService, VaultRepository],
  exports: [VaultService, VaultRepository],
})
export class VaultModule {}
