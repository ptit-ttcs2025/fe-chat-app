/**
 * Search Navigation Component
 * Displays search result counter and navigation controls (prev/next/close)
 */

interface SearchNavigationProps {
  currentIndex: number;
  totalResults: number;
  onNavigate: (direction: 'prev' | 'next') => void;
  onClose: () => void;
}

const SearchNavigation = ({
  currentIndex,
  totalResults,
  onNavigate,
  onClose,
}: SearchNavigationProps) => {
  if (totalResults === 0) {
    return null;
  }

  const currentPosition = currentIndex + 1;
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < totalResults - 1;

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Result Counter */}
      <div
        style={{
          fontSize: '14px',
          fontWeight: 500,
          color: '#374151',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <i className="ti ti-search" style={{ fontSize: '16px', color: '#667eea' }} />
        <span>
          {currentPosition} / {totalResults} kết quả
        </span>
      </div>

      {/* Navigation Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {/* Prev Button */}
        <button
          type="button"
          onClick={() => onNavigate('prev')}
          disabled={!canGoPrev}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            backgroundColor: canGoPrev ? '#ffffff' : '#f9fafb',
            color: canGoPrev ? '#374151' : '#9ca3af',
            cursor: canGoPrev ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
            fontSize: '16px',
          }}
          onMouseEnter={(e) => {
            if (canGoPrev) {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.borderColor = '#667eea';
            }
          }}
          onMouseLeave={(e) => {
            if (canGoPrev) {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }
          }}
          title="Kết quả trước"
        >
          <i className="ti ti-chevron-up" />
        </button>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onNavigate('next')}
          disabled={!canGoNext}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            backgroundColor: canGoNext ? '#ffffff' : '#f9fafb',
            color: canGoNext ? '#374151' : '#9ca3af',
            cursor: canGoNext ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
            fontSize: '16px',
          }}
          onMouseEnter={(e) => {
            if (canGoNext) {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.borderColor = '#667eea';
            }
          }}
          onMouseLeave={(e) => {
            if (canGoNext) {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }
          }}
          title="Kết quả tiếp theo"
        >
          <i className="ti ti-chevron-down" />
        </button>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            backgroundColor: '#ffffff',
            color: '#6b7280',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontSize: '16px',
            marginLeft: '4px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#fef2f2';
            e.currentTarget.style.borderColor = '#ef4444';
            e.currentTarget.style.color = '#ef4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.color = '#6b7280';
          }}
          title="Đóng tìm kiếm"
        >
          <i className="ti ti-x" />
        </button>
      </div>
    </div>
  );
};

export default SearchNavigation;

