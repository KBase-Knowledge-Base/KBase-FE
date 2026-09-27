import React from 'react';
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/shared/ui/button';

export const RouteErrorBoundary: React.FC = () => {
  const error = useRouteError();

  let errorMessage = 'Đã có lỗi không mong muốn xảy ra trong quá trình kết xuất giao diện.';
  let statusCode = 500;

  if (isRouteErrorResponse(error)) {
    statusCode = error.status;
    errorMessage = error.data?.message || error.statusText || errorMessage;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-canvas text-center">
      <div className="w-16 h-16 rounded-full bg-semantic-danger-bg border border-semantic-danger-border flex items-center justify-center text-semantic-danger mb-6">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-ink">
        {statusCode === 404 ? '404 — Không tìm thấy trang' : 'Lỗi hệ thống'}
      </h1>
      <p className="text-ink-muted mt-2 max-w-md text-sm leading-relaxed">
        {errorMessage}
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Button variant="outline" onClick={handleReload}>
          <RefreshCw className="w-4 h-4 mr-1.5" />
          Tải lại trang
        </Button>
        <Link to="/app/projects">
          <Button variant="primary">
            <Home className="w-4 h-4 mr-1.5" />
            Về trang chính
          </Button>
        </Link>
      </div>
    </div>
  );
};
