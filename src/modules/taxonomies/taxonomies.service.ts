import { Injectable } from '@nestjs/common';
import { TaxonomiesRepository } from './taxonomies.repository';

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
    };
  }
}
