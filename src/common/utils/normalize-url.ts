import { HttpStatus } from '@nestjs/common';
import { AppException } from '../exceptions/app.exception';

const TRACKING_PARAM_EXACT = new Set(['fbclid', 'gclid', 'ref', 'mc_cid', 'mc_eid']);

export function normalizeUrl(rawUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new AppException(HttpStatus.BAD_REQUEST, 'VALIDATION_FAILED', '유효하지 않은 URL입니다.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new AppException(
      HttpStatus.BAD_REQUEST,
      'SSRF_BLOCKED_URL',
      'http 또는 https 프로토콜만 허용됩니다.',
    );
  }

  parsed.hostname = parsed.hostname.toLowerCase();
  if (
    (parsed.protocol === 'http:' && parsed.port === '80') ||
    (parsed.protocol === 'https:' && parsed.port === '443')
  ) {
    parsed.port = '';
  }

  parsed.hash = '';

  const keptEntries: Array<[string, string]> = [];
  for (const [key, value] of parsed.searchParams.entries()) {
    const lowerKey = key.toLowerCase();
    if (lowerKey.startsWith('utm_') || TRACKING_PARAM_EXACT.has(lowerKey)) {
      continue;
    }
    keptEntries.push([key, value]);
  }

  keptEntries.sort((a, b) => {
    if (a[0] !== b[0]) return a[0].localeCompare(b[0]);
    return a[1].localeCompare(b[1]);
  });

  const sortedParams = new URLSearchParams();
  for (const [k, v] of keptEntries) {
    sortedParams.append(k, v);
  }
  const qs = sortedParams.toString();
  parsed.search = qs ? `?${qs}` : '';

  if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
    parsed.pathname = parsed.pathname.replace(/\/+$/, '');
  }

  return parsed.toString();
}
