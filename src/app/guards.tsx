import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/auth-context';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute: React.FC = () => {
  const { status, isAuthenticated } = useAuth();
  const location = useLocation();

  if (status === 'bootstrapping') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas" role="status">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-sm font-medium text-ink-muted">Đang tải dữ liệu phiên làm việc...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnTo = location.pathname + location.search;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  return <Outlet />;
};

export const AdminRoute: React.FC = () => {
  const { status, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (status === 'bootstrapping') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas" role="status">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-sm font-medium text-ink-muted">Đang kiểm tra quyền quản trị viên...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnTo = location.pathname + location.search;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
};

export const PublicOnlyRoute: React.FC = () => {
  const { status, isAuthenticated } = useAuth();

  if (status === 'bootstrapping') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/app/projects" replace />;
  }

  return <Outlet />;
};
