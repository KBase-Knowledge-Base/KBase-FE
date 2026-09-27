import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll } from 'vitest';
import vm from 'node:vm';
import { server } from './server';
import { tokenStorage } from '@/shared/api/client';

// Align jsdom AbortController & AbortSignal with Node native globals for MSW compatibility
if (typeof window !== 'undefined') {
  try {
    const NodeAbortController = vm.runInThisContext('AbortController');
    const NodeAbortSignal = vm.runInThisContext('AbortSignal');
    if (NodeAbortController && NodeAbortSignal) {
      window.AbortController = NodeAbortController;
      window.AbortSignal = NodeAbortSignal;
      globalThis.AbortController = NodeAbortController;
      globalThis.AbortSignal = NodeAbortSignal;
    }
  } catch {
    // Fallback if vm execution fails
  }
}

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' });
});

afterEach(() => {
  server.resetHandlers();
  tokenStorage.clear();
});

afterAll(() => {
  server.close();
});
