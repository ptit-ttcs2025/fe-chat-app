export interface IAuth {
    username: string;
    password: string;
}

export interface IAuthUser {
    id: string;
    userName: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    department: {
        id: string;
        name: string;
    } | null;
    position: {
        id: string;
        name: string;
    } | null;
    roles: string[];
}

export interface IAuthResponse {
    user: IAuthUser | null;
    token: string;
    refresh: string;
}
