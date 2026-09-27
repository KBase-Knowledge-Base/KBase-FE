import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '@/features/auth/api/auth';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { AlertCircle, CheckCircle2, RotateCw } from 'lucide-react';
import { isApiError } from '@/shared/api/errors';

const verifySchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email').email('Email không đúng định dạng'),
  otp: z.string().min(6, 'Mã OTP phải có 6 chữ số').max(6, 'Mã OTP gồm 6 chữ số').regex(/^\d+$/, 'Mã OTP chỉ bao gồm chữ số'),
});

type VerifyFormData = z.infer<typeof verifySchema>;

export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const returnTo = searchParams.get('returnTo');

  const [serverError, setServerError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      email: emailParam,
      otp: '',
    },
  });

  const currentEmail = watch('email');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const onSubmit = async (data: VerifyFormData) => {
    setServerError(null);
    try {
      await authApi.verifyEmail({
        email: data.email,
        otp: data.otp,
      });

      // Verification succeeded, navigate to login
      const targetLogin = `/login?verified=true${returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ''}`;
      navigate(targetLogin);
    } catch (err: unknown) {
      if (isApiError(err)) {
        setServerError(err.message);
      } else {
        setServerError('Không thể xác thực mã OTP. Vui lòng kiểm tra lại.');
      }
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !currentEmail || isResending) return;
    setServerError(null);
    setResendSuccess(false);
    setIsResending(true);

    try {
      await authApi.resendVerificationOtp({ email: currentEmail });
      setResendSuccess(true);
      setResendCooldown(60);
    } catch (err: unknown) {
      if (isApiError(err)) {
        setServerError(err.message);
      } else {
        setServerError('Không thể gửi lại mã lúc này. Vui lòng thử lại sau.');
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-left">
        <h2 className="text-xl font-bold text-ink tracking-tight">Xác thực địa chỉ email</h2>
        <p className="text-sm text-ink-muted mt-1">
          Chúng tôi đã gửi mã xác thực 6 chữ số đến email của bạn. Vui lòng nhập mã để hoàn tất.
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

      {resendSuccess && (
        <div
          role="status"
          className="p-3.5 rounded-button bg-semantic-success-bg border border-semantic-success-border flex items-start gap-2.5 text-xs text-semantic-success"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="font-medium">Mã xác thực mới đã được gửi. Vui lòng kiểm tra hộp thư.</p>
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

        <div>
          <Input
            label="Mã xác thực OTP (6 chữ số)"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            className="text-center font-mono text-lg tracking-widest"
            error={errors.otp?.message}
            required
            {...register('otp')}
          />
        </div>

        <Button
          type="submit"
          className="w-full mt-2"
          size="lg"
          isLoading={isSubmitting}
        >
          Xác nhận tài khoản
        </Button>
      </form>

      <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-xs text-ink-muted">
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0 || isResending || !currentEmail}
          className="inline-flex items-center gap-1 font-medium text-accent hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
          {resendCooldown > 0 ? `Gửi lại mã sau ${resendCooldown}s` : 'Gửi lại mã OTP'}
        </button>

        <Link to="/login" className="hover:text-ink">
          Quay lại Đăng nhập
        </Link>
      </div>
    </div>
  );
};
