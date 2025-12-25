/**
 * Upload API Client
 * REST API endpoints cho File Upload System
 * Theo API_DOCUMENTATION.md - Section 9: File Management APIs
 */

import http from '@/lib/apiBase';
import type {
  IUploadFileRequest,
  IUploadFileResponse,
  IFileValidation,
} from './upload.type';

const URI = '';

// ===========================
// FILE VALIDATION HELPERS
// ===========================

export const validateFile = (file: File, validation: IFileValidation): { valid: boolean; error?: string } => {
  // Check file size
  if (file.size > validation.maxSize) {
    const maxSizeMB = (validation.maxSize / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `Kích thước file vượt quá ${maxSizeMB}MB` };
  }

  // Check file type
  if (!validation.allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Định dạng file không được hỗ trợ' };
  }

  return { valid: true };
};

// ===========================
// UPLOAD APIs
// ===========================

/**
 * Upload file
 * POST /files/upload
 */
export const uploadFile = async (request: IUploadFileRequest): Promise<IUploadFileResponse> => {
  const formData = new FormData();
  formData.append('file', request.file);

  if (request.folder) {
    formData.append('folder', request.folder);
  }

  const response = await http.post<IUploadFileResponse>(`${URI}/files/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * Upload avatar với validation
 * Wrapper function với validation built-in
 */
export const uploadAvatar = async (file: File): Promise<string> => {
  // Import validation
  const { IMAGE_VALIDATION } = await import('./upload.type');

  // Validate
  const validation = validateFile(file, IMAGE_VALIDATION);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Upload
  const response = await uploadFile({
    file,
    folder: 'AVATARS',
  });

  return response.data.fileUrl;
};

/**
 * Delete file
 * DELETE /files/{fileId}
 */
export const deleteFile = async (fileId: string): Promise<void> => {
  await http.delete(`${URI}/files/${fileId}`);
};

// ===========================
// EXPORT ALL
// ===========================

export const uploadApi = {
  uploadFile,
  uploadAvatar,
  deleteFile,
  validateFile,
};

export default uploadApi;

