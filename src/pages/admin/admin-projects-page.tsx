import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminApi, GetAdminProjectsParams } from '@/features/admin/api/admin';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Input } from '@/shared/ui/input';
import { ContentSkeleton } from '@/shared/ui/skeleton';
import { ErrorState } from '@/shared/ui/error-state';
import { EmptyState } from '@/shared/ui/empty-state';
import { formatDate, formatRelativeTime } from '@/shared/lib/formatting';
import { Search, Building, ArrowRight, FolderKanban } from 'lucide-react';

export const AdminProjectsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [ownerIdFilter, setOwnerIdFilter] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 15;

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const queryParams: GetAdminProjectsParams = {
    q: debouncedSearch || undefined,
    ownerId: ownerIdFilter || undefined,
    page,
    size: pageSize,
    sort: 'updatedAt,desc',
  };

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-projects', queryParams],
    queryFn: () => adminApi.getAdminProjects(queryParams),
  });

  return (
    <div className="space-y-6 text-left">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">Tất cả dự án hệ thống</h1>
          <Badge variant="warning">ADMIN ONLY</Badge>
        </div>
        <p className="text-sm text-ink-muted mt-1">
          Theo dõi và truy cập tất cả các không gian dự án tri thức được tạo trong hệ thống KBase.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm dự án theo tên..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-white rounded-input border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          />
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Lọc theo Owner ID..."
            value={ownerIdFilter}
            onChange={(e) => {
              setOwnerIdFilter(e.target.value);
              setPage(0);
            }}
            className="max-w-xs text-xs py-1.5"
          />
        </div>
      </Card>

      {/* Projects Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading && (
          <div className="p-6 space-y-3">
            <ContentSkeleton height={36} count={5} />
          </div>
        )}

        {isError && (
          <div className="p-6">
            <ErrorState
              title="Không thể tải danh sách dự án"
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
                  icon={<FolderKanban className="w-8 h-8 text-ink-muted" />}
                  title="Không tìm thấy dự án"
                  description="Thử thay đổi từ khóa tìm kiếm hoặc bỏ lọc theo mã Owner."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-ink-muted border-b border-border bg-surface-subtle/60">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Tên dự án</th>
                      <th className="py-3 px-4 font-semibold">Mô tả</th>
                      <th className="py-3 px-4 font-semibold">Ngày tạo</th>
                      <th className="py-3 px-4 font-semibold">Cập nhật</th>
                      <th className="py-3 px-4 text-right font-semibold">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {data.content.map((proj) => (
                      <tr key={proj.id} className="hover:bg-surface-subtle/30 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-ink">
                          <Link
                            to={`/app/projects/${proj.id}`}
                            className="hover:text-accent hover:underline flex items-center gap-2"
                          >
                            <Building className="w-4 h-4 text-accent shrink-0" />
                            <span>{proj.name}</span>
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 text-ink-muted text-xs max-w-sm truncate">
                          {proj.description || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-ink-muted text-xs">
                          {formatDate(proj.createdAt)}
                        </td>
                        <td className="py-3.5 px-4 text-ink-muted text-xs">
                          {formatRelativeTime(proj.updatedAt)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link to={`/app/projects/${proj.id}`}>
                            <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
                              Truy cập dự án
                              <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                          </Link>
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
                  Trang {data.page + 1} / {data.totalPages} ({data.totalElements} dự án)
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
