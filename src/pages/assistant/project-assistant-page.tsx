import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProject } from '@/app/layouts/project-layout';
import { assistantApi } from '@/features/project-assistant/api/assistant';
import {
  AiTurnResponse,
  AiSourceResponse,
} from '@/shared/api/types';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Textarea } from '@/shared/ui/textarea';
import { Input } from '@/shared/ui/input';
import { ContentSkeleton } from '@/shared/ui/skeleton';
import { ErrorState } from '@/shared/ui/error-state';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui/dialog';
import { ConfirmDangerDialog } from '@/shared/ui/confirm-danger-dialog';
import { useToast } from '@/shared/ui/toast';
import { formatRelativeTime } from '@/shared/lib/formatting';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bot,
  User,
  Plus,
  Send,
  MessageSquare,
  FileText,
  Trash2,
  Edit2,
  ExternalLink,
  Info,
  RotateCw,
} from 'lucide-react';
import { isApiError } from '@/shared/api/errors';
import { cn } from '@/shared/lib/utils';

export const ProjectAssistantPage: React.FC = () => {
  const { projectId } = useProject();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [inputMessage, setInputMessage] = useState('');
  const [selectedCitation, setSelectedCitation] = useState<AiSourceResponse | null>(null);

  // Dialog states for rename & delete conversation
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch conversations list for current user & project (Max 5)
  const {
    data: conversationsData,
    isLoading: isConversationsLoading,
  } = useQuery({
    queryKey: ['ai-conversations', projectId],
    queryFn: () => assistantApi.getConversations(projectId, { size: 10 }),
  });

  const conversations = conversationsData?.content || [];
  const currentConversation = conversations.find((c) => c.id === conversationId);

  // 2. Fetch messages if conversationId is selected
  const {
    data: messagesData,
    isLoading: isMessagesLoading,
    isError: isMessagesError,
    error: messagesError,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ['ai-messages', projectId, conversationId],
    queryFn: () => assistantApi.getMessages(projectId, conversationId!, { size: 50 }),
    enabled: !!conversationId,
  });

  const turns: AiTurnResponse[] = React.useMemo(
    () => messagesData?.content || [],
    [messagesData?.content]
  );

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, isMessagesLoading]);

  // Mutations
  const createConversationMutation = useMutation({
    mutationFn: (message: string) =>
      assistantApi.createConversation(projectId, { message }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations', projectId] });
      setInputMessage('');
      navigate(`/app/projects/${projectId}/assistant/${res.conversation.id}`);
    },
    onError: (err: unknown) => {
      addToast({
        type: 'error',
        title: 'Lỗi gửi tin nhắn',
        message: isApiError(err) ? err.message : 'Không thể khởi tạo cuộc trò chuyện.',
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (message: string) =>
      assistantApi.sendMessage(projectId, conversationId!, { message }),
    onSuccess: () => {
      setInputMessage('');
      queryClient.invalidateQueries({ queryKey: ['ai-messages', projectId, conversationId] });
      queryClient.invalidateQueries({ queryKey: ['ai-conversations', projectId] });
    },
    onError: (err: unknown) => {
      addToast({
        type: 'error',
        title: 'Lỗi gửi tin nhắn',
        message: isApiError(err) ? err.message : 'Không thể gửi câu hỏi.',
      });
    },
  });

  const renameMutation = useMutation({
    mutationFn: (title: string) =>
      assistantApi.renameConversation(projectId, conversationId!, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations', projectId] });
      setRenameDialogOpen(false);
      addToast({ type: 'success', title: 'Đổi tên thành công' });
    },
    onError: (err: unknown) => {
      addToast({
        type: 'error',
        title: 'Lỗi đổi tên',
        message: isApiError(err) ? err.message : 'Không thể đổi tên cuộc trò chuyện.',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => assistantApi.deleteConversation(projectId, conversationId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations', projectId] });
      setDeleteDialogOpen(false);
      addToast({ type: 'success', title: 'Đã xóa cuộc trò chuyện' });
      navigate(`/app/projects/${projectId}/assistant`);
    },
    onError: (err: unknown) => {
      addToast({
        type: 'error',
        title: 'Lỗi xóa',
        message: isApiError(err) ? err.message : 'Không thể xóa cuộc trò chuyện.',
      });
    },
  });

  const isSending = createConversationMutation.isPending || sendMessageMutation.isPending;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputMessage.trim();
    if (!trimmed || isSending) return;

    if (!conversationId) {
      // First question creates conversation
      createConversationMutation.mutate(trimmed);
    } else {
      sendMessageMutation.mutate(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-14rem)] min-h-[500px] text-left">
      {/* Left Rail: Conversations List */}
      <div className="w-full lg:w-72 flex flex-col rounded-card bg-white border border-border shadow-sm overflow-hidden shrink-0">
        <div className="p-3.5 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-accent" />
            <span className="text-sm font-bold text-ink">Cuộc trò chuyện</span>
          </div>

          <Link to={`/app/projects/${projectId}/assistant`}>
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 px-2"
              disabled={conversations.length >= 5}
              title={conversations.length >= 5 ? 'Đã đạt giới hạn tối đa 5 cuộc trò chuyện' : 'Tạo cuộc trò chuyện mới'}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Mới
            </Button>
          </Link>
        </div>

        {conversations.length >= 5 && (
          <div className="px-3 py-1.5 bg-semantic-warning-bg border-b border-semantic-warning-border text-[11px] text-semantic-warning flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>Đã đạt tối đa 5/5 cuộc trò chuyện</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isConversationsLoading ? (
            <div className="p-2 space-y-2">
              <ContentSkeleton height={36} count={3} />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-ink-muted">
              <MessageSquare className="w-6 h-6 text-border-control mx-auto mb-2" />
              <p>Chưa có cuộc trò chuyện nào.</p>
              <p className="mt-1">Gửi câu hỏi đầu tiên ở khung bên phải để bắt đầu.</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = conv.id === conversationId;
              return (
                <Link
                  key={conv.id}
                  to={`/app/projects/${projectId}/assistant/${conv.id}`}
                  className={cn(
                    'block px-3 py-2.5 rounded-button text-xs transition-all text-left border',
                    isSelected
                      ? 'bg-ink text-white border-ink font-medium shadow-sm'
                      : 'bg-white text-ink border-transparent hover:bg-surface-subtle hover:border-border-subtle'
                  )}
                >
                  <p className="font-semibold truncate">{conv.title}</p>
                  <p className={cn('text-[11px] truncate mt-0.5', isSelected ? 'text-white/70' : 'text-ink-muted')}>
                    {conv.lastMessagePreview || 'Chưa có tin nhắn...'}
                  </p>
                  <p className={cn('text-[10px] mt-1', isSelected ? 'text-white/50' : 'text-ink-subtle')}>
                    {formatRelativeTime(conv.updatedAt)}
                  </p>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* Main Column: Chat Area */}
      <div className="flex-1 flex flex-col rounded-card bg-white border border-border shadow-sm overflow-hidden">
        {/* Chat Topbar */}
        <div className="p-3.5 border-b border-border-subtle flex items-center justify-between bg-surface-subtle/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-accent-subtle text-accent flex items-center justify-center font-bold text-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink leading-tight">
                {currentConversation ? currentConversation.title : 'Cuộc trò chuyện mới'}
              </h3>
              <p className="text-[11px] text-ink-muted">
                Trợ lý tri thức trả lời dựa trên các tài liệu đã lập chỉ mục của dự án
              </p>
            </div>
          </div>

          {currentConversation && (
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 px-2"
                onClick={() => {
                  setNewTitle(currentConversation.title);
                  setRenameDialogOpen(true);
                }}
              >
                <Edit2 className="w-3.5 h-3.5 mr-1" />
                Đổi tên
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 px-2 text-semantic-danger hover:bg-semantic-danger-bg"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Xóa
              </Button>
            </div>
          )}
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {!conversationId ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-full neu-flat flex items-center justify-center text-accent mx-auto">
                <Bot className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-ink">Bắt đầu câu hỏi đầu tiên</h4>
              <p className="text-xs text-ink-muted max-w-md leading-relaxed">
                Trợ lý AI sẽ đọc tài liệu trong dự án và đưa ra câu trả lời kèm nguồn trích dẫn chính xác (số trang, đề mục).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 max-w-lg w-full text-left">
                {[
                  'Tóm tắt các điểm chính trong tài liệu dự án?',
                  'Dự án này có những quy chuẩn kỹ thuật nào?',
                  'Tìm thông tin liên hệ và các điều khoản trong hợp đồng?',
                  'Các bước triển khai được mô tả như thế nào?',
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setInputMessage(sample)}
                    className="p-2.5 rounded-card border border-border bg-surface-subtle/50 text-xs text-ink hover:border-accent hover:bg-accent-subtle/30 transition-all text-left"
                  >
                    "{sample}"
                  </button>
                ))}
              </div>
            </div>
          ) : isMessagesLoading ? (
            <div className="space-y-4">
              <ContentSkeleton height={60} count={3} />
            </div>
          ) : isMessagesError ? (
            <ErrorState
              title="Không thể tải lịch sử trò chuyện"
              message={(messagesError as Error)?.message}
              onRetry={() => refetchMessages()}
            />
          ) : turns.length === 0 ? (
            <div className="text-center py-10 text-xs text-ink-muted">
              Chưa có tin nhắn trong cuộc trò chuyện này.
            </div>
          ) : (
            turns.map((turn) => {
              const isUser = turn.message.role === 'USER';
              return (
                <div
                  key={turn.message.id}
                  className={cn(
                    'flex gap-3 max-w-3xl',
                    isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0',
                      isUser ? 'bg-ink text-white' : 'bg-accent-subtle text-accent border border-accent-light'
                    )}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div className="space-y-2 max-w-[85%]">
                    <div
                      className={cn(
                        'p-4 rounded-card text-sm leading-relaxed',
                        isUser
                          ? 'bg-ink text-white shadow-sm'
                          : 'bg-surface-subtle/70 text-ink border border-border-subtle shadow-sm'
                      )}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{turn.message.content}</p>
                      ) : (
                        <div className="prose prose-sm max-w-none text-ink">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {turn.message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>

                    {/* Citations block for assistant turn */}
                    {!isUser && turn.sources && turn.sources.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <p className="text-[11px] font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1">
                          <FileText className="w-3 h-3 text-accent" />
                          Nguồn trích dẫn ({turn.sources.length}):
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {turn.sources.map((src) => (
                            <button
                              key={src.id}
                              type="button"
                              onClick={() => setSelectedCitation(src)}
                              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-card bg-white border border-border hover:border-accent hover:text-accent transition-colors shadow-2xs text-left"
                            >
                              <span className="font-semibold truncate max-w-[180px]">{src.documentName}</span>
                              {src.pageNumber && (
                                <span className="text-[10px] text-ink-muted bg-surface-subtle px-1 rounded">
                                  Trang {src.pageNumber}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {isSending && (
            <div className="flex gap-3 max-w-3xl mr-auto">
              <div className="w-8 h-8 rounded-full bg-accent-subtle text-accent border border-accent-light flex items-center justify-center font-bold text-xs shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-card bg-surface-subtle border border-border-subtle text-xs text-ink-muted flex items-center gap-2">
                <RotateCw className="w-3.5 h-3.5 animate-spin text-accent" />
                <span>Trợ lý đang đọc tài liệu và chuẩn bị câu trả lời...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Composer */}
        <div className="p-3 border-t border-border bg-white">
          <form onSubmit={handleSendMessage} className="relative">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Đặt câu hỏi về tài liệu trong dự án... (Nhấn Enter để gửi, Shift+Enter để xuống dòng)"
              rows={2}
              className="pr-14 resize-none text-xs sm:text-sm py-2.5"
              disabled={isSending}
              autoFocus
            />

            <Button
              type="submit"
              size="sm"
              disabled={!inputMessage.trim() || isSending}
              isLoading={isSending}
              className="absolute right-2.5 bottom-2.5 h-8 w-8 p-0 rounded-full"
              title="Gửi câu hỏi"
              aria-label="Gửi câu hỏi"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Citation Detail Modal Drawer */}
      <Dialog open={!!selectedCitation} onOpenChange={(open) => !open && setSelectedCitation(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent shrink-0" />
              <DialogTitle className="truncate">{selectedCitation?.documentName}</DialogTitle>
            </div>
            <DialogDescription>
              Chi tiết đoạn văn bản được Trợ lý AI sử dụng để trích dẫn câu trả lời.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-left">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {selectedCitation?.pageNumber && (
                <Badge variant="neutral">Trang: {selectedCitation.pageNumber}</Badge>
              )}
              {selectedCitation?.sectionTitle && (
                <Badge variant="neutral">Mục: {selectedCitation.sectionTitle}</Badge>
              )}
              {selectedCitation?.confidenceScore !== null && selectedCitation?.confidenceScore !== undefined && (
                <Badge variant="accent">Độ tương quan: {Math.round(selectedCitation.confidenceScore * 100)}%</Badge>
              )}
            </div>

            <div className="p-3.5 rounded-card bg-surface-subtle/80 border border-border text-xs text-ink leading-relaxed max-h-60 overflow-y-auto">
              <p className="font-semibold text-ink-muted mb-1">Đoạn trích từ tài liệu:</p>
              <p className="whitespace-pre-wrap font-serif italic text-ink">
                "{selectedCitation?.excerpt}"
              </p>
            </div>
          </div>

          <DialogFooter>
            {selectedCitation?.sourceAvailable && selectedCitation.documentId ? (
              <Link to={`/app/documents/${selectedCitation.documentId}`}>
                <Button size="sm">
                  <ExternalLink className="w-4 h-4 mr-1.5" />
                  Mở tài liệu gốc
                </Button>
              </Link>
            ) : (
              <p className="text-xs text-ink-muted self-center">
                (Tài liệu gốc hiện không còn khả dụng để mở trực tiếp)
              </p>
            )}
            <Button variant="outline" size="sm" onClick={() => setSelectedCitation(null)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Conversation Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đổi tên cuộc trò chuyện</DialogTitle>
            <DialogDescription>Đặt tiêu đề gợi nhớ cho cuộc trò chuyện này.</DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newTitle.trim()) renameMutation.mutate(newTitle.trim());
            }}
            className="space-y-4"
          >
            <Input
              label="Tiêu đề cuộc trò chuyện"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              autoFocus
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRenameDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" isLoading={renameMutation.isPending}>
                Lưu tiêu đề
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Conversation Dialog */}
      <ConfirmDangerDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Xóa cuộc trò chuyện"
        description="Bạn có chắc chắn muốn xóa cuộc trò chuyện này không? Lịch sử câu hỏi và câu trả lời sẽ bị xóa hoàn toàn."
        confirmText="Xóa cuộc trò chuyện"
        isConfirming={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
};
