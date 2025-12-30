/**
 * Upload API Types & Interfaces
 * Định nghĩa types cho File Upload System
 * Theo API_DOCUMENTATION.md - Section 9: File Management APIs
 */

// ===========================
// FILE UPLOAD TYPES
// ===========================

export type FileFolder = 'AVATARS' | 'FILES' | 'IMAGES' | 'OTHERS';

export interface IUploadedFile {
  id: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  mimeType: string;
}

export interface IUploadFileRequest {
  file: File;
  folder?: FileFolder;
}

export interface IUploadFileResponse {
  statusCode: number;
  message: string;
  data: IUploadedFile;
}

// ===========================
// VALIDATION TYPES
// ===========================

export interface IFileValidation {
  maxSize: number; // bytes
  allowedTypes: string[]; // MIME types
}

export const IMAGE_VALIDATION: IFileValidation = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
};

export const FILE_VALIDATION: IFileValidation = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
};

// Evidence validation for report module (images only, 10MB max)
export const EVIDENCE_VALIDATION: IFileValidation = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
};

