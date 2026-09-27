import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useProject } from '@/app/layouts/project-layout';
import { documentsApi } from '@/features/documents/api/documents';
import { membersApi } from '@/features/members/api/members';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { ContentSkeleton } from '@/shared/ui/skeleton';
import { formatRelativeTime, formatBytes } from '@/shared/lib/formatting';
import {
  FileText,
  Users,
  Bot,
  Tags,
  ArrowRight,
  Upload,
  UserPlus,
  MessageSquare,
} from 'lucide-react';

export const ProjectOverviewPage: React.FC = () => {
  const { projectId, canManage } = useProject();

  // Fetch document total count & recent documents
  const {
    data: documentsData,
    isLoading: isDocsLoading,
  } = useQuery({
    queryKey: ['documents', projectId, { page: 0, size: 5, sort: 'createdAt,desc' }],
    queryFn: () => documentsApi.getDocuments(projectId, { page: 0, size: 5, sort: 'createdAt,desc' }),
  });

  // Fetch member total count
  const {
    data: membersData,
    isLoading: isMembersLoading,
  } = useQuery({
    queryKey: ['members', projectId, { page: 0, size: 1 }],
    queryFn: () => membersApi.getProjectMembers(projectId, { page: 0, size: 1 }),
  });

  return (
    <div className="space-y-6 text-left">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full neu-flat flex items-center justify-center text-accent shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-ink-muted">Tổng số tài liệu</p>
            {isDocsLoading ? (
              <ContentSkeleton height={28} width={60} />
            ) : (
              <p className="text-2xl font-bold text-ink mt-0.5">
                {documentsData?.totalElements ?? 0}
              </p>
            )}
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full neu-flat flex items-center justify-center text-ink shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-ink-muted">Thành viên tham gia</p>
            {isMembersLoading ? (
              <ContentSkeleton height={28} width={60} />
            ) : (
              <p className="text-2xl font-bold text-ink mt-0.5">
                {membersData?.totalElements ?? 1}
              </p>
            )}
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full neu-flat flex items-center justify-center text-accent shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-ink-muted">Trợ lý dự án</p>
            <p className="text-sm font-semibold text-ink mt-0.5">Sẵn sàng phản hồi</p>
          </div>
        </Card>
      </div>

      {/* Action Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to={`/app/projects/${projectId}/documents`} className="block group">
          <Card className="h-full hover:border-ink/20 transition-all p-5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-surface-subtle flex items-center justify-center text-ink">
                <Upload className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-ink-muted group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-semibold text-ink mt-3">Quản lý & Tải lên tài liệu</h3>
            <p className="text-xs text-ink-muted mt-1">
              Duyệt cây thư mục, tìm kiếm tài liệu và tải lên tệp mới.
            </p>
          </Card>
        </Link>

        <Link to={`/app/projects/${projectId}/assistant`} className="block group">
          <Card className="h-full hover:border-ink/20 transition-all p-5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-accent-subtle flex items-center justify-center text-accent">
                <MessageSquare className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-accent group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-semibold text-ink mt-3">Hỏi đáp với Trợ lý AI</h3>
            <p className="text-xs text-ink-muted mt-1">
              Đặt câu hỏi và nhận câu trả lời có nguồn trích dẫn từ tài liệu.
            </p>
          </Card>
        </Link>

        {canManage ? (
          <Link to={`/app/projects/${projectId}/invitations`} className="block group">
            <Card className="h-full hover:border-ink/20 transition-all p-5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-surface-subtle flex items-center justify-center text-ink">
                  <UserPlus className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-ink-muted group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-semibold text-ink mt-3">Mời thành viên</h3>
              <p className="text-xs text-ink-muted mt-1">
                Gửi lời mời tham gia dự án qua email cho đồng đội.
              </p>
            </Card>
          </Link>
        ) : (
          <Link to={`/app/projects/${projectId}/organization`} className="block group">
            <Card className="h-full hover:border-ink/20 transition-all p-5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-surface-subtle flex items-center justify-center text-ink">
                  <Tags className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-ink-muted group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-semibold text-ink mt-3">Tổ chức phân loại</h3>
              <p className="text-xs text-ink-muted mt-1">
                Xem cấu trúc thư mục, danh mục và thẻ phân loại.
              </p>
            </Card>
          </Link>
        )}
      </div>

      {/* Recent Documents Table */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-ink">Tài liệu mới tải lên gần đây</h2>
          <Link
            to={`/app/projects/${projectId}/documents`}
            className="text-xs font-semibold text-accent hover:underline inline-flex items-center"
          >
            Xem tất cả
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        {isDocsLoading ? (
          <div className="space-y-2">
            <ContentSkeleton height={40} count={3} />
          </div>
        ) : !documentsData || documentsData.content.length === 0 ? (
          <p className="text-sm text-ink-muted py-6 text-center">
            Chưa có tài liệu nào trong dự án này. Hãy bắt đầu tải lên tài liệu đầu tiên!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-ink-muted border-b border-border bg-surface-subtle/50">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Tên tài liệu</th>
                  <th className="py-2.5 px-3 font-semibold">Loại tệp</th>
                  <th className="py-2.5 px-3 font-semibold">Kích thước</th>
                  <th className="py-2.5 px-3 font-semibold">Thời gian tải</th>
                  <th className="py-2.5 px-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {documentsData.content.map((doc) => (
                  <tr key={doc.id} className="hover:bg-surface-subtle/40 transition-colors">
                    <td className="py-3 px-3 font-medium text-ink">
                      <Link
                        to={`/app/documents/${doc.id}`}
                        className="hover:text-accent hover:underline truncate max-w-xs block"
                      >
                        {doc.displayName || doc.fileName}
                      </Link>
                    </td>
                    <td className="py-3 px-3 text-ink-muted text-xs">
                      <Badge variant="neutral" size="sm">
                        {doc.fileKind}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-ink-muted text-xs font-mono">
                      {formatBytes(doc.sizeBytes)}
                    </td>
                    <td className="py-3 px-3 text-ink-muted text-xs">
                      {formatRelativeTime(doc.createdAt)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/app/documents/${doc.id}`}
                        className="text-xs font-medium text-accent hover:underline"
                      >
                        Chi tiết
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
