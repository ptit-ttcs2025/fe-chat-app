import http from '@/lib/apiBase';
import authStorage from '@/lib/authStorage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { IUploadAvatarResponse, IUserProfile } from './user.type';
import { IUpdateProfileRequest, IChangePasswordRequest } from './user.schema';

const URI = '/api/v1';

export const userUri = {
    profile: `${URI}/auth/profile`,
    updateProfile: (id: string) =>  `${URI}/users/${id}`,
    changePassword: `${URI}/auth/change-password`,
    uploadImage: `${URI}/files/upload`,
    deleteAccount: (id: string) => `${URI}/users/${id}`,
};

export const userApis = {
    /**
     * Lấy thông tin profile của user hiện tại
     */
    getProfile: async (): Promise<IUserProfile> => {
        const response = await http.get<IUserProfile>(userUri.profile);
        return response.data;
    },

    /**
     * Cập nhật thông tin profile
     */
    updateProfile: async (id: string, payload: IUpdateProfileRequest): Promise<IUserProfile> => {
        const response = await http.put<IUserProfile>(userUri.updateProfile(id), payload);
        return response.data;
    },

    /**
     * Đổi mật khẩu
     */
    changePassword: async (payload: IChangePasswordRequest): Promise<{ message: string }> => {
        const response = await http.post<{ message: string }>(userUri.changePassword, payload);
        return response.data;
    },

    /**
     * Upload avatar
     */
    uploadAvatar: async (file: File, folder: string = 'AVATARS'): Promise<IUploadAvatarResponse> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        // ✅ Không set Content-Type, để axios tự động set với boundary
        const response = await http.post<IUploadAvatarResponse>(userUri.uploadImage, formData, {
        });

        return response.data;
    },

    /**
     * Xóa tài khoản
     */
    deleteAccount: async (id: string): Promise<{ message: string }> => {
        const response = await http.delete<{ message: string }>(userUri.deleteAccount(id));
        return response.data;
    }   
};

// ==================== REACT QUERY HOOKS ====================

/**
 * Hook lấy thông tin profile của user hiện tại
 */
export const useGetProfile = () => {
    return useQuery<IUserProfile, AxiosError>({
        queryKey: ['user', 'profile'],
        queryFn: userApis.getProfile,
        enabled: !!authStorage.getAccessToken(),
        retry: false,
    });
};

/**
 * Hook cập nhật thông tin profile
 */
export const useUpdateProfile = () => {
    const queryClient = useQueryClient();

    return useMutation<
        IUserProfile, 
        AxiosError<{ message: string }>, 
        {id: string, data: IUpdateProfileRequest}
        >({
          mutationFn: ({id, data}) => userApis.updateProfile(id, data),
          onSuccess: (data) => {
            // Invalidate và refetch profile sau khi cập nhật thành công
            queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
            // Có thể cập nhật cache trực tiếp
            queryClient.setQueryData(['user', 'profile'], data);
          },
    });
};

/**
 * Hook đổi mật khẩu
 */
export const useChangePassword = () => {
    return useMutation<
        { message: string },
        AxiosError<{ message: string }>,
        IChangePasswordRequest
    >({
        mutationFn: (payload) => userApis.changePassword(payload),
    });
};

/**
 * Hook upload avatar
 */

export const useUploadAvatar = () => {
    return useMutation<
        IUploadAvatarResponse,
        AxiosError<{message: string}>,
        { file: File; folder?: string}
    >({
        mutationFn: ({ file ,folder }) => userApis.uploadAvatar(file, folder),
    });
}

/**
 * Hook xóa tài khoản
 */
export const useDeleteAccount = () => {
    const queryClient = useQueryClient();

    return useMutation<
        { message: string },
        AxiosError<{ message: string }>,
        string // userId
    >({
        mutationFn: (userId) => userApis.deleteAccount(userId),
        onSuccess: () => {
            // Xóa toàn bộ cache
            queryClient.clear();
            // Xóa token
            authStorage.clearTokens();
        },
    });
};