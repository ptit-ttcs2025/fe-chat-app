export interface BreadcrumbItem {
    label: string;
    path?: string;
    isActive?: boolean;
    isDynamic?: boolean;
}

export interface DynamicParams {
    [key: string]: string;
}

export interface BreadcrumbConfig {
    [key: string]: {
        label: string;
        parent?: string;
        isDynamic?: boolean;
        dynamicLabelResolver?: (
            params: DynamicParams,
        ) => Promise<string> | string;
    };
}

// Mapping từ route path sang breadcrumb config
export const BREADCRUMB_CONFIG: BreadcrumbConfig = {
    // Dashboard
    '/dashboard': {
        label: 'Dashboard',
    },
    '/dashboard/crm': {
        label: 'Trang chủ',
        parent: '/dashboard',
    },
    '/dashboard/cong-viec': {
        label: 'Công việc',
        parent: '/dashboard',
    },

};

// Helper function để normalize path (remove dynamic segments)
export const normalizePath = (path: string): string => {
    return path
        .replace(/\/\[.*?\]/g, '') // Remove [id] segments
        .replace(/\/[^\/]*\/\d+/g, '') // Remove /something/123 patterns
        .replace(/\/\d+$/g, ''); // Remove trailing numbers
};

// Helper function để extract dynamic segments
export const extractDynamicSegments = (
    path: string,
): { [key: string]: string } => {
    const segments: { [key: string]: string } = {};
    const pathParts = path.split('/');

    pathParts.forEach((part) => {
        if (/^\d+$/.test(part)) {
            segments.id = part;
        }
    });

    return segments;
};
