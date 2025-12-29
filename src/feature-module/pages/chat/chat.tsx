/**
 * Chat Component - Tích hợp API đầy đủ với theme gốc
 * Giữ nguyên giao diện nhưng thêm logic real-time và modern features
 * Refactored: Tách thành các component nhỏ hơn để dễ quản lý
 */

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useSelector } from "react-redux";

// Theme Components
import ContactInfo from "../../../core/modals/contact-info-off-canva";

// API & Hooks - Tích hợp real-time
import { useChatMessages } from "@/hooks/useChatMessages";
import { useChatConversations } from "@/hooks/useChatConversations";
import { useGroupManagement } from "@/hooks/useGroupManagement";
import { useWebSocketStatus, useChatActions } from "@/hooks/useWebSocketChat";
import websocketService from "@/core/services/websocket.service";
import type { IMessage, IConversation } from "@/apis/chat/chat.type";
import { sendFile, chatApi } from "@/apis/chat/chat.api";
import { ThumbnailService } from "@/core/services/ThumbnailService";

// Components
import ChatHeader from "./components/ChatHeader";
import ChatSearch from "./components/ChatSearch";
import ChatBody from "./components/ChatBody";
import ChatFooter from "./components/ChatFooter";
import TypingIndicator from "./components/TypingIndicator";
import { chatStyles } from "./styles/chatStyles";

// Group Components (for unified handling)
import GroupChatHeader from "../group-chat/components/GroupChatHeader";
import GroupChatBody from "../group-chat/components/GroupChatBody";

type UploadKind = "image" | "file";

type PendingUploadStatus = "uploading" | "done" | "error";

interface PendingUploadItem {
  id: string;
  kind: UploadKind;
  name: string;
  size: number;
  mime: string;
  file: File;
  thumbnailFile?: File;
  previewUrl?: string;
  status: PendingUploadStatus;
  error?: string;
}

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

const Chat = () => {
  // ==================== Redux State ====================
  const user = useSelector((state: RootState) => state.auth?.user);
  const selectedConversationId = useSelector(
    (state: RootState) => state.common?.selectedConversationId
  );

  // ==================== Local State (UI) ====================
  const [showSearch, setShowSearch] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  const [selectedConversation, setSelectedConversation] =
    useState<IConversation | null>(null);
  const [filteredMessages, setFilteredMessages] = useState<IMessage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [sendLocked, setSendLocked] = useState(false);

  // ==================== Refs ====================
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [footerHeight, setFooterHeight] = useState(100);

  // ==================== API Hooks ====================

  // WebSocket connection
  const isWsConnected = useWebSocketStatus();

  // Conversations list (both ONE_TO_ONE and GROUP for unified chat)
  const {
    conversations,
  } = useChatConversations({
    pageSize: 50,
    autoRefresh: true,
    // No type filter - handle both ONE_TO_ONE and GROUP
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

  // Messages cho conversation đã chọn (Cursor-based pagination)
  const {
    messages,
    isLoading: isLoadingMessages,
    isSending,
    sendMessage: sendMessageHook,
    deleteMessage,
    togglePin,
    scrollToBottom,
    // Cursor pagination
    hasMore,
    isLoadingMore,
    loadMoreMessages,
  } = useChatMessages({
    conversationId: selectedConversation?.id || null,
    pageSize: 50,
    autoMarkAsRead: true,
    currentUserId: user?.id,
  });

  // Group management hook (for GROUP conversations)
  const {
    group,
    members,
    // isLoadingMembers,
    // addMembers: addMembersToGroup,
    // removeMember: removeMemberFromGroup,
    // updateGroup: updateGroupInfo,
    isAdmin,
    getOnlineMembersCount,
  } = useGroupManagement({
    groupId: selectedConversation?.type === 'GROUP' ? (selectedConversation?.groupId || null) : null,
    autoFetchMembers: selectedConversation?.type === 'GROUP',
  });

  // Determine if current conversation is a group
  const isGroupConversation = selectedConversation?.type === 'GROUP';

  // Pinned messages state
  const [pinnedMessages, setPinnedMessages] = useState<IMessage[]>([]);

  // Pending uploads preview state
  const [pendingUploads, setPendingUploads] = useState<PendingUploadItem[]>([]);

  // Send message with attachment using sendFile (upload + optional content)
  const sendMessageWithAttachment = useCallback(
    async (
      content: string | undefined,
      type: "TEXT" | "IMAGE" | "FILE",
      file: File,
      thumbnailFile?: File
    ) => {
      if (!selectedConversation) return;

      await sendFile({
        originalFile: file,
        thumbnailFile,
        conversationId: selectedConversation.id,
        content:
          content && content.trim().length > 0 ? content.trim() : undefined,
      });

      // Note: Message object sẽ được nhận qua WebSocket, không phải từ sendFile response
    },
    [selectedConversation]
  );
  
  // Chat actions (typing, etc)
  const { sendTypingStatus } = useChatActions();
  
  // Typing users state
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // Helpers for pending upload preview lifecycle
  const addPendingUpload = useCallback(
    (file: File, kind: UploadKind): { id: string; previewUrl?: string } => {
      const id = crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
      const previewUrl =
        kind === "image"
          ? ThumbnailService.getLocalPreviewUrl(file)
          : undefined;

      setPendingUploads((prev) => [
        ...prev,
        {
          id,
          kind,
          name: file.name,
          size: file.size,
          mime: file.type,
          file,
          previewUrl,
          status: "uploading",
        },
      ]);

      return { id, previewUrl };
    },
    []
  );

  const updatePendingUpload = useCallback(
    (id: string, payload: Partial<PendingUploadItem>) => {
      setPendingUploads((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...payload } : item))
      );
    },
    []
  );

  const removePendingUpload = useCallback((id: string) => {
    setPendingUploads((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target?.previewUrl) {
        ThumbnailService.revokePreviewUrl(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  // ==================== Effects ====================
  
  // Auto-select first conversation
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

  // Cleanup preview URLs when component unmounts
  useEffect(() => {
    return () => {
      pendingUploads.forEach((item) => {
        if (item.previewUrl) {
          ThumbnailService.revokePreviewUrl(item.previewUrl);
        }
      });
    };
  }, [pendingUploads]);

  // NOTE: Đã chuyển logic auto-scroll sang ChatBody component
  // để tránh scroll khi load more messages
  
  // Filter messages when search keyword changes
  // ✅ FIXED: Dùng useMemo để tính toán, không cần useEffect
  const filteredMessagesComputed = useMemo(() => {
    if (searchKeyword.trim()) {
      return messages.filter(
        (msg) =>
          msg.content?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          msg.senderName?.toLowerCase().includes(searchKeyword.toLowerCase())
      );
    }
    return messages;
  }, [searchKeyword, messages]);

  // ✅ FIXED: Chỉ update state khi computed value thực sự thay đổi (so sánh IDs)
  const prevFilteredIdsRef = useRef<string>("");

  useEffect(() => {
    const currentIds = filteredMessagesComputed
      .map((m) => m.id)
      .sort()
      .join(",");

    if (currentIds !== prevFilteredIdsRef.current) {
      prevFilteredIdsRef.current = currentIds;
      setFilteredMessages(filteredMessagesComputed);
    }
  }, [filteredMessagesComputed]);
  
  // Focus input when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      inputRef.current?.focus();
    }
  }, [selectedConversation]);

  // Tính toán chiều cao footer động
  useEffect(() => {
    const updateFooterHeight = () => {
      if (footerRef.current) {
        // Chỉ tính chiều cao thực tế của footer, không thêm buffer quá lớn
        const height = footerRef.current.offsetHeight;
        // Giới hạn footer height tối đa 150px để tránh tính sai
        const maxHeight = Math.min(height, 150);
        setFooterHeight(maxHeight);
      }
    };

    // Delay một chút để đảm bảo DOM đã render
    const timeoutId = setTimeout(updateFooterHeight, 100);

    // Update khi typing indicator xuất hiện/ẩn
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        // Giới hạn footer height tối đa 150px
        const maxHeight = Math.min(height, 150);
        setFooterHeight(maxHeight);
      }
    });

    if (footerRef.current) {
      resizeObserver.observe(footerRef.current);
    }

    // Update khi window resize
    window.addEventListener("resize", updateFooterHeight);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateFooterHeight);
    };
  }, [typingUsers.length, selectedConversation]);

  // Fetch pinned messages when conversation changes
  // ✅ FIXED: Loại bỏ messages khỏi dependency để tránh infinite loop
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
          // Trường hợp response trực tiếp là array
          setPinnedMessages(response);
        } else {
          // Fallback: Lọc từ messages nếu API không trả về đúng
          const pinnedFromMessages = messages.filter((m) => m.pinned);
          setPinnedMessages(pinnedFromMessages);
        }
      } catch (error) {
        console.error("❌ Error fetching pinned messages:", error);
        // Fallback: Lọc từ messages
        const pinnedFromMessages = messages.filter((m) => m.pinned);
        setPinnedMessages(pinnedFromMessages);
      }
    };

    fetchPinnedMessages();
    // ✅ FIXED: Chỉ depend on conversationId, không depend on messages
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation?.id]);

  // Sync pinned messages từ messages array khi messages thay đổi
  // ✅ FIXED: Dùng useMemo để tránh infinite loop
  const pinnedFromMessagesMemo = useMemo(() => {
    if (messages.length === 0) return [];
    return messages.filter((m) => m.pinned);
  }, [messages]);

  // ✅ FIXED: Chỉ update khi pinned messages thực sự thay đổi
  const prevPinnedIdsRef = useRef<string>("");

  useEffect(() => {
    const currentPinnedIds = pinnedFromMessagesMemo
      .map((m) => m.id)
      .sort()
      .join(",");

    // Chỉ update nếu IDs thay đổi
    if (currentPinnedIds !== prevPinnedIdsRef.current) {
      prevPinnedIdsRef.current = currentPinnedIds;

      setPinnedMessages((prev) => {
        // Tạo Map từ existing pinned messages (từ API)
        const existingMap = new Map(prev.map((p) => [p.id, p]));

        // Cập nhật với pinned messages từ local messages
        pinnedFromMessagesMemo.forEach((msg) => {
          existingMap.set(msg.id, msg);
        });

        // Xóa những message không còn pinned nữa (dựa trên local messages)
        messages.forEach((msg) => {
          if (!msg.pinned && existingMap.has(msg.id)) {
            existingMap.delete(msg.id);
          }
        });

        const merged = Array.from(existingMap.values());

        // Sort theo thời gian mới nhất
        merged.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return merged;
      });
    }
    // ✅ FIXED: Chỉ depend on memoized pinned messages, không depend on full messages array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinnedFromMessagesMemo]);

  // ==================== Handlers ====================

  const toggleSearch = useCallback(() => {
    setShowSearch((prev) => !prev);
  }, []);

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

        // Clear previous timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // Stop typing after 1s of inactivity
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

      // Check if we have any done uploads
      const doneUploads = pendingUploads.filter((u) => u.status === "done");
      const hasMessage = inputMessage.trim().length > 0;
      const hasAttachments = doneUploads.length > 0;

      // Must have either message or attachments
      if (!hasMessage && !hasAttachments) return;
      if (!selectedConversation || isSending) return;

      const messageToSend = inputMessage.trim();

      setSendLocked(true); // Lock send button
      try {
        // Clear input trước để UI phản hồi nhanh
        setInputMessage("");

        // Focus input ngay lập tức
        inputRef.current?.focus();

        // Send messages with attachments via sendFile
        if (hasAttachments) {
          for (const upload of doneUploads) {
            const messageType = upload.kind === "image" ? "IMAGE" : "FILE";
            const contentToSend = hasMessage ? messageToSend : undefined;

            // Ensure thumbnail exists for images
            let thumb = upload.thumbnailFile;
            if (!thumb && upload.kind === "image") {
              try {
                thumb = await ThumbnailService.createThumbnail(upload.file);
              } catch (err) {
                console.warn(
                  "⚠️ Cannot create thumbnail, continue without thumb",
                  err
                );
              }
            }

            await sendMessageWithAttachment(
              contentToSend,
              messageType,
              upload.file,
              thumb
            );
          }

          // Clear pending uploads after successful send
          setPendingUploads([]);
        } else if (hasMessage) {
          // Normal text message (no attachments)
          sendMessageHook(messageToSend, "TEXT");
        }

        // Stop typing indicator
        if (selectedConversation) {
          sendTypingStatus(
            selectedConversation.id,
            false,
            user?.fullName || "User"
          );
        }

        // Clear timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }

        // Auto scroll to bottom
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
          setTimeout(() => {
            inputRef.current?.focus();
          }, 0);
        });
      } catch (error) {
        console.error("❌ Error sending message:", error);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      } finally {
        setSendLocked(false); // Unlock send button
      }
    },
    [
      inputMessage,
      selectedConversation,
      isSending,
      sendMessageHook,
      sendMessageWithAttachment,
      sendTypingStatus,
      user,
      scrollToBottom,
      pendingUploads,
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

      // Optimistic UI Update - Cập nhật ngay lập tức
      if (currentlyPinned) {
        // Bỏ ghim - xóa khỏi danh sách
        setPinnedMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      } else {
        // Ghim - tìm message và thêm vào đầu danh sách
        const messageToPin = messages.find((msg) => msg.id === messageId);
        if (messageToPin) {
          setPinnedMessages((prev) => [
            { ...messageToPin, pinned: true },
            ...prev,
          ]);
        }
      }

      // Gọi API toggle pin (không await vì là mutation)
      togglePin(messageId, !currentlyPinned);

      // Refresh từ server để đồng bộ
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
    // Logic đã được xử lý trong PinnedMessages component
  }, []);

  // Handle file selection: prepare pending with optional thumbnail, no upload
  const handleFileUpload = useCallback(
    async (file: File, type: "IMAGE" | "FILE") => {
      if (!selectedConversation || isUploading) return;

      setIsUploading(true);
      let pendingId: string | null = null;
      let previewUrl: string | undefined;
      try {
        const pending = addPendingUpload(
          file,
          type === "IMAGE" ? "image" : "file"
        );
        pendingId = pending.id;
        previewUrl = pending.previewUrl;

        // Create thumbnail for images (optional)
        let thumbnailFile: File | undefined;
        if (type === "IMAGE") {
          try {
            thumbnailFile = await ThumbnailService.createThumbnail(file);
          } catch (err) {
            console.warn("⚠️ Cannot create thumbnail", err);
          }
        }

        updatePendingUpload(pendingId!, {
          status: "done",
          thumbnailFile,
          previewUrl,
        });
      } catch (error) {
        console.error("❌ Error preparing file:", error);
        if (pendingId) {
          updatePendingUpload(pendingId, {
            status: "error",
            error: error instanceof Error ? error.message : "Upload failed",
          });

          if (previewUrl) {
            ThumbnailService.revokePreviewUrl(previewUrl);
          }
        }
        alert("Không thể tải file lên. Vui lòng thử lại.");
      } finally {
        setIsUploading(false);
      }
    },
    [addPendingUpload, selectedConversation, isUploading, updatePendingUpload]
  );

  // Handle image selection
  const handleImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type.startsWith("image/")) {
        handleFileUpload(file, "IMAGE");
      }
      // Reset input
      imageInputRef.current && (imageInputRef.current.value = "");
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    },
    [handleFileUpload]
  );

  // Handle file selection
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileUpload(file, "FILE");
      }
      // Reset input
      fileInputRef.current && (fileInputRef.current.value = "");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFileUpload]
  );

  // Trigger file input
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Trigger image input
  const triggerImageInput = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

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

      {/* Chat Container - Professional Layout Structure */}
      <div
        className={`chat chat-messages show`}
        id="middle"
        style={
          {
            display: "flex",
            flexDirection: "column",
            flex: 1, // Take remaining space after sidebar
            height: "100vh",
            maxHeight: "100vh",
            overflow: "hidden",
            position: "relative",
            "--footer-height": `${footerHeight}px`,
          } as React.CSSProperties
        }
      >
        {/* Header Section - Fixed at top */}
        <div style={{
          flexShrink: 0,
          zIndex: 10,
          position: 'relative',
        }}>
          {isGroupConversation ? (
            <GroupChatHeader
              conversation={selectedConversation}
              group={group}
              members={members}
              onlineMembersCount={getOnlineMembersCount()}
              onToggleSearch={toggleSearch}
              onShowMembers={() => {
                // Trigger Bootstrap modal for members
                const modal = document.querySelector('[data-bs-target="#group-members"]');
                if (modal) {
                  (modal as HTMLElement).click();
                }
              }}
              onShowEditGroup={() => {
                // Trigger Bootstrap modal for edit group
                const modal = document.querySelector('[data-bs-target="#edit-group"]');
                if (modal) {
                  (modal as HTMLElement).click();
                }
              }}
              isAdmin={isAdmin(user?.id || '')}
              showSearch={showSearch}
              searchKeyword={searchKeyword}
              onSearchChange={setSearchKeyword}
            />
          ) : (
            <>
              <ChatHeader
                selectedConversation={selectedConversation}
                onToggleSearch={toggleSearch}
              />

              <ChatSearch
                showSearch={showSearch}
                searchKeyword={searchKeyword}
                onSearchChange={setSearchKeyword}
              />
            </>
          )}
        </div>

        {/* Body Section - Scrollable, takes remaining space */}
        <div style={{
          flex: '1 1 auto',
          flexGrow: 1,
          flexShrink: 1,
          flexBasis: 0,
          minHeight: 0,
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {isGroupConversation ? (
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
            />
          ) : (
            <ChatBody
              messages={messages}
              filteredMessages={filteredMessages}
              pinnedMessages={pinnedMessages}
              isLoadingMessages={isLoadingMessages}
              searchKeyword={searchKeyword}
              selectedConversation={selectedConversation}
              currentUserId={user?.id}
              userAvatarUrl={user?.avatarUrl}
              userFullName={user?.fullName}
              userUsername={user?.username}
              footerHeight={footerHeight}
              messagesEndRef={messagesEndRef}
              onTogglePin={handleTogglePin}
              onDeleteMessage={handleDeleteMessage}
              onPinnedMessageClick={handlePinnedMessageClick}
              onUnpin={(messageId) => handleTogglePin(messageId, true)}
              typingUsers={typingUsers}
              // Cursor pagination props
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              onLoadMore={loadMoreMessages}
            />
          )}
        </div>

        {/* Footer Section - Fixed at bottom */}
        <div
          style={{
            flexShrink: 0,
            zIndex: 100,
            position: "relative",
          }}
        >
          {/* Typing Indicator - Positioned absolutely above footer */}
          {typingUsers.length > 0 && (
            <TypingIndicator typingUsers={typingUsers} />
          )}

          <ChatFooter
            footerRef={footerRef}
            selectedConversation={selectedConversation}
            inputMessage={inputMessage}
            inputRef={inputRef}
            imageInputRef={imageInputRef}
            fileInputRef={fileInputRef}
            isUploading={isUploading}
            isSending={isSending || sendLocked}
            pendingUploads={pendingUploads}
            onInputChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onSendMessage={handleSendMessage}
            onImageSelect={handleImageSelect}
            onFileSelect={handleFileSelect}
            onTriggerImageInput={triggerImageInput}
            onTriggerFileInput={triggerFileInput}
            footerHeight={footerHeight}
            onRemovePending={removePendingUpload}
            onEmojiSelect={(emoji) => setInputMessage((prev) => prev + emoji)}
          />
        </div>
      </div>
      {/* /Chat */}

      {/* Modals */}
      <ContactInfo selectedConversation={selectedConversation} />
    </>
  );
};

export default Chat;
