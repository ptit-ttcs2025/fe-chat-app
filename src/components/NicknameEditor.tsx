/**
 * Inline Nickname Editor Component
 * Allows users to set/edit/reset friend nicknames
 * Reference: FRIEND_NICKNAME_GUIDE.md
 */

import { useState, useRef, useEffect } from 'react';
import { useUpdateNickname } from '@/apis/friend/friend-nickname.api';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

interface NicknameEditorProps {
    friendId: string;
    currentName: string; // Current displayName (could be nickname or fullName)
    fullName: string; // Original fullName (for reset)
    onUpdate?: (newName: string) => void;
}

/**
 * Nickname Editor Component
 *
 * Features:
 * - Inline editing with Enter/Escape keys
 * - Click-to-edit UX
 * - Max 100 characters validation
 * - Auto-focus and select on edit
 * - Reset to original name (empty string)
 * - Loading state during save
 *
 * @example
 * ```tsx
 * <NicknameEditor
 *   friendId="user-123"
 *   currentName="Best Friend"
 *   fullName="John Doe"
 *   onUpdate={(newName) => console.log('Updated to:', newName)}
 * />
 * ```
 */
export const NicknameEditor: React.FC<NicknameEditorProps> = ({
    friendId,
    currentName,
    fullName,
    onUpdate,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [nickname, setNickname] = useState(currentName);
    const inputRef = useRef<HTMLInputElement>(null);
    const updateNickname = useUpdateNickname();

    // Auto-focus and select when editing starts
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    // Update local state when currentName changes (from WebSocket or refetch)
    useEffect(() => {
        setNickname(currentName);
    }, [currentName]);

    const handleSave = async () => {
        const trimmedNickname = nickname.trim();

        // No changes
        if (trimmedNickname === currentName.trim()) {
            setIsEditing(false);
            return;
        }

        // Validate length
        if (trimmedNickname.length > 100) {
            MySwal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Biệt danh không được quá 100 ký tự',
                confirmButtonText: 'OK',
            });
            return;
        }

        try {
            const result = await updateNickname.mutateAsync({
                friendId,
                nickname: trimmedNickname,
            });

            // ✅ Handle both response structures:
            // 1. Wrapped: { statusCode, message, data: { displayName, ... } }
            // 2. Unwrapped: { displayName, userId, ... } (actual backend behavior)
            let newDisplayName: string | undefined;
            let successMessage: string | undefined;

            if (result.data && result.data.displayName) {
                // Wrapped response
                newDisplayName = result.data.displayName;
                successMessage = result.message;
            } else if (result.displayName) {
                // Unwrapped response (direct data)
                newDisplayName = result.displayName;
                successMessage = 'Cập nhật biệt danh thành công';
            }

            if (!newDisplayName) {
                console.error('⚠️ Invalid response structure:', result);
                throw new Error('Response không có dữ liệu hợp lệ');
            }

            // ✅ Show success alert
            await MySwal.fire({
                icon: 'success',
                title: 'Thành công',
                text: successMessage || 'Cập nhật biệt danh thành công',
                timer: 2000,
                showConfirmButton: false,
            });

            // ✅ Update UI
            onUpdate?.(newDisplayName);
            setNickname(newDisplayName);
            setIsEditing(false);
        } catch (error) {
            console.error('❌ Error updating nickname:', error);
            await MySwal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: error instanceof Error && 'response' in error
                    ? (error.response as { data?: { message?: string } })?.data?.message || 'Không thể cập nhật biệt danh'
                    : error instanceof Error
                        ? error.message
                        : 'Không thể cập nhật biệt danh',
                confirmButtonText: 'OK',
            });
            // Revert to original on error
            setNickname(currentName);
        }
    };

    const handleCancel = () => {
        setNickname(currentName);
        setIsEditing(false);
    };

    const handleReset = async () => {
        const result = await MySwal.fire({
            title: 'Xóa biệt danh?',
            text: `Tên sẽ được khôi phục về "${fullName}"`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Xóa biệt danh',
            cancelButtonText: 'Hủy',
            confirmButtonColor: '#d33',
        });

        if (result.isConfirmed) {
            try {
                const response = await updateNickname.mutateAsync({
                    friendId,
                    nickname: '', // Empty string resets to fullName
                });

                // ✅ Handle both response structures:
                // 1. Wrapped: { statusCode, message, data: { displayName, ... } }
                // 2. Unwrapped: { displayName, userId, ... } (actual backend behavior)
                let newDisplayName: string | undefined;

                if (response.data && response.data.displayName) {
                    // Wrapped response
                    newDisplayName = response.data.displayName;
                } else if (response.displayName) {
                    // Unwrapped response (direct data)
                    newDisplayName = response.displayName;
                }

                if (!newDisplayName) {
                    console.error('⚠️ Invalid response structure:', response);
                    throw new Error('Response không có dữ liệu hợp lệ');
                }

                // ✅ Show success alert
                await MySwal.fire({
                    icon: 'success',
                    title: 'Đã xóa biệt danh',
                    text: 'Tên đã được khôi phục về tên gốc',
                    timer: 2000,
                    showConfirmButton: false,
                });

                // ✅ Update UI
                onUpdate?.(newDisplayName);
                setNickname(newDisplayName);
                setIsEditing(false);
            } catch (error) {
                console.error('❌ Error resetting nickname:', error);
                await MySwal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: error instanceof Error && 'response' in error
                        ? (error.response as { data?: { message?: string } })?.data?.message || 'Không thể xóa biệt danh'
                        : error instanceof Error
                            ? error.message
                            : 'Không thể xóa biệt danh',
                    confirmButtonText: 'OK',
                });
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            handleCancel();
        }
    };

    // Check if current name is a nickname (different from fullName)
    const hasNickname = currentName !== fullName;

    // Editing mode
    if (isEditing) {
        return (
            <div className="nickname-editor d-flex align-items-center gap-2" style={{ width: '100%' }}>
                <input
                    ref={inputRef}
                    type="text"
                    className="form-control form-control-sm"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSave}
                    placeholder="Nhập biệt danh..."
                    maxLength={100}
                    disabled={updateNickname.isPending}
                    style={{ fontSize: '15px' }}
                />
                <button
                    className="btn btn-sm btn-success"
                    onClick={handleSave}
                    disabled={updateNickname.isPending}
                    title="Lưu"
                    type="button"
                >
                    {updateNickname.isPending ? (
                        <span className="spinner-border spinner-border-sm" />
                    ) : (
                        <i className="ti ti-check" />
                    )}
                </button>
                <button
                    className="btn btn-sm btn-danger"
                    onClick={handleCancel}
                    disabled={updateNickname.isPending}
                    title="Hủy"
                    type="button"
                >
                    <i className="ti ti-x" />
                </button>
            </div>
        );
    }

    // Display mode
    return (
        <div className="nickname-display d-flex align-items-center gap-2 justify-content-between w-100">
            <div>
                <h6 className="mb-0" style={{ fontSize: '15px', fontWeight: '500' }}>
                    {currentName}
                </h6>
                {/*{hasNickname && (*/}
                {/*    <p className="mb-0 text-muted" style={{ fontSize: '12px' }}>*/}
                {/*        Tên gốc: {fullName}*/}
                {/*    </p>*/}
                {/*)}*/}
            </div>
            <div className="d-flex gap-1">
                <button
                    className="btn btn-sm btn-light"
                    onClick={() => setIsEditing(true)}
                    title={hasNickname ? 'Sửa biệt danh' : 'Đặt biệt danh'}
                    type="button"
                >
                    <i className="ti ti-pencil" />
                </button>
                {hasNickname && (
                    <button
                        className="btn btn-sm btn-light"
                        onClick={handleReset}
                        title="Xóa biệt danh"
                        type="button"
                    >
                        <i className="ti ti-x" />
                    </button>
                )}
            </div>
        </div>
    );
};
