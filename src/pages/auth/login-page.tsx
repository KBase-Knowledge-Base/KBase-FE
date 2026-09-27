import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/auth-context';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { sanitizeReturnTo } from '@/shared/lib/safe-urls';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { isApiError } from '@/shared/api/errors';

const loginSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không đúng định dạng'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    setUnverifiedEmail(null);
    try {
      await login(data);
      const targetUrl = sanitizeReturnTo(returnTo, '/app/projects');
      navigate(targetUrl, { replace: true });
    } catch (err: unknown) {
      if (isApiError(err)) {
        if (err.code === 'EMAIL_NOT_VERIFIED') {
          setUnverifiedEmail(data.email);
        }
        setServerError(err.message);
      } else {
        setServerError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-left">
        <h2 className="text-xl font-bold text-ink tracking-tight">Đăng nhập tài khoản</h2>
        <p className="text-sm text-ink-muted mt-1">
          Nhập thông tin xác thực để vào không gian làm việc của bạn.
        </p>
      </div>

      {serverError && (
        <div
          role="alert"
          className="p-3.5 rounded-button bg-semantic-danger-bg border border-semantic-danger-border flex items-start gap-2.5 text-xs text-semantic-danger"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{serverError}</p>
            {unverifiedEmail && (
              <p className="mt-1">
                <Link
                  to={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                  className="font-medium underline hover:text-ink"
                >
                  Bấm vào đây để xác thực email của bạn ngay
                </Link>
              </p>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
            autoComplete="current-password"
            placeholder="••••••••"
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

        <Button
          type="submit"
          className="w-full mt-2"
          size="lg"
          isLoading={isSubmitting}
        >
          Đăng nhập
        </Button>
      </form>

      <div className="text-center pt-2 border-t border-border-subtle">
        <p className="text-xs text-ink-muted">
          Chưa có tài khoản?{' '}
          <Link
            to={returnTo ? `/register?returnTo=${encodeURIComponent(returnTo)}` : '/register'}
            className="font-medium text-accent hover:underline"
          >
            Đăng ký tài khoản mới
          </Link>
        </p>
      </div>
    </div>
  );
};
