import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useProject } from '@/app/layouts/project-layout';
import { projectsApi } from '@/features/projects/api/projects';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Button } from '@/shared/ui/button';
import { ConfirmDangerDialog } from '@/shared/ui/confirm-danger-dialog';
import { useToast } from '@/shared/ui/toast';
import { AlertCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { isApiError } from '@/shared/api/errors';

const settingsSchema = z.object({
  name: z.string().min(2, 'Tên dự án phải có ít nhất 2 ký tự').max(100, 'Tên dự án quá dài'),
  description: z.string().max(1000, 'Mô tả quá dài').optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export const ProjectSettingsPage: React.FC = () => {
  const { project, projectId, canManage } = useProject();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [serverError, setServerError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    values: {
      name: project.name,
      description: project.description || '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: SettingsFormData) =>
      projectsApi.updateProject(projectId, {
        name: data.name,
        description: data.description || undefined,
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      reset({ name: updated.name, description: updated.description || '' });
      addToast({
        type: 'success',
        title: 'Cập nhật thành công',
        message: 'Thông tin dự án đã được lưu.',
      });
    },
    onError: (err: unknown) => {
      if (isApiError(err)) {
        setServerError(err.message);
      } else {
        setServerError('Không thể cập nhật dự án lúc này.');
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => projectsApi.deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      addToast({
        type: 'success',
        title: 'Đã xóa dự án',
        message: `Dự án "${project.name}" đã được xóa vĩnh viễn.`,
      });
      navigate('/app/projects');
    },
    onError: (err: unknown) => {
      addToast({
        type: 'error',
        title: 'Lỗi xóa dự án',
        message: isApiError(err) ? err.message : 'Không thể xóa dự án lúc này.',
      });
    },
  });

  const onSubmit = (data: SettingsFormData) => {
    setServerError(null);
    updateMutation.mutate(data);
  };

  if (!canManage) {
    return (
      <Card className="text-center py-8">
        <p className="text-sm text-ink-muted">
          Chỉ Chủ sở hữu (Owner) hoặc Quản trị viên hệ thống mới có quyền truy cập trang cài đặt dự án.
        </p>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl space-y-8 text-left">
      <div>
        <h2 className="text-lg font-bold text-ink tracking-tight">Cài đặt dự án</h2>
        <p className="text-sm text-ink-muted mt-0.5">
          Quản lý các cấu hình chung và khu vực nguy hiểm cho dự án này.
        </p>
      </div>

      {serverError && (
        <div
          role="alert"
          className="p-3.5 rounded-button bg-semantic-danger-bg border border-semantic-danger-border flex items-start gap-2.5 text-xs text-semantic-danger"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="font-semibold">{serverError}</p>
        </div>
      )}

      {/* General Information Card */}
      <Card className="space-y-4">
        <h3 className="text-base font-semibold text-ink border-b border-border-subtle pb-3">
          Thông tin chung
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Tên dự án"
            error={errors.name?.message}
            required
            {...register('name')}
          />

          <Textarea
            label="Mô tả dự án"
            rows={4}
            error={errors.description?.message}
            helperText="Mô tả ngắn gọn giúp các thành viên hiểu rõ mục tiêu và tài liệu trong dự án."
            {...register('description')}
          />

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={!isDirty || isSubmitting}
              isLoading={isSubmitting || updateMutation.isPending}
            >
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </Card>

      {/* Danger Zone Card */}
      <Card className="border-semantic-danger-border/60 bg-semantic-danger-bg/20 space-y-4">
        <div className="flex items-center gap-2.5 text-semantic-danger border-b border-semantic-danger-border/40 pb-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <h3 className="text-base font-semibold">Khu vực nguy hiểm</h3>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold text-ink">Xóa dự án này</h4>
            <p className="text-xs text-ink-muted mt-0.5 max-w-md">
              Hành động này sẽ xóa vĩnh viễn toàn bộ tài liệu, thư mục, thẻ, lịch sử trò chuyện AI và các lời mời liên quan. Không thể khôi phục sau khi xóa.
            </p>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            className="shrink-0"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Xóa dự án
          </Button>
        </div>
      </Card>

      {/* Delete Project Confirmation Dialog with Match Requirement */}
      <ConfirmDangerDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Xác nhận xóa vĩnh viễn dự án"
        description={`Bạn đang chuẩn bị xóa dự án "${project.name}". Toàn bộ tài liệu và dữ liệu tri thức trong dự án sẽ bị xóa vĩnh viễn khỏi hệ thống lưu trữ.`}
        confirmText="Xác nhận xóa dự án"
        confirmMatch={project.name}
        confirmMatchPlaceholder="Nhập chính xác tên dự án để xác nhận"
        isConfirming={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
};
