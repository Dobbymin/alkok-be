import { Module } from '@nestjs/common';
import { SafeFetchService } from '../../common/utils/safe-fetch';
import { AdminJobsController } from './admin-jobs.controller';
import { AdminSourcesController } from './admin-sources.controller';
import { AdminSourcesRepository } from './admin-sources.repository';
import { AdminSourcesService } from './admin-sources.service';
import { AiDraftService } from './ai-draft.service';
import { HtmlExtractorService } from './html-extractor.service';
import { JobWorkerService } from './job-worker.service';
import { MaintenanceBatchService } from './maintenance-batch.service';
import { RssFetcherService } from './rss-fetcher.service';

@Module({
  controllers: [AdminSourcesController, AdminJobsController],
  providers: [
    SafeFetchService,
    HtmlExtractorService,
    AdminSourcesService,
    AdminSourcesRepository,
    JobWorkerService,
    RssFetcherService,
    AiDraftService,
    MaintenanceBatchService,
  ],
  exports: [
    SafeFetchService,
    HtmlExtractorService,
    AdminSourcesService,
    AdminSourcesRepository,
    JobWorkerService,
    RssFetcherService,
    AiDraftService,
    MaintenanceBatchService,
  ],
})
export class IngestionModule {}
