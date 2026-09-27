import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/features/admin/api/admin';
import { UserStatus } from '@/shared/api/types';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { ContentSkeleton } from '@/shared/ui/skeleton';
import { ErrorState } from '@/shared/ui/error-state';
import { ConfirmDangerDialog } from '@/shared/ui/confirm-danger-dialog';
import { useToast } from '@/shared/ui/toast';
import { formatDate } from '@/shared/lib/formatting';
import {
  Trash2,
  UserCheck,
  UserX,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { isApiError } from '@/shared/api/errors';

export const AdminUserDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const {
    data: targetUser,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: () => adminApi.getAdminUser(userId!),
    enabled: !!userId,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (status: UserStatus) => adminApi.changeUserStatus(userId!, { status }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      addToast({
        type: 'success',
        title: 'Cập nhật trạng thái thành công',
        message: `Tài khoản hiện ở trạng thái ${updated.status}.`,
      });
    },
    onError: (err: unknown) => {
      addToast({
        type: 'error',
        title: 'Lỗi',
        message: isApiError(err) ? err.message : 'Không thể thay đổi trạng thái tài khoản.',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteAdminUser(userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setDeleteDialogOpen(false);
      addToast({
        type: 'success',
        title: 'Đã xóa người dùng',
        message: 'Tài khoản đã được xóa khỏi hệ thống.',
      });
      navigate('/app/admin/users');
    },
    onError: (err: unknown) => {
      if (isApiError(err)) {
        setDeleteError(err.message);
      } else {
        setDeleteError('Không thể xóa tài khoản lúc này.');
      }
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <ContentSkeleton height={32} width={240} />
        <ContentSkeleton height={250} />
      </div>
    );
  }

  if (isError || !targetUser) {
    return (
      <ErrorState
        title="Không tìm thấy người dùng"
        message={(error as Error)?.message || 'Người dùng không tồn tại hoặc đã bị xóa.'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="max-w-3xl space-y-6 text-left">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-ink-muted">
        <Link to="/app/admin/users" className="hover:text-ink hover:underline">
          Quản trị người dùng
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-border-control" />
        <span className="text-ink font-medium">{targetUser.displayName}</span>
      </nav>

      {/* Header and profile card */}
      <Card className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-subtle">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-ink text-white flex items-center justify-center font-bold text-xl shadow">
              {targetUser.displayName ? targetUser.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-ink">{targetUser.displayName}</h1>
              <p className="text-sm text-ink-muted font-mono">{targetUser.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={targetUser.systemRole === 'ADMIN' ? 'warning' : 'neutral'}>
                  {targetUser.systemRole}
                </Badge>
                <Badge variant={targetUser.status === 'ACTIVE' ? 'success' : 'danger'}>
                  {targetUser.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã bị khóa'}
                </Badge>
                <Badge variant={targetUser.emailVerified ? 'success' : 'warning'}>
                  {targetUser.emailVerified ? 'Email đã xác thực' : 'Chưa xác thực email'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              isLoading={toggleStatusMutation.isPending}
              onClick={() =>
                toggleStatusMutation.mutate(
                  targetUser.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
                )
              }
            >
              {targetUser.status === 'ACTIVE' ? (
                <>
                  <UserX className="w-4 h-4 mr-1.5 text-semantic-danger" />
                  Khóa tài khoản
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 mr-1.5 text-semantic-success" />
                  Mở khóa
                </>
              )}
            </Button>

            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setDeleteError(null);
                setDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Xóa tài khoản
            </Button>
          </div>
        </div>

        {/* User Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-card bg-surface-subtle border border-border-subtle">
            <span className="text-ink-muted block">Mã định danh User ID:</span>
            <span className="font-mono text-ink font-semibold mt-1 block truncate">
              {targetUser.id}
            </span>
          </div>

          <div className="p-3 rounded-card bg-surface-subtle border border-border-subtle">
            <span className="text-ink-muted block">Thời gian tham gia:</span>
            <span className="text-ink font-semibold mt-1 block">
              {formatDate(targetUser.createdAt)}
            </span>
          </div>
        </div>
      </Card>

      {/* Delete User Confirmation Dialog */}
      <ConfirmDangerDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Xóa người dùng"
        description={`Bạn có chắc muốn xóa tài khoản "${targetUser.displayName}" (${targetUser.email})? Nếu người dùng này đang sở hữu dự án hoặc có dữ liệu phụ thuộc, hệ thống sẽ ngăn chặn việc xóa để đảm bảo toàn vẹn dữ liệu.`}
        confirmText="Xóa người dùng"
        isConfirming={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />

      {deleteError && (
        <div
          role="alert"
          className="p-4 rounded-card bg-semantic-danger-bg border border-semantic-danger-border flex items-start gap-3 text-xs text-semantic-danger"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Không thể xóa người dùng:</p>
            <p className="mt-0.5 leading-relaxed">{deleteError}</p>
          </div>
        </div>
      )}
    </div>
  );
};
