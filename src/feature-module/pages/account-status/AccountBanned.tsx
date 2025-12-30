/**
 * Account Banned Page
 * Hiển thị thông tin khi tài khoản bị cấm vĩnh viễn
 */

import React from 'react';
import { Link } from 'react-router-dom';
import ImageWithBasePath from '@/core/common/imageWithBasePath';

const AccountBanned: React.FC = () => {
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
            alt="Banned"
          />
          <h1>Tài khoản bị cấm</h1>
          <p>
            Tài khoản của bạn đã bị cấm vĩnh viễn do vi phạm nghiêm trọng quy định sử dụng.
          </p>
          <p className="mb-4">
            Nếu bạn cho rằng đây là sai sót, vui lòng liên hệ với chúng tôi để kháng cáo.
          </p>
          <Link to="/signin" className="btn btn-primary">
            <i className="ti ti-arrow-left me-2" />
            Quay lại đăng nhập
          </Link>
          <div className="mt-4">
            <a href="mailto:support@ptit.edu.vn" className="text-primary">
              Gửi khiếu nại
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountBanned;

