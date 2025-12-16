import ImageWithBasePath from '../imageWithBasePath'
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import "overlayscrollbars/overlayscrollbars.css";
import { useGetProfile } from 'src/apis/user/user.api';
import { getGenderLabel, formatDate } from 'src/lib/formatter.helper';


export const ProfileTab = () => {
    const {data: user, isLoading, error} = useGetProfile();
    
    if (isLoading) {
      return (
            <div className="sidebar-content active slimscroll">
                <div className="d-flex justify-content-center align-items-center vh-100">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Đang tải...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !user) {
      return (
            <div className="sidebar-content active slimscroll">
                <div className="alert alert-danger m-3">
                    Không thể tải thông tin người dùng
                </div>
            </div>
        );
    }

  return (
    <>
        {/* Profile sidebar */}
        <div className="sidebar-content active slimscroll">
        <OverlayScrollbarsComponent
            options={{
              scrollbars: {
                autoHide: 'scroll',
                autoHideDelay: 1000,
              },
            }}
            style={{ maxHeight: '100vh' }}
          >
          <div className="slimscroll">
            <div className="chat-search-header">
              <div className="header-title d-flex align-items-center justify-content-between">
                <h4 className="mb-3">Trang cá nhân</h4>
              </div>
            </div>

            {/* Profile */}
            <div className="profile mx-3">
              <div className="border-bottom text-center pb-3 mx-1">
                <div className="d-flex justify-content-center ">
                  <span className="avatar avatar-xxxl online mb-4">
                    <ImageWithBasePath
                      src={user.avatarUrl != null ? user.avatarUrl : 
                        'assets/img/profiles/avatar-16.jpg'}
                      className="rounded-circle"
                      alt="user"
                    />
                  </span>
                </div>
                <div>
                  <h6 className="fs-16">{user.username}</h6>
                </div>
              </div>
            </div>
            {/* /Profile */}
            <div className="sidebar-body chat-body">
              {/* Profile Info */}
              <h5 className="mb-2">Thông tin tài khoản</h5>
              <div className="card">
                <div className="card-body">
                  <div className="d-flex profile-list justify-content-between align-items-center border-bottom mb-3 pb-3">
                    <div>
                      <h6 className="fs-14">Họ và tên</h6>
                      <p className="fs-16 ">{user.fullName}</p>
                    </div>
                    <span>
                      <i className="ti ti-user-circle fs-16" />
                    </span>
                  </div>
                  <div className="d-flex profile-list  profile-list justify-content-between align-items-center border-bottom mb-3 pb-3">
                    <div>
                      <h6 className="fs-14">Giới tính</h6>
                      <p className="fs-16">{getGenderLabel(user.gender)}</p>
                    </div>
                    <span>
                      <i className="ti ti-user-star fs-16" />
                    </span>
                  </div>
                  <div className="d-flex profile-list justify-content-between align-items-center border-bottom mb-3 pb-3">
                    <div>
                      <h6 className="fs-14">Email</h6>
                      <p className="fs-16">{user.email}</p>
                    </div>
                    <span>
                      <i className="ti ti-mail-heart fs-16" />
                    </span>
                  </div>
                  <div className="d-flex profile-list profile-list justify-content-between align-items-center border-bottom mb-3 pb-3">
                    <div>
                      <h6 className="fs-14">Tiểu sử</h6>
                      <p className="fs-16">{user.bio ? user.bio : 'Chưa cập nhật'}</p>
                    </div>
                    <span>
                      <i className="ti ti-user-check fs-16" />
                    </span>
                  </div>
                  <div className="d-flex profile-list justify-content-between align-items-center border-bottom mb-3 pb-3">
                    <div>
                      <h6 className="fs-14">Vị trí</h6>
                      <p className="fs-16">Việt Nam</p>
                    </div>
                    <span>
                      <i className="ti ti-map-2 fs-16" />
                    </span>
                  </div>
                  <div className="d-flex profile-list justify-content-between align-items-center">
                    <div>
                      <h6 className="fs-14">Tham gia từ</h6>
                      <p className="fs-16">{formatDate(user.createdAt)}</p>
                    </div>
                    <span>
                      <i className="ti ti-calendar-event fs-16" />
                    </span>
                  </div>
                </div>
              </div>
              {/* /Profile Info */}
              {/* Status */}
              {/* <h5 className="mb-2">Status</h5>
              <div className="card">
                <div className="card-body">
                  <div className="d-flex profile-list justify-content-between align-items-center border-bottom mb-3 pb-3">
                    <div>
                      <h6 className="fs-14">Active Status</h6>
                      <p className="fs-16 ">Show when you're active</p>
                    </div>
                    <div className="form-check form-switch d-flex justify-content-end align-items-center">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        defaultChecked
                      />
                    </div>
                  </div>
                  <div className="d-flex profile-list justify-content-between align-items-center">
                    <div>
                      <h6 className="fs-14">Friends Status</h6>
                      <p className="fs-16 ">Show friends status in chat</p>
                    </div>
                    <div className="form-check form-switch d-flex justify-content-end align-items-center">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        defaultChecked
                      />
                    </div>
                  </div>
                </div>
              </div> */}
              {/* /Status */}
              {/* Social Media */}
              {/* <h5 className="mb-2">Social Media</h5>
              <div className="card">
                <div className="card-body">
                  <div className="d-flex profile-list justify-content-between align-items-center border-bottom mb-3 pb-3">
                    <div>
                      <h6 className="fs-14">Facebook</h6>
                      <p className="fs-16 ">@SalomKatherine</p>
                    </div>
                    <span>
                      <i className="ti ti-brand-facebook fs-16" />
                    </span>
                  </div>
                  <div className="d-flex profile-list justify-content-between align-items-center border-bottom mb-3 pb-3">
                    <div>
                      <h6 className="fs-14">Instagram Linkedin</h6>
                      <p className="fs-16 ">@SalomKatherine</p>
                    </div>
                    <span>
                      <i className="ti ti-brand-instagram fs-16" />
                    </span>
                  </div>
                  <div className="d-flex profile-list justify-content-between align-items-center">
                    <div>
                      <h6 className="fs-14">Linkedin</h6>
                      <p className="fs-16 ">@SalomKatherine</p>
                    </div>
                    <span>
                      <i className="ti ti-brand-linkedin fs-16" />
                    </span>
                  </div>
                </div>
              </div> */}
              {/* /Social Media */}
            </div>
          </div>
          </OverlayScrollbarsComponent>
        </div>
        {/* / Profile sidebar */}
    </>
  )
}