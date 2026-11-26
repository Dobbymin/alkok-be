import { Injectable } from '@nestjs/common';
import { TaxonomiesRepository } from './taxonomies.repository';
import { FEATURED_TOPICS } from './topic-presets';

@Injectable()
export class TaxonomiesService {
  constructor(private readonly taxonomiesRepository: TaxonomiesRepository) {}

  async getTaxonomies() {
    const [categories, popularTags] = await Promise.all([
      this.taxonomiesRepository.findActiveCategories(),
      this.taxonomiesRepository.findPopularTags(20),
    ]);
    const grouped = this.taxonomiesRepository.groupCategories(categories);
    return {
      ...grouped,
      popularTags,
      topics: FEATURED_TOPICS,
    };
  }
}
