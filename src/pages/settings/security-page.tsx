import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/auth-context';
import { accountApi } from '@/features/account/api/account';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { useToast } from '@/shared/ui/toast';
import { Eye, EyeOff, AlertCircle, ShieldAlert } from 'lucide-react';
import { isApiError } from '@/shared/api/errors';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z.string().min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự'),
    confirmNewPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmNewPassword'],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export const SecurityPage: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    setServerError(null);
    try {
      await accountApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      addToast({
        type: 'success',
        title: 'Đổi mật khẩu thành công',
        message: 'Các phiên đăng nhập cũ đã được thu hồi. Vui lòng đăng nhập lại.',
      });

      // Clear local auth session and redirect to login
      await logout();
      navigate('/login?changed=true');
    } catch (err: unknown) {
      if (isApiError(err)) {
        setServerError(err.message);
      } else {
        setServerError('Không thể đổi mật khẩu lúc này. Vui lòng thử lại sau.');
      }
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">Bảo mật tài khoản</h1>
        <p className="text-sm text-ink-muted mt-1">
          Cập nhật mật khẩu để bảo vệ tài khoản và không gian kiến thức của bạn.
        </p>
      </div>

      <Card variant="card" className="space-y-6 text-left">
        <div className="flex items-start gap-3 p-3.5 rounded-card bg-surface-subtle border border-border-subtle text-xs text-ink-muted">
          <ShieldAlert className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <p>
            Lưu ý: Sau khi đổi mật khẩu thành công, toàn bộ các phiên làm việc hiện tại trên các thiết bị khác sẽ được tự động thu hồi. Bạn sẽ cần đăng nhập lại với mật khẩu mới.
          </p>
        </div>

        {serverError && (
          <div
            role="alert"
            className="p-3.5 rounded-button bg-semantic-danger-bg border border-semantic-danger-border flex items-start gap-2.5 text-xs text-semantic-danger"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="font-semibold">{serverError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="relative">
            <Input
              label="Mật khẩu hiện tại"
              type={showCurrentPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.currentPassword?.message}
              required
              {...register('currentPassword')}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-[34px] text-ink-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded p-0.5"
              aria-label={showCurrentPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="Mật khẩu mới"
              type={showNewPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Tối thiểu 8 ký tự"
              error={errors.newPassword?.message}
              required
              {...register('newPassword')}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-[34px] text-ink-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded p-0.5"
              aria-label={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <Input
            label="Xác nhận mật khẩu mới"
            type={showNewPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Nhập lại mật khẩu mới"
            error={errors.confirmNewPassword?.message}
            required
            {...register('confirmNewPassword')}
          />

          <div className="pt-2 flex items-center justify-end">
            <Button
              type="submit"
              size="md"
              isLoading={isSubmitting}
            >
              Đổi mật khẩu
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
