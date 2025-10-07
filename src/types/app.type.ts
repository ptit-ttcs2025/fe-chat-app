export interface NavigationAppType {
    id: string;
    label: string;
    path: string;
    icon: string;
    isPinned?: boolean;
}

export interface MenuAppType {
    [key: string]: {
        id: string;
        label: string;
        icon: string;
        childrens: Record<string, NavigationAppType>;
    };
}
