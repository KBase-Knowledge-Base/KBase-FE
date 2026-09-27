import React, { useState, useRef, useEffect } from 'react';
import { guideApi } from '@/features/guide/api/guide';
import { GuideContextMessage, GuideSourceResponse } from '@/shared/api/types';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Textarea } from '@/shared/ui/textarea';
import { useToast } from '@/shared/ui/toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Sparkles,
  RotateCcw,
  Send,
  User,
  BookOpen,
  Info,
  AlertCircle,
  RotateCw,
} from 'lucide-react';
import { isApiError } from '@/shared/api/errors';
import { cn } from '@/shared/lib/utils';

interface GuideTurn {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  sources?: GuideSourceResponse[];
  answerType?: 'GROUNDED' | 'NO_EVIDENCE';
}

export const GuidePage: React.FC = () => {
  const { addToast } = useToast();
  const [turns, setTurns] = useState<GuideTurn[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, isLoading]);

  const handleClearHistory = () => {
    setTurns([]);
    setInputMessage('');
    setErrorMsg(null);
    addToast({
      type: 'info',
      title: 'Đã đặt lại phiên hướng dẫn',
      message: 'Lịch sử câu hỏi bộ nhớ tạm đã được xóa sạch.',
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputMessage.trim();
    if (!trimmed || isLoading) return;

    if (trimmed.length > 8000) {
      setErrorMsg('Câu hỏi quá dài (tối đa 8000 ký tự). Vui lòng rút ngắn.');
      return;
    }

    setErrorMsg(null);
    const userTurn: GuideTurn = {
      id: Math.random().toString(36).substring(2, 9),
      role: 'USER',
      content: trimmed,
    };

    setTurns((prev) => [...prev, userTurn]);
    setInputMessage('');
    setIsLoading(true);

    // Build context: last 8 messages, max 4000 chars each
    const recentTurns = [...turns, userTurn].slice(-8);
    const context: GuideContextMessage[] = recentTurns.slice(0, -1).map((t) => ({
      role: t.role,
      content: t.content.slice(0, 4000),
    }));

    try {
      const res = await guideApi.queryGuide({
        message: trimmed,
        context,
      });

      const assistantTurn: GuideTurn = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'ASSISTANT',
        content: res.answer,
        sources: res.sources,
        answerType: res.answerType,
      };

      setTurns((prev) => [...prev, assistantTurn]);
    } catch (err: unknown) {
      if (isApiError(err)) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Không thể nhận phản hồi từ KBase Guide lúc này. Vui lòng thử lại sau.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const sampleQuestions = [
    'Làm thế nào để tạo một dự án mới trên KBase?',
    'Những định dạng tệp nào được hỗ trợ lập chỉ mục AI?',
    'Cách mời thành viên tham gia dự án?',
    'Trợ lý AI trích dẫn câu trả lời dựa trên những gì?',
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">KBase Guide</h1>
            <Badge variant="accent" className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Tài liệu hướng dẫn
            </Badge>
          </div>
          <p className="text-sm text-ink-muted mt-1">
            Hỏi đáp tức thì về cách sử dụng, tính năng và quy trình hoạt động của nền tảng KBase.
          </p>
        </div>

        {turns.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearHistory}
            className="text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Làm mới phiên
          </Button>
        )}
      </div>

      {/* Main Conversation Container */}
      <Card className="p-0 overflow-hidden flex flex-col h-[calc(100vh-16rem)] min-h-[500px]">
        {/* Memory notice banner */}
        <div className="px-4 py-2 bg-surface-subtle border-b border-border-subtle flex items-center justify-between text-xs text-ink-muted">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-accent shrink-0" />
            <span>KBase Guide hoạt động độc lập và lưu trữ ngữ cảnh trong bộ nhớ phiên làm việc.</span>
          </div>
          {turns.length > 0 && (
            <span>{turns.length} tin nhắn trong phiên</span>
          )}
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {turns.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-14 h-14 rounded-full neu-flat flex items-center justify-center text-accent mx-auto">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink">Chào bạn, tôi là KBase Guide</h3>
                <p className="text-xs text-ink-muted mt-1 max-w-md mx-auto leading-relaxed">
                  Tôi có thể giúp bạn giải đáp mọi thắc mắc về cách sử dụng dự án, thư mục, tải tệp tin và cơ chế hoạt động của Trợ lý AI.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full pt-2">
                {sampleQuestions.map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setInputMessage(q)}
                    className="p-3 rounded-card border border-border bg-surface-subtle/50 text-xs text-ink hover:border-accent hover:bg-accent-subtle/30 transition-all text-left"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            turns.map((turn) => {
              const isUser = turn.role === 'USER';
              return (
                <div
                  key={turn.id}
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
                    {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
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
                        <p className="whitespace-pre-wrap">{turn.content}</p>
                      ) : (
                        <div className="prose prose-sm max-w-none text-ink">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {turn.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>

                    {/* Sources for Guide Answer */}
                    {!isUser && turn.sources && turn.sources.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <p className="text-[11px] font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-accent" />
                          Nguồn đặc tả ({turn.sources.length}):
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {turn.sources.map((s, idx) => (
                            <div
                              key={idx}
                              className="text-xs px-2.5 py-1 rounded bg-white border border-border text-ink"
                            >
                              <span className="font-semibold text-accent">{s.title}</span>
                              {s.section && (
                                <span className="text-ink-muted text-[11px] ml-1">
                                  — Mục: {s.section}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {isLoading && (
            <div className="flex gap-3 max-w-3xl mr-auto">
              <div className="w-8 h-8 rounded-full bg-accent-subtle text-accent border border-accent-light flex items-center justify-center font-bold text-xs shrink-0 animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-card bg-surface-subtle border border-border-subtle text-xs text-ink-muted flex items-center gap-2">
                <RotateCw className="w-3.5 h-3.5 animate-spin text-accent" />
                <span>KBase Guide đang tra cứu đặc tả hệ thống...</span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div
              role="alert"
              className="p-3 rounded-card bg-semantic-danger-bg border border-semantic-danger-border flex items-start gap-2 text-xs text-semantic-danger max-w-md mx-auto"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{errorMsg}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Composer */}
        <div className="p-3 border-t border-border bg-white">
          <form onSubmit={handleSend} className="relative">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi về tính năng hoặc hướng dẫn sử dụng KBase... (Enter để gửi)"
              rows={2}
              className="pr-14 resize-none text-xs sm:text-sm py-2.5"
              disabled={isLoading}
              autoFocus
            />

            <Button
              type="submit"
              size="sm"
              disabled={!inputMessage.trim() || isLoading}
              isLoading={isLoading}
              className="absolute right-2.5 bottom-2.5 h-8 w-8 p-0 rounded-full"
              title="Gửi câu hỏi"
              aria-label="Gửi câu hỏi"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};
