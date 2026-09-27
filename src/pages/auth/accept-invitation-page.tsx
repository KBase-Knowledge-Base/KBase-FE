import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/auth-context';
import { invitationsApi } from '@/features/invitations/api/invitations';
import { Button } from '@/shared/ui/button';
import { useToast } from '@/shared/ui/toast';
import { MailCheck, AlertCircle, ArrowRight, LogOut, CheckCircle2 } from 'lucide-react';
import { isApiError } from '@/shared/api/errors';

export const AcceptInvitationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get('token');
  const navigate = useNavigate();
  const { user, isAuthenticated, status, logout } = useAuth();
  const { addToast } = useToast();

  const [token, setToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isEmailMismatch, setIsEmailMismatch] = useState(false);

  useEffect(() => {
    if (tokenParam) {
      setToken(tokenParam);
      // Clean token from browser history/address bar without reloading
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [tokenParam]);

  const handleAccept = async () => {
    if (!token) {
      setServerError('Không tìm thấy mã lời mời. Vui lòng kiểm tra lại liên kết trong email.');
      return;
    }

    setIsSubmitting(true);
    setServerError(null);
    setIsEmailMismatch(false);

    try {
      const res = await invitationsApi.acceptInvitation({ token });
      addToast({
        type: 'success',
        title: 'Tham gia dự án thành công!',
        message: 'Bạn đã là thành viên của dự án.',
      });
      navigate(`/app/projects/${res.projectId}`, { replace: true });
    } catch (err: unknown) {
      if (isApiError(err)) {
        if (err.code === 'EMAIL_MISMATCH') {
          setIsEmailMismatch(true);
        }
        setServerError(err.message);
      } else {
        setServerError('Không thể chấp nhận lời mời. Vui lòng thử lại sau.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchAccount = async () => {
    await logout();
    // Navigate to login with returnTo including original token
    navigate(`/login?returnTo=${encodeURIComponent(`/invitations/accept?token=${token}`)}`);
  };

  if (!token && !tokenParam) {
    return (
      <div className="space-y-4 text-center">
        <div className="w-12 h-12 rounded-full neu-flat flex items-center justify-center text-semantic-danger mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-ink">Thiếu mã lời mời</h2>
        <p className="text-sm text-ink-muted">
          Liên kết mời tham gia dự án không hợp lệ hoặc đã thiếu mã token. Vui lòng mở lại liên kết từ email.
        </p>
        <div className="pt-4">
          <Link to="/app/projects">
            <Button variant="outline">Về danh sách dự án</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'bootstrapping') {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-ink-muted">Đang kiểm tra thông tin tài khoản...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnUrl = `/invitations/accept?token=${token}`;
    return (
      <div className="space-y-6 text-center">
        <div className="w-12 h-12 rounded-full neu-flat flex items-center justify-center text-accent mx-auto">
          <MailCheck className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-ink tracking-tight">Lời mời tham gia dự án</h2>
          <p className="text-sm text-ink-muted mt-1.5">
            Bạn đã nhận được lời mời tham gia dự án trên KBase. Vui lòng đăng nhập hoặc tạo tài khoản để chấp nhận.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Link to={`/login?returnTo=${encodeURIComponent(returnUrl)}`}>
            <Button size="lg" className="w-full">
              Đăng nhập để nhận lời mời
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>

          <Link to={`/register?returnTo=${encodeURIComponent(returnUrl)}`}>
            <Button variant="outline" size="lg" className="w-full">
              Tạo tài khoản mới
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full neu-flat flex items-center justify-center text-accent shrink-0">
          <MailCheck className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-ink tracking-tight">Nhận lời mời dự án</h2>
          <p className="text-sm text-ink-muted">Xác nhận tham gia không gian kiến thức của nhóm</p>
        </div>
      </div>

      <div className="p-4 rounded-card bg-surface-subtle border border-border space-y-2">
        <p className="text-xs text-ink-muted">Bạn đang đăng nhập với tài khoản:</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">{user?.displayName}</p>
            <p className="text-xs text-ink-muted">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={handleSwitchAccount}
            className="inline-flex items-center gap-1 text-xs text-accent hover:underline font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            Đổi tài khoản
          </button>
        </div>
      </div>

      {serverError && (
        <div
          role="alert"
          className="p-3.5 rounded-button bg-semantic-danger-bg border border-semantic-danger-border flex items-start gap-2.5 text-xs text-semantic-danger"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{serverError}</p>
            {isEmailMismatch && (
              <p className="mt-1 text-ink-muted">
                Lời mời này được gửi đến một địa chỉ email khác. Vui lòng bấm{' '}
                <button
                  type="button"
                  onClick={handleSwitchAccount}
                  className="font-medium text-accent underline hover:text-ink"
                >
                  Đổi tài khoản
                </button>{' '}
                để đăng nhập đúng email nhận lời mời.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="pt-2">
        <Button
          type="button"
          onClick={handleAccept}
          className="w-full"
          size="lg"
          isLoading={isSubmitting}
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Chấp nhận và tham gia dự án
        </Button>
      </div>
    </div>
  );
};
