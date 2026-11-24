import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AiProviderClient, AiRawJsonResult } from './ai-provider.interface';

@Injectable()
export class HermesProvider implements AiProviderClient {
  readonly name = 'hermes' as const;

  constructor(private readonly configService: ConfigService) {}

  async generateRawJson(request: {
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
    maxTokens?: number;
    timeoutMs?: number;
  }): Promise<AiRawJsonResult> {
    const baseUrl = (
      this.configService.get<string>('HERMES_BASE_URL') ?? 'http://172.22.0.1:8642'
    ).replace(/\/$/, '');
    const apiKey = this.configService.get<string>('HERMES_API_KEY') ?? '';
    const timeoutMs = request.timeoutMs ?? 45_000;
    const started = Date.now();

    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: 'hermes-default',
        temperature: request.temperature ?? 0.2,
        max_tokens: request.maxTokens ?? 2048,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: request.systemPrompt },
          { role: 'user', content: request.userPrompt },
        ],
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Hermes HTTP ${res.status}: ${errText.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      model?: string;
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    const content = json.choices?.[0]?.message?.content ?? '';
    const parsed = JSON.parse(stripCodeFences(content)) as unknown;

    return {
      rawJson: parsed,
      usage: {
        provider: 'hermes',
        model: json.model ?? 'hermes-default',
        inputTokens: json.usage?.prompt_tokens ?? 0,
        outputTokens: json.usage?.completion_tokens ?? 0,
        estimatedCostUsd: 0,
      },
      latencyMs: Date.now() - started,
    };
  }
}

export function stripCodeFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}
