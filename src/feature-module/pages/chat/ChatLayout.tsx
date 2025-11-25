/**
 * ChatLayout - Layout hoàn chỉnh kết hợp Sidebar và Chat
 * Phiên bản hiện đại với API integration đầy đủ
 */

import React, { useState } from "react";
import type { IConversation } from "@/apis/chat/chat.type";

// Components
import ConversationsModern from "./ConversationsModern";
import ChatModern from "./ChatModern";

const ChatLayout: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<IConversation | null>(null);

  return (
    <div className="content main_content">
      <div className="sidebar-group left-sidebar chat_sidebar">
        {/* Left Sidebar - Conversations List */}
        <div id="chats" className="left-sidebar-wrap sidebar active slimscroll">
          <ConversationsModern
            onConversationSelect={setSelectedConversation}
            selectedConversationId={selectedConversation?.id || null}
          />
        </div>

        {/* Middle - Chat Room */}
        <ChatModern selectedConversation={selectedConversation} />

        {/* Right Sidebar - Contact Info (có thể thêm sau) */}
        {/* <div className="right-sidebar right_sidebar_profile" id="middle1">
          // Contact info component
        </div> */}
      </div>

      {/* Global Styles for Modern Chat */}
      <style>{`
        .chat_sidebar {
          background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
        }

        .left-sidebar-wrap {
          width: 380px;
          border-right: 1px solid rgba(0, 0, 0, 0.05);
        }

        @media (max-width: 992px) {
          .left-sidebar-wrap {
            width: 100%;
          }
        }

        /* Smooth transitions */
        * {
          transition: all 0.2s ease;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
        }
      `}</style>
    </div>
  );
};

export default ChatLayout;

