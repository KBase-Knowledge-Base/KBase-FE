import React, { createContext, useContext } from 'react';
import { useParams, Outlet, NavLink, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '@/features/projects/api/projects';
import { ProjectResponse, ProjectRole } from '@/shared/api/types';
import { useAuth } from '@/features/auth/context/auth-context';
import { canManageProject } from '@/shared/lib/permissions';
import {
  FolderKanban,
  FileText,
  Users,
  Mail,
  Tags,
  Bot,
  Settings,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { ContentSkeleton } from '@/shared/ui/skeleton';
import { ErrorState } from '@/shared/ui/error-state';
import { cn } from '@/shared/lib/utils';

export interface ProjectContextType {
  project: ProjectResponse;
  projectId: string;
  currentUserRole: ProjectRole | null;
  isOwner: boolean;
  canManage: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectLayout');
  }
  return context;
}

export const ProjectLayout: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();

  const {
    data: project,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => projectsApi.getProject(projectId!),
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <ContentSkeleton height={32} width={280} />
        <ContentSkeleton height={48} />
        <ContentSkeleton height={300} />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <ErrorState
        title="Không thể tải thông tin dự án"
        message={(error as Error)?.message || 'Dự án không tồn tại hoặc bạn không có quyền truy cập.'}
        onRetry={() => refetch()}
      />
    );
  }

  const currentUserRole = project.currentUserRole;
  const isOwner = currentUserRole === 'OWNER';
  const isAdminOverride = currentUserRole === null && user?.systemRole === 'ADMIN';
  const canManage = canManageProject({
    systemRole: user?.systemRole,
    projectRole: currentUserRole,
    currentUserId: user?.id,
  });

  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-2 py-3 px-3.5 border-b-2 text-sm font-medium transition-colors whitespace-nowrap',
      isActive
        ? 'border-ink text-ink font-semibold'
        : 'border-transparent text-ink-muted hover:text-ink hover:border-border'
    );

  const contextValue: ProjectContextType = {
    project,
    projectId: projectId!,
    currentUserRole,
    isOwner,
    canManage,
  };

  return (
    <ProjectContext.Provider value={contextValue}>
      <div className="space-y-6">
        {/* Breadcrumb & Header */}
        <div>
          <nav className="flex items-center gap-2 text-xs text-ink-muted mb-2">
            <Link to="/app/projects" className="hover:text-ink hover:underline">
              Dự án
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-border-control" />
            <span className="text-ink font-medium truncate max-w-xs">{project.name}</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-card neu-flat flex items-center justify-center text-ink shrink-0 font-bold">
                {project.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
                  {project.name}
                </h1>
                {project.description && (
                  <p className="text-sm text-ink-muted mt-0.5 max-w-2xl line-clamp-1">
                    {project.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isOwner && <Badge variant="accent">Chủ sở hữu (Owner)</Badge>}
              {currentUserRole === 'MEMBER' && <Badge variant="neutral">Thành viên (Member)</Badge>}
              {isAdminOverride && (
                <Badge variant="warning" className="flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  Quản trị viên (Admin Override)
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Subnavigation Tabs */}
        <div className="border-b border-border overflow-x-auto">
          <nav className="flex space-x-1" aria-label="Project Subnavigation">
            <NavLink to={`/app/projects/${projectId}`} end className={navClass}>
              <FolderKanban className="w-4 h-4" />
              <span>Tổng quan</span>
            </NavLink>

            <NavLink to={`/app/projects/${projectId}/documents`} className={navClass}>
              <FileText className="w-4 h-4" />
              <span>Tài liệu</span>
            </NavLink>

            <NavLink to={`/app/projects/${projectId}/members`} className={navClass}>
              <Users className="w-4 h-4" />
              <span>Thành viên</span>
            </NavLink>

            {canManage && (
              <NavLink to={`/app/projects/${projectId}/invitations`} className={navClass}>
                <Mail className="w-4 h-4" />
                <span>Lời mời</span>
              </NavLink>
            )}

            <NavLink to={`/app/projects/${projectId}/organization`} className={navClass}>
              <Tags className="w-4 h-4" />
              <span>Phân loại</span>
            </NavLink>

            <NavLink to={`/app/projects/${projectId}/assistant`} className={navClass}>
              <Bot className="w-4 h-4 text-accent" />
              <span className="text-accent font-medium">Trợ lý AI</span>
            </NavLink>

            {canManage && (
              <NavLink to={`/app/projects/${projectId}/settings`} className={navClass}>
                <Settings className="w-4 h-4" />
                <span>Cài đặt</span>
              </NavLink>
            )}
          </nav>
        </div>

        {/* Subroute Content */}
        <div className="pt-2">
          <Outlet />
        </div>
      </div>
    </ProjectContext.Provider>
  );
};
