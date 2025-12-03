/**
 * ChatPageWithIntegration
 * Page demo hoàn chỉnh với tích hợp Chat API
 * Sử dụng file này để thay thế chat.tsx hiện tại hoặc làm reference
 */

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import ChatRoomExample from './ChatRoomExample';
import ConversationsSidebar from './ConversationsSidebar';

// Import modals (giữ nguyên từ chat.tsx cũ)
import ContactInfo from '../../../core/modals/contact-info-off-canva';
import ContactFavourite from '../../../core/modals/contact-favourite-canva';
import ForwardMessage from '../../../core/modals/forward-message';
import MessageDelete from '../../../core/modals/message-delete';

interface AuthState {
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  } | null;
}

interface RootState {
  auth: AuthState;
}

const ChatPageWithIntegration: React.FC = () => {
  // Get current user from Redux
  const user = useSelector((state: RootState) => state.auth.user);

  // State cho selected conversation
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    null
  );

  // Nếu chưa đăng nhập, redirect hoặc show message
  if (!user) {
    return (
      <div className="content main_content">
        <div className="d-flex align-items-center justify-content-center" style={{ height: '100vh' }}>
          <div className="text-center">
            <i className="ti ti-user-off" style={{ fontSize: '64px' }} />
            <h4 className="mt-3">Bạn chưa đăng nhập</h4>
            <p className="text-muted">Vui lòng đăng nhập để sử dụng chat</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="content main_content">
        <div className="sidebar-group">
          {/* Left Sidebar - Conversations List */}
          <ConversationsSidebar
            currentUserId={user.id}
            onConversationSelect={setSelectedConversationId}
            selectedConversationId={selectedConversationId}
          />

          {/* Middle - Chat Room */}
          <ChatRoomExample
            currentUserId={user.id}
            currentUserName={user.name}
            initialConversationId={selectedConversationId}
          />

          {/* Right Sidebar - Contact Info (optional, có thể thêm sau) */}
          {/* <ContactInfoSidebar /> */}
        </div>
      </div>

      {/* Modals - Giữ nguyên từ chat.tsx cũ */}
      <ContactInfo />
      <ContactFavourite />
      <ForwardMessage />
      <MessageDelete />
      {/* Thêm các modals khác nếu cần */}
    </>
  );
};

export default ChatPageWithIntegration;

/**
 * USAGE:
 * 
 * 1. Thay thế route trong router.tsx:
 * 
 * import ChatPageWithIntegration from '@/feature-module/pages/chat/ChatPageWithIntegration';
 * 
 * {
 *   path: routes.chat,
 *   element: <ChatPageWithIntegration />,
 * }
 * 
 * 2. Hoặc import trực tiếp:
 * 
 * import ChatPage from './chat/ChatPageWithIntegration';
 * 
 * 3. Hoặc rename file này thành chat.tsx và backup file cũ
 */

