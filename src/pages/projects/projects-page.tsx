import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { projectsApi } from '@/features/projects/api/projects';
import { ProjectRole } from '@/shared/api/types';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { ContentSkeleton } from '@/shared/ui/skeleton';
import { EmptyState } from '@/shared/ui/empty-state';
import { ErrorState } from '@/shared/ui/error-state';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui/dialog';
import { Textarea } from '@/shared/ui/textarea';
import { useToast } from '@/shared/ui/toast';
import { formatRelativeTime } from '@/shared/lib/formatting';
import { Plus, Search, FolderKanban, ArrowRight } from 'lucide-react';
import { isApiError } from '@/shared/api/errors';

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<ProjectRole | ''>('');
  const [page, setPage] = useState(0);
  const pageSize = 12;

  // Create Project Dialog State
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['projects', { q: debouncedSearch, role: roleFilter || undefined, page, size: pageSize }],
    queryFn: () =>
      projectsApi.getProjects({
        q: debouncedSearch || undefined,
        role: (roleFilter as ProjectRole) || undefined,
        page,
        size: pageSize,
        sort: 'updatedAt,desc',
      }),
  });

  const createMutation = useMutation({
    mutationFn: projectsApi.createProject,
    onSuccess: (newProj) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setCreateDialogOpen(false);
      setNewProjectName('');
      setNewProjectDescription('');
      addToast({
        type: 'success',
        title: 'Tạo dự án thành công',
        message: `Dự án "${newProj.name}" đã sẵn sàng hoạt động.`,
      });
      navigate(`/app/projects/${newProj.id}`);
    },
    onError: (err: unknown) => {
      if (isApiError(err)) {
        setCreateError(err.message);
      } else {
        setCreateError('Không thể tạo dự án lúc này. Vui lòng thử lại.');
      }
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      setCreateError('Vui lòng nhập tên dự án');
      return;
    }
    setCreateError(null);
    createMutation.mutate({
      name: newProjectName.trim(),
      description: newProjectDescription.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Dự án của tôi</h1>
          <p className="text-sm text-ink-muted mt-1">
            Không gian lưu trữ, tổ chức tài liệu và hỏi đáp tri thức cùng trợ lý AI.
          </p>
        </div>

        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Tạo dự án mới
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm dự án theo tên..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-white rounded-input border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-muted shrink-0">Vai trò:</span>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as ProjectRole | '');
              setPage(0);
            }}
            className="px-3 py-2 text-sm bg-white rounded-button border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent text-ink"
          >
            <option value="">Tất cả vai trò</option>
            <option value="OWNER">Chủ sở hữu (Owner)</option>
            <option value="MEMBER">Thành viên (Member)</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-44 flex flex-col justify-between">
              <div className="space-y-2">
                <ContentSkeleton height={20} width="60%" />
                <ContentSkeleton height={14} width="90%" />
                <ContentSkeleton height={14} width="40%" />
              </div>
              <ContentSkeleton height={16} width="30%" />
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <ErrorState
          title="Không thể tải danh sách dự án"
          message={(error as Error)?.message}
          onRetry={() => refetch()}
        />
      )}

      {/* Data Grid */}
      {!isLoading && !isError && data && (
        <>
          {data.content.length === 0 ? (
            debouncedSearch || roleFilter ? (
              <EmptyState
                title="Không tìm thấy dự án phù hợp"
                description="Hãy thử thay đổi từ khóa tìm kiếm hoặc bỏ bộ lọc vai trò."
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearch('');
                      setRoleFilter('');
                    }}
                  >
                    Xóa bộ lọc
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={<FolderKanban className="w-8 h-8 text-accent" />}
                title="Chưa có dự án nào"
                description="Bạn chưa tham gia dự án nào. Hãy tạo dự án đầu tiên để bắt đầu tổ chức tài liệu và sử dụng Trợ lý AI."
                action={
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-1.5" />
                    Tạo dự án đầu tiên
                  </Button>
                }
              />
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.content.map((proj) => (
                <Link
                  key={proj.id}
                  to={`/app/projects/${proj.id}`}
                  className="group block"
                >
                  <Card className="h-full flex flex-col justify-between transition-all duration-150 group-hover:shadow-md group-hover:-translate-y-0.5 border border-border hover:border-ink/20">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-base text-ink group-hover:text-accent transition-colors line-clamp-1">
                          {proj.name}
                        </h3>
                        {proj.currentUserRole === 'OWNER' && (
                          <Badge variant="accent" size="sm">
                            Owner
                          </Badge>
                        )}
                        {proj.currentUserRole === 'MEMBER' && (
                          <Badge variant="neutral" size="sm">
                            Member
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-ink-muted line-clamp-2 min-h-[32px]">
                        {proj.description || 'Chưa có mô tả cho dự án này.'}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-border-subtle mt-4 flex items-center justify-between text-xs text-ink-muted">
                      <span>Cập nhật {formatRelativeTime(proj.updatedAt)}</span>
                      <span className="inline-flex items-center text-accent font-medium group-hover:translate-x-0.5 transition-transform">
                        Truy cập
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
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

      {/* Create Project Modal Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo dự án mới</DialogTitle>
            <DialogDescription>
              Tạo không gian để lưu trữ và quản lý tài liệu tri thức cho nhóm của bạn.
            </DialogDescription>
          </DialogHeader>

          {createError && (
            <p className="text-xs text-semantic-danger font-medium">{createError}</p>
          )}

          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <Input
              label="Tên dự án"
              placeholder="VD: Tài liệu Kỹ thuật, Sách Hướng dẫn..."
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              required
              autoFocus
            />

            <Textarea
              label="Mô tả dự án (tùy chọn)"
              placeholder="Mục đích hoặc phạm vi của dự án này..."
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
              rows={3}
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
                Tạo dự án
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
