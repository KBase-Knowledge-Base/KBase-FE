import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '@/features/documents/api/documents';
import { organizationApi } from '@/features/organization/api/organization';
import { useAuth } from '@/features/auth/context/auth-context';
import { canModifyDocument } from '@/shared/lib/permissions';
import { DocumentAiIndexStatus, DocumentMetadataRequest } from '@/shared/api/types';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
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
import { useToast } from '@/shared/ui/toast';
import { formatBytes, formatDate } from '@/shared/lib/formatting';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  FileText,
  Download,
  Edit,
  Trash2,
  ChevronRight,
  RotateCw,
  AlertCircle,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { isApiError } from '@/shared/api/errors';

export const DocumentDetailPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editFolderId, setEditFolderId] = useState<string>('');
  const [editCategoryId, setEditCategoryId] = useState<string>('');
  const [editTagIds, setEditTagIds] = useState<string[]>([]);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Preview state
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewTextContent, setPreviewTextContent] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch document details
  const {
    data: document,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => documentsApi.getDocument(documentId!),
    enabled: !!documentId,
  });

  // Fetch folders, categories, tags for edit dialog
  const { data: folders } = useQuery({
    queryKey: ['folders', document?.projectId],
    queryFn: () => organizationApi.getFolders(document!.projectId),
    enabled: !!document?.projectId,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories', document?.projectId],
    queryFn: () => organizationApi.getCategories(document!.projectId),
    enabled: !!document?.projectId,
  });

  const { data: tags } = useQuery({
    queryKey: ['tags', document?.projectId],
    queryFn: () => organizationApi.getTags(document!.projectId),
    enabled: !!document?.projectId,
  });

  // Bounded Polling for AI Index Status if PENDING or INDEXING
  const shouldPollIndex =
    document?.aiIndexStatus === 'PENDING' || document?.aiIndexStatus === 'INDEXING';

  useQuery({
    queryKey: ['document-ai-index', document?.projectId, documentId],
    queryFn: async () => {
      const res = await documentsApi.getDocumentAiIndex(document!.projectId, documentId!);
      // If status changed, invalidate document query
      if (res.status !== document?.aiIndexStatus) {
        queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      }
      return res;
    },
    enabled: !!document?.projectId && !!documentId && shouldPollIndex,
    refetchInterval: 4000, // Poll every 4 seconds
  });

  // Load authenticated preview
  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    if (!documentId || !document) return;

    const mime = document.mimeType.toLowerCase();
    const isImage = document.fileKind === 'IMAGE' || mime.startsWith('image/');
    const isPdf = mime.includes('pdf');
    const isText =
      mime.includes('text') ||
      document.fileName.endsWith('.txt') ||
      document.fileName.endsWith('.md');

    if (isImage || isPdf || isText) {
      setIsPreviewLoading(true);
      setPreviewError(null);

      documentsApi
        .previewDocument(documentId)
        .then(async (res) => {
          if (!active) return;
          if (isText) {
            const text = await res.blob.text();
            setPreviewTextContent(text);
          } else {
            createdUrl = URL.createObjectURL(res.blob);
            setPreviewBlobUrl(createdUrl);
          }
          setIsPreviewLoading(false);
        })
        .catch((err) => {
          if (!active) return;
          setIsPreviewLoading(false);
          setPreviewError((err as Error)?.message || 'Không thể tải bản xem trước.');
        });
    }

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [documentId, document]);

  // Mutations
  const updateMutation = useMutation({
    mutationFn: (data: DocumentMetadataRequest) => documentsApi.updateDocument(documentId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      queryClient.invalidateQueries({ queryKey: ['documents', document?.projectId] });
      setEditDialogOpen(false);
      addToast({
        type: 'success',
        title: 'Cập nhật thành công',
        message: 'Thông tin tài liệu đã được cập nhật.',
      });
    },
    onError: (err: unknown) => {
      setEditError(isApiError(err) ? err.message : 'Không thể cập nhật tài liệu.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => documentsApi.deleteDocument(documentId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', document?.projectId] });
      addToast({
        type: 'success',
        title: 'Đã xóa tài liệu',
        message: 'Tài liệu đã được xóa vĩnh viễn khỏi dự án.',
      });
      navigate(`/app/projects/${document?.projectId}/documents`);
    },
    onError: (err: unknown) => {
      addToast({
        type: 'error',
        title: 'Lỗi xóa tài liệu',
        message: isApiError(err) ? err.message : 'Không thể xóa tài liệu.',
      });
    },
  });

  const retryAiIndexMutation = useMutation({
    mutationFn: () => documentsApi.retryDocumentAiIndex(document!.projectId, documentId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      addToast({
        type: 'success',
        title: 'Đang bắt đầu lập chỉ mục lại',
        message: 'Hệ thống đã nhận yêu cầu retry và đang tiến hành xử lý.',
      });
    },
    onError: (err: unknown) => {
      addToast({
        type: 'error',
        title: 'Không thể thử lại',
        message: isApiError(err) ? err.message : 'Yêu cầu lập lại chỉ mục thất bại.',
      });
    },
  });

  const handleDownload = async () => {
    if (!documentId) return;
    setIsDownloading(true);
    try {
      const res = await documentsApi.downloadDocument(documentId);
      const url = URL.createObjectURL(res.blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = res.fileName || document?.displayName || document?.fileName || 'document';
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err: unknown) {
      addToast({
        type: 'error',
        title: 'Tải xuống thất bại',
        message: isApiError(err) ? err.message : 'Không thể tải xuống tệp tin.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenEdit = () => {
    if (!document) return;
    setEditDisplayName(document.displayName);
    setEditDescription(document.description || '');
    setEditFolderId(document.folderId || '');
    setEditCategoryId(document.category?.id || '');
    setEditTagIds(document.tags.map((t) => t.id));
    setEditError(null);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!document) return;

    // Respect null semantics: folderId/categoryId keep old if null
    const payload: DocumentMetadataRequest = {
      displayName: editDisplayName.trim() || undefined,
      description: editDescription.trim(),
      folderId: editFolderId ? editFolderId : undefined,
      categoryId: editCategoryId ? editCategoryId : undefined,
      tagIds: editTagIds,
    };

    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <ContentSkeleton height={32} width={280} />
        <ContentSkeleton height={200} />
        <ContentSkeleton height={400} />
      </div>
    );
  }

  if (isError || !document) {
    return (
      <ErrorState
        title="Không tìm thấy tài liệu"
        message={(error as Error)?.message || 'Tài liệu không tồn tại hoặc đã bị xóa.'}
        onRetry={() => refetch()}
      />
    );
  }

  const userCanModify = canModifyDocument(
    {
      systemRole: user?.systemRole,
      projectRole: null, // Check uploader
      currentUserId: user?.id,
    },
    document.uploader.id
  );

  const getAiBadge = (status: DocumentAiIndexStatus) => {
    switch (status) {
      case 'READY':
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đã lập chỉ mục AI
          </Badge>
        );
      case 'INDEXING':
      case 'PENDING':
        return (
          <Badge variant="warning" className="flex items-center gap-1 animate-pulse">
            <RotateCw className="w-3.5 h-3.5 animate-spin" />
            {status === 'INDEXING' ? 'Đang lập chỉ mục AI...' : 'Đang chờ xử lý...'}
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge variant="danger" className="flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            Lập chỉ mục thất bại
          </Badge>
        );
      case 'UNSUPPORTED':
        return (
          <Badge variant="neutral">
            Định dạng không hỗ trợ AI
          </Badge>
        );
    }
  };

  const isMarkdown = document.fileName.endsWith('.md');
  const isImage = document.fileKind === 'IMAGE' || document.mimeType.startsWith('image/');
  const isPdf = document.mimeType.includes('pdf');
  const isText = document.mimeType.includes('text') || document.fileName.endsWith('.txt') || isMarkdown;

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-ink-muted">
        <Link to="/app/projects" className="hover:text-ink hover:underline">
          Dự án
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-border-control" />
        <Link to={`/app/projects/${document.projectId}/documents`} className="hover:text-ink hover:underline">
          Tài liệu
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-border-control" />
        <span className="text-ink font-medium truncate max-w-sm">{document.displayName || document.fileName}</span>
      </nav>

      {/* Document Header Card */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
                {document.displayName || document.fileName}
              </h1>
              {getAiBadge(document.aiIndexStatus)}
            </div>

            <p className="text-xs text-ink-muted font-mono">
              Tên tệp gốc: {document.fileName}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button size="sm" onClick={handleDownload} isLoading={isDownloading}>
              <Download className="w-4 h-4 mr-1.5" />
              Tải xuống
            </Button>

            {userCanModify && (
              <>
                <Button variant="outline" size="sm" onClick={handleOpenEdit}>
                  <Edit className="w-4 h-4 mr-1.5" />
                  Sửa thông tin
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-semantic-danger hover:bg-semantic-danger-bg"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Xóa
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Description if present */}
        {document.description && (
          <p className="text-sm text-ink-muted bg-surface-subtle/50 p-3 rounded-card border border-border-subtle">
            {document.description}
          </p>
        )}

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-border-subtle text-xs">
          <div>
            <span className="text-ink-muted block">Dung lượng:</span>
            <span className="font-semibold text-ink font-mono mt-0.5 block">{formatBytes(document.sizeBytes)}</span>
          </div>

          <div>
            <span className="text-ink-muted block">Loại tệp tin:</span>
            <span className="font-semibold text-ink mt-0.5 block">{document.mimeType}</span>
          </div>

          <div>
            <span className="text-ink-muted block">Người tải lên:</span>
            <span className="font-semibold text-ink mt-0.5 block truncate">{document.uploader.displayName}</span>
          </div>

          <div>
            <span className="text-ink-muted block">Thời gian tạo:</span>
            <span className="font-semibold text-ink mt-0.5 block">{formatDate(document.createdAt)}</span>
          </div>
        </div>

        {/* Category & Tags Row */}
        {(document.category || document.tags.length > 0) && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border-subtle text-xs">
            {document.category && (
              <div className="flex items-center gap-1.5">
                <span className="text-ink-muted">Danh mục:</span>
                <Badge variant="accent">{document.category.name}</Badge>
              </div>
            )}

            {document.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 ml-2">
                <span className="text-ink-muted">Thẻ:</span>
                {document.tags.map((t) => (
                  <Badge key={t.id} variant="neutral">#{t.name}</Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI Index Failure Alert & Retry Button */}
        {document.aiIndexStatus === 'FAILED' && (
          <div className="p-3.5 rounded-card bg-semantic-danger-bg border border-semantic-danger-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-semantic-danger">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Quá trình lập chỉ mục tài liệu cho AI gặp sự cố.</p>
                <p className="text-ink-muted mt-0.5">
                  Tài liệu có thể bị lỗi font hoặc cấu trúc phức tạp. Bạn có thể bấm Thử lại để hệ thống xử lý lại.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => retryAiIndexMutation.mutate()}
              isLoading={retryAiIndexMutation.isPending}
              className="shrink-0"
            >
              <RotateCw className="w-3.5 h-3.5 mr-1" />
              Thử lại chỉ mục
            </Button>
          </div>
        )}
      </Card>

      {/* Preview Section */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-accent" />
            <h2 className="text-base font-semibold text-ink">Xem trước nội dung</h2>
          </div>
        </div>

        {isPreviewLoading && (
          <div className="py-12 space-y-3">
            <ContentSkeleton height={300} />
          </div>
        )}

        {previewError && (
          <div className="p-6 text-center text-xs text-semantic-danger">
            <p>{previewError}</p>
          </div>
        )}

        {!isPreviewLoading && !previewError && (
          <div className="min-h-[300px] flex items-center justify-center bg-canvas/60 rounded-card p-4 overflow-hidden border border-border">
            {/* Image Preview */}
            {isImage && previewBlobUrl && (
              <img
                src={previewBlobUrl}
                alt={document.displayName || document.fileName}
                className="max-h-[600px] w-auto object-contain rounded shadow"
              />
            )}

            {/* PDF Preview */}
            {isPdf && previewBlobUrl && (
              <iframe
                src={previewBlobUrl}
                title={document.displayName || document.fileName}
                className="w-full h-[650px] rounded border border-border bg-white"
              />
            )}

            {/* Markdown / Text Preview */}
            {isText && previewTextContent !== null && (
              <div className="w-full max-w-3xl bg-white p-6 rounded-card border border-border shadow-sm text-left overflow-x-auto max-h-[650px] overflow-y-auto">
                {isMarkdown ? (
                  <div className="prose prose-sm max-w-none text-ink">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {previewTextContent}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <pre className="font-mono text-xs text-ink whitespace-pre-wrap leading-relaxed">
                    {previewTextContent}
                  </pre>
                )}
              </div>
            )}

            {/* Fallback for unsupported in-browser preview (Office, MOV, AVI...) */}
            {!isImage && !isPdf && !isText && (
              <div className="text-center py-10 px-4 space-y-3">
                <div className="w-12 h-12 rounded-full neu-flat flex items-center justify-center text-ink-muted mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-ink text-sm">Chưa hỗ trợ xem trước trực tiếp trên trình duyệt</h3>
                  <p className="text-xs text-ink-muted mt-1 max-w-sm mx-auto">
                    Định dạng tệp này ({document.fileName.split('.').pop()?.toUpperCase()}) được lưu trữ an toàn. Bạn có thể tải tệp tin về để mở bằng ứng dụng trên máy tính.
                  </p>
                </div>
                <Button size="sm" onClick={handleDownload} isLoading={isDownloading}>
                  <Download className="w-4 h-4 mr-1.5" />
                  Tải xuống để xem
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Edit Metadata Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Sửa thông tin tài liệu</DialogTitle>
            <DialogDescription>
              Cập nhật tên hiển thị, mô tả hoặc phân loại thư mục/danh mục cho tài liệu.
            </DialogDescription>
          </DialogHeader>

          {editError && <p className="text-xs text-semantic-danger font-medium">{editError}</p>}

          <form onSubmit={handleEditSubmit} className="space-y-4">
            <Input
              label="Tên hiển thị"
              value={editDisplayName}
              onChange={(e) => setEditDisplayName(e.target.value)}
              placeholder="VD: Hướng dẫn sử dụng phần mềm"
              required
              autoFocus
            />

            <Textarea
              label="Mô tả tài liệu"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Tóm tắt ngắn gọn nội dung tài liệu..."
              rows={3}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Thư mục</label>
                <select
                  value={editFolderId}
                  onChange={(e) => setEditFolderId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white rounded-input border border-border text-ink"
                >
                  <option value="">Giữ nguyên / Thư mục gốc</option>
                  {folders?.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Danh mục</label>
                <select
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white rounded-input border border-border text-ink"
                >
                  <option value="">Không thay đổi</option>
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {tags && tags.length > 0 && (
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-ink">Gán thẻ phân loại</label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-surface-subtle/50 rounded border border-border">
                  {tags.map((tag) => {
                    const isSelected = editTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setEditTagIds((prev) => prev.filter((id) => id !== tag.id));
                          } else {
                            setEditTagIds((prev) => [...prev, tag.id]);
                          }
                        }}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          isSelected
                            ? 'bg-ink text-white border-ink'
                            : 'bg-white text-ink-muted border-border hover:border-ink/40'
                        }`}
                      >
                        #{tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" isLoading={updateMutation.isPending}>
                Lưu thay đổi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDangerDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Xác nhận xóa tài liệu"
        description={`Bạn có chắc muốn xóa tài liệu "${document.displayName || document.fileName}"? Tệp tin và toàn bộ vector chỉ mục AI liên quan sẽ bị xóa vĩnh viễn khỏi hệ thống.`}
        confirmText="Xóa tài liệu"
        isConfirming={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
};
