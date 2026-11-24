import { normalizeUrl } from './normalize-url';

describe('normalizeUrl', () => {
  it('lowercases host, strips default ports, fragments, trailing slashes, and tracking params, and sorts remaining query keys', () => {
    const input =
      'HTTPS://Example.COM:443/docs/Guide/?z=2&utm_source=x&fbclid=abc&a=1&gclid=def#section';
    expect(normalizeUrl(input)).toBe('https://example.com/docs/Guide?a=1&z=2');
  });

  it('preserves root path slash and strips port 80 on http', () => {
    expect(normalizeUrl('http://EXAMPLE.com:80/')).toBe('http://example.com/');
  });

  it('rejects non-http(s) schemes', () => {
    expect(() => normalizeUrl('file:///etc/passwd')).toThrow();
    expect(() => normalizeUrl('javascript:alert(1)')).toThrow();
  });
});
