import { HttpStatus, Injectable } from '@nestjs/common';
import { buildPaginationMeta } from '../../common/dto/pagination.dto';
import { AppException } from '../../common/exceptions/app.exception';
import { mapContentSummary } from '../../common/utils/content-mapper.util';
import { SearchVectorService } from '../../infra/prisma/search-vector.service';
import type {
  AdminContentListQueryDto,
  CreateAdminContentDto,
  UpdateAdminContentDto,
} from './admin-contents.dto';
import { AdminContentsRepository } from './admin-contents.repository';

@Injectable()
export class AdminContentsService {
  constructor(
    private readonly adminContentsRepository: AdminContentsRepository,
    private readonly searchVectorService: SearchVectorService,
  ) {}

  async list(query: AdminContentListQueryDto) {
    const result = await this.adminContentsRepository.list(query);
    return {
      data: result.items.map((item) => mapContentSummary(item)),
      meta: buildPaginationMeta(result.page, result.limit, result.total),
    };
  }

  async create(dto: CreateAdminContentDto, authorId: string) {
    const created = await this.adminContentsRepository.create(dto, authorId);
    await this.searchVectorService.refresh(created.id);
    return mapContentSummary(created);
  }

  async update(id: string, dto: UpdateAdminContentDto) {
    const existing = await this.adminContentsRepository.findById(id);
    if (!existing) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'CONTENT_NOT_FOUND',
        '콘텐츠를 찾을 수 없습니다.',
      );
    }
    const updated = await this.adminContentsRepository.update(id, existing.type, dto);
    await this.searchVectorService.refresh(updated.id);
    return mapContentSummary(updated);
  }

  async verify(id: string) {
    const existing = await this.adminContentsRepository.findById(id);
    if (!existing) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'CONTENT_NOT_FOUND',
        '콘텐츠를 찾을 수 없습니다.',
      );
    }
    const verified = await this.adminContentsRepository.verify(id);
    return mapContentSummary(verified);
  }

  async archive(id: string) {
    const existing = await this.adminContentsRepository.findById(id);
    if (!existing) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'CONTENT_NOT_FOUND',
        '콘텐츠를 찾을 수 없습니다.',
      );
    }
    const archived = await this.adminContentsRepository.archive(id);
    return mapContentSummary(archived);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.adminContentsRepository.findById(id);
    if (!existing) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'CONTENT_NOT_FOUND',
        '콘텐츠를 찾을 수 없습니다.',
      );
    }
    await this.adminContentsRepository.softDelete(id);
  }
}
