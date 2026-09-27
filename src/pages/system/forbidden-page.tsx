import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/ui/button';

export const ForbiddenPage: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 rounded-full neu-flat flex items-center justify-center text-semantic-danger mb-6">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-ink">Không có quyền truy cập</h1>
      <p className="text-ink-muted mt-2 max-w-md text-sm leading-relaxed">
        Bạn không có quyền hạn cần thiết để xem trang này hoặc thực hiện thao tác được yêu cầu.
        Vui lòng liên hệ với chủ dự án hoặc quản trị viên nếu bạn cần cấp quyền.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Link to="/app/projects">
          <Button variant="primary">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Về danh sách dự án
          </Button>
        </Link>
      </div>
    </div>
  );
};
