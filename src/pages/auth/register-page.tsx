import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '@/features/auth/api/auth';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { isApiError } from '@/shared/api/errors';

const registerSchema = z
  .object({
    displayName: z.string().min(2, 'Tên hiển thị phải có ít nhất 2 ký tự').max(100, 'Tên quá dài'),
    email: z.string().min(1, 'Vui lòng nhập email').email('Email không đúng định dạng'),
    password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      // confirmPassword is only verified on FE, never sent to BE
      await authApi.register({
        email: data.email,
        displayName: data.displayName,
        password: data.password,
      });

      // Navigate to verify email
      const verifyUrl = `/verify-email?email=${encodeURIComponent(data.email)}${returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ''}`;
      navigate(verifyUrl);
    } catch (err: unknown) {
      if (isApiError(err)) {
        setServerError(err.message);
      } else {
        setServerError('Không thể tạo tài khoản lúc này. Vui lòng thử lại.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-left">
        <h2 className="text-xl font-bold text-ink tracking-tight">Tạo tài khoản mới</h2>
        <p className="text-sm text-ink-muted mt-1">
          Bắt đầu xây dựng cơ sở tri thức cho nhóm của bạn.
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Họ và tên / Tên hiển thị"
          type="text"
          autoComplete="name"
          placeholder="Nguyễn Văn A"
          error={errors.displayName?.message}
          required
          {...register('displayName')}
        />

        <Input
          label="Địa chỉ email"
          type="email"
          autoComplete="email"
          placeholder="name@company.com"
          error={errors.email?.message}
          required
          {...register('email')}
        />

        <div className="relative">
          <Input
            label="Mật khẩu"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Tối thiểu 8 ký tự"
            error={errors.password?.message}
            required
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[34px] text-ink-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded p-0.5"
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <Input
          label="Xác nhận mật khẩu"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Nhập lại mật khẩu"
          error={errors.confirmPassword?.message}
          required
          {...register('confirmPassword')}
        />

        <Button
          type="submit"
          className="w-full mt-2"
          size="lg"
          isLoading={isSubmitting}
        >
          Đăng ký tài khoản
        </Button>
      </form>

      <div className="text-center pt-2 border-t border-border-subtle">
        <p className="text-xs text-ink-muted">
          Đã có tài khoản?{' '}
          <Link
            to={returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : '/login'}
            className="font-medium text-accent hover:underline"
          >
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
};
