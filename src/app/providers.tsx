import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/features/auth/context/auth-context';
import { ToastProvider } from '@/shared/ui/toast';
import { isApiError } from '@/shared/api/errors';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (failureCount, error) => {
              if (failureCount >= 2) return false;
              if (
                isApiError(error) &&
                (error.status === 401 ||
                  error.status === 403 ||
                  error.status === 404 ||
                  error.status === 400)
              ) {
                return false;
              }
              return true;
            },
            staleTime: 1000 * 30, // 30 seconds
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0, // Strict rule: never automatically retry mutations
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};
