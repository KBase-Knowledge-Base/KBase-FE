import { describe, it, expect } from 'vitest';
import { sanitizeUrl, isSafeUrl } from './safe-urls';

describe('safe-urls utility', () => {
  it('allows safe http and https URLs', () => {
    expect(isSafeUrl('https://kbase.dev/docs')).toBe(true);
    expect(isSafeUrl('http://localhost:3000')).toBe(true);
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
  });

  it('allows relative paths and anchor links', () => {
    expect(isSafeUrl('/projects/123')).toBe(true);
    expect(isSafeUrl('#section')).toBe(true);
    expect(sanitizeUrl('/dashboard')).toBe('/dashboard');
  });

  it('rejects and neutralizes dangerous javascript: URLs', () => {
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeUrl('JAVASCRIPT:alert(document.cookie)')).toBe(false);
    expect(sanitizeUrl('javascript:alert(1)')).toBe('about:blank');
  });

  it('rejects data: and vbscript: URLs', () => {
    expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isSafeUrl('vbscript:msgbox("test")')).toBe(false);
    expect(sanitizeUrl('data:text/html,hack')).toBe('about:blank');
  });
});
