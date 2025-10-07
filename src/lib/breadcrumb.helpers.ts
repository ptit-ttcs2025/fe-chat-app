// Helper functions để lấy tên thực của các entity cho breadcrumb dynamic routes

// Customer helpers
// Personal contact helpers
export const getPersonalUserName = async (id: string): Promise<string> => {
    try {
        // TODO: Replace with actual API call
        return `Liên hệ #${id}`;
    } catch (error) {
        console.error('Error fetching personal user name:', error);
        return `Liên hệ #${id}`;
    }
};

// Generic helper for unknown entities
export const getGenericEntityName = async (
    id: string,
    entityType: string,
): Promise<string> => {
    try {
        // TODO: Implement generic entity name resolver
        return `${entityType} #${id}`;
    } catch (error) {
        console.error(`Error fetching ${entityType} name:`, error);
        return `${entityType} #${id}`;
    }
};
