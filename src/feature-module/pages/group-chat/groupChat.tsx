/**
 * Group Chat Component - Tích hợp API đầy đủ với realtime messaging
 * Redesigned theo cấu trúc chat.tsx với group-specific features
 */

import { useEffect, useState, useCallback, useRef, RefObject } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { all_routes } from "@/feature-module/router/all_routes";

// API & Hooks
import { useChatMessages } from "@/hooks/useChatMessages";
import { useChatConversations } from "@/hooks/useChatConversations";
import { useGroupManagement } from "@/hooks/useGroupManagement";
import { useWebSocketStatus, useChatActions } from "@/hooks/useWebSocketChat";
import websocketService from "@/core/services/websocket.service";
import type { IMessage, IConversation } from "@/apis/chat/chat.type";
import { uploadImage, uploadFile, chatApi } from "@/apis/chat/chat.api";
import { useQueryClient } from "@tanstack/react-query";
import { groupApi } from "@/apis/group/group.api";

// Components
import GroupChatHeader from "./components/GroupChatHeader";
import GroupChatBody from "./components/GroupChatBody";
import ChatFooter from "../chat/components/ChatFooter"; // Using ChatFooter from 1-1 chat
import TypingIndicator from "../chat/components/TypingIndicator";
import { chatStyles } from "../chat/styles/chatStyles";
import CommonGroupModal from "@/core/modals/common-group-modal"; // Group modals (NewGroup, AddGroup, etc.)
import GroupInfo from "@/core/modals/group-info-off-canva"; // Group info sidebar
import ChatSearchSidebar from "@/core/modals/chat-search-sidebar";

// Redux State Interface
interface RootState {
  auth: {
    user: {
      id: string;
      username: string;
      fullName: string;
      avatarUrl?: string;
    } | null;
    token: string | null;
  };
  common: {
    selectedConversationId: string | null;
  };
}

const GroupChat = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const MySwal = withReactContent(Swal);

  // ==================== Redux State ====================
  const user = useSelector((state: RootState) => state.auth?.user);
  const selectedConversationId = useSelector(
    (state: RootState) => state.common?.selectedConversationId
  );

  // ==================== Local State (UI) ====================
  const [searchKeyword, setSearchKeyword] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  const [selectedConversation, setSelectedConversation] =
    useState<IConversation | null>(null);
  const [filteredMessages, setFilteredMessages] = useState<IMessage[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // ==================== Refs ====================
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null) as RefObject<HTMLDivElement>;
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const footerRef = useRef<HTMLDivElement>(null) as RefObject<HTMLDivElement>;
  const [footerHeight, setFooterHeight] = useState(100);

  // ==================== API Hooks ====================

  // WebSocket connection
  const isWsConnected = useWebSocketStatus();

  // Group conversations list (filter type=GROUP)
  const {
    conversations,
    useConversation
  } = useChatConversations({
    pageSize: 50,
    autoRefresh: true,
    type: "GROUP", // Filter only GROUP conversations
  });

  // Sync conversation from Redux
  useEffect(() => {
    if (selectedConversationId && conversations.length > 0) {
      const conv = conversations.find((c) => c.id === selectedConversationId);
      if (conv) {
        setSelectedConversation(conv);
      }
    }
  }, [selectedConversationId, conversations]);

  // Group management hook
  // Add safety checks and logging
  const groupId = selectedConversation?.groupId || null;

  // Debug log for group conversation
  useEffect(() => {
    if (selectedConversation) {
      console.log('🏢 [GroupChat] GROUP conversation selected:', {
        conversationId: selectedConversation.id,
        groupId: selectedConversation.groupId,
        hasGroupId: !!selectedConversation.groupId,
        name: selectedConversation.name,
      });

      if (!selectedConversation.groupId) {
        console.error('❌ [GroupChat] GROUP conversation missing groupId!', selectedConversation);
      }
    }
  }, [selectedConversation]);

  const {
    group,
    members,
    isLoadingMembers,
    addMembers: addMembersToGroup,
    removeMember: removeMemberFromGroup,
    updateGroup: updateGroupInfo,
    isAdmin,
    getOnlineMembersCount,
  } = useGroupManagement({
    groupId,
    autoFetchMembers: !!groupId,
  });

  // Messages hook (reuse from chat - supports both ONE_TO_ONE and GROUP)
  const {
    messages,
    isLoading: isLoadingMessages,
    isSending,
    sendMessage: sendMessageHook,
    deleteMessage,
    togglePin,
    hasMore,
    isLoadingMore,
    loadMoreMessages,
  } = useChatMessages({
    conversationId: selectedConversation?.id || null,
    pageSize: 50,
    autoMarkAsRead: true,
    currentUserId: user?.id,
  });

  // Pinned messages state
  const [pinnedMessages, setPinnedMessages] = useState<IMessage[]>([]);

  // Send message with attachment helper
  const sendMessageWithAttachment = useCallback(
    async (
      content: string,
      type: "TEXT" | "IMAGE" | "FILE",
      attachmentId?: string
    ) => {
      if (!selectedConversation) return;

      await chatApi.sendMessage({
        conversationId: selectedConversation.id,
        content,
        type,
        attachmentId,
      });
    },
    [selectedConversation]
  );

  // Use scrollToBottom from hook
  const { scrollToBottom: scrollToBottomFromHook } = {
    scrollToBottom: () => {
      requestAnimationFrame(() => {
        const chatBody = document.querySelector(
          "#middle .chat-body.chat-page-group"
        ) as HTMLElement;
        if (chatBody) {
          const scrollHeight = chatBody.scrollHeight;
          const clientHeight = chatBody.clientHeight;
          const maxScroll = scrollHeight - clientHeight;
          chatBody.scrollTop = Math.max(0, maxScroll);
        }
      });
    },
  };

  // Chat actions (typing, etc)
  const { sendTypingStatus } = useChatActions();

  // Typing users state
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // ==================== Effects ====================

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (!selectedConversation && conversations.length > 0) {
      setSelectedConversation(conversations[0]);
    }
  }, [conversations, selectedConversation]);

  // Subscribe to typing status
  useEffect(() => {
    if (selectedConversation?.id && isWsConnected) {
      const unsubscribe = websocketService.subscribeToTyping(
        selectedConversation.id,
        (status) => {
          if (status.userId !== user?.id) {
            setTypingUsers((prev) => {
              if (status.isTyping) {
                return [
                  ...prev.filter((u) => u !== status.userName),
                  status.userName,
                ];
              } else {
                return prev.filter((u) => u !== status.userName);
              }
            });

            // Auto clear after 2s
            setTimeout(() => {
              setTypingUsers((prev) =>
                prev.filter((u) => u !== status.userName)
              );
            }, 2000);
          }
        }
      );

      return () => unsubscribe();
    }
  }, [selectedConversation?.id, isWsConnected, user?.id]);

  // Mobile responsive handlers
  useEffect(() => {
    const handleChatUserClick = () => {
      if (window.innerWidth <= 992) {
        const showChat = document.querySelector(".chat-messages");
        if (showChat) {
          showChat.classList.add("show");
        }
      }
    };

    const handleChatClose = () => {
      if (window.innerWidth <= 992) {
        const hideChat = document.querySelector(".chat-messages");
        if (hideChat) {
          hideChat.classList.remove("show");
        }
      }
    };

    document.querySelectorAll(".chat-user-list").forEach((element) => {
      element.addEventListener("click", handleChatUserClick);
    });

    document.querySelectorAll(".chat-close").forEach((element) => {
      element.addEventListener("click", handleChatClose);
    });

    return () => {
      document.querySelectorAll(".chat-user-list").forEach((element) => {
        element.removeEventListener("click", handleChatUserClick);
      });
      document.querySelectorAll(".chat-close").forEach((element) => {
        element.removeEventListener("click", handleChatClose);
      });
    };
  }, []);

  // Filter messages when search keyword changes
  useEffect(() => {
    if (searchKeyword.trim()) {
      const filtered = messages.filter(
        (msg) =>
          msg.content?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          msg.senderName?.toLowerCase().includes(searchKeyword.toLowerCase())
      );
      setFilteredMessages(filtered);
    } else {
      setFilteredMessages(messages);
    }
  }, [searchKeyword, messages]);


  // Focus input when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      inputRef.current?.focus();
    }
  }, [selectedConversation?.id]);

  // Calculate footer height dynamically
  useEffect(() => {
    const updateFooterHeight = () => {
      if (footerRef.current) {
        const height = footerRef.current.offsetHeight;
        const maxHeight = Math.min(height, 150);
        setFooterHeight(maxHeight);
      }
    };

    const timeoutId = setTimeout(updateFooterHeight, 100);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        const maxHeight = Math.min(height, 150);
        setFooterHeight(maxHeight);
      }
    });

    if (footerRef.current) {
      resizeObserver.observe(footerRef.current);
    }

    window.addEventListener("resize", updateFooterHeight);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateFooterHeight);
    };
  }, [typingUsers.length, selectedConversation]);

  // Fetch pinned messages
  useEffect(() => {
    const fetchPinnedMessages = async () => {
      if (!selectedConversation?.id) {
        setPinnedMessages([]);
        return;
      }

      try {
        const response = await chatApi.getPinnedMessages(
          selectedConversation.id
        );

        if (response.data) {
          const pinnedData = Array.isArray(response.data) ? response.data : [];
          setPinnedMessages(pinnedData);
        } else if (response && Array.isArray(response)) {
          setPinnedMessages(response);
        } else {
          const pinnedFromMessages = messages.filter((m) => m.pinned);
          setPinnedMessages(pinnedFromMessages);
        }
      } catch (error) {
        console.error("❌ Error fetching pinned messages:", error);
        const pinnedFromMessages = messages.filter((m) => m.pinned);
        setPinnedMessages(pinnedFromMessages);
      }
    };

    fetchPinnedMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation?.id]);

  // ==================== Handlers ====================

  // Handler để mở modal chỉnh sửa nhóm (edit-group)
  const handleShowEditGroup = useCallback(() => {
    // Đợi một chút để đảm bảo modal đã được render
    setTimeout(() => {
      const modalElement = document.getElementById('edit-group');
      if (modalElement) {
        // Sử dụng Bootstrap Modal API trực tiếp
        const Bootstrap = (window as any).bootstrap;
        if (Bootstrap && Bootstrap.Modal) {
          const existingModal = Bootstrap.Modal.getInstance(modalElement);
          if (existingModal) {
            existingModal.show();
          } else {
            const modal = new Bootstrap.Modal(modalElement);
            modal.show();
          }
        } else {
          // Fallback: tạo trigger element tạm thời
          const tempTrigger = document.createElement('button');
          tempTrigger.dataset.bsToggle = 'modal';
          tempTrigger.dataset.bsTarget = '#edit-group';
          tempTrigger.style.display = 'none';
          document.body.appendChild(tempTrigger);
          tempTrigger.click();
          setTimeout(() => tempTrigger.remove(), 100);
        }
      } else {
        console.warn('Modal #edit-group not found in DOM');
      }
    }, 100);
  }, []);

  // Handle scroll to message from search sidebar
  const handleSearchMessageClick = useCallback((messageId: string) => {
    // Scroll to message in chat body
    setTimeout(() => {
      const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
      if (messageElement) {
        messageElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
        // Temporary highlight
        messageElement.classList.add('highlight-message-temp');
        setTimeout(() => {
          messageElement.classList.remove('highlight-message-temp');
        }, 2000);
      }
    }, 100);
  }, []);

  // Handle leave group
  const handleLeaveGroup = useCallback(async () => {
    if (!selectedConversation) return;

    const groupName = group?.name || selectedConversation?.name || "nhóm này";

    // Show confirmation dialog
    const result = await MySwal.fire({
      title: 'Xác nhận rời nhóm',
      html: `Bạn có chắc chắn muốn rời khỏi <strong>${groupName}</strong>?<br><br><small class="text-muted">Bạn sẽ không thể xem tin nhắn hoặc thông tin nhóm sau khi rời.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '<i class="ti ti-logout me-2"></i>Rời nhóm',
      cancelButtonText: '<i class="ti ti-x me-2"></i>Hủy',
      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      // Get groupId - fetch conversation detail if not available
      let groupId = selectedConversation.groupId;

      if (!groupId) {
        // Fetch conversation detail to get groupId
        const conversationDetail = await chatApi.getConversation(selectedConversation.id);
        groupId = conversationDetail.data?.groupId;

        if (!groupId) {
          throw new Error('Không tìm thấy groupId trong thông tin nhóm');
        }
      }

      // Call API using groupApi.leaveGroup
      await groupApi.leaveGroup(groupId);

      // Invalidate conversations query to update the list
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });

      // Show success notification
      MySwal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Đã rời nhóm!',
        text: `Bạn đã rời khỏi ${groupName}`,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });

      // Navigate to index page
      navigate(all_routes.index);
    } catch (error: any) {
      console.error('❌ Error leaving group:', error);

      // Show error notification
      MySwal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Lỗi!',
        text: error?.response?.data?.message || error?.message || 'Không thể rời nhóm. Vui lòng thử lại.',
        showConfirmButton: false,
        timer: 3000,
      });
    }
  }, [selectedConversation, group, navigate, queryClient, MySwal]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInputMessage(value);

      // Send typing indicator
      if (selectedConversation && value.length > 0) {
        sendTypingStatus(
          selectedConversation.id,
          true,
          user?.fullName || "User"
        );

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
          sendTypingStatus(
            selectedConversation.id,
            false,
            user?.fullName || "User"
          );
        }, 1000);
      }
    },
    [selectedConversation, sendTypingStatus, user]
  );

  const handleSendMessage = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      if (!inputMessage.trim() || !selectedConversation || isSending) return;

      const messageToSend = inputMessage.trim();

      try {
        setInputMessage("");
        inputRef.current?.focus();

        sendMessageHook(messageToSend, "TEXT");

        if (selectedConversation) {
          sendTypingStatus(
            selectedConversation.id,
            false,
            user?.fullName || "User"
          );
        }

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }

        scrollToBottomFromHook();
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      } catch (error) {
        console.error("❌ Error sending message:", error);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    },
    [
      inputMessage,
      selectedConversation,
      isSending,
      sendMessageHook,
      sendTypingStatus,
      user,
    ]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  const handleDeleteMessage = useCallback(
    (messageId: string) => {
      if (globalThis.confirm("Bạn có chắc muốn xóa tin nhắn này?")) {
        deleteMessage(messageId);
      }
    },
    [deleteMessage]
  );

  const handleTogglePin = useCallback(
    (messageId: string, currentlyPinned: boolean) => {
      if (!selectedConversation?.id) return;

      if (currentlyPinned) {
        setPinnedMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      } else {
        const messageToPin = messages.find((msg) => msg.id === messageId);
        if (messageToPin) {
          setPinnedMessages((prev) => [
            { ...messageToPin, pinned: true },
            ...prev,
          ]);
        }
      }

      togglePin(messageId, !currentlyPinned);

      setTimeout(async () => {
        try {
          const response = await chatApi.getPinnedMessages(
            selectedConversation.id
          );
          if (response.data) {
            setPinnedMessages(
              Array.isArray(response.data) ? response.data : []
            );
          } else if (response && Array.isArray(response)) {
            setPinnedMessages(response);
          }
        } catch (error) {
          console.error("❌ Error refreshing pinned messages:", error);
        }
      }, 150);
    },
    [togglePin, selectedConversation?.id, messages]
  );

  const handlePinnedMessageClick = useCallback(() => {
    // Logic handled in PinnedMessages component
  }, []);

  // File upload handlers
  const handleFileUpload = useCallback(
    async (file: File, type: "IMAGE" | "FILE") => {
      if (!selectedConversation || isUploading) return;

      setIsUploading(true);
      try {
        const uploadResponse = await (type === "IMAGE"
          ? uploadImage(file, selectedConversation.id)
          : uploadFile({
              file,
              conversationId: selectedConversation.id,
              type: "FILE",
            }));

        if (uploadResponse.data) {
          await sendMessageWithAttachment(
            uploadResponse.data.fileName ||
              (type === "IMAGE" ? "Ảnh" : "File"),
            type,
            uploadResponse.data.id
          );
        }
      } catch (error) {
        console.error("❌ Error uploading file:", error);
        alert("Không thể tải file lên. Vui lòng thử lại.");
      } finally {
        setIsUploading(false);
      }
    },
    [selectedConversation, isUploading, sendMessageWithAttachment]
  );

  const handleImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type.startsWith("image/")) {
        handleFileUpload(file, "IMAGE");
      }
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    },
    [handleFileUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileUpload(file, "FILE");
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleFileUpload]
  );

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const triggerImageInput = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  // Group management handlers
  const handleAddMembers = useCallback(
    async (memberIds: string[]) => {
      try {
        await addMembersToGroup(memberIds);
        // Modal will be closed by template
      } catch (error) {
        console.error("❌ Error adding members:", error);
        alert("Không thể thêm thành viên. Vui lòng thử lại.");
      }
    },
    [addMembersToGroup]
  );

  const handleRemoveMember = useCallback(
    async (memberId: string) => {
      if (confirm("Bạn có chắc muốn xóa thành viên này?")) {
        try {
          await removeMemberFromGroup(memberId);
        } catch (error) {
          console.error("❌ Error removing member:", error);
          alert("Không thể xóa thành viên. Vui lòng thử lại.");
        }
      }
    },
    [removeMemberFromGroup]
  );

  const handleUpdateGroup = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (data: any) => {
      try {
        await updateGroupInfo(data);
        // Modal will be closed by template
      } catch (error) {
        console.error("❌ Error updating group:", error);
        alert("Không thể cập nhật nhóm. Vui lòng thử lại.");
      }
    },
    [updateGroupInfo]
  );

  // ==================== Render ====================

  if (!user) {
    return (
      <div className="content main_content">
        <div
          className="d-flex align-items-center justify-content-center"
          style={{ height: "100vh" }}
        >
          <div className="text-center">
            <i
              className="ti ti-user-off"
              style={{ fontSize: "64px", color: "#667eea" }}
            />
            <h4 className="mt-3">Bạn chưa đăng nhập</h4>
            <p className="text-muted">Vui lòng đăng nhập để sử dụng chat</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Modern Styles */}
      <style>{chatStyles}</style>

      {/* Chat Container */}
      <div
        className="chat chat-messages show"
        id="middle"
        style={
          {
            display: "flex",
            flexDirection: "column",
            flex: 1,
            height: "100vh",
            maxHeight: "100vh",
            overflow: "hidden",
            position: "relative",
            "--footer-height": `${footerHeight}px`,
          } as React.CSSProperties
        }
      >
        {/* Header Section */}
        <div
          style={{
            flexShrink: 0,
            zIndex: 10,
            position: "relative",
          }}
        >
          <GroupChatHeader
            conversation={selectedConversation}
            group={group}
            members={members}
            onlineMembersCount={getOnlineMembersCount()}
            onShowEditGroup={handleShowEditGroup}
            onLeaveGroup={handleLeaveGroup}
            isAdmin={isAdmin(user?.id || "")}
          />
        </div>

        {/* Body Section */}
        <div
          style={{
            flex: "1 1 auto",
            flexGrow: 1,
            flexShrink: 1,
            flexBasis: 0,
            minHeight: 0,
            overflow: "hidden",
            position: "relative",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <GroupChatBody
            messages={filteredMessages}
            pinnedMessages={pinnedMessages}
            members={members}
            isLoadingMessages={isLoadingMessages}
            selectedConversation={selectedConversation}
            currentUserId={user?.id}
            userAvatarUrl={user?.avatarUrl}
            userFullName={user?.fullName}
            messagesEndRef={messagesEndRef}
            onTogglePin={handleTogglePin}
            onDeleteMessage={handleDeleteMessage}
            onPinnedMessageClick={handlePinnedMessageClick}
            onUnpin={(messageId) => handleTogglePin(messageId, true)}
            typingUsers={typingUsers}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={loadMoreMessages}
            searchKeyword={searchKeyword}
          />
        </div>

        {/* Footer Section */}
        <div
          style={{
            flexShrink: 0,
            zIndex: 100,
            position: "relative",
          }}
        >
          {typingUsers.length > 0 && (
            <TypingIndicator typingUsers={typingUsers} />
          )}

          <ChatFooter
            footerRef={footerRef as RefObject<HTMLDivElement>}
            selectedConversation={selectedConversation}
            inputMessage={inputMessage}
            inputRef={inputRef as RefObject<HTMLInputElement>}
            imageInputRef={imageInputRef as RefObject<HTMLInputElement>}
            fileInputRef={fileInputRef as RefObject<HTMLInputElement>}
            isUploading={isUploading}
            isSending={isSending}
            onInputChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onSendMessage={handleSendMessage}
            onImageSelect={handleImageSelect}
            onFileSelect={handleFileSelect}
            onTriggerImageInput={triggerImageInput}
            onTriggerFileInput={triggerFileInput}
            footerHeight={footerHeight}
            onEmojiSelect={(emoji) => setInputMessage((prev) => prev + emoji)}
          />
        </div>
      </div>

      {/* Group Modals (NewGroup, AddGroup, EditGroup, etc.) */}
      <CommonGroupModal />

      {/* Chat Search Sidebar */}
      <ChatSearchSidebar
        selectedConversation={selectedConversation}
        messages={messages}
        searchKeyword={searchKeyword}
        onSearchChange={setSearchKeyword}
        onMessageClick={handleSearchMessageClick}
        currentUserId={user?.id}
      />

      {/* Group Info Sidebar */}
      <GroupInfo selectedConversation={selectedConversation} />
    </>
  );
};

export default GroupChat;
