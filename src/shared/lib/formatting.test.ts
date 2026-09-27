import { describe, it, expect } from 'vitest';
import { formatBytes, formatDate, formatRelativeTime } from './formatting';

describe('formatting utilities', () => {
  describe('formatBytes', () => {
    it('handles 0 and negative bytes gracefully', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(-100)).toBe('0 B');
    });

    it('formats bytes into KB, MB, GB properly', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1572864)).toBe('1.5 MB');
      expect(formatBytes(1073741824)).toBe('1 GB');
    });
  });

  describe('formatDate', () => {
    it('returns em-dash placeholder for null or invalid dates', () => {
      expect(formatDate(null)).toBe('—');
      expect(formatDate(undefined)).toBe('—');
      expect(formatDate('invalid-date')).toBe('—');
    });

    it('formats valid ISO date strings', () => {
      const formatted = formatDate('2026-01-15T10:30:00Z');
      expect(formatted).toContain('2026');
      expect(formatted).toContain('01');
      expect(formatted).toContain('15');
    });
  });

  describe('formatRelativeTime', () => {
    it('returns em-dash for falsy dates', () => {
      expect(formatRelativeTime(null)).toBe('—');
    });

    it('returns "Vừa xong" for recent timestamps', () => {
      const now = new Date().toISOString();
      expect(formatRelativeTime(now)).toBe('Vừa xong');
    });
  });
});
