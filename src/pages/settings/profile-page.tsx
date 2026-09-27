import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/features/auth/context/auth-context';
import { accountApi } from '@/features/account/api/account';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { useToast } from '@/shared/ui/toast';
import { formatDate } from '@/shared/lib/formatting';
import { AlertCircle } from 'lucide-react';
import { isApiError } from '@/shared/api/errors';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Tên hiển thị phải có ít nhất 2 ký tự').max(100, 'Tên quá dài'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      displayName: user?.displayName || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setServerError(null);
    try {
      const updated = await accountApi.updateProfile({ displayName: data.displayName });
      updateUser(updated);
      reset({ displayName: updated.displayName });
      addToast({
        type: 'success',
        title: 'Cập nhật thành công',
        message: 'Họ và tên hiển thị đã được lưu thay đổi.',
      });
    } catch (err: unknown) {
      if (isApiError(err)) {
        setServerError(err.message);
      } else {
        setServerError('Không thể cập nhật hồ sơ. Vui lòng thử lại sau.');
      }
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">Hồ sơ cá nhân</h1>
        <p className="text-sm text-ink-muted mt-1">
          Quản lý thông tin tài khoản và cách bạn xuất hiện với các thành viên khác trong dự án.
        </p>
      </div>

      <Card variant="card" className="space-y-6 text-left">
        <div className="flex items-center gap-4 pb-6 border-b border-border-subtle">
          <div className="w-16 h-16 rounded-full bg-ink text-white flex items-center justify-center font-bold text-xl shadow-md">
            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink">{user?.displayName}</h2>
            <p className="text-sm text-ink-muted">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={user?.systemRole === 'ADMIN' ? 'warning' : 'neutral'}>
                {user?.systemRole === 'ADMIN' ? 'Quản trị viên hệ thống' : 'Người dùng chuẩn'}
              </Badge>
              <Badge variant={user?.status === 'ACTIVE' ? 'success' : 'danger'}>
                {user?.status === 'ACTIVE' ? 'Đang hoạt động' : 'Bị vô hiệu'}
              </Badge>
            </div>
          </div>
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
          <Input
            label="Địa chỉ email"
            type="email"
            value={user?.email || ''}
            disabled
            helperText="Địa chỉ email được bảo vệ và không thể thay đổi trực tiếp."
          />

          <Input
            label="Tên hiển thị"
            type="text"
            error={errors.displayName?.message}
            required
            {...register('displayName')}
          />

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button
              type="submit"
              disabled={!isDirty || isSubmitting}
              isLoading={isSubmitting}
            >
              Lưu thay đổi
            </Button>
          </div>
        </form>

        <div className="pt-4 border-t border-border-subtle text-xs text-ink-muted flex flex-col sm:flex-row sm:justify-between gap-2">
          <span>Ngày tham gia: {formatDate(user?.createdAt)}</span>
          <span>Cập nhật lần cuối: {formatDate(user?.updatedAt)}</span>
        </div>
      </Card>
    </div>
  );
};
