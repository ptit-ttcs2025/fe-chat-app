/**
 * Custom Hook for Chat Conversations Management
 * Quản lý danh sách conversations
 */

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/apis/chat/chat.api';
import type {
    IConversation,
    CreateConversationRequest,
    ConversationFilter,
    MessageResponse,
} from '@/apis/chat/chat.type';
import websocketService from '@/core/services/websocket.service';

interface UseChatConversationsOptions {
    pageSize?: number;
    filter?: ConversationFilter;
    autoRefresh?: boolean;
}

export const useChatConversations = ({
    pageSize = 20,
    filter,
    autoRefresh = true,
}: UseChatConversationsOptions = {}) => {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(0);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
        null
    );

    // Query key
    const queryKey = ['chat', 'conversations', page, filter];

    // Fetch conversations
    const {
        data: conversationsData,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey,
        queryFn: () => chatApi.getConversations(page, pageSize, filter),
        staleTime: autoRefresh ? 10000 : 30000, // 10s or 30s
        refetchInterval: autoRefresh ? 30000 : false, // Auto refresh every 30s
    });

    // Get single conversation
    const useConversation = (conversationId: string | null) => {
        return useQuery({
            queryKey: ['chat', 'conversation', conversationId],
            queryFn: () =>
                conversationId
                    ? chatApi.getConversation(conversationId)
                    : Promise.reject('No conversation ID'),
            enabled: !!conversationId,
            staleTime: 30000,
        });
    };

    // Mutation: Create conversation
    const createConversationMutation = useMutation({
        mutationFn: (data: CreateConversationRequest) =>
            chatApi.createConversation(data),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
            
            // ✅ NEW: Subscribe to new conversation immediately
            if (response.data?.id) {
                websocketService.subscribeNewConversation(response.data.id);
                setSelectedConversationId(response.data.id);
            }
        },
        onError: (error) => {
            console.error('❌ Failed to create conversation:', error);
        },
    });

    // Mutation: Delete conversation
    const deleteConversationMutation = useMutation({
        mutationFn: (conversationId: string) =>
            chatApi.deleteConversation(conversationId),
        onSuccess: (_, conversationId) => {
            queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });

            // Clear selection if deleted conversation was selected
            if (selectedConversationId === conversationId) {
                setSelectedConversationId(null);
            }
        },
        onError: (error) => {
            console.error('❌ Failed to delete conversation:', error);
        },
    });

    // Mutation: Mute/Unmute conversation
    const toggleMuteMutation = useMutation({
        mutationFn: ({
            conversationId,
            muted,
        }: {
            conversationId: string;
            muted: boolean;
        }) => chatApi.toggleMuteConversation(conversationId, muted),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
            queryClient.invalidateQueries({
                queryKey: ['chat', 'conversation', response.data?.id],
            });
        },
        onError: (error) => {
            console.error('❌ Failed to update mute status:', error);
        },
    });

    // Mutation: Pin/Unpin conversation
    const togglePinMutation = useMutation({
        mutationFn: ({
            conversationId,
            pinned,
        }: {
            conversationId: string;
            pinned: boolean;
        }) => chatApi.togglePinConversation(conversationId, pinned),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
            queryClient.invalidateQueries({
                queryKey: ['chat', 'conversation', response.data?.id],
            });
        },
        onError: (error) => {
            console.error('❌ Failed to update pin status:', error);
        },
    });

    // Mutation: Leave conversation
    const leaveConversationMutation = useMutation({
        mutationFn: (conversationId: string) =>
            chatApi.leaveConversation(conversationId),
        onSuccess: (_, conversationId) => {
            queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });

            // Clear selection if left conversation was selected
            if (selectedConversationId === conversationId) {
                setSelectedConversationId(null);
            }
        },
        onError: (error) => {
            console.error('❌ Failed to leave conversation:', error);
        },
    });

    // Helper: Create conversation
    const createConversation = useCallback(
        (data: CreateConversationRequest) => {
            createConversationMutation.mutate(data);
        },
        [createConversationMutation]
    );

    // Helper: Delete conversation
    const deleteConversation = useCallback(
        (conversationId: string) => {
            deleteConversationMutation.mutate(conversationId);
        },
        [deleteConversationMutation]
    );

    // Helper: Toggle mute
    const toggleMute = useCallback(
        (conversationId: string, muted: boolean) => {
            toggleMuteMutation.mutate({ conversationId, muted });
        },
        [toggleMuteMutation]
    );

    // Helper: Toggle pin
    const togglePin = useCallback(
        (conversationId: string, pinned: boolean) => {
            togglePinMutation.mutate({ conversationId, pinned });
        },
        [togglePinMutation]
    );

    // Helper: Leave conversation
    const leaveConversation = useCallback(
        (conversationId: string) => {
            leaveConversationMutation.mutate(conversationId);
        },
        [leaveConversationMutation]
    );

    // Helper: Select conversation
    const selectConversation = useCallback((conversationId: string | null) => {
        setSelectedConversationId(conversationId);
    }, []);

    // Helper: Load more
    const loadMore = useCallback(() => {
        if (conversationsData?.data?.hasNext) {
            setPage((prev) => prev + 1);
        }
    }, [conversationsData]);

    // Helper: Refresh
    const refresh = useCallback(() => {
        setPage(0);
        refetch();
    }, [refetch]);

  // conversationsData bây giờ là PaginatedResponse<IConversation> trực tiếp
  const results = conversationsData?.results || [];
  const meta = conversationsData?.meta || null;

  // Find selected conversation
  const findSelectedConversation = () => {
    if (!selectedConversationId || !Array.isArray(results)) return undefined;
    return results.find((c: IConversation) => c.id === selectedConversationId);
  };

  // ✅ NEW: Listen to messages for ALL conversations to update previews and unread counts
  useEffect(() => {
    const unsubscribe = websocketService.on('conversation-message', (message: MessageResponse) => {
      // Update conversation preview and unread count in React Query cache
      queryClient.setQueryData(
        ['chat', 'conversations', page, filter],
        (oldData: any) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            results: oldData.results.map((conv: IConversation) => {
              if (conv.id === message.conversationId) {
                return {
                  ...conv,
                  lastMessage: message.content,
                  lastMessageTime: message.createdAt,
                  // Increment unread if not current conversation
                  unreadCount: conv.id === selectedConversationId 
                    ? conv.unreadCount 
                    : (conv.unreadCount || 0) + 1
                };
              }
              return conv;
            })
          };
        }
      );
    });
    
    return () => unsubscribe();
  }, [selectedConversationId, queryClient, page, filter]);

  return {
    // Data
    conversations: Array.isArray(results) ? results : [],
    isLoading,
    error,
    hasMore: meta ? meta.pageNumber < meta.totalPages - 1 : false,
    totalPages: meta?.totalPages || 0,
    currentPage: page,

        // Selected conversation
        selectedConversationId,
        selectedConversation: findSelectedConversation(),

        // Actions
        createConversation,
        deleteConversation,
        toggleMute,
        togglePin,
        leaveConversation,
        selectConversation,
        loadMore,
        refresh,

        // Mutation states
        isCreating: createConversationMutation.isPending,
        isDeleting: deleteConversationMutation.isPending,

        // Hook for single conversation
        useConversation,
    };
};

/**
 * Hook để tìm kiếm conversations
 */
export const useSearchConversations = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<ConversationFilter>({});

    const { conversations, isLoading } = useChatConversations({
        filter: {
            ...filter,
            searchTerm: searchTerm || undefined,
        },
    });

    return {
        searchTerm,
        setSearchTerm,
        filter,
        setFilter,
        results: conversations,
        isLoading,
    };
};

/**
 * Hook để lấy unread count
 */
export const useUnreadCount = () => {
    const { data, refetch } = useQuery({
        queryKey: ['chat', 'unread', 'total'],
        queryFn: () => chatApi.getTotalUnreadCount(),
        staleTime: 5000,
        refetchInterval: 10000, // Refresh every 10s
    });

    return {
        unreadCount: data?.data || 0,
        refresh: refetch,
    };
};

/**
 * Hook để lấy unread count của một conversation
 */
export const useConversationUnreadCount = (conversationId: string | null) => {
    const { data, refetch } = useQuery({
        queryKey: ['chat', 'unread', conversationId],
        queryFn: () =>
            conversationId
                ? chatApi.getConversationUnreadCount(conversationId)
                : Promise.reject('No conversation ID'),
        enabled: !!conversationId,
        staleTime: 5000,
        refetchInterval: 10000,
    });

    return {
        unreadCount: data?.data || 0,
        refresh: refetch,
    };
};

