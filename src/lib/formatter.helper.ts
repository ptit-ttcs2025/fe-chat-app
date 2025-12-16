import { format } from 'date-fns';

/**
 * Chuyển đổi gender enum sang label tiếng Việt
 */
export const getGenderLabel = (gender?: string): string => {
    if (!gender) return 'Không rõ';
    switch (gender.toUpperCase()) {
        case 'MALE': return 'Nam';
        case 'FEMALE': return 'Nữ';
        case 'UNKNOWN': return 'Không rõ';
        case 'OTHER': return 'Khác';
        default: return 'Không rõ';
    }
};

/**
 * Format date về dd/MM/yyyy
 */
export const formatDate = (date?: Date | string | null): string => {
    if (!date) return 'N/A';
    try {
        return format(new Date(date), 'dd/MM/yyyy');
    } catch {
        return 'N/A';
    }
};

/**
 * Format date với time (dd/MM/yyyy HH:mm)
 */
export const formatDateTime = (date?: Date | string | null): string => {
    if (!date) return 'N/A';
    try {
        return format(new Date(date), 'dd/MM/yyyy HH:mm');
    } catch {
        return 'N/A';
    }
};