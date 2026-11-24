import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppException } from '../exceptions/app.exception';

export interface ErrorEnvelope {
  statusCode: number;
  errorCode: string;
  message: string;
  details: unknown;
  timestamp: string;
  path: string;
}

function isPrismaKnownError(
  exception: unknown,
): exception is { code: string; meta?: Record<string, unknown> } {
  if (typeof exception !== 'object' || exception === null || !('code' in exception)) {
    return false;
  }
  const code = exception.code;
  return typeof code === 'string' && code.startsWith('P');
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = '서버 내부 오류가 발생했습니다.';
    let details: unknown = null;

    if (exception instanceof AppException) {
      statusCode = exception.getStatus();
      errorCode = exception.errorCode;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const statusNum = Number(statusCode);
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, unknown>;
        errorCode =
          typeof obj.errorCode === 'string'
            ? obj.errorCode
            : statusNum === 404
              ? 'NOT_FOUND'
              : statusNum === 401
                ? 'UNAUTHORIZED'
                : statusNum === 403
                  ? 'FORBIDDEN'
                  : statusNum === 400
                    ? 'BAD_REQUEST'
                    : 'HTTP_ERROR';
        if (Array.isArray(obj.message)) {
          message = '입력값 검증에 실패했습니다.';
          details = obj.message;
          errorCode = 'VALIDATION_FAILED';
        } else if (typeof obj.message === 'string') {
          message = obj.message;
        } else {
          message = exception.message;
        }
        if (obj.details !== undefined) {
          details = obj.details;
        }
      } else {
        message = exception.message;
      }
    } else if (isPrismaKnownError(exception)) {
      if (exception.code === 'P2002') {
        statusCode = HttpStatus.CONFLICT;
        errorCode = 'CONFLICT';
        message = '이미 존재하는 데이터입니다.';
        details = exception.meta ?? null;
      } else if (exception.code === 'P2025') {
        statusCode = HttpStatus.NOT_FOUND;
        errorCode = 'NOT_FOUND';
        message = '대상을 찾을 수 없습니다.';
      } else {
        this.logger.error(`Prisma error ${exception.code}`, exception);
      }
    } else {
      this.logger.error(
        'Unhandled exception',
        exception instanceof Error ? exception.stack : exception,
      );
    }

    const body: ErrorEnvelope = {
      statusCode,
      errorCode,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: request.originalUrl || request.url,
    };

    response.status(statusCode).json(body);
  }
}
