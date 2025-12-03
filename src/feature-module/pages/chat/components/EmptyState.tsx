interface EmptyStateProps {
  type: 'loading' | 'no-results' | 'no-messages' | 'no-conversation';
}

const EmptyState = ({ type }: EmptyStateProps) => {
  const configs = {
    loading: {
      icon: 'ti ti-loader',
      title: 'Đang tải tin nhắn...',
      description: '',
      showSpinner: true,
    },
    'no-results': {
      icon: 'ti ti-search-off',
      title: 'Không tìm thấy kết quả',
      description: 'Thử tìm với từ khóa khác',
      showSpinner: false,
    },
    'no-messages': {
      icon: 'ti ti-message-off',
      title: 'Chưa có tin nhắn nào',
      description: 'Hãy bắt đầu cuộc trò chuyện! 💬',
      showSpinner: false,
    },
    'no-conversation': {
      icon: 'ti ti-message-circle',
      title: 'Chọn một cuộc trò chuyện',
      description: 'Chọn một cuộc trò chuyện từ sidebar để bắt đầu',
      showSpinner: false,
    },
  };

  const config = configs[type];
  const containerClass = type === 'loading' ? 'loading-state-container' : 'empty-state-container';

  return (
    <div className={containerClass}>
      {config.showSpinner ? (
        <div className="spinner-border text-primary" role="status" style={{ 
          width: '48px', 
          height: '48px', 
          borderWidth: '4px',
          color: '#667eea'
        }}>
          <span className="visually-hidden">Đang tải...</span>
        </div>
      ) : (
        <i className={config.icon} style={{ fontSize: "64px", color: "#667eea", display: 'block', marginBottom: '16px' }} />
      )}
      <h5 style={{ marginTop: 0, marginBottom: '8px', fontSize: '18px', fontWeight: '600', color: '#333' }}>
        {config.title}
      </h5>
      {config.description && (
        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
          {config.description}
        </p>
      )}
    </div>
  );
};

export default EmptyState;

