import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException } from '../../common/exceptions/app.exception';
import { RateLimitService } from '../../common/rate-limit/rate-limit.service';
import { sha256Hex } from '../../common/utils/crypto.util';
import type { SubmitReportDto } from './engagement.dto';
import { EngagementRepository } from './engagement.repository';

@Injectable()
export class EngagementService {
  constructor(
    private readonly engagementRepository: EngagementRepository,
    private readonly rateLimitService: RateLimitService,
    private readonly configService: ConfigService,
  ) {}

  async markHelpful(userId: string, contentId: string) {
    const content = await this.engagementRepository.findPublishedContent(contentId);
    if (!content) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'CONTENT_NOT_FOUND',
        '콘텐츠를 찾을 수 없습니다.',
      );
    }
    const result = await this.engagementRepository.addHelpfulVote(userId, contentId);
    return { helpfulCount: result.helpfulCount, isHelpful: true };
  }

  async unmarkHelpful(userId: string, contentId: string) {
    const content = await this.engagementRepository.findPublishedContent(contentId);
    if (!content) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'CONTENT_NOT_FOUND',
        '콘텐츠를 찾을 수 없습니다.',
      );
    }
    const result = await this.engagementRepository.removeHelpfulVote(userId, contentId);
    return { helpfulCount: result.helpfulCount, isHelpful: false };
  }

  async submitReport(
    contentId: string,
    dto: SubmitReportDto,
    meta: { ip: string; userId?: string },
  ): Promise<{ id: string }> {
    this.rateLimitService.consume(`contents:report:${meta.ip}`, 10, 60 * 60 * 1000);

    // Honeypot triggered: pretend success without persisting
    if (dto.website && dto.website.trim().length > 0) {
      return { id: 'ignored' };
    }

    const content = await this.engagementRepository.findPublishedContent(contentId);
    if (!content) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'CONTENT_NOT_FOUND',
        '콘텐츠를 찾을 수 없습니다.',
      );
    }

    const salt = this.configService.get<string>('IP_HASH_SALT') ?? 'dev-salt';
    const reporterIpHash = sha256Hex(`${meta.ip}:${salt}`);

    const report = await this.engagementRepository.createReportAndCheckThreshold({
      contentId,
      reporterUserId: meta.userId,
      reporterEmail: dto.reporterEmail?.trim(),
      reason: dto.reason,
      detail: dto.detail.trim(),
      reporterIpHash,
    });

    return { id: report.id };
  }
}
