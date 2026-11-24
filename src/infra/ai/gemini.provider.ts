import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AiProviderClient, AiRawJsonResult } from './ai-provider.interface';
import { stripCodeFences } from './hermes.provider';

@Injectable()
export class GeminiProvider implements AiProviderClient {
  readonly name = 'gemini' as const;

  constructor(private readonly configService: ConfigService) {}

  async generateRawJson(request: {
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
    maxTokens?: number;
    timeoutMs?: number;
  }): Promise<AiRawJsonResult> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') ?? '';
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const model = this.configService.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash';
    const timeoutMs = request.timeoutMs ?? 45_000;
    const started = Date.now();

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: request.systemPrompt }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: request.userPrompt }],
          },
        ],
        generationConfig: {
          temperature: request.temperature ?? 0.2,
          maxOutputTokens: request.maxTokens ?? 2048,
          responseMimeType: 'application/json',
        },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Gemini HTTP ${res.status}: ${errText.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    };

    const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const parsed = JSON.parse(stripCodeFences(text)) as unknown;

    const inputTokens = json.usageMetadata?.promptTokenCount ?? 0;
    const outputTokens = json.usageMetadata?.candidatesTokenCount ?? 0;
    // Conservative Gemini 2.5 Flash token estimate ($0.15/1M input, $0.60/1M output)
    const estimatedCostUsd = Number(
      ((inputTokens * 0.15 + outputTokens * 0.6) / 1_000_000).toFixed(6),
    );

    return {
      rawJson: parsed,
      usage: {
        provider: 'gemini',
        model,
        inputTokens,
        outputTokens,
        estimatedCostUsd,
      },
      latencyMs: Date.now() - started,
    };
  }
}
