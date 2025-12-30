/**
 * ErrorBoundary Component
 * Bắt lỗi JavaScript trong component tree và hiển thị fallback UI
 * Ngăn chặn white screen khi có lỗi
 */

import React, { Component, ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(_error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI nếu được truyền vào
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="error-boundary-fallback">
          <div className="container">
            <div className="row justify-content-center align-items-center min-vh-100">
              <div className="col-md-6">
                <div className="card shadow-lg border-0">
                  <div className="card-body p-5 text-center">
                    <div className="mb-4">
                      <i className="ti ti-exclamation-circle text-danger" style={{ fontSize: '64px' }} />
                    </div>
                    <h2 className="mb-3">Đã xảy ra lỗi</h2>
                    <p className="text-muted mb-4">
                      Xin lỗi, ứng dụng gặp sự cố không mong muốn. Vui lòng thử lại hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp diễn.
                    </p>

                    {process.env.NODE_ENV === 'development' && this.state.error && (
                      <div className="alert alert-danger text-start mb-4">
                        <h6 className="alert-heading">Chi tiết lỗi (Development):</h6>
                        <hr />
                        <small>
                          <strong>Message:</strong> {this.state.error.message}
                        </small>
                        {this.state.errorInfo && (
                          <>
                            <hr />
                            <small>
                              <strong>Component Stack:</strong>
                              <pre className="mb-0 mt-2" style={{ fontSize: '11px', maxHeight: '200px', overflow: 'auto' }}>
                                {this.state.errorInfo.componentStack}
                              </pre>
                            </small>
                          </>
                        )}
                      </div>
                    )}

                    <div className="d-flex gap-3 justify-content-center">
                      <button
                        onClick={this.handleReset}
                        className="btn btn-primary"
                      >
                        <i className="ti ti-refresh me-2" />
                        Thử lại
                      </button>
                      <Link to="/" className="btn btn-outline-secondary">
                        <i className="ti ti-home me-2" />
                        Về trang chủ
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

