import { AppException } from '../exceptions/app.exception';
import { isBlockedIp, SafeFetchService } from './safe-fetch';

class TestableSafeFetchService extends SafeFetchService {
  dnsMap: Record<string, Array<{ address: string }>> = {};
  fetchImpl: (url: string, init: RequestInit) => Promise<Response> = () =>
    Promise.resolve(new Response('ok', { status: 200 }));

  protected override resolveHostname(hostname: string) {
    return Promise.resolve(this.dnsMap[hostname] ?? [{ address: '93.184.216.34' }]);
  }

  protected override performFetch(url: string, init: RequestInit) {
    return this.fetchImpl(url, init);
  }
}

describe('SafeFetchService SSRF Protection', () => {
  it('detects private, loopback, link-local, and IPv6 ULA/loopback ranges', () => {
    expect(isBlockedIp('127.0.0.1')).toBe(true);
    expect(isBlockedIp('10.0.0.5')).toBe(true);
    expect(isBlockedIp('172.16.0.1')).toBe(true);
    expect(isBlockedIp('172.22.0.1')).toBe(true);
    expect(isBlockedIp('192.168.1.10')).toBe(true);
    expect(isBlockedIp('169.254.169.254')).toBe(true);
    expect(isBlockedIp('0.0.0.0')).toBe(true);
    expect(isBlockedIp('::1')).toBe(true);
    expect(isBlockedIp('fe80::1')).toBe(true);
    expect(isBlockedIp('fc00::1')).toBe(true);
    expect(isBlockedIp('::ffff:127.0.0.1')).toBe(true);
    expect(isBlockedIp('93.184.216.34')).toBe(false);
    expect(isBlockedIp('8.8.8.8')).toBe(false);
  });

  it('blocks direct private/metadata IPs and DNS resolving to private IPs', async () => {
    const svc = new TestableSafeFetchService();
    await expect(svc.assertSafeUrl('http://127.0.0.1:8080/health')).rejects.toMatchObject({
      errorCode: 'SSRF_BLOCKED_URL',
    });
    await expect(
      svc.assertSafeUrl('http://169.254.169.254/latest/meta-data'),
    ).rejects.toBeInstanceOf(AppException);

    svc.dnsMap['evil.example.com'] = [{ address: '10.1.2.3' }];
    await expect(svc.assertSafeUrl('https://evil.example.com/test')).rejects.toMatchObject({
      errorCode: 'SSRF_BLOCKED_URL',
    });
  });

  it('blocks redirects to private IPs on subsequent hops', async () => {
    const svc = new TestableSafeFetchService();
    svc.fetchImpl = () =>
      Promise.resolve(
        new Response(null, {
          status: 302,
          headers: { location: 'http://169.254.169.254/latest/meta-data' },
        }),
      );

    await expect(svc.fetchText('https://public.example.com/start')).rejects.toMatchObject({
      errorCode: 'SSRF_BLOCKED_URL',
    });
  });
});
