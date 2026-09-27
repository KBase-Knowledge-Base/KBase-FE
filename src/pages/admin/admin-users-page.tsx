import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminApi, GetAdminUsersParams } from '@/features/admin/api/admin';
import { UserStatus, SystemRole } from '@/shared/api/types';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { ContentSkeleton } from '@/shared/ui/skeleton';
import { ErrorState } from '@/shared/ui/error-state';
import { EmptyState } from '@/shared/ui/empty-state';
import { useToast } from '@/shared/ui/toast';
import { formatRelativeTime } from '@/shared/lib/formatting';
import { Search, Users, UserCheck, UserX } from 'lucide-react';
import { isApiError } from '@/shared/api/errors';

export const AdminUsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('');
  const [roleFilter, setRoleFilter] = useState<SystemRole | ''>('');
  const [page, setPage] = useState(0);
  const pageSize = 15;

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const queryParams: GetAdminUsersParams = {
    q: debouncedSearch || undefined,
    status: (statusFilter as UserStatus) || undefined,
    systemRole: (roleFilter as SystemRole) || undefined,
    page,
    size: pageSize,
    sort: 'createdAt,desc',
  };

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-users', queryParams],
    queryFn: () => adminApi.getAdminUsers(queryParams),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: UserStatus }) =>
      adminApi.changeUserStatus(userId, { status }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      addToast({
        type: 'success',
        title: 'Cập nhật trạng thái thành công',
        message: `Tài khoản ${updated.email} hiện ở trạng thái ${updated.status}.`,
      });
    },
    onError: (err: unknown) => {
      addToast({
        type: 'error',
        title: 'Lỗi cập nhật',
        message: isApiError(err) ? err.message : 'Không thể thay đổi trạng thái người dùng.',
      });
    },
  });

  return (
    <div className="space-y-6 text-left">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">Quản trị người dùng</h1>
          <Badge variant="warning">ADMIN ONLY</Badge>
        </div>
        <p className="text-sm text-ink-muted mt-1">
          Xem danh sách tài khoản, trạng thái hoạt động và quản lý quyền truy cập hệ thống.
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-white rounded-input border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as UserStatus | '');
              setPage(0);
            }}
            className="px-3 py-2 text-xs bg-white rounded-button border border-border text-ink"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
            <option value="DISABLED">Bị vô hiệu (DISABLED)</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as SystemRole | '');
              setPage(0);
            }}
            className="px-3 py-2 text-xs bg-white rounded-button border border-border text-ink"
          >
            <option value="">Tất cả vai trò</option>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading && (
          <div className="p-6 space-y-3">
            <ContentSkeleton height={36} count={5} />
          </div>
        )}

        {isError && (
          <div className="p-6">
            <ErrorState
              title="Không thể tải danh sách người dùng"
              message={(error as Error)?.message}
              onRetry={() => refetch()}
            />
          </div>
        )}

        {!isLoading && !isError && data && (
          <>
            {data.content.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={<Users className="w-8 h-8 text-ink-muted" />}
                  title="Không tìm thấy người dùng"
                  description="Thử thay đổi từ khóa tìm kiếm hoặc bỏ các bộ lọc trạng thái."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-ink-muted border-b border-border bg-surface-subtle/60">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Tên hiển thị</th>
                      <th className="py-3 px-4 font-semibold">Email</th>
                      <th className="py-3 px-4 font-semibold">Vai trò hệ thống</th>
                      <th className="py-3 px-4 font-semibold">Trạng thái</th>
                      <th className="py-3 px-4 font-semibold">Ngày đăng ký</th>
                      <th className="py-3 px-4 text-right font-semibold">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {data.content.map((u) => (
                      <tr key={u.id} className="hover:bg-surface-subtle/30 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-ink">
                          <Link
                            to={`/app/admin/users/${u.id}`}
                            className="hover:text-accent hover:underline"
                          >
                            {u.displayName}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 text-ink-muted text-xs font-mono">
                          {u.email}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <Badge variant={u.systemRole === 'ADMIN' ? 'warning' : 'neutral'}>
                            {u.systemRole}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <Badge variant={u.status === 'ACTIVE' ? 'success' : 'danger'}>
                            {u.status === 'ACTIVE' ? 'Hoạt động' : 'Vô hiệu'}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-ink-muted text-xs">
                          {formatRelativeTime(u.createdAt)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 px-2"
                              isLoading={toggleStatusMutation.isPending && toggleStatusMutation.variables?.userId === u.id}
                              onClick={() =>
                                toggleStatusMutation.mutate({
                                  userId: u.id,
                                  status: u.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
                                })
                              }
                            >
                              {u.status === 'ACTIVE' ? (
                                <>
                                  <UserX className="w-3 h-3 mr-1 text-semantic-danger" />
                                  Khóa
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-3 h-3 mr-1 text-semantic-success" />
                                  Kích hoạt
                                </>
                              )}
                            </Button>

                            <Link to={`/app/admin/users/${u.id}`}>
                              <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
                                Chi tiết
                              </Button>
                            </Link>
                          </div>
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
                  Trang {data.page + 1} / {data.totalPages} ({data.totalElements} tài khoản)
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
    </div>
  );
};
