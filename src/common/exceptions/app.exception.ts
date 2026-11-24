import { HttpException, HttpStatus } from '@nestjs/common';

export class AppException extends HttpException {
  readonly errorCode: string;
  readonly details: unknown;

  constructor(
    statusCode: HttpStatus | number,
    errorCode: string,
    message: string,
    details: unknown = null,
  ) {
    super({ statusCode, errorCode, message, details }, statusCode);
    this.errorCode = errorCode;
    this.details = details;
  }
}
