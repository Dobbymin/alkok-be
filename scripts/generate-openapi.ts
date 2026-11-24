import * as fs from 'node:fs';
import * as path from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { buildSwaggerDocument, configureApp } from '../src/main';

async function generateOpenApi(): Promise<void> {
  process.env.NODE_ENV = 'test';
  process.env.SKIP_DB_CONNECT = 'true';
  process.env.ENABLE_SCHEDULER = 'false';

  const app = await NestFactory.create(AppModule, { logger: false });
  configureApp(app);
  await app.init();

  const document = buildSwaggerDocument(app);
  const outDir = path.join(process.cwd(), 'openapi');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'alkok-openapi.json');
  fs.writeFileSync(outPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');

  await app.close();
  console.log(`[openapi:generate] Wrote ${path.relative(process.cwd(), outPath)}`);
}

void generateOpenApi();
