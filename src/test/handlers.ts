import { http, HttpResponse } from 'msw';

export const mockUser = {
  id: 'usr-test-123',
  email: 'test@kbase.dev',
  fullName: 'Test User',
  displayName: 'Test User',
  systemRole: 'USER' as const,
  status: 'ACTIVE' as const,
  emailVerified: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

export const mockProject = {
  id: 'prj-test-123',
  name: 'Demo Knowledge Base',
  description: 'A test project for unit testing',
  currentUserRole: 'OWNER',
  memberCount: 3,
  documentCount: 5,
  storageBytesUsed: 1048576,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

export const handlers = [
  // Auth
  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };
    if (body.email === 'invalid@kbase.dev') {
      return HttpResponse.json(
        {
          code: 'AUTH_INVALID_CREDENTIALS',
          message: 'Email hoặc mật khẩu không chính xác',
          status: 401,
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }
    return HttpResponse.json({
      accessToken: 'mock-access-token-123',
      tokenType: 'Bearer',
      expiresInSeconds: 900,
      user: mockUser,
    });
  }),

  http.post('/api/v1/auth/refresh', () => {
    return HttpResponse.json({
      accessToken: 'mock-refreshed-token-456',
      tokenType: 'Bearer',
      expiresInSeconds: 900,
      user: mockUser,
    });
  }),

  http.post('/api/v1/auth/logout', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Account
  http.get('/api/v1/account/me', () => {
    return HttpResponse.json(mockUser);
  }),

  // Projects
  http.get('/api/v1/projects', () => {
    return HttpResponse.json({
      content: [mockProject],
      totalElements: 1,
      totalPages: 1,
      size: 20,
      number: 0,
      first: true,
      last: true,
      empty: false,
    });
  }),

  http.get('/api/v1/projects/:id', ({ params }) => {
    return HttpResponse.json({
      ...mockProject,
      id: params.id,
    });
  }),

  // Project Assistant
  http.get('/api/v1/projects/:id/ai/conversations', () => {
    return HttpResponse.json({
      content: [
        {
          id: 'convo-test-1',
          projectId: 'prj-test-123',
          title: 'Cuộc trò chuyện mẫu',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 20,
      number: 0,
      first: true,
      last: true,
      empty: false,
    });
  }),

  http.post('/api/v1/projects/:id/ai/conversations', () => {
    return HttpResponse.json({
      conversation: {
        id: 'convo-test-1',
        projectId: 'prj-test-123',
        title: 'Tóm tắt tài liệu dự án',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      message: {
        id: 'msg-1',
        conversationId: 'convo-test-1',
        role: 'ASSISTANT',
        content: 'Kiến trúc KBase gồm Frontend React và Backend Spring Boot.',
        answerType: 'GROUNDED',
        createdAt: '2026-01-01T00:00:00Z',
      },
      sources: [
        {
          id: 'src-1',
          messageId: 'msg-1',
          documentId: 'doc-1',
          documentName: 'ARCHITECTURE.md',
          pageNumber: 1,
          slideNumber: null,
          sectionTitle: 'Tổng quan',
          excerpt: 'Kiến trúc phân tầng clean architecture',
          confidenceScore: 0.95,
          sourceAvailable: true,
        },
      ],
    });
  }),

  // FEAPI-057: Guide query
  http.post('/api/v1/ai/guide/query', () => {
    return HttpResponse.json({
      answer: 'KBase là nền tảng quản lý tri thức nội bộ có tích hợp AI RAG.',
      answerType: 'GROUNDED',
      sources: [
        {
          sourceKey: 'guide-intro',
          title: 'Tổng quan hệ thống',
          section: 'Giới thiệu',
        },
      ],
    });
  }),
];
