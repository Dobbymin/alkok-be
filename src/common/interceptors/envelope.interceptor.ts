import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
}

export interface ApiEnvelope<T> {
  data: T;
  meta?: PaginationMeta;
}

@Injectable()
export class EnvelopeInterceptor<T> implements NestInterceptor<T, ApiEnvelope<T> | undefined> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiEnvelope<T> | undefined> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((payload) => {
        if (response.statusCode === 204 || payload === undefined) {
          return undefined;
        }
        if (
          typeof payload === 'object' &&
          payload !== null &&
          'data' in payload &&
          Object.keys(payload).every((k) => k === 'data' || k === 'meta')
        ) {
          return payload as unknown as ApiEnvelope<T>;
        }
        return { data: payload };
      }),
    );
  }
}
