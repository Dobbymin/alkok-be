import { Module } from '@nestjs/common';
import { TaxonomiesController } from './taxonomies.controller';
import { TaxonomiesRepository } from './taxonomies.repository';
import { TaxonomiesService } from './taxonomies.service';

@Module({
  controllers: [TaxonomiesController],
  providers: [TaxonomiesService, TaxonomiesRepository],
  exports: [TaxonomiesService, TaxonomiesRepository],
})
export class TaxonomiesModule {}
