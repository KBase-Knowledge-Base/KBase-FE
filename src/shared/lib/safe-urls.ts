/**
 * Validates and sanitizes internal and external URLs to prevent Open Redirect and XSS.
 */

export function sanitizeReturnTo(url: string | null | undefined, fallback: string = '/app/projects'): string {
  if (!url) return fallback;
  const trimmed = url.trim();

  // Must start with a single slash and not double slash (protocol-relative)
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return fallback;
  }

  // Reject dangerous schemes or backslashes
  if (trimmed.includes('\\') || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return fallback;
  }

  return trimmed;
}

export function isSafeUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();

  // Disallow javascript:, data:, vbscript:
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:') ||
    trimmed.startsWith('file:')
  ) {
    return false;
  }

  // Allow internal relative URLs and anchors
  if ((trimmed.startsWith('/') && !trimmed.startsWith('//')) || trimmed.startsWith('#')) {
    return true;
  }

  // Allow http: and https:
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function sanitizeUrl(url: string | null | undefined, fallback: string = 'about:blank'): string {
  if (!url) return fallback;
  return isSafeUrl(url) ? url : fallback;
}
