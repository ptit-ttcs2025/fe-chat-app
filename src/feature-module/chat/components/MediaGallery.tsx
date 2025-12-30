import { memo, useEffect, useRef } from "react";
import type { MediaMessage } from "@/apis/chat/chat.type";
import { useConversationMedia } from "../hooks/useConversationMedia";

interface MediaGalleryProps {
  conversationId: string;
  type: "IMAGE" | "FILE";
  autoRefreshMs?: number;
  className?: string;
}

export const MediaGallery = memo(({ conversationId, type, autoRefreshMs = 60000, className }: MediaGalleryProps) => {
  const { sections, loading, refreshing, hasMore, loadMore, refresh } = useConversationMedia({
    conversationId,
    type,
    pageSize: 50,
    autoRefreshMs,
  });

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const pullingRef = useRef(false);
  const startYRef = useRef(0);

  // infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!bottomRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore();
      },
      { root: scrollRef.current ?? null, threshold: 0 }
    );
    io.observe(bottomRef.current);
    return () => io.disconnect();
  }, [loadMore]);

  // pull-to-refresh for touch
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (el.scrollTop <= 0) {
        pullingRef.current = true;
        startYRef.current = e.touches[0].clientY;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!pullingRef.current) return;
      const dy = e.touches[0].clientY - startYRef.current;
      if (dy > 70) {
        pullingRef.current = false;
        void refresh();
      }
    };
    const onTouchEnd = () => {
      pullingRef.current = false;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [refresh]);

  const renderThumb = (m: MediaMessage) => {
    const src = m.attachment.thumbnailUrl || m.attachment.url;
    const name = m.attachment.fileName || m.id;

    if (type === "IMAGE" && src) {
      return (
        <img
          src={src}
          alt={String(name)}
          loading="lazy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          onClick={() => window.open(m.attachment.url, "_blank")}
        />
      );
    }

    // FILE - hiển thị với metadata
    const formatFileSize = (bytes?: number) => {
      if (!bytes || bytes <= 0) return "0 KB";
      const kb = bytes / 1024;
      if (kb >= 1024) {
        const mb = kb / 1024;
        return `${mb.toFixed(1)} MB`;
      }
      return `${kb.toFixed(1)} KB`;
    };

    return (
      <div className="d-flex align-items-center justify-content-between w-100 px-2" style={{ minHeight: 48 }}>
        <div className="d-flex align-items-center flex-grow-1" style={{ minWidth: 0 }}>
          <span className="me-2">
            <i className="ti ti-file" style={{ fontSize: "24px" }} />
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              className="text-truncate fw-medium"
              style={{ fontSize: "13px" }}
              title={String(name)}
            >
              {String(name)}
            </div>
            <div className="text-muted" style={{ fontSize: "11px" }}>
              {formatFileSize(m.attachment.fileSize)} • {new Date(m.createdAt).toLocaleDateString("vi-VN")}
            </div>
          </div>
        </div>
        <a
          href={m.attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sm btn-link text-primary p-0 ms-2"
          title="Tải xuống"
        >
          <i className="ti ti-download" />
        </a>
      </div>
    );
  };

  return (
    <div className={"media-gallery-wrapper " + (className ?? "")}>
      {/* Removed toolbar - auto-refresh via polling + WebSocket */}

      <div className="media-scroll" ref={scrollRef} style={{ overflow: "auto", height: "100%" }}>
        {/* Pull-to-refresh indicator (visible when refreshing) */}
        {refreshing && (
          <div className="text-center py-2">
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Đang làm mới...</span>
            </div>
          </div>
        )}

        {sections.length === 0 && !loading ? (
          <div className="text-center py-5">
            <i
              className={type === "IMAGE" ? "ti ti-photo-off" : "ti ti-file-off"}
              style={{ fontSize: "48px", color: "#dee2e6" }}
            />
            <p className="text-muted mt-2" style={{ fontSize: "13px" }}>
              {type === "IMAGE" ? "Chưa có ảnh nào" : "Chưa có tài liệu nào"}
            </p>
          </div>
        ) : (
          sections.map((section) => (
            <div key={section.dateKey} className="media-section mb-3">
              <div className="media-section-header text-muted fw-semibold mb-2" style={{ fontSize: "12px" }}>
                {section.label}
              </div>
              {type === "IMAGE" ? (
                <div className="row g-2">
                  {section.items.map((item) => (
                    <div key={item.id} className="col-4">
                      <div
                        className="media-cell border rounded overflow-hidden"
                        style={{
                          aspectRatio: "1/1",
                          position: "relative",
                        }}
                      >
                        {renderThumb(item)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="list-group">
                  {section.items.map((item) => (
                    <div key={item.id} className="list-group-item p-0 border-0 border-bottom">
                      {renderThumb(item)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}

        <div ref={bottomRef} style={{ height: 1 }} />
        {loading && <div className="text-center text-muted py-2">Đang tải...</div>}
        {!hasMore && sections.length > 0 && <div className="text-center text-muted small py-2">Đã hiển thị tất cả</div>}
      </div>
    </div>
  );
});

export default MediaGallery;

