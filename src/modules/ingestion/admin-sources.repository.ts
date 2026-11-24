import { Injectable } from '@nestjs/common';
import { JobStatus, JobType } from '@prisma/client';
import { uuidv7 } from '../../common/utils/uuidv7';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { CreateSourceDto, UpdateSourceDto } from './admin-sources.dto';

@Injectable()
export class AdminSourcesRepository {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.source.findMany({
      where: { deletedAt: null },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });
  }

  findById(id: string) {
    return this.prisma.source.findFirst({
      where: { id, deletedAt: null },
    });
  }

  create(dto: CreateSourceDto) {
    return this.prisma.source.create({
      data: {
        id: uuidv7(),
        name: dto.name.trim(),
        feedUrl: dto.feedUrl.trim(),
        sourceType: dto.sourceType,
        fetchIntervalHours: dto.fetchIntervalHours ?? 12,
        isActive: dto.isActive ?? true,
      },
    });
  }

  update(id: string, dto: UpdateSourceDto) {
    return this.prisma.source.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.feedUrl !== undefined ? { feedUrl: dto.feedUrl.trim() } : {}),
        ...(dto.sourceType !== undefined ? { sourceType: dto.sourceType } : {}),
        ...(dto.fetchIntervalHours !== undefined
          ? { fetchIntervalHours: dto.fetchIntervalHours }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  softDelete(id: string) {
    return this.prisma.source.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  enqueueRssFetchJob(sourceId: string) {
    return this.prisma.jobRun.create({
      data: {
        id: uuidv7(),
        type: JobType.RSS_FETCH,
        status: JobStatus.PENDING,
        payload: { sourceId },
        nextRunAt: new Date(),
      },
    });
  }
}
