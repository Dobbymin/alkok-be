import { Body, Controller, HttpStatus, INestApplication, Post } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { IsEmail, IsString } from 'class-validator';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { configureApp } from '../../main';
import { DB_HEALTH_CHECKER } from './health.constants';

class SampleDto {
  @IsEmail()
  email!: string;

  @IsString()
  name!: string;
}

@Controller('test-validation')
class TestValidationController {
  @Post()
  submit(@Body() dto: SampleDto) {
    return dto;
  }
}

describe('Health & Common Infra', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [TestValidationController],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health returns 200 with standard data envelope', async () => {
    const res = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(res.body).toEqual({
      data: {
        status: 'ok',
        db: 'up',
      },
    });
  });

  it('returns standard error envelope on 404', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/nonexistent').expect(404);
    expect(res.body).toMatchObject({
      statusCode: 404,
      errorCode: 'NOT_FOUND',
      path: '/api/v1/nonexistent',
    });
    expect(typeof res.body.timestamp).toBe('string');
  });

  it('returns VALIDATION_FAILED envelope on invalid DTO', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/test-validation')
      .send({ email: 'not-an-email' })
      .expect(400);

    expect(res.body).toMatchObject({
      statusCode: 400,
      errorCode: 'VALIDATION_FAILED',
      path: '/api/v1/test-validation',
    });
    expect(Array.isArray(res.body.details)).toBe(true);
  });

  it('returns 503 when DB health checker reports down', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DB_HEALTH_CHECKER)
      .useValue({ ping: () => Promise.resolve('down') })
      .compile();

    const downApp = moduleRef.createNestApplication();
    configureApp(downApp);
    await downApp.init();

    const res = await request(downApp.getHttpServer())
      .get('/api/health')
      .expect(HttpStatus.SERVICE_UNAVAILABLE);

    expect(res.body).toMatchObject({
      statusCode: 503,
      errorCode: 'SERVICE_UNAVAILABLE',
    });

    await downApp.close();
  });
});
