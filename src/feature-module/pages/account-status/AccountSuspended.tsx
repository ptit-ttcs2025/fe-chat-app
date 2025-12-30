/**
 * Account Suspended Page
 * Hiển thị thông tin khi tài khoản bị tạm khóa
 */

import React from 'react';
import { Link } from 'react-router-dom';
import ImageWithBasePath from '@/core/common/imageWithBasePath';

const AccountSuspended: React.FC = () => {
  // You can parse unlock time from localStorage if needed
  const unlockTime = localStorage.getItem('unlockTime');

  return (
    <div className="main-wrapper">
      <div className="error-box">
        <ImageWithBasePath
          src="assets/img/bg/error-bg.png"
          className="img-fluid error-bg-img"
          alt="Bg"
        />
        <div className="error-page-content">
          <ImageWithBasePath
            src="assets/img/icons/danger.svg"
            className="img-fluid mb-4"
            alt="Suspended"
          />
          <h1>Tài khoản bị tạm khóa</h1>
          <p>
            Tài khoản của bạn đã bị tạm khóa do vi phạm quy định sử dụng.
            {unlockTime && (
              <span className="d-block mt-2">
                Thời gian mở khóa: <strong>{new Date(unlockTime).toLocaleString('vi-VN')}</strong>
              </span>
            )}
          </p>
          <p className="mb-4">
            Nếu bạn cho rằng đây là sai sót, vui lòng liên hệ với chúng tôi.
          </p>
          <Link to="/signin" className="btn btn-primary">
            <i className="ti ti-arrow-left me-2" />
            Quay lại đăng nhập
          </Link>
          <div className="mt-4">
            <a href="mailto:support@ptit.edu.vn" className="text-primary">
              Liên hệ hỗ trợ
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSuspended;

