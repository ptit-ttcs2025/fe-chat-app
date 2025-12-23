/**
 * Custom Hook for Group Management
 * Quản lý CRUD operations cho groups và members
 * (Không bao gồm messages - dùng useChatMessages cho messages)
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupApi } from '@/apis/group/group.api';
import type {
  IGroup,
  IGroupMember,
  CreateGroupRequest,
  UpdateGroupRequest,
  AddMembersRequest,
  GroupMemberFilter,
} from '@/apis/group/group.type';

interface UseGroupManagementOptions {
  groupId: string | null;
  autoFetchMembers?: boolean;  // Tự động fetch members khi có groupId
}

export const useGroupManagement = ({
  groupId,
  autoFetchMembers = true,
}: UseGroupManagementOptions) => {
  const queryClient = useQueryClient();
  const [members, setMembers] = useState<IGroupMember[]>([]);

  // Query key
  const groupQueryKey = ['group', groupId];
  const membersQueryKey = ['group', groupId, 'members'];

  // ===========================
  // QUERIES
  // ===========================

  // Fetch group info
  const {
    data: groupData,
    isLoading: isLoadingGroup,
    error: groupError,
    refetch: refetchGroup,
  } = useQuery({
    queryKey: groupQueryKey,
    queryFn: async () => {
      if (!groupId) throw new Error('No group ID provided');
      const response = await groupApi.getGroup(groupId);
      return response.data;
    },
    enabled: !!groupId,
    staleTime: 30000, // 30 seconds
  });

  // Fetch members list
  const {
    data: membersData,
    isLoading: isLoadingMembers,
    error: membersError,
    refetch: refetchMembers,
  } = useQuery({
    queryKey: membersQueryKey,
    queryFn: async () => {
      if (!groupId) throw new Error('No group ID provided');
      const response = await groupApi.getMembers(groupId, { page: 0, size: 100 });
      return response;
    },
    enabled: !!groupId && autoFetchMembers,
    staleTime: 30000,
  });

  // Update local members state khi data thay đổi
  useEffect(() => {
    if (membersData?.results) {
      setMembers(membersData.results);
    }
  }, [membersData]);

  // ===========================
  // MUTATIONS
  // ===========================

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: (data: CreateGroupRequest) => groupApi.createGroup(data),
    onSuccess: (response) => {
      // Invalidate conversations list
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
      
      // Add to query cache
      if (response.data) {
        queryClient.setQueryData(['group', response.data.id], response.data);
      }
    },
    onError: (error) => {
      console.error('❌ Failed to create group:', error);
    },
  });

  // Update group mutation
  const updateGroupMutation = useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: UpdateGroupRequest }) =>
      groupApi.updateGroup(groupId, data),
    onSuccess: (response) => {
      // Update query cache
      if (response.data && groupId) {
        queryClient.setQueryData(groupQueryKey, response.data);
      }
      
      // Invalidate conversations to update group info in list
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    },
    onError: (error) => {
      console.error('❌ Failed to update group:', error);
    },
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: (groupId: string) => groupApi.deleteGroup(groupId),
    onSuccess: () => {
      // Remove from query cache
      queryClient.removeQueries({ queryKey: groupQueryKey });
      
      // Invalidate conversations list
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    },
    onError: (error) => {
      console.error('❌ Failed to delete group:', error);
    },
  });

  // Add members mutation
  const addMembersMutation = useMutation({
    mutationFn: ({ groupId, memberIds }: { groupId: string; memberIds: string[] }) =>
      groupApi.addMembers(groupId, { memberIds }),
    onSuccess: () => {
      // Refresh members list
      queryClient.invalidateQueries({ queryKey: membersQueryKey });
      refetchMembers();
    },
    onError: (error) => {
      console.error('❌ Failed to add members:', error);
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: ({ groupId, memberId }: { groupId: string; memberId: string }) =>
      groupApi.removeMember(groupId, memberId),
    onSuccess: (_, variables) => {
      // Optimistic update - remove from local state
      setMembers((prev) => prev.filter((m) => m.userId !== variables.memberId));
      
      // Refresh members list
      queryClient.invalidateQueries({ queryKey: membersQueryKey });
    },
    onError: (error) => {
      console.error('❌ Failed to remove member:', error);
      // Revert optimistic update on error
      refetchMembers();
    },
  });

  // ===========================
  // HELPER FUNCTIONS
  // ===========================

  const createGroup = useCallback(
    async (data: CreateGroupRequest) => {
      return createGroupMutation.mutateAsync(data);
    },
    [createGroupMutation]
  );

  const updateGroup = useCallback(
    async (data: UpdateGroupRequest) => {
      if (!groupId) {
        throw new Error('No group ID provided');
      }
      return updateGroupMutation.mutateAsync({ groupId, data });
    },
    [groupId, updateGroupMutation]
  );

  const deleteGroup = useCallback(
    async (groupIdToDelete?: string) => {
      const targetGroupId = groupIdToDelete || groupId;
      if (!targetGroupId) {
        throw new Error('No group ID provided');
      }
      return deleteGroupMutation.mutateAsync(targetGroupId);
    },
    [groupId, deleteGroupMutation]
  );

  const addMembers = useCallback(
    async (memberIds: string[]) => {
      if (!groupId) {
        throw new Error('No group ID provided');
      }
      return addMembersMutation.mutateAsync({ groupId, memberIds });
    },
    [groupId, addMembersMutation]
  );

  const removeMember = useCallback(
    async (memberId: string) => {
      if (!groupId) {
        throw new Error('No group ID provided');
      }
      return removeMemberMutation.mutateAsync({ groupId, memberId });
    },
    [groupId, removeMemberMutation]
  );

  const searchMembers = useCallback(
    async (filter: GroupMemberFilter) => {
      if (!groupId) {
        throw new Error('No group ID provided');
      }
      const response = await groupApi.getMembers(groupId, filter);
      return response.results;
    },
    [groupId]
  );

  // Helper: Check if current user is admin
  const isAdmin = useCallback(
    (userId: string) => {
      return groupData?.adminId === userId;
    },
    [groupData]
  );

  // Helper: Get member by userId
  const getMemberByUserId = useCallback(
    (userId: string) => {
      return members.find((m) => m.userId === userId);
    },
    [members]
  );

  // Helper: Get online members count
  const getOnlineMembersCount = useCallback(() => {
    return members.filter((m) => m.isOnline).length;
  }, [members]);

  return {
    // Data
    group: groupData,
    members,
    isLoading: isLoadingGroup,
    isLoadingMembers,
    error: groupError || membersError,

    // Actions
    createGroup,
    updateGroup,
    deleteGroup,
    addMembers,
    removeMember,
    searchMembers,
    refetchGroup,
    refetchMembers,

    // Helpers
    isAdmin,
    getMemberByUserId,
    getOnlineMembersCount,

    // Mutation states
    isCreating: createGroupMutation.isPending,
    isUpdating: updateGroupMutation.isPending,
    isDeleting: deleteGroupMutation.isPending,
    isAddingMembers: addMembersMutation.isPending,
    isRemovingMember: removeMemberMutation.isPending,
  };
};

