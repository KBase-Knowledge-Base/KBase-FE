import { describe, it, expect } from 'vitest';
import {
  canManageProject,
  canInviteMembers,
  canRemoveMember,
  canLeaveProject,
  canManageFolders,
  canManageCategories,
  canCreateTag,
  canManageTag,
  canUploadDocuments,
  canModifyDocument,
  canRetryAiIndex,
  isSystemAdmin,
} from './permissions';

describe('Permission Matrix and System Admin Override', () => {
  describe('Project OWNER', () => {
    const ownerCtx = { projectRole: 'OWNER' as const, systemRole: 'USER' as const, currentUserId: 'usr-1' };

    it('has full management and modification permissions on the project', () => {
      expect(canManageProject(ownerCtx)).toBe(true);
      expect(canInviteMembers(ownerCtx)).toBe(true);
      expect(canManageFolders(ownerCtx)).toBe(true);
      expect(canManageCategories(ownerCtx)).toBe(true);
      expect(canCreateTag(ownerCtx)).toBe(true);
      expect(canManageTag(ownerCtx)).toBe(true);
      expect(canUploadDocuments(ownerCtx)).toBe(true);
      expect(canModifyDocument(ownerCtx, 'any-uploader-id')).toBe(true);
      expect(canRetryAiIndex(ownerCtx, 'any-uploader-id')).toBe(true);
    });

    it('can remove other members but cannot remove another OWNER', () => {
      expect(canRemoveMember(ownerCtx, 'MEMBER')).toBe(true);
      expect(canRemoveMember(ownerCtx, 'OWNER')).toBe(false);
    });

    it('cannot leave project (OWNER cannot leave)', () => {
      expect(canLeaveProject(ownerCtx)).toBe(false);
    });
  });

  describe('Project MEMBER', () => {
    const memberCtx = { projectRole: 'MEMBER' as const, systemRole: 'USER' as const, currentUserId: 'usr-2' };

    it('can upload documents and create tags, and can leave project', () => {
      expect(canUploadDocuments(memberCtx)).toBe(true);
      expect(canCreateTag(memberCtx)).toBe(true);
      expect(canLeaveProject(memberCtx)).toBe(true);
    });

    it('does NOT have project settings, invitations, folder, category, or tag management permissions', () => {
      expect(canManageProject(memberCtx)).toBe(false);
      expect(canInviteMembers(memberCtx)).toBe(false);
      expect(canRemoveMember(memberCtx, 'MEMBER')).toBe(false);
      expect(canManageFolders(memberCtx)).toBe(false);
      expect(canManageCategories(memberCtx)).toBe(false);
      expect(canManageTag(memberCtx)).toBe(false);
    });

    it('can only modify or retry documents they uploaded themselves', () => {
      expect(canModifyDocument(memberCtx, 'usr-2')).toBe(true);
      expect(canModifyDocument(memberCtx, 'usr-other')).toBe(false);
      expect(canRetryAiIndex(memberCtx, 'usr-2')).toBe(true);
      expect(canRetryAiIndex(memberCtx, 'usr-other')).toBe(false);
    });
  });

  describe('System ADMIN Override', () => {
    const adminCtx = { projectRole: null, systemRole: 'ADMIN' as const, currentUserId: 'admin-id' };

    it('grants view and management permissions even when not a project member', () => {
      expect(isSystemAdmin(adminCtx.systemRole)).toBe(true);
      expect(canManageProject(adminCtx)).toBe(true);
      expect(canInviteMembers(adminCtx)).toBe(true);
      expect(canManageFolders(adminCtx)).toBe(true);
      expect(canManageCategories(adminCtx)).toBe(true);
      expect(canCreateTag(adminCtx)).toBe(true);
      expect(canManageTag(adminCtx)).toBe(true);
      expect(canUploadDocuments(adminCtx)).toBe(true);
      expect(canModifyDocument(adminCtx, 'any-user')).toBe(true);
      expect(canRetryAiIndex(adminCtx, 'any-user')).toBe(true);
    });

    it('can remove non-owner members, but cannot leave if not a MEMBER', () => {
      expect(canRemoveMember(adminCtx, 'MEMBER')).toBe(true);
      expect(canRemoveMember(adminCtx, 'OWNER')).toBe(false);
      expect(canLeaveProject(adminCtx)).toBe(false);
    });
  });
});
