import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '@prisma/client';
import { AppException } from '../../common/exceptions/app.exception';
import { RateLimitService } from '../../common/rate-limit/rate-limit.service';
import {
  generateRandomToken,
  hashPassword,
  sha256Hex,
  verifyPassword,
} from '../../common/utils/crypto.util';
import { uuidv7 } from '../../common/utils/uuidv7';
import { MAIL_PROVIDER, type MailProvider } from '../../infra/mail/mail.interface';
import {
  LoginDto,
  PasswordResetConfirmDto,
  PasswordResetRequestDto,
  ResendVerificationDto,
  SignupDto,
  VerifyEmailDto,
} from './auth.dto';
import { AuthRepository } from './auth.repository';

export const REFRESH_COOKIE_NAME = 'alkok_rt';
const REFRESH_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

export function formatUserProfile(user: {
  id: string;
  email: string;
  nickname: string;
  role: string;
  status: string;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  interests?: Array<{ category: { slug: string } }>;
}) {
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    role: user.role,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    interestCategorySlugs: user.interests?.map((i) => i.category.slug) ?? [],
    createdAt: user.createdAt.toISOString(),
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly rateLimitService: RateLimitService,
    @Inject(MAIL_PROVIDER) private readonly mailProvider: MailProvider,
  ) {}

  async signup(dto: SignupDto, ip: string): Promise<{ message: string }> {
    this.rateLimitService.consume(`auth:signup:${ip}`, 10, 60 * 60 * 1000);
    const email = dto.email.trim().toLowerCase();

    const existing = await this.authRepository.findUserByEmail(email);
    if (existing) {
      throw new AppException(
        HttpStatus.CONFLICT,
        'AUTH_EMAIL_ALREADY_EXISTS',
        '이미 가입된 이메일 주소입니다.',
      );
    }

    const passwordHash = await hashPassword(dto.password);
    const rawToken = generateRandomToken(32);
    const tokenHash = sha256Hex(rawToken);
    const expiresAt = new Date(Date.now() + VERIFY_TOKEN_TTL_MS);

    await this.authRepository.createUserWithVerificationToken({
      email,
      passwordHash,
      nickname: dto.nickname.trim(),
      tokenHash,
      expiresAt,
    });

    const webBaseUrl = (
      this.configService.get<string>('WEB_BASE_URL') ?? 'http://localhost:3000'
    ).replace(/\/$/, '');
    await this.mailProvider.sendVerificationEmail(
      email,
      `${webBaseUrl}/verify-email?token=${encodeURIComponent(rawToken)}`,
    );

    return { message: '인증 메일이 발송되었습니다. 이메일을 확인해 주세요.' };
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<{ verified: boolean }> {
    const tokenHash = sha256Hex(dto.token.trim());
    const record = await this.authRepository.findVerificationTokenByHash(tokenHash);

    if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'AUTH_TOKEN_EXPIRED',
        '인증 토큰이 유효하지 않거나 만료되었습니다.',
      );
    }

    await this.authRepository.markEmailVerified(record.id, record.userId);
    return { verified: true };
  }

  async resendVerification(dto: ResendVerificationDto): Promise<{ sent: boolean }> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.authRepository.findUserByEmail(email);
    if (!user || user.status !== UserStatus.PENDING_VERIFICATION) {
      return { sent: true };
    }

    const latest = await this.authRepository.findLatestVerificationTokenForUser(user.id);
    if (latest && Date.now() - latest.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      throw new AppException(
        HttpStatus.TOO_MANY_REQUESTS,
        'AUTH_RESEND_COOLDOWN',
        '인증 메일은 60초에 한 번만 재발송할 수 있습니다.',
      );
    }

    const rawToken = generateRandomToken(32);
    await this.authRepository.createVerificationToken(
      user.id,
      sha256Hex(rawToken),
      new Date(Date.now() + VERIFY_TOKEN_TTL_MS),
    );

    const webBaseUrl = (
      this.configService.get<string>('WEB_BASE_URL') ?? 'http://localhost:3000'
    ).replace(/\/$/, '');
    await this.mailProvider.sendVerificationEmail(
      email,
      `${webBaseUrl}/verify-email?token=${encodeURIComponent(rawToken)}`,
    );

    return { sent: true };
  }

  async login(
    dto: LoginDto,
    meta: { ip: string; userAgent?: string },
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: ReturnType<typeof formatUserProfile>;
  }> {
    const email = dto.email.trim().toLowerCase();
    this.rateLimitService.consume(`auth:login:${meta.ip}:${email}`, 10, 60 * 1000);

    const user = await this.authRepository.findUserByEmail(email);
    if (!user || user.deletedAt) {
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        'AUTH_INVALID_CREDENTIALS',
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    const passwordValid = await verifyPassword(user.passwordHash, dto.password);
    if (!passwordValid) {
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        'AUTH_INVALID_CREDENTIALS',
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    if (user.status === UserStatus.PENDING_VERIFICATION) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        'AUTH_EMAIL_NOT_VERIFIED',
        '이메일 인증 완료 후 로그인할 수 있습니다.',
      );
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        'AUTH_ACCOUNT_SUSPENDED',
        '정지되었거나 탈퇴한 계정입니다.',
      );
    }

    const refreshToken = generateRandomToken(32);
    const familyId = uuidv7();
    await this.authRepository.createRefreshSessionAndTouchLogin({
      userId: user.id,
      familyId,
      tokenHash: sha256Hex(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    });

    const accessToken = await this.signAccessToken(user.id, user.role);
    return {
      accessToken,
      refreshToken,
      user: formatUserProfile(user),
    };
  }

  async refresh(
    rawRefreshToken: string | undefined,
    meta: { ip: string; userAgent?: string },
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: ReturnType<typeof formatUserProfile>;
  }> {
    if (!rawRefreshToken) {
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        'AUTH_TOKEN_EXPIRED',
        '세션이 만료되었습니다. 다시 로그인해 주세요.',
      );
    }

    const tokenHash = sha256Hex(rawRefreshToken);
    const session = await this.authRepository.findRefreshSessionByHash(tokenHash);

    if (!session) {
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        'AUTH_TOKEN_EXPIRED',
        '유효하지 않은 리프레시 토큰입니다.',
      );
    }

    if (session.revokedAt !== null) {
      // Reuse detected: revoke entire token family immediately
      await this.authRepository.revokeFamilySessions(session.familyId);
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        'AUTH_TOKEN_REUSED',
        '비정상적인 토큰 재사용이 감지되어 모든 세션이 만료되었습니다.',
      );
    }

    if (session.expiresAt.getTime() < Date.now() || session.user.status !== UserStatus.ACTIVE) {
      await this.authRepository.revokeFamilySessions(session.familyId);
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        'AUTH_TOKEN_EXPIRED',
        '세션이 만료되었습니다. 다시 로그인해 주세요.',
      );
    }

    const newRefreshToken = generateRandomToken(32);
    await this.authRepository.rotateRefreshSession({
      oldSessionId: session.id,
      userId: session.userId,
      familyId: session.familyId,
      newTokenHash: sha256Hex(newRefreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    });

    const accessToken = await this.signAccessToken(session.user.id, session.user.role);
    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: formatUserProfile(session.user),
    };
  }

  async logout(rawRefreshToken: string | undefined): Promise<void> {
    if (!rawRefreshToken) {
      return;
    }
    await this.authRepository.revokeSessionByHash(sha256Hex(rawRefreshToken));
  }

  async requestPasswordReset(dto: PasswordResetRequestDto, ip: string): Promise<{ sent: boolean }> {
    this.rateLimitService.consume(`auth:reset:${ip}`, 10, 60 * 60 * 1000);
    const email = dto.email.trim().toLowerCase();
    const user = await this.authRepository.findUserByEmail(email);

    if (!user || user.deletedAt || user.status !== UserStatus.ACTIVE) {
      return { sent: true };
    }

    const rawToken = generateRandomToken(32);
    await this.authRepository.createPasswordResetToken(
      user.id,
      sha256Hex(rawToken),
      new Date(Date.now() + RESET_TOKEN_TTL_MS),
    );

    const webBaseUrl = (
      this.configService.get<string>('WEB_BASE_URL') ?? 'http://localhost:3000'
    ).replace(/\/$/, '');
    await this.mailProvider.sendPasswordResetEmail(
      email,
      `${webBaseUrl}/reset-password?token=${encodeURIComponent(rawToken)}`,
    );

    return { sent: true };
  }

  async confirmPasswordReset(dto: PasswordResetConfirmDto): Promise<{ reset: boolean }> {
    const tokenHash = sha256Hex(dto.token.trim());
    const record = await this.authRepository.findPasswordResetTokenByHash(tokenHash);

    if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'AUTH_TOKEN_EXPIRED',
        '비밀번호 재설정 토큰이 유효하지 않거나 만료되었습니다.',
      );
    }

    const newPasswordHash = await hashPassword(dto.newPassword);
    await this.authRepository.resetPasswordAndRevokeAllSessions({
      tokenId: record.id,
      userId: record.userId,
      newPasswordHash,
    });

    return { reset: true };
  }

  private signAccessToken(userId: string, role: string): Promise<string> {
    const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
    return this.jwtService.signAsync({ sub: userId, role }, { secret, expiresIn: '15m' });
  }
}
