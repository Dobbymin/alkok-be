import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8080),
  APP_BASE_URL: z.string().url().default('http://localhost:8080'),
  WEB_BASE_URL: z.string().url().default('http://localhost:3000'),
  CORS_ORIGINS: z
    .string()
    .default(
      'https://alkok.dobbymin.cloud,https://admin.dobbymin.cloud,http://localhost:3000,http://localhost:3001,http://localhost:18101,http://localhost:18103',
    ),
  DATABASE_URL: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().min(16).default('dev-only-jwt-secret-change-in-production'),
  IP_HASH_SALT: z.string().default('dev-only-ip-hash-salt'),
  MAIL_PROVIDER: z.enum(['mailpit', 'resend', 'console']).default('mailpit'),
  MAIL_FROM: z.string().default('noreply@alkok.dobbymin.cloud'),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  RESEND_API_KEY: z.string().optional(),
  AI_PRIMARY_PROVIDER: z.enum(['hermes', 'gemini']).default('hermes'),
  HERMES_BASE_URL: z.string().default('http://172.22.0.1:8642'),
  HERMES_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  AI_MONTHLY_BUDGET_USD: z.coerce.number().positive().default(15),
  DISCORD_WEBHOOK_URL: z.string().optional(),
  ENABLE_SCHEDULER: z
    .string()
    .optional()
    .transform((v) => v !== 'false'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  return envSchema.parse(config);
}
