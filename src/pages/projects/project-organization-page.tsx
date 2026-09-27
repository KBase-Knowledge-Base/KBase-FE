import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProject } from '@/app/layouts/project-layout';
import { organizationApi } from '@/features/organization/api/organization';
import { FolderResponse, CategoryResponse, TagResponse } from '@/shared/api/types';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs';
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
import { formatDate } from '@/shared/lib/formatting';
import { canManageFolders, canManageCategories, canCreateTag, canManageTag } from '@/shared/lib/permissions';
import { useAuth } from '@/features/auth/context/auth-context';
import {
  Folder,
  FolderPlus,
  Edit2,
  Trash2,
  CornerDownRight,
  Tags,
  Layers,
  Plus,
  Search,
} from 'lucide-react';
import { isApiError } from '@/shared/api/errors';

export const ProjectOrganizationPage: React.FC = () => {
  const { projectId, currentUserRole } = useProject();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'folders';

  // Permission helpers
  const permCtx = { systemRole: user?.systemRole, projectRole: currentUserRole, currentUserId: user?.id };
  const userCanManageFolders = canManageFolders(permCtx);
  const userCanManageCategories = canManageCategories(permCtx);
  const userCanCreateTag = canCreateTag(permCtx);
  const userCanManageTag = canManageTag(permCtx);

  // ==========================================
  // FOLDERS STATE & LOGIC
  // ==========================================
  const {
    data: folders,
    isLoading: isFoldersLoading,
    isError: isFoldersError,
    error: foldersError,
    refetch: refetchFolders,
  } = useQuery({
    queryKey: ['folders', projectId],
    queryFn: () => organizationApi.getFolders(projectId),
  });

  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderParentId, setNewFolderParentId] = useState<string>('');

  const [folderToEdit, setFolderToEdit] = useState<FolderResponse | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [editFolderParentId, setEditFolderParentId] = useState<string>('');

  const [folderToDelete, setFolderToDelete] = useState<FolderResponse | null>(null);
  const [folderError, setFolderError] = useState<string | null>(null);

  const createFolderMutation = useMutation({
    mutationFn: (data: { name: string; parentId?: string | null }) =>
      organizationApi.createFolder(projectId, data),
    onSuccess: (f) => {
      queryClient.invalidateQueries({ queryKey: ['folders', projectId] });
      setCreateFolderDialogOpen(false);
      setNewFolderName('');
      setNewFolderParentId('');
      addToast({ type: 'success', title: 'Đã tạo thư mục', message: `Thư mục "${f.name}" đã được tạo.` });
    },
    onError: (err: unknown) => {
      setFolderError(isApiError(err) ? err.message : 'Không thể tạo thư mục.');
    },
  });

  const updateFolderMutation = useMutation({
    mutationFn: ({ folderId, data }: { folderId: string; data: { name?: string; parentId?: string | null } }) =>
      organizationApi.updateFolder(projectId, folderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', projectId] });
      setFolderToEdit(null);
      addToast({ type: 'success', title: 'Cập nhật thành công', message: 'Thông tin thư mục đã được lưu.' });
    },
    onError: (err: unknown) => {
      setFolderError(isApiError(err) ? err.message : 'Không thể cập nhật thư mục.');
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (folderId: string) => organizationApi.deleteFolder(projectId, folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', projectId] });
      setFolderToDelete(null);
      addToast({ type: 'success', title: 'Đã xóa thư mục', message: 'Thư mục đã được xóa.' });
    },
    onError: (err: unknown) => {
      addToast({ type: 'error', title: 'Lỗi xóa thư mục', message: isApiError(err) ? err.message : 'Không thể xóa thư mục.' });
    },
  });

  // ==========================================
  // CATEGORIES STATE & LOGIC
  // ==========================================
  const {
    data: categories,
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
    error: categoriesError,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ['categories', projectId],
    queryFn: () => organizationApi.getCategories(projectId),
  });

  const [createCategoryDialogOpen, setCreateCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [categoryToEdit, setCategoryToEdit] = useState<CategoryResponse | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  const [categoryToDelete, setCategoryToDelete] = useState<CategoryResponse | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => organizationApi.createCategory(projectId, { name }),
    onSuccess: (cat) => {
      queryClient.invalidateQueries({ queryKey: ['categories', projectId] });
      setCreateCategoryDialogOpen(false);
      setNewCategoryName('');
      addToast({ type: 'success', title: 'Đã tạo danh mục', message: `Danh mục "${cat.name}" đã được tạo.` });
    },
    onError: (err: unknown) => {
      setCategoryError(isApiError(err) ? err.message : 'Không thể tạo danh mục.');
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ categoryId, name }: { categoryId: string; name: string }) =>
      organizationApi.updateCategory(projectId, categoryId, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', projectId] });
      setCategoryToEdit(null);
      addToast({ type: 'success', title: 'Đã đổi tên danh mục' });
    },
    onError: (err: unknown) => {
      setCategoryError(isApiError(err) ? err.message : 'Không thể đổi tên danh mục.');
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (categoryId: string) => organizationApi.deleteCategory(projectId, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', projectId] });
      setCategoryToDelete(null);
      addToast({ type: 'success', title: 'Đã xóa danh mục' });
    },
    onError: (err: unknown) => {
      addToast({ type: 'error', title: 'Lỗi xóa danh mục', message: isApiError(err) ? err.message : 'Không thể xóa danh mục.' });
    },
  });

  // ==========================================
  // TAGS STATE & LOGIC
  // ==========================================
  const [tagSearch, setTagSearch] = useState('');

  const {
    data: tags,
    isLoading: isTagsLoading,
    isError: isTagsError,
    error: tagsError,
    refetch: refetchTags,
  } = useQuery({
    queryKey: ['tags', projectId, tagSearch],
    queryFn: () => organizationApi.getTags(projectId, tagSearch || undefined),
  });

  const [createTagDialogOpen, setCreateTagDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const [tagToEdit, setTagToEdit] = useState<TagResponse | null>(null);
  const [editTagName, setEditTagName] = useState('');

  const [tagToDelete, setTagToDelete] = useState<TagResponse | null>(null);
  const [tagError, setTagError] = useState<string | null>(null);

  const createTagMutation = useMutation({
    mutationFn: (name: string) => organizationApi.createTag(projectId, { name }),
    onSuccess: (tag) => {
      queryClient.invalidateQueries({ queryKey: ['tags', projectId] });
      setCreateTagDialogOpen(false);
      setNewTagName('');
      addToast({ type: 'success', title: 'Đã tạo thẻ phân loại', message: `Thẻ "${tag.name}" đã sẵn sàng gán cho tài liệu.` });
    },
    onError: (err: unknown) => {
      setTagError(isApiError(err) ? err.message : 'Không thể tạo thẻ.');
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: ({ tagId, name }: { tagId: string; name: string }) =>
      organizationApi.updateTag(projectId, tagId, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', projectId] });
      setTagToEdit(null);
      addToast({ type: 'success', title: 'Đã cập nhật thẻ' });
    },
    onError: (err: unknown) => {
      setTagError(isApiError(err) ? err.message : 'Không thể cập nhật thẻ.');
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: (tagId: string) => organizationApi.deleteTag(projectId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', projectId] });
      setTagToDelete(null);
      addToast({ type: 'success', title: 'Đã xóa thẻ phân loại' });
    },
    onError: (err: unknown) => {
      addToast({ type: 'error', title: 'Lỗi xóa thẻ', message: isApiError(err) ? err.message : 'Không thể xóa thẻ.' });
    },
  });

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-lg font-bold text-ink tracking-tight">Tổ chức phân loại</h2>
        <p className="text-sm text-ink-muted mt-0.5">
          Quản lý cây thư mục, danh mục tài liệu và hệ thống thẻ từ khóa trong dự án.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(val) => setSearchParams({ tab: val })}
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="folders" className="flex items-center gap-2">
            <Folder className="w-4 h-4" />
            <span>Thư mục</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <span>Danh mục</span>
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center gap-2">
            <Tags className="w-4 h-4" />
            <span>Thẻ phân loại</span>
          </TabsTrigger>
        </TabsList>

        {/* ======================================================== */}
        {/* TAB 1: THƯ MỤC                                           */}
        {/* ======================================================== */}
        <TabsContent value="folders" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink-muted">
              Cây thư mục giúp phân nhóm các tài liệu theo dự án con hoặc chủ đề chuyên môn.
            </p>
            {userCanManageFolders && (
              <Button size="sm" onClick={() => { setFolderError(null); setCreateFolderDialogOpen(true); }}>
                <FolderPlus className="w-4 h-4 mr-1.5" />
                Tạo thư mục
              </Button>
            )}
          </div>

          <Card className="p-0 overflow-hidden">
            {isFoldersLoading && (
              <div className="p-6 space-y-3">
                <ContentSkeleton height={36} count={4} />
              </div>
            )}

            {isFoldersError && (
              <div className="p-6">
                <ErrorState
                  title="Không thể tải thư mục"
                  message={(foldersError as Error)?.message}
                  onRetry={() => refetchFolders()}
                />
              </div>
            )}

            {!isFoldersLoading && !isFoldersError && folders && (
              folders.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={<Folder className="w-8 h-8 text-ink-muted" />}
                    title="Chưa có thư mục nào"
                    description="Tạo thư mục đầu tiên để tổ chức và sắp xếp tài liệu một cách khoa học."
                    action={
                      userCanManageFolders && (
                        <Button size="sm" onClick={() => setCreateFolderDialogOpen(true)}>
                          <FolderPlus className="w-4 h-4 mr-1.5" />
                          Tạo thư mục đầu tiên
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
                        <th className="py-3 px-4 font-semibold">Tên thư mục</th>
                        <th className="py-3 px-4 font-semibold">Thư mục cha</th>
                        <th className="py-3 px-4 font-semibold">Ngày tạo</th>
                        <th className="py-3 px-4 text-right font-semibold">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {folders.map((folder) => {
                        const parent = folders.find((f) => f.id === folder.parentId);
                        return (
                          <tr key={folder.id} className="hover:bg-surface-subtle/30 transition-colors">
                            <td className="py-3.5 px-4 font-medium text-ink flex items-center gap-2">
                              <Folder className="w-4 h-4 text-accent shrink-0" />
                              <span>{folder.name}</span>
                            </td>
                            <td className="py-3.5 px-4 text-ink-muted text-xs">
                              {parent ? (
                                <span className="inline-flex items-center gap-1">
                                  <CornerDownRight className="w-3 h-3 text-border-control" />
                                  {parent.name}
                                </span>
                              ) : (
                                <span className="text-ink-subtle">Thư mục gốc (Root)</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-ink-muted text-xs">
                              {formatDate(folder.createdAt)}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {userCanManageFolders && (
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs h-7 px-2"
                                    onClick={() => {
                                      setFolderToEdit(folder);
                                      setEditFolderName(folder.name);
                                      setEditFolderParentId(folder.parentId || '');
                                      setFolderError(null);
                                    }}
                                  >
                                    <Edit2 className="w-3 h-3 mr-1" />
                                    Sửa
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs h-7 px-2 text-semantic-danger hover:bg-semantic-danger-bg"
                                    onClick={() => setFolderToDelete(folder)}
                                  >
                                    <Trash2 className="w-3 h-3 mr-1" />
                                    Xóa
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </Card>
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 2: DANH MỤC                                          */}
        {/* ======================================================== */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink-muted">
              Danh mục phân loại các tài liệu theo loại hình nội dung (ví dụ: Báo cáo, Quy chuẩn, Thiết kế).
            </p>
            {userCanManageCategories && (
              <Button size="sm" onClick={() => { setCategoryError(null); setCreateCategoryDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-1.5" />
                Thêm danh mục
              </Button>
            )}
          </div>

          <Card className="p-0 overflow-hidden">
            {isCategoriesLoading && (
              <div className="p-6 space-y-3">
                <ContentSkeleton height={36} count={3} />
              </div>
            )}

            {isCategoriesError && (
              <div className="p-6">
                <ErrorState
                  title="Không thể tải danh mục"
                  message={(categoriesError as Error)?.message}
                  onRetry={() => refetchCategories()}
                />
              </div>
            )}

            {!isCategoriesLoading && !isCategoriesError && categories && (
              categories.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={<Layers className="w-8 h-8 text-ink-muted" />}
                    title="Chưa có danh mục nào"
                    description="Tạo các danh mục tài liệu để việc tìm kiếm và lọc nội dung dễ dàng hơn."
                    action={
                      userCanManageCategories && (
                        <Button size="sm" onClick={() => setCreateCategoryDialogOpen(true)}>
                          <Plus className="w-4 h-4 mr-1.5" />
                          Tạo danh mục đầu tiên
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
                        <th className="py-3 px-4 font-semibold">Tên danh mục</th>
                        <th className="py-3 px-4 font-semibold">Ngày tạo</th>
                        <th className="py-3 px-4 text-right font-semibold">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {categories.map((cat) => (
                        <tr key={cat.id} className="hover:bg-surface-subtle/30 transition-colors">
                          <td className="py-3.5 px-4 font-medium text-ink flex items-center gap-2">
                            <Layers className="w-4 h-4 text-ink-muted shrink-0" />
                            <span>{cat.name}</span>
                          </td>
                          <td className="py-3.5 px-4 text-ink-muted text-xs">
                            {formatDate(cat.createdAt)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {userCanManageCategories && (
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs h-7 px-2"
                                  onClick={() => {
                                    setCategoryToEdit(cat);
                                    setEditCategoryName(cat.name);
                                    setCategoryError(null);
                                  }}
                                >
                                  <Edit2 className="w-3 h-3 mr-1" />
                                  Đổi tên
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs h-7 px-2 text-semantic-danger hover:bg-semantic-danger-bg"
                                  onClick={() => setCategoryToDelete(cat)}
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Xóa
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </Card>
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 3: THẺ TỪ KHÓA (TAGS)                                */}
        {/* ======================================================== */}
        <TabsContent value="tags" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
              <input
                type="text"
                placeholder="Tìm kiếm thẻ..."
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-white rounded-input border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              />
            </div>

            {userCanCreateTag && (
              <Button size="sm" onClick={() => { setTagError(null); setCreateTagDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-1.5" />
                Tạo thẻ mới
              </Button>
            )}
          </div>

          <Card className="p-6">
            {isTagsLoading && (
              <div className="flex flex-wrap gap-2">
                <ContentSkeleton height={32} width={80} count={6} inline />
              </div>
            )}

            {isTagsError && (
              <ErrorState
                title="Không thể tải danh sách thẻ"
                message={(tagsError as Error)?.message}
                onRetry={() => refetchTags()}
              />
            )}

            {!isTagsLoading && !isTagsError && tags && (
              tags.length === 0 ? (
                <EmptyState
                  icon={<Tags className="w-8 h-8 text-ink-muted" />}
                  title="Chưa có thẻ nào"
                  description="Thành viên có thể tự do tạo các thẻ từ khóa để đánh dấu và tìm kiếm tài liệu nhanh chóng."
                  action={
                    userCanCreateTag && (
                      <Button size="sm" onClick={() => setCreateTagDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-1.5" />
                        Tạo thẻ đầu tiên
                      </Button>
                    )
                  }
                />
              ) : (
                <div className="flex flex-wrap gap-3">
                  {tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-card bg-surface-subtle border border-border text-sm text-ink group hover:border-ink/20 transition-all"
                    >
                      <span className="font-medium">#{tag.name}</span>
                      {userCanManageTag && (
                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => {
                              setTagToEdit(tag);
                              setEditTagName(tag.name);
                              setTagError(null);
                            }}
                            className="p-1 hover:text-accent rounded"
                            title="Sửa tên thẻ"
                            aria-label="Sửa tên thẻ"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setTagToDelete(tag)}
                            className="p-1 hover:text-semantic-danger rounded"
                            title="Xóa thẻ"
                            aria-label="Xóa thẻ"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* ======================================================== */}
      {/* DIALOGS CHO THƯ MỤC                                      */}
      {/* ======================================================== */}
      {/* Create Folder */}
      <Dialog open={createFolderDialogOpen} onOpenChange={setCreateFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo thư mục mới</DialogTitle>
            <DialogDescription>Nhập tên thư mục và chọn vị trí thư mục cha nếu cần.</DialogDescription>
          </DialogHeader>
          {folderError && <p className="text-xs text-semantic-danger font-medium">{folderError}</p>}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newFolderName.trim()) return;
              createFolderMutation.mutate({
                name: newFolderName.trim(),
                parentId: newFolderParentId || null,
              });
            }}
            className="space-y-4"
          >
            <Input
              label="Tên thư mục"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="VD: Báo cáo quý 1"
              required
              autoFocus
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink">Thư mục cha</label>
              <select
                value={newFolderParentId}
                onChange={(e) => setNewFolderParentId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white rounded-input border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                <option value="">Thư mục gốc (Root)</option>
                {folders?.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateFolderDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" isLoading={createFolderMutation.isPending}>
                Tạo thư mục
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Folder */}
      <Dialog open={!!folderToEdit} onOpenChange={(open) => !open && setFolderToEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa thông tin thư mục</DialogTitle>
            <DialogDescription>Đổi tên hoặc di chuyển thư mục sang vị trí khác.</DialogDescription>
          </DialogHeader>
          {folderError && <p className="text-xs text-semantic-danger font-medium">{folderError}</p>}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!folderToEdit || !editFolderName.trim()) return;
              updateFolderMutation.mutate({
                folderId: folderToEdit.id,
                data: {
                  name: editFolderName.trim(),
                  // If empty string selected, explicitly pass null to move to root!
                  parentId: editFolderParentId ? editFolderParentId : null,
                },
              });
            }}
            className="space-y-4"
          >
            <Input
              label="Tên thư mục"
              value={editFolderName}
              onChange={(e) => setEditFolderName(e.target.value)}
              required
              autoFocus
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink">Thư mục cha</label>
              <select
                value={editFolderParentId}
                onChange={(e) => setEditFolderParentId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white rounded-input border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                <option value="">Thư mục gốc (Root - không có cha)</option>
                {folders
                  ?.filter((f) => f.id !== folderToEdit?.id)
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFolderToEdit(null)}>
                Hủy
              </Button>
              <Button type="submit" isLoading={updateFolderMutation.isPending}>
                Lưu thay đổi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Folder Confirmation */}
      <ConfirmDangerDialog
        open={!!folderToDelete}
        onOpenChange={(open) => !open && setFolderToDelete(null)}
        title="Xóa thư mục"
        description={`Bạn có chắc muốn xóa thư mục "${folderToDelete?.name}"? Lưu ý rằng thư mục phải rỗng (không chứa thư mục con hoặc tài liệu) mới có thể xóa được.`}
        confirmText="Xóa thư mục"
        isConfirming={deleteFolderMutation.isPending}
        onConfirm={() => {
          if (folderToDelete) deleteFolderMutation.mutate(folderToDelete.id);
        }}
      />

      {/* ======================================================== */}
      {/* DIALOGS CHO DANH MỤC                                     */}
      {/* ======================================================== */}
      <Dialog open={createCategoryDialogOpen} onOpenChange={setCreateCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo danh mục mới</DialogTitle>
            <DialogDescription>Nhập tên danh mục để phân loại tài liệu.</DialogDescription>
          </DialogHeader>
          {categoryError && <p className="text-xs text-semantic-danger font-medium">{categoryError}</p>}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newCategoryName.trim()) return;
              createCategoryMutation.mutate(newCategoryName.trim());
            }}
            className="space-y-4"
          >
            <Input
              label="Tên danh mục"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="VD: Hợp đồng, Quy chế..."
              required
              autoFocus
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateCategoryDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" isLoading={createCategoryMutation.isPending}>
                Tạo danh mục
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!categoryToEdit} onOpenChange={(open) => !open && setCategoryToEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đổi tên danh mục</DialogTitle>
            <DialogDescription>Cập nhật tên hiển thị cho danh mục này.</DialogDescription>
          </DialogHeader>
          {categoryError && <p className="text-xs text-semantic-danger font-medium">{categoryError}</p>}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!categoryToEdit || !editCategoryName.trim()) return;
              updateCategoryMutation.mutate({ categoryId: categoryToEdit.id, name: editCategoryName.trim() });
            }}
            className="space-y-4"
          >
            <Input
              label="Tên danh mục"
              value={editCategoryName}
              onChange={(e) => setEditCategoryName(e.target.value)}
              required
              autoFocus
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCategoryToEdit(null)}>
                Hủy
              </Button>
              <Button type="submit" isLoading={updateCategoryMutation.isPending}>
                Lưu thay đổi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDangerDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
        title="Xóa danh mục"
        description={`Bạn có chắc muốn xóa danh mục "${categoryToDelete?.name}"? Danh mục không thể xóa nếu đang được gán cho bất kỳ tài liệu nào.`}
        confirmText="Xóa danh mục"
        isConfirming={deleteCategoryMutation.isPending}
        onConfirm={() => {
          if (categoryToDelete) deleteCategoryMutation.mutate(categoryToDelete.id);
        }}
      />

      {/* ======================================================== */}
      {/* DIALOGS CHO THẺ TỪ KHÓA (TAGS)                           */}
      {/* ======================================================== */}
      <Dialog open={createTagDialogOpen} onOpenChange={setCreateTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo thẻ từ khóa mới</DialogTitle>
            <DialogDescription>Thẻ từ khóa giúp gắn nhãn và tìm kiếm tài liệu linh hoạt.</DialogDescription>
          </DialogHeader>
          {tagError && <p className="text-xs text-semantic-danger font-medium">{tagError}</p>}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newTagName.trim()) return;
              createTagMutation.mutate(newTagName.trim());
            }}
            className="space-y-4"
          >
            <Input
              label="Tên thẻ"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="VD: quy-trinh-2026, huong-dan..."
              required
              autoFocus
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateTagDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" isLoading={createTagMutation.isPending}>
                Tạo thẻ
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!tagToEdit} onOpenChange={(open) => !open && setTagToEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đổi tên thẻ</DialogTitle>
            <DialogDescription>Cập nhật tên từ khóa cho thẻ phân loại.</DialogDescription>
          </DialogHeader>
          {tagError && <p className="text-xs text-semantic-danger font-medium">{tagError}</p>}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!tagToEdit || !editTagName.trim()) return;
              updateTagMutation.mutate({ tagId: tagToEdit.id, name: editTagName.trim() });
            }}
            className="space-y-4"
          >
            <Input
              label="Tên thẻ"
              value={editTagName}
              onChange={(e) => setEditTagName(e.target.value)}
              required
              autoFocus
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTagToEdit(null)}>
                Hủy
              </Button>
              <Button type="submit" isLoading={updateTagMutation.isPending}>
                Lưu thay đổi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDangerDialog
        open={!!tagToDelete}
        onOpenChange={(open) => !open && setTagToDelete(null)}
        title="Xóa thẻ phân loại"
        description={`Bạn có chắc muốn xóa thẻ "#${tagToDelete?.name}"? Thẻ này sẽ được gỡ khỏi tất cả các tài liệu đang sử dụng.`}
        confirmText="Xóa thẻ"
        isConfirming={deleteTagMutation.isPending}
        onConfirm={() => {
          if (tagToDelete) deleteTagMutation.mutate(tagToDelete.id);
        }}
      />
    </div>
  );
};
