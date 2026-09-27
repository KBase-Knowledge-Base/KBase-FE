import { describe, it, expect } from 'vitest';
import { assistantApi } from './api/assistant';

describe('assistantApi module', () => {
  it('retrieves conversations list with PageResponse format', async () => {
    const res = await assistantApi.getConversations('prj-test-123');
    expect(res).toBeDefined();
    expect(res.content?.length).toBe(1);
    expect(res.content?.[0]?.id).toBe('convo-test-1');
  });

  it('creates conversation on first message and receives grounded turn with citations', async () => {
    const res = await assistantApi.createConversation('prj-test-123', {
      message: 'Tài liệu nói gì về kiến trúc?',
    });

    expect(res.conversation.id).toBe('convo-test-1');
    expect(res.message.status).toBe('GROUNDED');
    expect(res.message.content).toContain('Kiến trúc KBase');
    expect(res.sources.length).toBe(1);
    expect(res.sources[0]?.documentName).toBe('ARCHITECTURE.md');
    expect(res.sources[0]?.sourceAvailable).toBe(true);
  });
});
