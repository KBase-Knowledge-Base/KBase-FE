import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useProject } from '@/app/layouts/project-layout';
import { documentsApi, GetDocumentsParams } from '@/features/documents/api/documents';
import { organizationApi } from '@/features/organization/api/organization';
import { membersApi } from '@/features/members/api/members';
import { FileKind, DocumentMetadataRequest } from '@/shared/api/types';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
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
import { useToast } from '@/shared/ui/toast';
import { formatBytes, formatRelativeTime } from '@/shared/lib/formatting';
import { canUploadDocuments } from '@/shared/lib/permissions';
import { useAuth } from '@/features/auth/context/auth-context';
import {
  FileText,
  Upload,
  Search,
  Folder,
  X,
  FileCode,
  Image as ImageIcon,
  Video,
  AlertCircle,
} from 'lucide-react';
import { isApiError } from '@/shared/api/errors';

export const DocumentsPage: React.FC = () => {
  const { projectId, currentUserRole } = useProject();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();

  // Search & Filter States from URL / state
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(searchParams.get('folderId') || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(searchParams.get('categoryId') || '');
  const [selectedTagId, setSelectedTagId] = useState<string>(searchParams.get('tagId') || '');
  const [selectedFileKind, setSelectedFileKind] = useState<FileKind | ''>((searchParams.get('fileKind') as FileKind) || '');
  const [selectedUploader, setSelectedUploader] = useState<string>(searchParams.get('uploadedBy') || '');
  const [page, setPage] = useState(0);
  const pageSize = 15;
  const sortField = 'createdAt';
  const sortOrder = 'desc';

  // Upload Dialog States
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadFolderId, setUploadFolderId] = useState<string>('');
  const [uploadCategoryId, setUploadCategoryId] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const userCanUpload = canUploadDocuments({
    systemRole: user?.systemRole,
    projectRole: currentUserRole,
    currentUserId: user?.id,
  });

  // Debounce search input
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch documents
  const queryParams: GetDocumentsParams = {
    q: debouncedSearch || undefined,
    folderId: selectedFolderId || undefined,
    categoryId: selectedCategoryId || undefined,
    tagId: selectedTagId || undefined,
    fileKind: (selectedFileKind as FileKind) || undefined,
    uploadedBy: selectedUploader || undefined,
    page,
    size: pageSize,
    sort: `${sortField},${sortOrder}`,
  };

  const {
    data: documentsData,
    isLoading: isDocsLoading,
    isError: isDocsError,
    error: docsError,
    refetch: refetchDocs,
  } = useQuery({
    queryKey: ['documents', projectId, queryParams],
    queryFn: () => documentsApi.getDocuments(projectId, queryParams),
  });

  // Fetch filter metadata (folders, categories, tags, members for uploader filter)
  const { data: folders } = useQuery({
    queryKey: ['folders', projectId],
    queryFn: () => organizationApi.getFolders(projectId),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories', projectId],
    queryFn: () => organizationApi.getCategories(projectId),
  });

  const { data: tags } = useQuery({
    queryKey: ['tags', projectId],
    queryFn: () => organizationApi.getTags(projectId),
  });

  const { data: members } = useQuery({
    queryKey: ['members', projectId, { size: 50 }],
    queryFn: () => membersApi.getProjectMembers(projectId, { size: 50 }),
  });

  // Reset all filters
  const handleClearFilters = () => {
    setSearch('');
    setSelectedFolderId('');
    setSelectedCategoryId('');
    setSelectedTagId('');
    setSelectedFileKind('');
    setSelectedUploader('');
    setPage(0);
  };

  // Upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      if (isBatchMode) {
        setSelectedFiles(filesArray.slice(0, 10)); // Max 10 per batch
      } else {
        setSelectedFiles([filesArray[0]!]);
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setUploadError('Vui lòng chọn ít nhất một tệp tin để tải lên');
      return;
    }

    setUploadError(null);
    setUploadProgress(0);
    setIsProcessingUpload(false);

    const metadata: DocumentMetadataRequest = {
      folderId: uploadFolderId || null,
      categoryId: uploadCategoryId || null,
    };

    try {
      if (isBatchMode || selectedFiles.length > 1) {
        await documentsApi.uploadBatchDocuments(
          projectId,
          selectedFiles,
          metadata,
          (percent) => {
            setUploadProgress(percent);
            if (percent === 100) {
              setIsProcessingUpload(true);
            }
          }
        );
        addToast({
          type: 'success',
          title: 'Tải lên thành công',
          message: `Đã tải lên ${selectedFiles.length} tệp tin vào dự án.`,
        });
      } else {
        await documentsApi.uploadDocument(
          projectId,
          selectedFiles[0]!,
          metadata,
          (percent) => {
            setUploadProgress(percent);
            if (percent === 100) {
              setIsProcessingUpload(true);
            }
          }
        );
        addToast({
          type: 'success',
          title: 'Tải lên thành công',
          message: `Tài liệu "${selectedFiles[0]!.name}" đã được tải lên.`,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      setUploadDialogOpen(false);
      setSelectedFiles([]);
      setUploadProgress(null);
      setIsProcessingUpload(false);
    } catch (err: unknown) {
      setUploadProgress(null);
      setIsProcessingUpload(false);
      if (isApiError(err)) {
        setUploadError(err.message);
      } else {
        setUploadError('Tải lên thất bại. Vui lòng kiểm tra dung lượng và định dạng tệp.');
      }
    }
  };

  const getFileIcon = (fileKind: FileKind, fileName: string) => {
    if (fileKind === 'IMAGE') return <ImageIcon className="w-4 h-4 text-emerald-600" />;
    if (fileKind === 'VIDEO') return <Video className="w-4 h-4 text-purple-600" />;
    if (fileName.endsWith('.md') || fileName.endsWith('.txt')) return <FileCode className="w-4 h-4 text-accent" />;
    return <FileText className="w-4 h-4 text-blue-600" />;
  };

  const hasActiveFilters =
    debouncedSearch || selectedFolderId || selectedCategoryId || selectedTagId || selectedFileKind || selectedUploader;

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink tracking-tight">Tài liệu dự án</h2>
          <p className="text-sm text-ink-muted mt-0.5">
            Duyệt, tìm kiếm theo metadata và quản lý kho tài liệu của dự án.
          </p>
        </div>

        {userCanUpload && (
          <Button size="sm" onClick={() => { setUploadError(null); setUploadDialogOpen(true); }}>
            <Upload className="w-4 h-4 mr-1.5" />
            Tải lên tài liệu
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm tài liệu theo tên..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-white rounded-input border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            />
          </div>

          {/* Quick Filter Selects */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Folder Filter */}
            <select
              value={selectedFolderId}
              onChange={(e) => { setSelectedFolderId(e.target.value); setPage(0); }}
              className="px-3 py-2 text-xs bg-white rounded-button border border-border text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <option value="">Tất cả thư mục</option>
              {folders?.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategoryId}
              onChange={(e) => { setSelectedCategoryId(e.target.value); setPage(0); }}
              className="px-3 py-2 text-xs bg-white rounded-button border border-border text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <option value="">Tất cả danh mục</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Tag Filter */}
            <select
              value={selectedTagId}
              onChange={(e) => { setSelectedTagId(e.target.value); setPage(0); }}
              className="px-3 py-2 text-xs bg-white rounded-button border border-border text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <option value="">Tất cả thẻ</option>
              {tags?.map((t) => (
                <option key={t.id} value={t.id}>#{t.name}</option>
              ))}
            </select>

            {/* File Kind Filter */}
            <select
              value={selectedFileKind}
              onChange={(e) => { setSelectedFileKind(e.target.value as FileKind | ''); setPage(0); }}
              className="px-3 py-2 text-xs bg-white rounded-button border border-border text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <option value="">Tất cả loại tệp</option>
              <option value="DOCUMENT">Tài liệu (PDF, Word, Text...)</option>
              <option value="IMAGE">Hình ảnh</option>
              <option value="VIDEO">Video</option>
            </select>

            {/* Uploader Filter */}
            {members && (
              <select
                value={selectedUploader}
                onChange={(e) => { setSelectedUploader(e.target.value); setPage(0); }}
                className="px-3 py-2 text-xs bg-white rounded-button border border-border text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                <option value="">Tất cả người tải</option>
                {members.content.map((m) => (
                  <option key={m.userId} value={m.userId}>{m.displayName}</option>
                ))}
              </select>
            )}

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-xs h-8 text-semantic-danger hover:bg-semantic-danger-bg"
              >
                <X className="w-3 h-3 mr-1" />
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Documents Table */}
      <Card className="p-0 overflow-hidden">
        {isDocsLoading && (
          <div className="p-6 space-y-3">
            <ContentSkeleton height={36} count={5} />
          </div>
        )}

        {isDocsError && (
          <div className="p-6">
            <ErrorState
              title="Không thể tải danh sách tài liệu"
              message={(docsError as Error)?.message}
              onRetry={() => refetchDocs()}
            />
          </div>
        )}

        {!isDocsLoading && !isDocsError && documentsData && (
          <>
            {documentsData.content.length === 0 ? (
              <div className="p-8">
                {hasActiveFilters ? (
                  <EmptyState
                    title="Không tìm thấy tài liệu phù hợp"
                    description="Thử thay đổi từ khóa tìm kiếm hoặc bỏ các bộ lọc thư mục, danh mục hoặc thẻ."
                    action={
                      <Button variant="outline" size="sm" onClick={handleClearFilters}>
                        Xóa tất cả bộ lọc
                      </Button>
                    }
                  />
                ) : (
                  <EmptyState
                    icon={<FileText className="w-8 h-8 text-ink-muted" />}
                    title="Chưa có tài liệu nào trong dự án"
                    description="Dự án hiện chưa có tệp tin nào. Hãy tải lên tài liệu đầu tiên để tạo nguồn tri thức cho AI."
                    action={
                      userCanUpload && (
                        <Button size="sm" onClick={() => setUploadDialogOpen(true)}>
                          <Upload className="w-4 h-4 mr-1.5" />
                          Tải lên tài liệu ngay
                        </Button>
                      )
                    }
                  />
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-ink-muted border-b border-border bg-surface-subtle/60">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Tên tài liệu</th>
                      <th className="py-3 px-4 font-semibold">Loại tệp</th>
                      <th className="py-3 px-4 font-semibold">Thư mục</th>
                      <th className="py-3 px-4 font-semibold">Dung lượng</th>
                      <th className="py-3 px-4 font-semibold">Thời gian tải</th>
                      <th className="py-3 px-4 text-right font-semibold">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {documentsData.content.map((doc) => {
                      const folder = folders?.find((f) => f.id === doc.folderId);

                      return (
                        <tr key={doc.id} className="hover:bg-surface-subtle/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-ink">
                            <div className="flex items-center gap-2.5">
                              {getFileIcon(doc.fileKind, doc.fileName)}
                              <Link
                                to={`/app/documents/${doc.id}`}
                                className="hover:text-accent hover:underline truncate max-w-sm"
                                title={doc.displayName || doc.fileName}
                              >
                                {doc.displayName || doc.fileName}
                              </Link>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-xs">
                            <Badge variant="neutral" size="sm">
                              {doc.fileKind}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-ink-muted text-xs">
                            {folder ? (
                              <span className="inline-flex items-center gap-1">
                                <Folder className="w-3 h-3 text-border-control" />
                                {folder.name}
                              </span>
                            ) : (
                              <span className="text-ink-subtle">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-ink-muted text-xs font-mono">
                            {formatBytes(doc.sizeBytes)}
                          </td>
                          <td className="py-3 px-4 text-ink-muted text-xs">
                            {formatRelativeTime(doc.createdAt)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              to={`/app/documents/${doc.id}`}
                              className="text-xs font-semibold text-accent hover:underline"
                            >
                              Xem chi tiết
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {documentsData.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border-subtle">
                <span className="text-xs text-ink-muted">
                  Trang {documentsData.page + 1} / {documentsData.totalPages} ({documentsData.totalElements} tài liệu)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={documentsData.first}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    Trang trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={documentsData.last}
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

      {/* Upload Documents Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={(open) => !uploadProgress && setUploadDialogOpen(open)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Tải lên tài liệu</DialogTitle>
            <DialogDescription>
              Tải tài liệu lên dự án để lưu trữ và lập chỉ mục cho Trợ lý AI. Hỗ trợ tệp văn bản (PDF, DOCX, TXT, MD), hình ảnh và video.
            </DialogDescription>
          </DialogHeader>

          {uploadError && (
            <div
              role="alert"
              className="p-3 rounded-button bg-semantic-danger-bg border border-semantic-danger-border flex items-start gap-2 text-xs text-semantic-danger"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{uploadError}</p>
            </div>
          )}

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            {/* Mode Selector */}
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <span className="text-xs font-semibold text-ink">Chế độ tải:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setIsBatchMode(false); setSelectedFiles([]); }}
                  className={`text-xs px-2.5 py-1 rounded-button font-medium transition-colors ${!isBatchMode ? 'bg-ink text-white' : 'text-ink-muted hover:bg-surface-subtle'}`}
                >
                  Một tệp
                </button>
                <button
                  type="button"
                  onClick={() => { setIsBatchMode(true); setSelectedFiles([]); }}
                  className={`text-xs px-2.5 py-1 rounded-button font-medium transition-colors ${isBatchMode ? 'bg-ink text-white' : 'text-ink-muted hover:bg-surface-subtle'}`}
                >
                  Nhiều tệp (Tối đa 10)
                </button>
              </div>
            </div>

            {/* File Input Box */}
            <div className="border-2 border-dashed border-border rounded-card p-6 text-center bg-surface-subtle/40 hover:bg-surface-subtle/80 transition-colors">
              <input
                type="file"
                id="doc-upload-input"
                multiple={isBatchMode}
                onChange={handleFileChange}
                className="hidden"
                disabled={uploadProgress !== null}
              />
              <label htmlFor="doc-upload-input" className="cursor-pointer block">
                <Upload className="w-8 h-8 text-accent mx-auto mb-2" />
                <p className="text-sm font-semibold text-ink">
                  {selectedFiles.length > 0
                    ? `Đã chọn ${selectedFiles.length} tệp tin`
                    : 'Bấm vào đây để chọn tệp tin từ thiết bị'}
                </p>
                <p className="text-xs text-ink-muted mt-1">
                  PDF, DOC, DOCX, PPT, PPTX, TXT, MD, PNG, JPG, MP4...
                </p>
              </label>

              {selectedFiles.length > 0 && (
                <div className="mt-3 text-xs text-ink-muted space-y-1 max-h-24 overflow-y-auto">
                  {selectedFiles.map((f, i) => (
                    <div key={i} className="flex items-center justify-between bg-white px-2.5 py-1 rounded border border-border">
                      <span className="truncate max-w-xs">{f.name}</span>
                      <span className="font-mono">{formatBytes(f.size)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Metadata selections */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Thư mục lưu trữ</label>
                <select
                  value={uploadFolderId}
                  onChange={(e) => setUploadFolderId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white rounded-input border border-border text-ink"
                >
                  <option value="">Thư mục gốc (Root)</option>
                  {folders?.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Danh mục</label>
                <select
                  value={uploadCategoryId}
                  onChange={(e) => setUploadCategoryId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white rounded-input border border-border text-ink"
                >
                  <option value="">Không phân danh mục</option>
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Upload Progress Bar */}
            {uploadProgress !== null && (
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs text-ink-muted">
                  <span>{isProcessingUpload ? 'Đang hoàn tất xử lý trên máy chủ...' : 'Đang gửi dữ liệu...'}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-border-subtle rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-accent h-2 rounded-full transition-all duration-150"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setUploadDialogOpen(false)}
                disabled={uploadProgress !== null}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={selectedFiles.length === 0 || uploadProgress !== null}
                isLoading={uploadProgress !== null}
              >
                Bắt đầu tải lên
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
