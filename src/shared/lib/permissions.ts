import { ProjectRole, SystemRole } from '@/shared/api/types';

export interface PermissionContext {
  systemRole?: SystemRole | null;
  projectRole?: ProjectRole | null;
  currentUserId?: string | null;
}

/**
 * Checks if the user is a system admin.
 */
export function isSystemAdmin(systemRole?: SystemRole | null): boolean {
  return systemRole === 'ADMIN';
}

/**
 * Checks if the user can manage project settings (edit name/description, delete project).
 * Allowed: OWNER or system ADMIN.
 */
export function canManageProject(ctx: PermissionContext): boolean {
  if (isSystemAdmin(ctx.systemRole)) return true;
  return ctx.projectRole === 'OWNER';
}

/**
 * Checks if the user can invite new members to the project.
 * Allowed: OWNER or system ADMIN.
 */
export function canInviteMembers(ctx: PermissionContext): boolean {
  if (isSystemAdmin(ctx.systemRole)) return true;
  return ctx.projectRole === 'OWNER';
}

/**
 * Checks if the user can remove a member from the project.
 * Allowed: OWNER or system ADMIN (cannot remove OWNER).
 */
export function canRemoveMember(ctx: PermissionContext, targetRole: ProjectRole): boolean {
  if (targetRole === 'OWNER') return false;
  if (isSystemAdmin(ctx.systemRole)) return true;
  return ctx.projectRole === 'OWNER';
}

/**
 * Checks if the user can leave the project.
 * Allowed: MEMBER only. OWNER cannot leave project.
 */
export function canLeaveProject(ctx: PermissionContext): boolean {
  return ctx.projectRole === 'MEMBER';
}

/**
 * Checks if the user can manage folders (create, rename, move, delete).
 * Allowed: OWNER or system ADMIN.
 */
export function canManageFolders(ctx: PermissionContext): boolean {
  if (isSystemAdmin(ctx.systemRole)) return true;
  return ctx.projectRole === 'OWNER';
}

/**
 * Checks if the user can manage categories (create, rename, delete).
 * Allowed: OWNER or system ADMIN.
 */
export function canManageCategories(ctx: PermissionContext): boolean {
  if (isSystemAdmin(ctx.systemRole)) return true;
  return ctx.projectRole === 'OWNER';
}

/**
 * Checks if the user can create a tag in the project.
 * Allowed: MEMBER, OWNER, or system ADMIN.
 */
export function canCreateTag(ctx: PermissionContext): boolean {
  if (isSystemAdmin(ctx.systemRole)) return true;
  return ctx.projectRole === 'OWNER' || ctx.projectRole === 'MEMBER';
}

/**
 * Checks if the user can rename or delete a tag.
 * Allowed: OWNER or system ADMIN.
 */
export function canManageTag(ctx: PermissionContext): boolean {
  if (isSystemAdmin(ctx.systemRole)) return true;
  return ctx.projectRole === 'OWNER';
}

/**
 * Checks if the user can upload documents into the project.
 * Allowed: MEMBER, OWNER, or system ADMIN.
 */
export function canUploadDocuments(ctx: PermissionContext): boolean {
  if (isSystemAdmin(ctx.systemRole)) return true;
  return ctx.projectRole === 'OWNER' || ctx.projectRole === 'MEMBER';
}

/**
 * Checks if the user can edit or delete a document.
 * Allowed: Document uploader (MEMBER) OR project OWNER OR system ADMIN.
 */
export function canModifyDocument(ctx: PermissionContext, uploaderId?: string | null): boolean {
  if (isSystemAdmin(ctx.systemRole)) return true;
  if (ctx.projectRole === 'OWNER') return true;
  if (ctx.projectRole === 'MEMBER' && ctx.currentUserId && uploaderId === ctx.currentUserId) {
    return true;
  }
  return false;
}

/**
 * Checks if the user can retry AI indexing for a document.
 * Allowed: Same as modify document (uploader, OWNER, or system ADMIN).
 */
export function canRetryAiIndex(ctx: PermissionContext, uploaderId?: string | null): boolean {
  return canModifyDocument(ctx, uploaderId);
}
