import { Module } from '@nestjs/common';
import { SafeFetchService } from '../../common/utils/safe-fetch';
import { AdminSourcesController } from './admin-sources.controller';
import { AdminSourcesRepository } from './admin-sources.repository';
import { AdminSourcesService } from './admin-sources.service';
import { HtmlExtractorService } from './html-extractor.service';

@Module({
  controllers: [AdminSourcesController],
  providers: [SafeFetchService, HtmlExtractorService, AdminSourcesService, AdminSourcesRepository],
  exports: [SafeFetchService, HtmlExtractorService, AdminSourcesService, AdminSourcesRepository],
})
export class IngestionModule {}
