import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException } from '../exceptions/app.exception';

interface RateBucket {
  timestamps: number[];
}

@Injectable()
export class RateLimitService {
  private readonly buckets = new Map<string, RateBucket>();

  consume(key: string, limit: number, windowMs: number): void {
    const now = Date.now();
    const cutoff = now - windowMs;
    const bucket = this.buckets.get(key) ?? { timestamps: [] };
    bucket.timestamps = bucket.timestamps.filter((ts) => ts > cutoff);

    if (bucket.timestamps.length >= limit) {
      throw new AppException(
        HttpStatus.TOO_MANY_REQUESTS,
        'RATE_LIMIT_EXCEEDED',
        '요청 횟수 제한을 초과했습니다. 잠시 후 다시 시도해 주세요.',
      );
    }

    bucket.timestamps.push(now);
    this.buckets.set(key, bucket);
  }

  reset(): void {
    this.buckets.clear();
  }
}
