/**
 * Chat Styles - Tất cả CSS styles cho chat component
 */

export const chatStyles = `
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  /* ========== TYPING INDICATOR - DƯỚI INPUT ========== */
  .typing-indicator-footer {
    position: absolute;
    bottom: 100%;
    left: 0;
    right: 0;
    padding: 8px 20px;
    background: #f8f9fa;
    border-top: 1px solid #e9ecef;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #667eea;
    animation: slideUp 0.3s ease;
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .typing-indicator-modern {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  
  .typing-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #667eea;
    animation: pulse 1.4s infinite;
  }
  
  .typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .typing-dot:nth-child(3) { animation-delay: 0.4s; }
  
  /* ========== PIN BADGE MODERN ========== */
  .pin-badge-modern {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    font-size: 10px;
    margin-left: 8px;
    box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
    flex-shrink: 0;
  }
  
  .pin-badge-modern i {
    font-size: 10px;
  }
  
  /* ========== TRUNCATE TÊN NGƯỜI DÙNG ========== */
  .chat-profile-name h6 {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    gap: 8px;
  }
  
  .chat-profile-name h6 > span:first-of-type,
  .chat-profile-name h6 > span:first-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 180px;
    display: inline-block;
  }
  
  .chat-header .ms-2 h6 {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 200px;
  }
  
  /* ========== SEARCH BAR - ẨN MẶC ĐỊNH ========== */
  .chat-search.search-wrap.contact-search {
    max-height: 0 !important;
    opacity: 0 !important;
    overflow: hidden !important;
    padding: 0 15px !important;
    transition: all 0.3s ease !important;
    visibility: hidden !important;
    flex-shrink: 0 !important;
  }
  
  .chat-search.search-wrap.contact-search.visible-chat {
    max-height: 60px !important;
    opacity: 1 !important;
    padding: 10px 15px !important;
    background: #f8f9fa !important;
    border-bottom: 1px solid #e9ecef !important;
    visibility: visible !important;
    flex-shrink: 0 !important;
    position: relative !important;
    z-index: 100 !important;
  }
  
  /* ========== MAIN CHAT LAYOUT - PROFESSIONAL FLEXBOX STRUCTURE ========== */
  #middle.chat.chat-messages {
    display: flex !important;
    flex-direction: column !important;
    height: 100vh !important;
    max-height: 100vh !important;
    overflow: hidden !important;
    position: relative !important;
    background: #ffffff !important;
  }
  
  /* Header Section - Fixed at top */
  #middle.chat.chat-messages > div:first-of-type {
    flex-shrink: 0 !important;
    z-index: 10 !important;
    position: relative !important;
    background: #fff !important;
  }
  
  /* Body Section - Scrollable, takes remaining space */
  #middle.chat.chat-messages > div:nth-of-type(2) {
    flex: 1 1 auto !important;
    flex-grow: 1 !important;
    flex-shrink: 1 !important;
    flex-basis: 0 !important;
    min-height: 0 !important;
    overflow: hidden !important;
    position: relative !important;
    display: flex !important;
    flex-direction: column !important;
  }
  
  /* Footer Section - Fixed at bottom */
  #middle.chat.chat-messages > div:last-of-type {
    flex-shrink: 0 !important;
    z-index: 100 !important;
    position: relative !important;
    background: #fff !important;
  }
  
  /* Header - fixed at top */
  .chat-header {
    flex-shrink: 0 !important;
    background: #fff !important;
    z-index: 10 !important;
    position: relative !important;
    border-bottom: 1px solid #e9ecef !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    padding: 12px 20px !important;
    min-height: 64px !important;
    box-sizing: border-box !important;
  }
  
  .chat-header .user-details {
    display: flex !important;
    align-items: center !important;
    flex: 1 1 auto !important;
    min-width: 0 !important;
  }
  
  .chat-header .chat-options {
    flex-shrink: 0 !important;
  }
  
  /* ========== CHAT BODY - SCROLL AREA ========== */
  .chat-body.chat-page-group {
    flex: 1 1 auto !important;
    flex-grow: 1 !important;
    flex-shrink: 1 !important;
    flex-basis: 0 !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    padding: 0 !important;
    min-height: 0 !important;
    display: flex !important;
    flex-direction: column !important;
    position: relative !important;
    width: 100% !important;
    height: 100% !important;
    background-color: #f0f2f5 !important;
    visibility: visible !important;
    opacity: 1 !important;
    box-sizing: border-box !important;
  }
  
  /* Custom scrollbar */
  .chat-body.chat-page-group::-webkit-scrollbar {
    width: 6px;
  }
  
  .chat-body.chat-page-group::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  
  .chat-body.chat-page-group::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 10px;
  }
  
  .chat-body.chat-page-group::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
  
  .messages {
    display: flex !important;
    flex-direction: column !important;
    gap: 0 !important;
    flex: 1 1 auto !important;
    min-height: min-content !important;
    width: 100% !important;
    position: relative !important;
    visibility: visible !important;
    opacity: 1 !important;
    padding: 16px 20px 20px 20px !important;
    box-sizing: border-box !important;
  }
  
  .messages .chats {
    visibility: visible !important;
    opacity: 1 !important;
    display: flex !important;
    margin-bottom: 8px !important;
  }
  
  .messages .chats:last-child {
    margin-bottom: 0 !important;
  }
  
  /* Group messages from same sender - thêm spacing */
  .messages .chats + .chats:not(.chats-right) {
    margin-top: 2px !important;
  }
  
  .messages .chats.chats-right + .chats.chats-right {
    margin-top: 2px !important;
  }
  
  /* Khi đổi người gửi - thêm spacing lớn hơn */
  .messages .chats:not(.chats-right) + .chats.chats-right,
  .messages .chats.chats-right + .chats:not(.chats-right) {
    margin-top: 12px !important;
  }
  
  /* ========== EMPTY/LOADING STATE - CĂN GIỮA ========== */
  .empty-state-container,
  .loading-state-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: calc(100% - 40px);
    max-width: 400px;
    text-align: center;
    padding: 20px;
    z-index: 1;
  }
  
  .empty-state-container i,
  .loading-state-container i {
    display: block;
    margin: 0 auto 16px;
  }
  
  .empty-state-container h5,
  .loading-state-container h5 {
    margin-top: 0;
    margin-bottom: 8px;
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }
  
  .empty-state-container p,
  .loading-state-container p {
    margin: 0;
    font-size: 14px;
    color: #666;
  }
  
  .loading-state-container .spinner-border {
    width: 48px;
    height: 48px;
    border-width: 4px;
    margin: 0 auto;
    border-color: #667eea;
    border-right-color: transparent;
  }
  
  /* ========== FOOTER - FIXED AT BOTTOM ========== */
  .chat-footer {
    flex-shrink: 0 !important;
    background: #fff !important;
    border-top: 1px solid #e9ecef !important;
    padding: 16px 20px !important;
    z-index: 100 !important;
    position: relative !important;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05) !important;
    visibility: visible !important;
    opacity: 1 !important;
    display: block !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }
  
  .footer-form {
    margin: 0;
  }
  
  .chat-footer-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .chat-footer-wrap .form-wrap {
    flex: 1;
    position: relative;
  }
  
  .chat-footer-wrap .form-wrap .form-control {
    width: 100%;
    height: 42px;
    border-radius: 21px;
    padding: 0 18px;
    border: 1px solid #d0d0d0;
    background: #f8f9fa;
    font-size: 14px;
    line-height: 42px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    outline: none;
    color: #212529;
    letter-spacing: 0;
    box-shadow: none;
  }
  
  .chat-footer-wrap .form-wrap .form-control:hover:not(:disabled) {
    background: #fff;
    border-color: #c0c0c0;
  }
  
  .chat-footer-wrap .form-wrap .form-control:focus {
    background: #fff;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    transform: none;
  }
  
  .chat-footer-wrap .form-wrap .form-control:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
    opacity: 0.6;
    border-color: #e0e0e0;
  }
  
  .chat-footer-wrap .form-wrap .form-control::placeholder {
    color: #9ca3af;
    font-style: normal;
    font-weight: 400;
  }
  
  .chat-footer-wrap .form-item {
    flex-shrink: 0;
  }
  
  .chat-footer-wrap .form-item .action-circle {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;
    color: #666;
    transition: all 0.2s ease;
  }
  
  .chat-footer-wrap .form-item .action-circle:hover {
    background: #667eea;
    color: #fff;
  }
  
  .chat-footer-wrap .form-btn {
    flex-shrink: 0;
  }
  
  .chat-footer-wrap .form-btn button {
    border-radius: 50%;
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    color: #fff;
    font-size: 18px;
    transition: all 0.25s ease;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  }
  
  .chat-footer-wrap .form-btn button:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }
  
  .chat-footer-wrap .form-btn button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  /* ========== MESSAGE ITEM - MODERN CHAT BUBBLES (WhatsApp/Messenger Style) ========== */
  .chats {
    display: flex !important;
    flex-direction: row !important;
    align-items: flex-end !important;
    gap: 10px !important;
    max-width: 70% !important;
    width: fit-content !important;
    position: relative !important;
    animation: slideIn 0.2s ease-out;
    visibility: visible !important;
    opacity: 1 !important;
    z-index: 1 !important;
    box-sizing: border-box !important;
    margin-bottom: 8px !important;
    padding: 0 !important;
  }
  
  .chats:last-child {
    margin-bottom: 0 !important;
  }
  
  /* Own message styling - Right aligned */
  .chats.chats-right {
    justify-content: flex-end !important;
    align-self: flex-end !important;
    margin-left: auto !important;
    margin-right: 0 !important;
    flex-direction: row-reverse !important;
  }
  
  /* Other messages - Left aligned */
  .chats:not(.chats-right) {
    align-self: flex-start !important;
    margin-left: 0 !important;
    margin-right: auto !important;
    flex-direction: row !important;
  }
  
  @media (max-width: 768px) {
    .chats {
      max-width: 80% !important;
    }
    
    .chat-body.chat-page-group {
      padding: 15px 15px 15px 15px !important;
    }
  }
  
  .chats.chats-right .message-content {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    color: white !important;
  }
  
  .chats.chats-right .chat-time {
    color: rgba(255,255,255,0.8) !important;
  }
  
  /* Chat content styling */
  .chat-content {
    flex: 1 !important;
    min-width: 0 !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
    display: flex !important;
    flex-direction: column !important;
  }
  
  .chat-info {
    position: relative !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }
  
  /* Sender name styling */
  .chat-profile-name {
    margin-bottom: 4px !important;
    padding-left: 2px !important;
  }
  
  .chat-profile-name span {
    font-size: 12px !important;
    font-weight: 500 !important;
    color: #667eea !important;
  }
  
  /* Modern message bubble - Left messages */
  .message-content {
    border-radius: 18px 18px 18px 4px !important;
    background: #ffffff !important;
    padding: 10px 14px 8px 14px !important;
    color: #1f2937 !important;
    font-size: 14px !important;
    font-weight: 400 !important;
    word-wrap: break-word !important;
    word-break: break-word !important;
    overflow-wrap: break-word !important;
    white-space: pre-wrap !important;
    display: inline-block !important;
    max-width: 100% !important;
    min-width: 60px !important;
    line-height: 1.5 !important;
    box-sizing: border-box !important;
    hyphens: auto !important;
    overflow: hidden !important;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
    border: 1px solid #e5e7eb !important;
    position: relative !important;
  }
  
  /* Own message bubble - Right messages (gradient) */
  .chats-right .message-content {
    border-radius: 18px 18px 4px 18px !important;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    color: white !important;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
    border: none !important;
  }
  
  /* Timestamp styling */
  .chat-time {
    font-size: 11px !important;
    line-height: 1 !important;
    opacity: 0.85 !important;
  }
  
  /* ========== AVATAR - MODERN AVATAR (36px) - KHÔNG BỊ CROP ========== */
  .chat-avatar {
    flex-shrink: 0 !important;
    width: 36px !important;
    height: 36px !important;
    min-width: 36px !important;
    min-height: 36px !important;
    max-width: 36px !important;
    max-height: 36px !important;
    position: relative !important;
    overflow: visible !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    margin: 0 !important;
    padding: 0 !important;
    box-sizing: border-box !important;
  }
  
  /* Avatar inner container - đảm bảo tròn và không bị crop */
  .chat-avatar > div {
    width: 100% !important;
    height: 100% !important;
    min-width: 100% !important;
    min-height: 100% !important;
    border-radius: 50% !important;
    overflow: hidden !important;
    position: relative !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    box-sizing: border-box !important;
  }
  
  /* Avatar image - đảm bảo hiển thị đầy đủ */
  .chat-avatar img {
    width: 100% !important;
    height: 100% !important;
    min-width: 100% !important;
    min-height: 100% !important;
    border-radius: 50% !important;
    object-fit: cover !important;
    object-position: center center !important;
    aspect-ratio: 1 / 1 !important;
    display: block !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  
  /* ========== MESSAGE ACTIONS DROPDOWN - MODERN UI ========== */
  .chat-actions-wrapper {
    position: absolute !important;
    opacity: 0 !important;
    transition: opacity 0.15s ease !important;
    z-index: 100 !important;
  }
  
  .chats:hover .chat-actions-wrapper {
    opacity: 1 !important;
  }
  
  /* Action Button */
  .btn-message-action {
    width: 28px !important;
    height: 28px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 50% !important;
    background: #ffffff !important;
    border: 1px solid #e5e7eb !important;
    cursor: pointer !important;
    transition: all 0.15s ease !important;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08) !important;
    padding: 0 !important;
  }
  
  .btn-message-action:hover {
    background: #f3f4f6 !important;
    border-color: #d1d5db !important;
    box-shadow: 0 2px 6px rgba(0,0,0,0.12) !important;
  }
  
  .btn-message-action:focus {
    outline: none !important;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2) !important;
  }
  
  /* Dropdown Menu - Hiển thị phía trên (dropup) */
  .message-dropdown-menu {
    min-width: 150px !important;
    padding: 6px !important;
    border-radius: 12px !important;
    border: 1px solid #e5e7eb !important;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.12) !important;
    background: #ffffff !important;
    margin-bottom: 4px !important;
    animation: dropupFadeIn 0.15s ease !important;
  }
  
  /* Đảm bảo dropup hiển thị đúng vị trí */
  .dropup .message-dropdown-menu {
    bottom: 100% !important;
    top: auto !important;
    margin-top: 0 !important;
    margin-bottom: 4px !important;
  }
  
  @keyframes dropupFadeIn {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .message-dropdown-menu .dropdown-item {
    display: flex !important;
    align-items: center !important;
    gap: 10px !important;
    padding: 10px 12px !important;
    border-radius: 8px !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    color: #374151 !important;
    background: transparent !important;
    border: none !important;
    width: 100% !important;
    cursor: pointer !important;
    transition: background 0.15s ease !important;
    text-align: left !important;
  }
  
  .message-dropdown-menu .dropdown-item:hover {
    background: #f3f4f6 !important;
  }
  
  .message-dropdown-menu .dropdown-item:active {
    background: #e5e7eb !important;
  }
  
  /* Delete button hover - red background */
  .message-dropdown-menu .dropdown-item[style*="color: rgb(239, 68, 68)"]:hover,
  .message-dropdown-menu .dropdown-item:last-child:hover {
    background: #fef2f2 !important;
  }
  
  /* ========== DATE MARKER ========== */
  .date-marker {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 20px 0;
    position: relative;
  }
  
  .date-marker::before,
  .date-marker::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e0e0e0;
  }
  
  .date-marker span {
    display: inline-block;
    padding: 6px 16px;
    background: #f0f0f0;
    border-radius: 20px;
    font-size: 13px;
    color: #666;
    font-weight: 500;
    margin: 0 12px;
  }
  
  /* ========== MESSAGE IMAGE ========== */
  .message-image img {
    max-width: 300px;
    max-height: 300px;
    border-radius: 12px;
    object-fit: cover;
    cursor: pointer;
    transition: transform 0.2s ease;
  }
  
  .message-image img:hover {
    transform: scale(1.02);
  }
  
  /* ========== MESSAGE FILE ========== */
  .message-file .file-attach {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #f0f0f0;
    border-radius: 12px;
    max-width: 300px;
    transition: background 0.2s ease;
  }
  
  .chats-right .message-file .file-attach {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .message-file .file-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
  }
  
  .chats-right .message-file .file-icon {
    background: rgba(255, 255, 255, 0.3);
  }
  
  /* ========== HIGHLIGHT MESSAGE ========== */
  .highlight-message {
    animation: highlightPulse 2s ease;
  }
  
  @keyframes highlightPulse {
    0% { background-color: rgba(102, 126, 234, 0.3); }
    50% { background-color: rgba(102, 126, 234, 0.1); }
    100% { background-color: transparent; }
  }
  
  /* ========== PINNED MESSAGES SECTION ========== */
  /* ========== PINNED MESSAGES - STICKY BAR ========== */
  .pinned-messages-sticky {
    position: sticky !important;
    top: 0 !important;
    z-index: 50 !important;
    background-color: #fff !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
    flex-shrink: 0 !important;
  }
  
  .pinned-messages-section {
    flex-shrink: 0;
  }
  
  .pinned-messages-section::-webkit-scrollbar {
    width: 4px;
  }
  
  .pinned-messages-section::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  
  .pinned-messages-section::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 2px;
  }
  
  .pinned-messages-section::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
  
  /* ========== EMOJI PICKER ANIMATION ========== */
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  /* Emoji picker scrollbar */
  .emoji-grid::-webkit-scrollbar {
    width: 6px;
  }
  
  .emoji-grid::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  
  .emoji-grid::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 10px;
  }
  
  .emoji-grid::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`;

