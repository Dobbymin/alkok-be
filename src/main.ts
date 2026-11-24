import { HttpStatus, RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AppException } from './common/exceptions/app.exception';

export function configureApp(app: import('@nestjs/common').INestApplication): void {
  const configService = app.get(ConfigService);
  const corsOriginsRaw = configService.get<string>('CORS_ORIGINS') ?? '';
  const allowedOrigins = corsOriginsRaw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(cookieParser());
  app.use(helmet());
  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  });

  app.setGlobalPrefix('api/v1', {
    exclude: [{ path: 'api/health', method: RequestMethod.GET }],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) => {
        const details = errors.map((err) => ({
          field: err.property,
          constraints: err.constraints ? Object.values(err.constraints) : [],
        }));
        return new AppException(
          HttpStatus.BAD_REQUEST,
          'VALIDATION_FAILED',
          '입력값 검증에 실패했습니다.',
          details,
        );
      },
    }),
  );
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  configureApp(app);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 8080;
  await app.listen(port);
}

if (require.main === module) {
  void bootstrap();
}
