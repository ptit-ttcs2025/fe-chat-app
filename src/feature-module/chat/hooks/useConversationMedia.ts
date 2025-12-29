import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chatApi } from "@/apis/chat/chat.api";
import type { MediaMessage, PaginatedResponse, MessageResponse } from "@/apis/chat/chat.type";
import websocketService from "@/core/services/websocket.service";

export type MediaType = "IMAGE" | "FILE";

export interface MediaSection {
  dateKey: string; // e.g., '2025-12-31'
  label: string; // e.g., 'Hôm nay', 'Hôm qua', '31/12/2025'
  items: MediaMessage[];
}

interface UseMediaParams {
  conversationId: string;
  type: MediaType;
  pageSize?: number;
  autoRefreshMs?: number; // optional polling & prepend
  enabled?: boolean;
}

const formatDateKey = (iso: string) => {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatDateLabel = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startD = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.floor((startToday - startD) / 86400000);
  if (dayDiff === 0) return "Hôm nay";
  if (dayDiff === 1) return "Hôm qua";
  const dd = `${d.getDate()}`.padStart(2, "0");
  const mm = `${d.getMonth() + 1}`.padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const groupByDay = (items: MediaMessage[]): MediaSection[] => {
  const map = new Map<string, MediaSection>();
  for (const it of items) {
    const createdAt = it.createdAt;
    const dateKey = formatDateKey(createdAt);
    if (!map.has(dateKey)) {
      map.set(dateKey, {
        dateKey,
        label: formatDateLabel(createdAt),
        items: [],
      });
    }
    map.get(dateKey)!.items.push(it);
  }
  // Order by newest day first; items assumed DESC by createdAt already from API
  return Array.from(map.values()).sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
};

export const useConversationMedia = ({
  conversationId,
  type,
  pageSize = 50,
  autoRefreshMs,
  enabled = true,
}: UseMediaParams) => {
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [items, setItems] = useState<MediaMessage[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());

  const fetchPage = useCallback(
    async (pageNumber: number): Promise<PaginatedResponse<MediaMessage> | null> => {
      if (!enabled) return null;
      try {
        setLoading(true);
        const res = await chatApi.getMediaMessages({
          conversationId,
          type,
          page: pageNumber,
          size: pageSize,
        });
        return res;
      } catch (e) {
        console.warn("getMediaMessages error", e);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [conversationId, type, pageSize, enabled]
  );

  // initial load & page changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetchPage(page);
      if (!res || cancelled) return;

      const next: MediaMessage[] = [];
      for (const it of res.results) {
        if (!it.attachment || !it.attachment.url) continue; // guard invalid
        const id = String(it.id);
        if (!seenIdsRef.current.has(id)) {
          seenIdsRef.current.add(id);
          next.push(it);
        }
      }
      setItems(prev => (page === 0 ? next : [...prev, ...next]));
      setHasMore(res.meta.pageNumber + 1 < res.meta.totalPages);
    })();
    return () => {
      cancelled = true;
    };
  }, [page, fetchPage]);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setRefreshing(true);
    try {
      const res = await fetchPage(0);
      if (!res) return;
      const toPrepend: MediaMessage[] = [];
      for (const it of res.results) {
        if (!it.attachment || !it.attachment.url) continue;
        const id = String(it.id);
        if (!seenIdsRef.current.has(id)) {
          seenIdsRef.current.add(id);
          toPrepend.push(it);
        }
      }
      if (toPrepend.length) {
        setItems(prev => [...toPrepend, ...prev]);
      }
      setHasMore(res.meta.pageNumber + 1 < res.meta.totalPages);
    } finally {
      setRefreshing(false);
    }
  }, [fetchPage, enabled]);

  // optional auto-refresh (polling)
  useEffect(() => {
    if (!autoRefreshMs || !enabled) return;
    const id = setInterval(() => {
      void refresh();
    }, autoRefreshMs);
    return () => clearInterval(id);
  }, [autoRefreshMs, refresh, enabled]);

  // WebSocket-triggered refresh: listen for new media messages
  useEffect(() => {
    if (!conversationId || !enabled) return;

    const handleNewMessage = (message: MessageResponse) => {
      // Only refresh if message is in this conversation and has matching media type
      if (message.conversationId !== conversationId) return;

      const hasMatchingMedia =
        message.attachment &&
        ((type === "IMAGE" && message.type === "IMAGE") ||
         (type === "FILE" && message.type === "FILE"));

      if (hasMatchingMedia) {
        console.log(`🔔 New ${type} detected via WebSocket, refreshing...`);
        void refresh(); // Silent prepend new media
      }
    };

    // Subscribe to WebSocket conversation messages
    const unsubscribe = websocketService.on("conversation-message", handleNewMessage);

    return () => {
      unsubscribe();
    };
  }, [conversationId, type, refresh, enabled]);

  // Visibility-based refresh: refresh when user returns to tab
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && conversationId) {
        console.log("👀 Tab visible, refreshing media...");
        void refresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [conversationId, refresh, enabled]);

  // reset when conversation or type changes
  useEffect(() => {
    setPage(0);
    setItems([]);
    setHasMore(true);
    seenIdsRef.current.clear();
  }, [conversationId, type]);

  const sections = useMemo(() => groupByDay(items), [items]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore && enabled) setPage(p => p + 1);
  }, [loading, hasMore, enabled]);

  return {
    sections,
    loading,
    refreshing,
    hasMore,
    loadMore,
    refresh,
  };
};

