/**
 * Group Creation Context
 * Share state giữa NewGroup và AddGroup modals
 * Theo coding guidelines: Context pattern cho shared state
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// ===========================
// TYPES
// ===========================

export interface IGroupCreationData {
  name: string;
  description: string;
  groupType: 'public' | 'private';
  avatarFile: File | null;
  avatarPreview: string | null;
  selectedMemberIds: string[];
  isSendMessageAllowed: boolean; // NEW: Allow everyone to send messages
}

export interface IGroupCreationContext {
  // Data
  groupData: IGroupCreationData;

  // Actions
  setGroupName: (name: string) => void;
  setGroupDescription: (description: string) => void;
  setGroupType: (type: 'public' | 'private') => void;
  setAvatarFile: (file: File | null) => void;
  setAvatarPreview: (preview: string | null) => void;
  setSelectedMemberIds: (ids: string[]) => void;
  toggleMember: (id: string) => void;
  setIsSendMessageAllowed: (allowed: boolean) => void; // NEW
  resetGroupData: () => void;
}

// ===========================
// CONTEXT
// ===========================

const GroupCreationContext = createContext<IGroupCreationContext | undefined>(undefined);

// ===========================
// INITIAL STATE
// ===========================

const initialGroupData: IGroupCreationData = {
  name: '',
  description: '',
  groupType: 'private',
  avatarFile: null,
  avatarPreview: null,
  selectedMemberIds: [],
  isSendMessageAllowed: true, // Default: allow all members to send messages
};

// ===========================
// PROVIDER
// ===========================

export const GroupCreationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [groupData, setGroupData] = useState<IGroupCreationData>(initialGroupData);

  // Actions
  const setGroupName = useCallback((name: string) => {
    setGroupData((prev) => ({ ...prev, name }));
  }, []);

  const setGroupDescription = useCallback((description: string) => {
    setGroupData((prev) => ({ ...prev, description }));
  }, []);

  const setGroupType = useCallback((type: 'public' | 'private') => {
    setGroupData((prev) => ({ ...prev, groupType: type }));
  }, []);

  const setAvatarFile = useCallback((file: File | null) => {
    setGroupData((prev) => ({ ...prev, avatarFile: file }));
  }, []);

  const setAvatarPreview = useCallback((preview: string | null) => {
    setGroupData((prev) => ({ ...prev, avatarPreview: preview }));
  }, []);

  const setSelectedMemberIds = useCallback((ids: string[]) => {
    setGroupData((prev) => ({ ...prev, selectedMemberIds: ids }));
  }, []);

  const toggleMember = useCallback((id: string) => {
    setGroupData((prev) => {
      const isSelected = prev.selectedMemberIds.includes(id);
      return {
        ...prev,
        selectedMemberIds: isSelected
          ? prev.selectedMemberIds.filter((memberId) => memberId !== id)
          : [...prev.selectedMemberIds, id],
      };
    });
  }, []);

  const setIsSendMessageAllowed = useCallback((allowed: boolean) => {
    setGroupData((prev) => ({ ...prev, isSendMessageAllowed: allowed }));
  }, []);

  const resetGroupData = useCallback(() => {
    setGroupData(initialGroupData);
  }, []);

  const contextValue: IGroupCreationContext = {
    groupData,
    setGroupName,
    setGroupDescription,
    setGroupType,
    setAvatarFile,
    setAvatarPreview,
    setSelectedMemberIds,
    toggleMember,
    setIsSendMessageAllowed,
    resetGroupData,
  };

  return (
    <GroupCreationContext.Provider value={contextValue}>
      {children}
    </GroupCreationContext.Provider>
  );
};

// ===========================
// HOOK
// ===========================

export const useGroupCreation = (): IGroupCreationContext => {
  const context = useContext(GroupCreationContext);
  if (!context) {
    throw new Error('useGroupCreation must be used within GroupCreationProvider');
  }
  return context;
};

export default GroupCreationContext;

