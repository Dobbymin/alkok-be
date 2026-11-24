import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException } from '../../common/exceptions/app.exception';
import { normalizeUrl } from '../../common/utils/normalize-url';
import type { CreateSourceDto, UpdateSourceDto } from './admin-sources.dto';
import { AdminSourcesRepository } from './admin-sources.repository';

@Injectable()
export class AdminSourcesService {
  constructor(private readonly adminSourcesRepository: AdminSourcesRepository) {}

  list() {
    return this.adminSourcesRepository.list();
  }

  create(dto: CreateSourceDto) {
    const normalizedFeedUrl = normalizeUrl(dto.feedUrl);
    return this.adminSourcesRepository.create({
      ...dto,
      feedUrl: normalizedFeedUrl,
    });
  }

  async update(id: string, dto: UpdateSourceDto) {
    const existing = await this.adminSourcesRepository.findById(id);
    if (!existing) {
      throw new AppException(HttpStatus.NOT_FOUND, 'NOT_FOUND', '출처를 찾을 수 없습니다.');
    }
    return this.adminSourcesRepository.update(id, {
      ...dto,
      ...(dto.feedUrl ? { feedUrl: normalizeUrl(dto.feedUrl) } : {}),
    });
  }

  async remove(id: string): Promise<void> {
    const existing = await this.adminSourcesRepository.findById(id);
    if (!existing) {
      throw new AppException(HttpStatus.NOT_FOUND, 'NOT_FOUND', '출처를 찾을 수 없습니다.');
    }
    await this.adminSourcesRepository.softDelete(id);
  }

  async triggerFetch(id: string): Promise<{ jobId: string }> {
    const existing = await this.adminSourcesRepository.findById(id);
    if (!existing) {
      throw new AppException(HttpStatus.NOT_FOUND, 'NOT_FOUND', '출처를 찾을 수 없습니다.');
    }
    const job = await this.adminSourcesRepository.enqueueRssFetchJob(id);
    return { jobId: job.id };
  }
}
