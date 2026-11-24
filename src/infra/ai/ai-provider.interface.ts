import type { ZodType } from 'zod';

export const HERMES_PROVIDER = Symbol('HERMES_PROVIDER');
export const GEMINI_PROVIDER = Symbol('GEMINI_PROVIDER');

export interface AiJsonRequest<T> {
  systemPrompt: string;
  userPrompt: string;
  schema: ZodType<T>;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface AiRawJsonResult {
  rawJson: unknown;
  usage: {
    provider: 'hermes' | 'gemini';
    model: string;
    inputTokens: number;
    outputTokens: number;
    estimatedCostUsd: number;
  };
  latencyMs: number;
}

export interface AiJsonResponse<T> {
  data: T;
  usage: {
    provider: 'hermes' | 'gemini';
    model: string;
    inputTokens: number;
    outputTokens: number;
    estimatedCostUsd: number;
  };
  latencyMs: number;
}

export interface AiProviderClient {
  readonly name: 'hermes' | 'gemini';
  generateRawJson(request: {
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
    maxTokens?: number;
    timeoutMs?: number;
  }): Promise<AiRawJsonResult>;
}
