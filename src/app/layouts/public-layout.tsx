import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/auth-context';
import { Button } from '@/shared/ui/button';
import { ArrowRight } from 'lucide-react';

export const PublicLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-canvas/80 backdrop-blur-md border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-lg text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded">
            <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center text-white font-bold">
              K
            </div>
            <span>KBase</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-ink-muted">
            <a href="#problem" className="hover:text-ink transition-colors">Vấn đề</a>
            <a href="#features" className="hover:text-ink transition-colors">Tính năng</a>
            <a href="#workflow" className="hover:text-ink transition-colors">Quy trình</a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link to="/app/projects">
                <Button size="sm">
                  Vào không gian làm việc
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Đăng nhập</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">
                    Tạo tài khoản
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-ink-muted">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-ink flex items-center justify-center text-white text-xs font-bold">
              K
            </div>
            <span className="font-semibold text-ink">KBase</span>
            <span>— Quản lý tri thức và Trợ lý tài liệu AI</span>
          </div>
          <div className="flex items-center gap-6 text-xs">
            <span>Phiên bản v1.0.0</span>
            <span>Hệ thống cơ sở tri thức nội bộ</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
