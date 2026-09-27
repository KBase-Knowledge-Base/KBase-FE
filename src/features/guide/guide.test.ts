import { describe, it, expect } from 'vitest';
import { guideApi } from './api/guide';
import { GuideQueryRequest } from '@/shared/api/types';

describe('guideApi module', () => {
  it('sends question with in-memory context (max 8 messages) and receives answer with sources', async () => {
    const payload: GuideQueryRequest = {
      message: 'KBase hỗ trợ định dạng tệp nào?',
      context: [
        { role: 'USER', content: 'Chào bạn!' },
        { role: 'ASSISTANT', content: 'Xin chào, tôi là KBase Guide.' },
      ],
    };

    const res = await guideApi.queryGuide(payload);
    expect(res).toBeDefined();
    expect(res.answer).toContain('KBase');
    expect(res.sources.length).toBeGreaterThan(0);
    expect(res.sources[0]?.sourceKey).toBe('guide-intro');
    expect(res.sources[0]?.title).toBe('Tổng quan hệ thống');
  });
});
