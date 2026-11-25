import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import {
  LoginDto,
  PasswordResetConfirmDto,
  PasswordResetRequestDto,
  ResendVerificationDto,
  SignupDto,
  VerifyEmailDto,
} from './auth.dto';
import { AuthService, REFRESH_COOKIE_NAME } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  signup(@Body() dto: SignupDto, @Req() req: Request) {
    return this.authService.signup(dto, req.ip || 'unknown');
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto, {
      ip: req.ip || 'unknown',
      userAgent: req.headers['user-agent'],
    });
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookies = req.cookies as Record<string, string | undefined> | undefined;
    const rawToken = cookies?.[REFRESH_COOKIE_NAME];
    try {
      const result = await this.authService.refresh(rawToken, {
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'],
      });
      this.setRefreshCookie(res, result.refreshToken);
      return { accessToken: result.accessToken, user: result.user };
    } catch (err) {
      this.clearRefreshCookie(res);
      throw err;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookies = req.cookies as Record<string, string | undefined> | undefined;
    const rawToken = cookies?.[REFRESH_COOKIE_NAME];
    await this.authService.logout(rawToken);
    this.clearRefreshCookie(res);
  }

  @Post('password-reset/request')
  @HttpCode(HttpStatus.OK)
  requestPasswordReset(@Body() dto: PasswordResetRequestDto, @Req() req: Request) {
    return this.authService.requestPasswordReset(dto, req.ip || 'unknown');
  }

  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.OK)
  confirmPasswordReset(@Body() dto: PasswordResetConfirmDto) {
    return this.authService.confirmPasswordReset(dto);
  }

  private setRefreshCookie(res: Response, token: string): void {
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';
    res.cookie(REFRESH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: 14 * 24 * 60 * 60 * 1000,
    });
    // Non-sensitive session-presence hint for cross-app SPA bootstrap (/ and /admin)
    res.cookie('alkok_logged_in', '1', {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 14 * 24 * 60 * 60 * 1000,
    });
  }

  private clearRefreshCookie(res: Response): void {
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';
    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/api/v1/auth',
    });
    res.clearCookie('alkok_logged_in', {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
    });
  }
}
