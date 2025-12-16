export interface IUserProfile {
    id: string,
    username: string, 
    fullName: string, 
    email: string,
    gender: string,
    dob: Date,
    bio: string,
    avatarUrl: string,
    createdAt: Date,
}

export interface IUploadAvatarResponse {
    fileUrl: string,
    fileType: string,
    fileSize: number,
    mimeType: string,
}

