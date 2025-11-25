/**
 * ChatDemo - Component demo độc lập để test nhanh
 * Không cần routing, chỉ cần import và render
 */

import React from "react";
import ChatLayout from "./ChatLayout";

/**
 * CÁCH DÙNG:
 * 
 * 1. Import vào file cần test:
 *    import ChatDemo from './feature-module/pages/chat/ChatDemo';
 * 
 * 2. Render:
 *    <ChatDemo />
 * 
 * 3. Hoặc test trực tiếp bằng cách thêm route:
 *    { path: "/chat-demo", element: <ChatDemo /> }
 */

const ChatDemo: React.FC = () => {
  return (
    <div className="main-wrapper">
      <div className="content">
        <div className="container-fluid">
          {/* Demo Header */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card bg-gradient text-white">
                <div className="card-body">
                  <h3>
                    💬 Chat Hiện Đại - Demo
                  </h3>
                  <p className="mb-0">
                    Phiên bản chat với API integration đầy đủ, UI hiện đại, và real-time features
                  </p>
                  <div className="mt-3">
                    <span className="badge bg-light text-dark me-2">✅ Real-time</span>
                    <span className="badge bg-light text-dark me-2">✅ WebSocket</span>
                    <span className="badge bg-light text-dark me-2">✅ Typing Indicators</span>
                    <span className="badge bg-light text-dark me-2">✅ Read Receipts</span>
                    <span className="badge bg-light text-dark me-2">✅ Modern UI</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Layout */}
          <div className="row">
            <div className="col-12">
              <div className="card shadow-lg border-0">
                <div className="card-body p-0" style={{ height: 'calc(100vh - 250px)' }}>
                  <ChatLayout />
                </div>
              </div>
            </div>
          </div>

          {/* Demo Footer */}
          <div className="row mt-3">
            <div className="col-12">
              <div className="alert alert-info">
                <h5 className="alert-heading">
                  <i className="ti ti-info-circle me-2" />
                  Hướng Dẫn Sử Dụng
                </h5>
                <ul className="mb-0">
                  <li>
                    <strong>Chọn conversation:</strong> Click vào conversation trong sidebar bên trái
                  </li>
                  <li>
                    <strong>Gửi tin nhắn:</strong> Nhập tin nhắn và nhấn Enter hoặc click nút Send
                  </li>
                  <li>
                    <strong>Xem typing indicator:</strong> Mở 2 tabs khác nhau và test
                  </li>
                  <li>
                    <strong>Quick actions:</strong> Hover vào messages để xem actions (pin, delete, reactions)
                  </li>
                  <li>
                    <strong>Search:</strong> Click icon search để tìm tin nhắn
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="row mt-3">
            <div className="col-md-6">
              <div className="card border-primary">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">
                    <i className="ti ti-sparkles me-2" />
                    Tính Năng Chính
                  </h5>
                </div>
                <div className="card-body">
                  <ul className="list-unstyled mb-0">
                    <li className="mb-2">
                      <i className="ti ti-check text-success me-2" />
                      Real-time messaging qua WebSocket
                    </li>
                    <li className="mb-2">
                      <i className="ti ti-check text-success me-2" />
                      Typing indicators (đang nhập...)
                    </li>
                    <li className="mb-2">
                      <i className="ti ti-check text-success me-2" />
                      Read receipts (đã xem)
                    </li>
                    <li className="mb-2">
                      <i className="ti ti-check text-success me-2" />
                      Pin/Unpin messages
                    </li>
                    <li className="mb-2">
                      <i className="ti ti-check text-success me-2" />
                      Delete messages
                    </li>
                    <li className="mb-2">
                      <i className="ti ti-check text-success me-2" />
                      Mute/Unmute conversations
                    </li>
                    <li className="mb-2">
                      <i className="ti ti-check text-success me-2" />
                      Search messages & conversations
                    </li>
                    <li className="mb-2">
                      <i className="ti ti-check text-success me-2" />
                      Filter conversations (All/Private/Group)
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card border-success">
                <div className="card-header bg-success text-white">
                  <h5 className="mb-0">
                    <i className="ti ti-palette me-2" />
                    UI/UX Features
                  </h5>
                </div>
                <div className="card-body">
                  <ul className="list-unstyled mb-0">
                    <li className="mb-2">
                      <i className="ti ti-check text-success me-2" />
                      Gradient colors hiện đại
                    </li>
                    <li className="mb-2">
                      <i className="ti ti-check text-success me-2" />
                      Smooth animations
                    </li>
                    <li className="mb-2">
                      <i className="ti ti-check text-success me-2" />
                      Hover effects đẹp mắt
                    </li>
                    <li className="mb-2">
                      <i className="ti ti-check text-success me-2" />
                      Quick reactions (❤️ 👍 😂)
                    </li>
                    <li className="mb-2">
                      <i className="ti ti-check text-success me-2" />
                      Loading states mượt mà
                    </li>
                    <li className="mb-2">
                      <i className="ti ti-check text-success me-2" />
                      Empty states với icons
                    </li>
                    <li className="mb-2">
                      <i className="ti ti-check text-success me-2" />
                      Responsive design
                    </li>
                    <li className="mb-2">
                      <i className="ti ti-check text-success me-2" />
                      Custom scrollbar
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inline Styles */}
      <style>{`
        .bg-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .card {
          border-radius: 15px;
          overflow: hidden;
        }

        .card-header {
          border-radius: 15px 15px 0 0 !important;
        }

        .badge {
          padding: 6px 12px;
          font-size: 0.8rem;
        }

        .shadow-lg {
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1) !important;
        }
      `}</style>
    </div>
  );
};

export default ChatDemo;

