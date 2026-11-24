import { HttpStatus, Injectable } from '@nestjs/common';
import * as dns from 'node:dns/promises';
import * as net from 'node:net';
import { AppException } from '../exceptions/app.exception';

export const ALKOK_USER_AGENT = 'AlkokBot/1.0 (+https://alkok.dobbymin.cloud)';
const DEFAULT_TIMEOUT_MS = 4000;
const MAX_REDIRECTS = 3;
const MAX_BODY_BYTES = 1024 * 1024; // 1MB

function ipv4ToInt(ip: string): number {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

export function isBlockedIp(ip: string): boolean {
  const trimmed = ip.trim().toLowerCase();
  if (net.isIPv4(trimmed)) {
    const n = ipv4ToInt(trimmed);
    const inRange = (cidrBase: string, maskBits: number) => {
      const base = ipv4ToInt(cidrBase);
      const mask = maskBits === 0 ? 0 : (~0 << (32 - maskBits)) >>> 0;
      return (n & mask) === (base & mask);
    };
    return (
      inRange('127.0.0.0', 8) ||
      inRange('10.0.0.0', 8) ||
      inRange('172.16.0.0', 12) ||
      inRange('192.168.0.0', 16) ||
      inRange('169.254.0.0', 16) ||
      inRange('0.0.0.0', 8) ||
      inRange('100.64.0.0', 10)
    );
  }

  if (net.isIPv6(trimmed)) {
    if (trimmed === '::1' || trimmed === '::') {
      return true;
    }
    if (trimmed.startsWith('::ffff:')) {
      const v4 = trimmed.slice('::ffff:'.length);
      if (net.isIPv4(v4)) {
        return isBlockedIp(v4);
      }
    }
    // fc00::/7 (ULA: fc00..fdff)
    if (trimmed.startsWith('fc') || trimmed.startsWith('fd')) {
      return true;
    }
    // fe80::/10 (link-local: fe80..febf)
    if (
      trimmed.startsWith('fe8') ||
      trimmed.startsWith('fe9') ||
      trimmed.startsWith('fea') ||
      trimmed.startsWith('feb')
    ) {
      return true;
    }
    return false;
  }

  return true;
}

export interface SafeFetchOptions {
  timeoutMs?: number;
  maxBytes?: number;
  headers?: Record<string, string>;
}

export interface SafeFetchResponse {
  status: number;
  finalUrl: string;
  contentType: string;
  bodyText: string;
}

@Injectable()
export class SafeFetchService {
  protected resolveHostname(hostname: string): Promise<Array<{ address: string }>> {
    return dns.lookup(hostname, { all: true });
  }

  protected performFetch(url: string, init: RequestInit): Promise<Response> {
    return fetch(url, init);
  }

  async assertSafeUrl(rawUrl: string): Promise<URL> {
    let url: URL;
    try {
      url = new URL(rawUrl);
    } catch {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'SSRF_BLOCKED_URL',
        '유효하지 않은 URL입니다.',
      );
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'SSRF_BLOCKED_URL',
        '허용되지 않는 URL 프로토콜입니다.',
      );
    }

    const host = url.hostname.replace(/^\[|\]$/g, '');
    if (host === 'localhost' || host.endsWith('.local')) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'SSRF_BLOCKED_URL',
        '내부 네트워크 주소에는 접근할 수 없습니다.',
      );
    }

    if (net.isIP(host)) {
      if (isBlockedIp(host)) {
        throw new AppException(HttpStatus.BAD_REQUEST, 'SSRF_BLOCKED_URL', '차단된 IP 대역입니다.');
      }
      return url;
    }

    let records: Array<{ address: string }>;
    try {
      records = await this.resolveHostname(host);
    } catch {
      throw new AppException(
        HttpStatus.BAD_GATEWAY,
        'FETCH_DNS_FAILED',
        '호스트 DNS 조회에 실패했습니다.',
      );
    }

    if (!records || records.length === 0 || records.some((r) => isBlockedIp(r.address))) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'SSRF_BLOCKED_URL',
        '사설망 또는 예약된 IP 대역은 접근할 수 없습니다.',
      );
    }

    return url;
  }

  async fetchText(rawUrl: string, options: SafeFetchOptions = {}): Promise<SafeFetchResponse> {
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const maxBytes = options.maxBytes ?? MAX_BODY_BYTES;
    let currentUrl = rawUrl;

    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
      await this.assertSafeUrl(currentUrl);

      const response = await this.performFetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          'User-Agent': ALKOK_USER_AGENT,
          Accept:
            'text/html,application/xhtml+xml,application/xml,application/rss+xml,application/json;q=0.9,*/*;q=0.8',
          ...(options.headers ?? {}),
        },
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location || hop === MAX_REDIRECTS) {
          throw new AppException(
            HttpStatus.BAD_REQUEST,
            'SSRF_BLOCKED_URL',
            '리다이렉트 횟수 제한을 초과했습니다.',
          );
        }
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }

      const bodyText = await this.readBodyWithLimit(response, maxBytes);
      return {
        status: response.status,
        finalUrl: currentUrl,
        contentType: response.headers.get('content-type') ?? '',
        bodyText,
      };
    }

    throw new AppException(
      HttpStatus.BAD_REQUEST,
      'SSRF_BLOCKED_URL',
      '리다이렉트 처리 중 차단되었습니다.',
    );
  }

  private async readBodyWithLimit(response: Response, maxBytes: number): Promise<string> {
    if (!response.body) {
      return '';
    }
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.byteLength;
        if (total > maxBytes) {
          await reader.cancel().catch(() => undefined);
          chunks.push(value.subarray(0, Math.max(0, value.byteLength - (total - maxBytes))));
          break;
        }
        chunks.push(value);
      }
    }

    const merged = Buffer.concat(chunks);
    return merged.toString('utf8');
  }
}
