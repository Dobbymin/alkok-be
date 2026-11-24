import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { UserRole } from '@prisma/client';
import type { Request } from 'express';
import type { AuthUser } from '../decorators/current-user.decorator';
import { AppException } from '../exceptions/app.exception';

export interface JwtAccessPayload {
  sub: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppException(HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', '인증이 필요합니다.');
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      throw new AppException(HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', '인증이 필요합니다.');
    }

    try {
      const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
      const payload = await this.jwtService.verifyAsync<JwtAccessPayload>(token, { secret });
      req.user = { id: payload.sub, role: payload.role };
      return true;
    } catch {
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        'UNAUTHORIZED',
        '유효하지 않거나 만료된 토큰입니다.',
      );
    }
  }
}
