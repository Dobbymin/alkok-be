import { HttpStatus, Inject, Injectable, Optional } from '@nestjs/common';
import { AppException } from '../../common/exceptions/app.exception';
import { DB_HEALTH_CHECKER, type DbHealthChecker } from './health.constants';

export interface HealthStatus {
  status: 'ok';
  db: 'up';
}

@Injectable()
export class HealthService {
  constructor(
    @Optional()
    @Inject(DB_HEALTH_CHECKER)
    private readonly dbChecker?: DbHealthChecker,
  ) {}

  async check(): Promise<HealthStatus> {
    const db = this.dbChecker ? await this.dbChecker.ping() : 'up';
    if (db !== 'up') {
      throw new AppException(
        HttpStatus.SERVICE_UNAVAILABLE,
        'SERVICE_UNAVAILABLE',
        '데이터베이스 연결 상태를 확인할 수 없습니다.',
        { db: 'down' },
      );
    }
    return { status: 'ok', db };
  }
}
