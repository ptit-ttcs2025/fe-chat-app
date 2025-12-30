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
          // Some API responses may include messages without attachment; guard them
          const validResults = response.results.filter(
            (item) => item?.attachment && item.attachment.url
          );
          if (validResults.length !== response.results.length) {
            console.warn(
              `⚠️ Filtered out ${response.results.length - validResults.length} media items without attachments`
            );
          }

          if (append) {
            setMedia((prev) => [...prev, ...validResults]);
          } else {
            setMedia(validResults);
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
    // ✅ Guard: Chỉ fetch khi conversationId hợp lệ
    if (conversationId && conversationId.trim() !== "" && enabled) {
      setMedia([]);
      setCurrentPage(0);
      fetchMedia(0, false);
    } else if (!conversationId || conversationId.trim() === "") {
      // Reset state khi không có conversationId
      setMedia([]);
      setCurrentPage(0);
      setTotalPages(0);
      setTotalCount(0);
      setError(null);
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
