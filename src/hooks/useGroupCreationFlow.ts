/**
 * Hook for creating new group with full validation and error handling
 * Implements complete group creation flow with avatar upload
 */
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { groupApi } from '@/apis/group/group.api';
import { userApis } from '@/apis/user/user.api';
import { useGroupCreation as useGroupContext } from '@/contexts/GroupCreationContext';
import websocketService from '@/core/services/websocket.service';
import type { CreateGroupRequest } from '@/apis/group/group.type';

interface ValidationErrors {
  name?: string;
  description?: string;
  avatar?: string;
  members?: string;
}

interface CreateGroupResult {
  success: boolean;
  groupId?: string;
  conversationId?: string;
  error?: string;
}

export const useGroupCreationFlow = () => {
  const queryClient = useQueryClient();
  const { groupData, resetGroupData } = useGroupContext();

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isCreating, setIsCreating] = useState(false);

  // Validate form data
  const validate = useCallback((): boolean => {
    const errors: ValidationErrors = {};

    // Name validation
    if (!groupData.name.trim()) {
      errors.name = "Tên nhóm không được để trống";
    } else if (groupData.name.trim().length < 3) {
      errors.name = "Tên nhóm phải có ít nhất 3 ký tự";
    } else if (groupData.name.trim().length > 50) {
      errors.name = "Tên nhóm không được quá 50 ký tự";
    }

    // Description validation
    if (groupData.description && groupData.description.length > 200) {
      errors.description = "Mô tả không được quá 200 ký tự";
    }

    // Avatar validation
    if (groupData.avatarFile) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (groupData.avatarFile.size > maxSize) {
        errors.avatar = "Ảnh không được lớn hơn 5MB";
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(groupData.avatarFile.type)) {
        errors.avatar = "Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP)";
      }
    }

    // Members validation
    if (groupData.selectedMemberIds.length === 0) {
      errors.members = "Vui lòng chọn ít nhất 1 thành viên";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [groupData]);

  // Create group with full flow
  const createGroup = useCallback(async (): Promise<CreateGroupResult> => {
    try {
      setIsCreating(true);
      setValidationErrors({});

      console.log('🚀 Starting group creation flow...');

      // 1. Validate
      if (!validate()) {
        console.log('❌ Validation failed');
        return { success: false, error: 'Vui lòng kiểm tra lại thông tin' };
      }

      // 2. Upload avatar if exists
      let avatarUrl: string | undefined;
      if (groupData.avatarFile) {
        try {
          console.log('📤 Uploading avatar...', {
            name: groupData.avatarFile.name,
            size: groupData.avatarFile.size,
            type: groupData.avatarFile.type
          });

          // Upload to AVATARS folder (can be changed to GROUP_AVATARS if needed)
          const uploadResult = await userApis.uploadAvatar(groupData.avatarFile, 'AVATARS');
          avatarUrl = uploadResult.fileUrl; // userApis.uploadAvatar returns IUploadAvatarResponse with 'fileUrl' property

          console.log('✅ Avatar uploaded:', avatarUrl);
        } catch (uploadError: unknown) {
          console.error('❌ Avatar upload failed:', uploadError);
          const errorMsg = uploadError instanceof Error
            ? uploadError.message
            : 'Không thể tải lên ảnh đại diện. Vui lòng thử lại.';
          return {
            success: false,
            error: errorMsg
          };
        }
      }

      // 3. Prepare create group request
      const createRequest: CreateGroupRequest = {
        name: groupData.name.trim(),
        description: groupData.description.trim() || undefined,
        avatarUrl,
        isPublic: groupData.groupType === 'public',
        isSendMessageAllowed: groupData.isSendMessageAllowed,
        memberIds: groupData.selectedMemberIds
      };

      console.log('📝 Creating group with data:', createRequest);

      // 4. Create group via API
      const response = await groupApi.createGroup(createRequest);

      console.log('📦 API Response:', response);

      // ⭐ FIX: response is ApiResponse<IGroup>, so response.data is IGroup
      const groupDataResponse = response.data;

      if (!groupDataResponse) {
        throw new Error('No group data in response');
      }

      console.log('✅ Group created successfully:', groupDataResponse);

      // 5. Extract conversation ID (group API response includes conversationId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conversationId = (groupDataResponse as any).conversationId;

      // 6. Subscribe to WebSocket for real-time messages
      if (conversationId) {
        try {
          websocketService.subscribeNewConversation(conversationId);
          console.log('✅ Subscribed to WebSocket for conversation:', conversationId);
        } catch (wsError) {
          console.error('⚠️ WebSocket subscription failed (non-critical):', wsError);
        }
      }

      // 7. Invalidate conversations cache to refetch and show new group
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
      console.log('🔄 Invalidated conversations cache');

      // 8. Reset form data
      resetGroupData();
      console.log('🧹 Form data reset');

      return {
        success: true,
        groupId: groupDataResponse.id,
        conversationId
      };

    } catch (error: unknown) {
      console.error('❌ Failed to create group:', error);

      // Parse error message from API response
      let errorMessage = 'Có lỗi xảy ra khi tạo nhóm. Vui lòng thử lại.';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const apiError = error as { response?: { data?: { message?: string } }; message?: string };
        errorMessage = apiError.response?.data?.message || apiError.message || errorMessage;
      }

      return { success: false, error: errorMessage };

    } finally {
      setIsCreating(false);
    }
  }, [validate, queryClient, resetGroupData]);

  // Clear specific validation error
  const clearError = useCallback((field: keyof ValidationErrors) => {
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  return {
    createGroup,
    isCreating,
    validationErrors,
    validate,
    clearError
  };
};

