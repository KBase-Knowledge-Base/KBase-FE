import React, { useState } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/auth-context';
import {
  FolderKanban,
  HelpCircle,
  User,
  Shield,
  Users,
  Building,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/shared/ui/dropdown-menu';
import { cn } from '@/shared/lib/utils';

export const AppLayout: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 px-3 py-2 rounded-button text-sm font-medium transition-all duration-150',
      isActive
        ? 'bg-ink text-white shadow-sm'
        : 'text-ink-muted hover:bg-surface-subtle hover:text-ink'
    );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-canvas">
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-border sticky top-0 z-30">
        <Link to="/app/projects" className="flex items-center gap-2 font-bold text-lg text-ink">
          <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center text-white font-bold text-sm">
            K
          </div>
          <span>KBase</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/app/guide"
            className="p-2 rounded-button text-accent hover:bg-accent-subtle"
            title="KBase Guide"
            aria-label="KBase Guide"
          >
            <Sparkles className="w-5 h-5" />
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-button text-ink hover:bg-surface-subtle"
            aria-label="Mở menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar for Desktop & Mobile drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-border flex flex-col transition-transform duration-200 md:translate-x-0 md:static',
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        )}
      >
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border-subtle">
          <Link to="/app/projects" className="flex items-center gap-2.5 font-bold text-lg text-ink">
            <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center text-white font-bold text-sm">
              K
            </div>
            <span>KBase</span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1 text-ink-muted hover:text-ink"
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle px-3 mb-2">
              Không gian làm việc
            </p>
            <div className="space-y-1">
              <NavLink
                to="/app/projects"
                onClick={() => setMobileMenuOpen(false)}
                className={navLinkClass}
              >
                <FolderKanban className="w-4 h-4 shrink-0" />
                <span>Dự án của tôi</span>
              </NavLink>

              <NavLink
                to="/app/guide"
                onClick={() => setMobileMenuOpen(false)}
                className={navLinkClass}
              >
                <HelpCircle className="w-4 h-4 shrink-0 text-accent" />
                <span>KBase Guide</span>
              </NavLink>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle px-3 mb-2">
              Tài khoản
            </p>
            <div className="space-y-1">
              <NavLink
                to="/app/settings/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={navLinkClass}
              >
                <User className="w-4 h-4 shrink-0" />
                <span>Hồ sơ cá nhân</span>
              </NavLink>

              <NavLink
                to="/app/settings/security"
                onClick={() => setMobileMenuOpen(false)}
                className={navLinkClass}
              >
                <Shield className="w-4 h-4 shrink-0" />
                <span>Bảo mật & Mật khẩu</span>
              </NavLink>
            </div>
          </div>

          {isAdmin && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-semantic-warning px-3 mb-2">
                Quản trị hệ thống
              </p>
              <div className="space-y-1">
                <NavLink
                  to="/app/admin/users"
                  onClick={() => setMobileMenuOpen(false)}
                  className={navLinkClass}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span>Quản lý người dùng</span>
                </NavLink>

                <NavLink
                  to="/app/admin/projects"
                  onClick={() => setMobileMenuOpen(false)}
                  className={navLinkClass}
                >
                  <Building className="w-4 h-4 shrink-0" />
                  <span>Tất cả dự án</span>
                </NavLink>
              </div>
            </div>
          )}
        </nav>

        {/* User Footer in Sidebar */}
        <div className="p-4 border-t border-border-subtle bg-surface-subtle/50">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full flex items-center justify-between p-2 rounded-button hover:bg-white transition-colors text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-ink text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="truncate">
                  <p className="text-sm font-medium text-ink truncate">{user?.displayName || 'Người dùng'}</p>
                  <p className="text-xs text-ink-muted truncate">{user?.email}</p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-ink-muted shrink-0" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2.5 py-2 text-xs border-b border-border-subtle mb-1">
                <p className="font-semibold text-ink">{user?.displayName}</p>
                <p className="text-ink-muted">{user?.email}</p>
                {isAdmin && (
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-semantic-warning-bg text-semantic-warning border border-semantic-warning-border">
                    SYSTEM ADMIN
                  </span>
                )}
              </div>
              <DropdownMenuItem onClick={() => navigate('/app/settings/profile')}>
                <User className="w-4 h-4 mr-2 text-ink-muted" />
                Hồ sơ cá nhân
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/app/settings/security')}>
                <Shield className="w-4 h-4 mr-2 text-ink-muted" />
                Bảo mật
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem danger onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
