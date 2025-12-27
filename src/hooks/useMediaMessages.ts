/**
 * Custom hook để lấy media files (ảnh/file) từ conversation
 */

import { useState, useEffect, useCallback } from "react";
import { chatApi } from "@/apis/chat/chat.api";
import { MediaMessage, PaginatedResponse } from "@/apis/chat/chat.type";

interface UseMediaMessagesProps {
  conversationId: string | null;
  type: "IMAGE" | "FILE";
  pageSize?: number;
  enabled?: boolean;
}

interface UseMediaMessagesReturn {
  media: MediaMessage[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  totalCount: number;
}

export const useMediaMessages = ({
  conversationId,
  type,
  pageSize = 20,
  enabled = true,
}: UseMediaMessagesProps): UseMediaMessagesReturn => {
  const [media, setMedia] = useState<MediaMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch media messages
  const fetchMedia = useCallback(
    async (page: number, append: boolean = false) => {
      if (!conversationId || !enabled) return;

      setIsLoading(true);
      setError(null);

      try {
        const response: PaginatedResponse<MediaMessage> =
          await chatApi.getMediaMessages({
            conversationId,
            type,
            page,
            size: pageSize,
          });

        if (response.results) {
          if (append) {
            setMedia((prev) => [...prev, ...response.results]);
          } else {
            setMedia(response.results);
          }

          setTotalPages(response.meta.totalPages);
          setTotalCount(response.meta.totalElements);
          setCurrentPage(page);
        }
      } catch (err) {
        console.error(`❌ Error fetching ${type} media:`, err);
        setError(err instanceof Error ? err.message : "Failed to load media");
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, type, pageSize, enabled]
  );

  // Initial fetch
  useEffect(() => {
    if (conversationId && enabled) {
      setMedia([]);
      setCurrentPage(0);
      fetchMedia(0, false);
    }
  }, [conversationId, enabled, fetchMedia]);

  // Load more (pagination)
  const loadMore = useCallback(() => {
    if (!isLoading && currentPage < totalPages - 1) {
      fetchMedia(currentPage + 1, true);
    }
  }, [isLoading, currentPage, totalPages, fetchMedia]);

  // Refresh
  const refresh = useCallback(() => {
    setMedia([]);
    setCurrentPage(0);
    fetchMedia(0, false);
  }, [fetchMedia]);

  return {
    media,
    isLoading,
    error,
    hasMore: currentPage < totalPages - 1,
    loadMore,
    refresh,
    totalCount,
  };
};
