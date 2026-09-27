import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProject } from '@/app/layouts/project-layout';
import { invitationsApi } from '@/features/invitations/api/invitations';
import { InvitationResponse, InvitationStatus } from '@/shared/api/types';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Input } from '@/shared/ui/input';
import { ContentSkeleton } from '@/shared/ui/skeleton';
import { ErrorState } from '@/shared/ui/error-state';
import { EmptyState } from '@/shared/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui/dialog';
import { ConfirmDangerDialog } from '@/shared/ui/confirm-danger-dialog';
import { useToast } from '@/shared/ui/toast';
import { formatDate, formatRelativeTime } from '@/shared/lib/formatting';
import { Mail, Plus, RotateCw, XCircle } from 'lucide-react';
import { isApiError } from '@/shared/api/errors';

export const ProjectInvitationsPage: React.FC = () => {
  const { projectId, canManage } = useProject();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [statusFilter, setStatusFilter] = useState<InvitationStatus | ''>('');
  const [page, setPage] = useState(0);
  const pageSize = 15;

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const [invitationToCancel, setInvitationToCancel] = useState<InvitationResponse | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['invitations', projectId, { status: statusFilter || undefined, page, size: pageSize }],
    queryFn: () =>
      invitationsApi.getInvitations(projectId, {
        status: (statusFilter as InvitationStatus) || undefined,
        page,
        size: pageSize,
        sort: 'createdAt,desc',
      }),
    enabled: canManage,
  });

  const createMutation = useMutation({
    mutationFn: (email: string) => invitationsApi.createInvitation(projectId, { email }),
    onSuccess: (invitation) => {
      queryClient.invalidateQueries({ queryKey: ['invitations', projectId] });
      setCreateDialogOpen(false);
      setNewEmail('');
      addToast({
        type: 'success',
        title: 'Đã gửi lời mời',
        message: `Lời mời đã được gửi tới ${invitation.email}.`,
      });
    },
    onError: (err: unknown) => {
      if (isApiError(err)) {
        setCreateError(err.message);
      } else {
        setCreateError('Không thể gửi lời mời. Vui lòng thử lại.');
      }
    },
  });

  const resendMutation = useMutation({
    mutationFn: (invitationId: string) => invitationsApi.resendInvitation(projectId, invitationId),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['invitations', projectId] });
      addToast({
        type: 'success',
        title: 'Đã gửi lại lời mời',
        message: `Mã mời mới và email đã được gửi lại tới ${updated.email}.`,
      });
    },
    onError: (err: unknown) => {
      addToast({
        type: 'error',
        title: 'Lỗi gửi lại',
        message: isApiError(err) ? err.message : 'Không thể gửi lại lời mời.',
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (invitationId: string) => invitationsApi.cancelInvitation(projectId, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations', projectId] });
      setInvitationToCancel(null);
      addToast({
        type: 'success',
        title: 'Đã hủy lời mời',
        message: 'Lời mời đã bị hủy.',
      });
    },
    onError: (err: unknown) => {
      addToast({
        type: 'error',
        title: 'Lỗi hủy lời mời',
        message: isApiError(err) ? err.message : 'Không thể hủy lời mời lúc này.',
      });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      setCreateError('Vui lòng nhập địa chỉ email');
      return;
    }
    setCreateError(null);
    createMutation.mutate(newEmail.trim());
  };

  const getStatusBadge = (status: InvitationStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="warning">Đang chờ (Pending)</Badge>;
      case 'ACCEPTED':
        return <Badge variant="success">Đã chấp nhận</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Đã hủy</Badge>;
      case 'EXPIRED':
        return <Badge variant="neutral">Đã hết hạn</Badge>;
    }
  };

  if (!canManage) {
    return (
      <Card className="text-center py-8">
        <p className="text-sm text-ink-muted">Chỉ Chủ sở hữu (Owner) hoặc Quản trị viên mới có quyền xem danh sách lời mời.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink tracking-tight">Lời mời tham gia</h2>
          <p className="text-sm text-ink-muted mt-0.5">
            Quản lý các lời mời đã gửi và theo dõi trạng thái phản hồi của người được mời.
          </p>
        </div>

        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Gửi lời mời mới
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-ink-muted shrink-0">Trạng thái:</span>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as InvitationStatus | '');
            setPage(0);
          }}
          className="px-3 py-1.5 text-sm bg-white rounded-button border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent text-ink"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="PENDING">Đang chờ (Pending)</option>
          <option value="ACCEPTED">Đã chấp nhận (Accepted)</option>
          <option value="EXPIRED">Đã hết hạn (Expired)</option>
          <option value="CANCELLED">Đã hủy (Cancelled)</option>
        </select>
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading && (
          <div className="p-6 space-y-3">
            <ContentSkeleton height={36} count={4} />
          </div>
        )}

        {isError && (
          <div className="p-6">
            <ErrorState
              title="Không thể tải danh sách lời mời"
              message={(error as Error)?.message}
              onRetry={() => refetch()}
            />
          </div>
        )}

        {!isLoading && !isError && data && (
          <>
            {data.content.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={<Mail className="w-8 h-8 text-ink-muted" />}
                  title="Chưa có lời mời nào"
                  description={statusFilter ? 'Không có lời mời nào khớp với trạng thái này.' : 'Dự án chưa có lời mời nào. Hãy gửi lời mời để kết nối thành viên mới!'}
                  action={
                    !statusFilter && (
                      <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-1.5" />
                        Gửi lời mời đầu tiên
                      </Button>
                    )
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-ink-muted border-b border-border bg-surface-subtle/60">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Email nhận</th>
                      <th className="py-3 px-4 font-semibold">Vai trò</th>
                      <th className="py-3 px-4 font-semibold">Trạng thái</th>
                      <th className="py-3 px-4 font-semibold">Ngày gửi</th>
                      <th className="py-3 px-4 font-semibold">Hết hạn</th>
                      <th className="py-3 px-4 text-right font-semibold">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {data.content.map((invitation) => (
                      <tr key={invitation.id} className="hover:bg-surface-subtle/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-xs font-semibold text-ink">
                          {invitation.email}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <Badge variant="neutral">
                            {invitation.role}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          {getStatusBadge(invitation.status)}
                        </td>
                        <td className="py-3.5 px-4 text-ink-muted text-xs">
                          {formatRelativeTime(invitation.createdAt)}
                        </td>
                        <td className="py-3.5 px-4 text-ink-muted text-xs">
                          {formatDate(invitation.expiresAt)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {invitation.status === 'PENDING' && (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7 px-2"
                                isLoading={resendMutation.isPending && resendMutation.variables === invitation.id}
                                onClick={() => resendMutation.mutate(invitation.id)}
                                title="Tạo token mới và gửi lại email"
                              >
                                <RotateCw className="w-3 h-3 mr-1" />
                                Gửi lại
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-7 px-2 text-semantic-danger hover:bg-semantic-danger-bg"
                                onClick={() => setInvitationToCancel(invitation)}
                                title="Hủy lời mời"
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                Hủy
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border-subtle">
                <span className="text-xs text-ink-muted">
                  Trang {data.page + 1} / {data.totalPages} ({data.totalElements} lời mời)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.first}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    Trang trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.last}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Trang sau
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Create Invitation Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gửi lời mời tham gia dự án</DialogTitle>
            <DialogDescription>
              Người được mời sẽ nhận được email kèm đường dẫn xác thực để tham gia vào dự án với vai trò Thành viên (Member).
            </DialogDescription>
          </DialogHeader>

          {createError && (
            <p className="text-xs text-semantic-danger font-medium">{createError}</p>
          )}

          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <Input
              label="Địa chỉ email người nhận"
              type="email"
              placeholder="colleague@company.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              autoFocus
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={createMutation.isPending}
              >
                Hủy
              </Button>
              <Button type="submit" isLoading={createMutation.isPending}>
                Gửi lời mời
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancel Invitation Confirmation Dialog */}
      <ConfirmDangerDialog
        open={!!invitationToCancel}
        onOpenChange={(open) => !open && setInvitationToCancel(null)}
        title="Hủy lời mời tham gia"
        description={`Bạn có chắc chắn muốn hủy lời mời gửi đến "${invitationToCancel?.email}" không? Liên kết đã gửi sẽ không còn hiệu lực.`}
        confirmText="Hủy lời mời"
        isConfirming={cancelMutation.isPending}
        onConfirm={() => {
          if (invitationToCancel) {
            cancelMutation.mutate(invitationToCancel.id);
          }
        }}
      />
    </div>
  );
};
