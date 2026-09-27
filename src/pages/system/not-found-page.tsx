import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/ui/button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 rounded-full neu-flat flex items-center justify-center text-ink-muted mb-6">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-ink">404 — Trang không tồn tại</h1>
      <p className="text-ink-muted mt-2 max-w-md text-sm leading-relaxed">
        Đường dẫn bạn yêu cầu không tồn tại hoặc đã được di chuyển sang vị trí khác.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Link to="/">
          <Button variant="outline">Về trang chủ</Button>
        </Link>
        <Link to="/app/projects">
          <Button variant="primary">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Về không gian làm việc
          </Button>
        </Link>
      </div>
    </div>
  );
};
