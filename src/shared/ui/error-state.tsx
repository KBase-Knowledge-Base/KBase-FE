import React from 'react';
import { cn } from '@/shared/lib/utils';
import { AlertCircle, RefreshCw, Copy, Check } from 'lucide-react';
import { Button } from './button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  requestId?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Đã có lỗi xảy ra',
  message = 'Không thể tải dữ liệu. Vui lòng kiểm tra kết nối mạng và thử lại.',
  requestId,
  onRetry,
  className,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyRequestId = () => {
    if (!requestId) return;
    navigator.clipboard.writeText(requestId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-card border border-semantic-danger-border bg-semantic-danger-bg/40',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-semantic-danger-bg border border-semantic-danger-border flex items-center justify-center text-semantic-danger mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-semantic-danger">{title}</h3>
      <p className="text-sm text-ink-muted mt-1 max-w-md">{message}</p>
      {requestId && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-ink-muted bg-white px-2.5 py-1 rounded border border-border">
          <span>Request ID: <code className="font-mono">{requestId}</code></span>
          <button
            type="button"
            onClick={handleCopyRequestId}
            className="p-1 hover:text-ink text-ink-muted rounded"
            title="Sao chép Request ID"
            aria-label="Sao chép Request ID"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-semantic-success" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
      {onRetry && (
        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Thử lại
          </Button>
        </div>
      )}
    </div>
  );
};
