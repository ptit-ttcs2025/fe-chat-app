export interface IAuth {
    username: string;
    password: string;
}

export interface IAuthResponse {
    accessToken: string;
    refreshToken: string;
    user: IAuthUser;
}

export interface IAuthUser {
    id: string;
    username: string;
    email: string;
    fullName: string;
    role?: string; // ROLE_ADMIN, USER, etc.
    dob?: string;
    bio?: string;
    createdAt?: string;
}

export interface ILoginResponse {
    id: string;
    username: string;
    email: string;
    fullName: string;
    role?: string; // ROLE_ADMIN, USER, etc.
    accessToken: string;
    refreshToken: string;
}

export interface ILoginRequest {
    username: string;
    password: string;
}

export interface ISignupRequest {
    fullName: string;
    email: string;
    username: string;
    password: string;
}

