import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useProject } from '@/app/layouts/project-layout';
import { useAuth } from '@/features/auth/context/auth-context';
import { membersApi } from '@/features/members/api/members';
import { invitationsApi } from '@/features/invitations/api/invitations';
import { ProjectMemberResponse } from '@/shared/api/types';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { ContentSkeleton } from '@/shared/ui/skeleton';
import { ErrorState } from '@/shared/ui/error-state';
import { ConfirmDangerDialog } from '@/shared/ui/confirm-danger-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { useToast } from '@/shared/ui/toast';
import { formatDate } from '@/shared/lib/formatting';
import { canRemoveMember, canLeaveProject } from '@/shared/lib/permissions';
import { UserPlus, UserMinus, LogOut, Mail } from 'lucide-react';
import { isApiError } from '@/shared/api/errors';
import { useNavigate } from 'react-router-dom';

export const ProjectMembersPage: React.FC = () => {
  const { projectId, currentUserRole, canManage } = useProject();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Dialog states
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [memberToRemove, setMemberToRemove] = useState<ProjectMemberResponse | null>(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['members', projectId, { page, size: pageSize }],
    queryFn: () => membersApi.getProjectMembers(projectId, { page, size: pageSize, sort: 'joinedAt,asc' }),
  });

  const inviteMutation = useMutation({
    mutationFn: (email: string) => invitationsApi.createInvitation(projectId, { email }),
    onSuccess: (invitation) => {
      queryClient.invalidateQueries({ queryKey: ['invitations', projectId] });
      setInviteDialogOpen(false);
      setInviteEmail('');
      addToast({
        type: 'success',
        title: 'Đã gửi lời mời',
        message: `Lời mời đã được gửi đến email ${invitation.email}.`,
      });
    },
    onError: (err: unknown) => {
      if (isApiError(err)) {
        setInviteError(err.message);
      } else {
        setInviteError('Không thể gửi lời mời lúc này. Vui lòng thử lại.');
      }
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => membersApi.removeMember(projectId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', projectId] });
      setMemberToRemove(null);
      addToast({
        type: 'success',
        title: 'Đã xóa thành viên',
        message: 'Thành viên đã bị xóa khỏi dự án.',
      });
    },
    onError: (err: unknown) => {
      addToast({
        type: 'error',
        title: 'Lỗi',
        message: isApiError(err) ? err.message : 'Không thể xóa thành viên lúc này.',
      });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => membersApi.leaveProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      addToast({
        type: 'success',
        title: 'Đã rời dự án',
        message: 'Bạn đã rời khỏi dự án thành công.',
      });
      navigate('/app/projects');
    },
    onError: (err: unknown) => {
      addToast({
        type: 'error',
        title: 'Lỗi',
        message: isApiError(err) ? err.message : 'Không thể rời dự án lúc này.',
      });
    },
  });

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      setInviteError('Vui lòng nhập địa chỉ email');
      return;
    }
    setInviteError(null);
    inviteMutation.mutate(inviteEmail.trim());
  };

  const userCanLeave = canLeaveProject({
    systemRole: user?.systemRole,
    projectRole: currentUserRole,
    currentUserId: user?.id,
  });

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink tracking-tight">Thành viên dự án</h2>
          <p className="text-sm text-ink-muted mt-0.5">
            Danh sách những người dùng có quyền truy cập vào tài liệu và không gian dự án này.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {userCanLeave && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLeaveDialogOpen(true)}
              className="text-semantic-danger hover:bg-semantic-danger-bg"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Rời dự án
            </Button>
          )}

          {canManage && (
            <>
              <Link to={`/app/projects/${projectId}/invitations`}>
                <Button variant="outline" size="sm">
                  <Mail className="w-4 h-4 mr-1.5" />
                  Xem lời mời
                </Button>
              </Link>
              <Button size="sm" onClick={() => setInviteDialogOpen(true)}>
                <UserPlus className="w-4 h-4 mr-1.5" />
                Mời thành viên
              </Button>
            </>
          )}
        </div>
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
              title="Không thể tải danh sách thành viên"
              message={(error as Error)?.message}
              onRetry={() => refetch()}
            />
          </div>
        )}

        {!isLoading && !isError && data && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-ink-muted border-b border-border bg-surface-subtle/60">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Thành viên</th>
                    <th className="py-3 px-4 font-semibold">Email</th>
                    <th className="py-3 px-4 font-semibold">Vai trò</th>
                    <th className="py-3 px-4 font-semibold">Ngày tham gia</th>
                    <th className="py-3 px-4 text-right font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {data.content.map((member) => {
                    const isCurrentUser = member.userId === user?.id;
                    const canRemove =
                      canRemoveMember(
                        { systemRole: user?.systemRole, projectRole: currentUserRole, currentUserId: user?.id },
                        member.role
                      ) && !isCurrentUser;

                    return (
                      <tr key={member.id} className="hover:bg-surface-subtle/30 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-ink">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-ink text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {member.displayName ? member.displayName.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <span>{member.displayName}</span>
                              {isCurrentUser && (
                                <span className="ml-1.5 text-xs text-ink-muted">(Bạn)</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-ink-muted text-xs font-mono">
                          {member.email}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <Badge variant={member.role === 'OWNER' ? 'accent' : 'neutral'}>
                            {member.role === 'OWNER' ? 'Chủ sở hữu (Owner)' : 'Thành viên (Member)'}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-ink-muted text-xs">
                          {formatDate(member.joinedAt)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {canRemove && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-semantic-danger hover:bg-semantic-danger-bg text-xs"
                              onClick={() => setMemberToRemove(member)}
                            >
                              <UserMinus className="w-3.5 h-3.5 mr-1" />
                              Xóa khỏi dự án
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border-subtle">
                <span className="text-xs text-ink-muted">
                  Trang {data.page + 1} / {data.totalPages} ({data.totalElements} thành viên)
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

      {/* Invite Member Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mời thành viên mới</DialogTitle>
            <DialogDescription>
              Nhập địa chỉ email người bạn muốn mời tham gia dự án. Họ sẽ nhận được email chứa liên kết tham gia.
            </DialogDescription>
          </DialogHeader>

          {inviteError && (
            <p className="text-xs text-semantic-danger font-medium">{inviteError}</p>
          )}

          <form onSubmit={handleInviteSubmit} className="space-y-4">
            <Input
              label="Địa chỉ email"
              type="email"
              placeholder="member@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              autoFocus
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteDialogOpen(false)}
                disabled={inviteMutation.isPending}
              >
                Hủy
              </Button>
              <Button type="submit" isLoading={inviteMutation.isPending}>
                Gửi lời mời
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation Dialog */}
      <ConfirmDangerDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
        title="Xóa thành viên khỏi dự án"
        description={`Bạn có chắc chắn muốn xóa "${memberToRemove?.displayName}" (${memberToRemove?.email}) khỏi dự án này không? Họ sẽ mất toàn bộ quyền truy cập vào tài liệu và các cuộc hội thoại trong dự án.`}
        confirmText="Xóa thành viên"
        isConfirming={removeMutation.isPending}
        onConfirm={() => {
          if (memberToRemove) {
            removeMutation.mutate(memberToRemove.userId);
          }
        }}
      />

      {/* Leave Project Confirmation Dialog */}
      <ConfirmDangerDialog
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
        title="Rời khỏi dự án"
        description="Bạn có chắc chắn muốn rời khỏi dự án này không? Bạn sẽ không còn quyền xem tài liệu hoặc sử dụng trợ lý AI trong dự án này trừ khi được mời lại."
        confirmText="Rời dự án"
        isConfirming={leaveMutation.isPending}
        onConfirm={() => leaveMutation.mutate()}
      />
    </div>
  );
};
