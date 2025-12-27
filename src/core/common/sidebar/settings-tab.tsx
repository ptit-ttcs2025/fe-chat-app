import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../imageWithBasePath";
import type { DatePickerProps } from "antd";
import { DatePicker } from "antd";
import LogoutModal from "../../modals/logout-modal";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import "overlayscrollbars/overlayscrollbars.css";
type PasswordField = "confirmPassword" | "newpassword" | "oldpassword";
import { useLogout } from "../../../hooks/useLogout";
import {
  useGetProfile,
  useUpdateProfile,
  useChangePassword,
  useUploadAvatar,
} from "../../../apis/user/user.api";
import dayjs from "dayjs";
import { updateProfileSchema } from "../../../apis/user/user.schema";
import { changePasswordSchema } from "../../../apis/user/user.schema";
import { message } from "antd";

const SettingsTab = () => {
  const [passwordVisibility, setPasswordVisibility] = useState({
    confirmPassword: false,
    newpassword: false,
    oldpassword: false,
  });

  const { handleLogout } = useLogout();

  // State quản lý chế độ chỉnh sửa
  const [isEditing, setIsEditing] = useState(false);

  // State quản lý form data
  const [formData, setFormData] = useState({
    fullName: "",
    gender: "",
    dob: null as dayjs.Dayjs | null,
    email: "",
    bio: "",
    avatarUrl: "",
  });

  // State quản lý lỗi
  const [errors, setErrors] = useState<Record<string, string>>({});

  // State quản lý chế độ chỉnh sửa password
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  // State quản lý password form data
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // State quản lý lỗi password
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {}
  );

  // State cho avatar preview
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // State để lưu file đã chọn (chưa upload)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Ref cho input file
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lấy dữ liệu profile
  const { data: profile } = useGetProfile();
  const updateProfileMutation = useUpdateProfile();
  // Hook đổi mật khẩu
  const changePasswordMutation = useChangePassword();
  // Hook upload ảnh
  const uploadAvatarMutation = useUploadAvatar();

  // Khởi tạo form data từ profile
  useEffect(() => {
    if (profile && !isEditing) {
      setFormData({
        fullName: profile.fullName || "",
        gender: profile.gender || "",
        dob: profile.dob ? dayjs(profile.dob) : null,
        email: profile.email || "",
        bio: profile.bio || "",
        avatarUrl: profile.avatarUrl || "",
      });
      setAvatarPreview(null); // Reset preview khi load lại
      setErrors({});
    }
  }, [profile, isEditing]);

  // Cleanup blob URL khi component unmount hoặc preview thay đổi
  useEffect(() => {
    return () => {
      // Cleanup blob URL khi component unmount
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const togglePasswordVisibility = (field: PasswordField) => {
    setPasswordVisibility((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };

  const onChange: DatePickerProps["onChange"] = (date) => {
    if (isEditing) {
      setFormData((prev) => ({
        ...prev,
        dob: date,
      }));
      // Xóa lỗi khi người dùng thay đổi
      if (errors.dob) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.dob;
          return newErrors;
        });
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (isEditing) {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
      // Xóa lỗi khi người dùng thay đổi
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  // Xử lý chọn file - dùng URL.createObjectURL() thay vì FileReader
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      message.error("Vui lòng chọn file ảnh");
      return;
    }

    // Validate file size (ví dụ: max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      message.error("Kích thước file không được vượt quá 5MB");
      return;
    }

    // Revoke URL cũ nếu có
    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    // Lưu file đã chọn (chưa upload)
    setSelectedFile(file);

    // Tạo preview bằng blob URL (ngắn hơn nhiều so với data URL)
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
  };

  // Xử lý click vào icon để mở file picker
  const handleAvatarClick = () => {
    if (isEditing && !uploadingAvatar && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSaveClick = async () => {
    // ✅ Upload avatar TRƯỚC nếu có file mới được chọn
    let avatarUrlToUpdate = formData.avatarUrl;

    if (selectedFile) {
      try {
        setUploadingAvatar(true);
        const uploadResult = await uploadAvatarMutation.mutateAsync({
          file: selectedFile,
          folder: "AVATARS",
        });
        avatarUrlToUpdate = uploadResult.fileUrl;
        setSelectedFile(null); // Clear sau khi upload thành công
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "Upload ảnh thất bại";
        message.error(errorMessage);
        setUploadingAvatar(false);
        return; // Dừng lại nếu upload ảnh thất bại
      } finally {
        setUploadingAvatar(false);
      }
    }

    // Chuẩn bị data để validate (chuyển dayjs thành string)
    const dataToValidate = {
      fullName: formData.fullName,
      email: formData.email,
      gender: formData.gender || undefined,
      dob: formData.dob ? formData.dob.toISOString() : undefined,
      bio: formData.bio || undefined,
      avatarUrl: avatarUrlToUpdate || undefined, // ✅ Cập nhật avatarUrl nếu có
    };

    // Validate bằng Zod
    const result = updateProfileSchema.safeParse(dataToValidate);

    if (!result.success) {
      // Chuyển đổi lỗi Zod sang format errors state
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path.length > 0) {
          const field = issue.path[0] as string;
          newErrors[field] = issue.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    // Clear errors nếu validate thành công
    setErrors({});

    // Gọi API cập nhật
    if (profile?.id) {
      try {
        await updateProfileMutation.mutateAsync({
          id: profile.id,
          data: result.data,
        });
        message.success("Cập nhật thông tin thành công");
        setIsEditing(false);
        // ✅ Cleanup blob URL sau khi save thành công
        if (avatarPreview && avatarPreview.startsWith("blob:")) {
          URL.revokeObjectURL(avatarPreview);
        }
        setAvatarPreview(null);
      } catch (error: any) {
        const errorMessage =
          error?.[0]?.message ||
          error?.response?.data?.message ||
          "Cập nhật thông tin thất bại.";
        message.error(errorMessage);
        console.error("Error updating profile:", error);
      }
    }
  };

  const handleCancel = () => {
    // Reset về dữ liệu gốc
    if (profile) {
      setFormData({
        fullName: profile.fullName || "",
        gender: profile.gender || "",
        dob: profile.dob ? dayjs(profile.dob) : null,
        email: profile.email || "",
        bio: profile.bio || "",
        avatarUrl: profile.avatarUrl || "",
      });
    }
    setIsEditing(false);
    setErrors({});

    // ✅ Cleanup blob URL khi cancel
    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setSelectedFile(null);
    setAvatarPreview(null);
  };

  const handlePasswordInputChange = (field: string, value: string) => {
    if (isEditingPassword) {
      setPasswordData((prev) => ({
        ...prev,
        [field]: value,
      }));
      // Xóa lỗi khi người dùng thay đổi
      if (passwordErrors[field]) {
        setPasswordErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    }
  };

  const handlePasswordEditClick = () => {
    setIsEditingPassword(true);
  };

  const handlePasswordSaveClick = async () => {
    // Validate bằng Zod
    const result = changePasswordSchema.safeParse(passwordData);

    if (!result.success) {
      // Chuyển đổi lỗi Zod sang format errors state
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path.length > 0) {
          const field = issue.path[0] as string;
          newErrors[field] = issue.message;
        }
      });
      setPasswordErrors(newErrors);
      return;
    }

    // Clear errors nếu validate thành công
    setPasswordErrors({});

    // Gọi API đổi mật khẩu
    try {
      await changePasswordMutation.mutateAsync(result.data);
      message.success("Đổi mật khẩu thành công");
      setIsEditingPassword(false);
      // Reset form
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      // Xử lý lỗi từ API
      const errorMessage = error?.[0].message || "Đổi mật khẩu thất bại";
      message.error(errorMessage);

      // Nếu có lỗi cụ thể cho từng field, có thể set vào passwordErrors
      if (error?.response?.data?.errors) {
        setPasswordErrors(error.response.data.errors);
      }
    }
  };

  const handlePasswordCancel = () => {
    setIsEditingPassword(false);
    setPasswordData({
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordErrors({});
  };

  const [showModal, setShowModal] = useState(false);

  // Thêm hàm để disable các ngày không hợp lệ
  const disabledDate = (current: dayjs.Dayjs | null) => {
    if (!current) return false;

    // Disable các ngày trong tương lai
    if (current.isAfter(dayjs(), "day")) {
      return true;
    }

    // Disable các ngày mà người dùng chưa đủ 18 tuổi
    const eighteenYearsAgo = dayjs().subtract(18, "year");
    if (current.isAfter(eighteenYearsAgo, "day")) {
      return true;
    }

    return false;
  };

  return (
    <>
      {/* Profile sidebar */}
      <div className="sidebar-content active slimscroll">
        <OverlayScrollbarsComponent
          options={{
            scrollbars: {
              autoHide: "scroll",
              autoHideDelay: 1000,
            },
          }}
          style={{ maxHeight: "100vh" }}
        >
          <div className="slimscroll">
            <div className="chat-search-header">
              <div className="header-title d-flex align-items-center justify-content-between">
                <h4 className="mb-3">Cài đặt</h4>
              </div>
              {/* Settings Search */}
              {/* <div className="search-wrap">
                <form >
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search Settings"
                    />
                    <span className="input-group-text">
                      <i className="ti ti-search" />
                    </span>
                  </div>
                </form>
              </div> */}
              {/* /Settings Search */}
            </div>
            <div className="sidebar-body chat-body">
              {/* Account setting */}
              <div className="content-wrapper">
                <h5 className="sub-title">Tài khoản</h5>
                <div className="chat-file">
                  <div className="file-item">
                    <div
                      className="accordion accordion-flush chat-accordion"
                      id="account-setting"
                    >
                      <div className="accordion-item others">
                        <h2 className="accordion-header">
                          <Link
                            to="#"
                            className="accordion-button collapsed"
                            data-bs-toggle="collapse"
                            data-bs-target="#chatuser-collapse"
                            aria-expanded="false"
                            aria-controls="chatuser-collapse"
                          >
                            <i className="ti ti-user me-2" />
                            Thông tin cá nhân
                          </Link>
                        </h2>
                        <div
                          id="chatuser-collapse"
                          className="accordion-collapse collapse"
                          data-bs-parent="#account-setting"
                        >
                          <div className="accordion-body">
                            <div>
                              <div className="d-flex justify-content-center align-items-center">
                                <span className="set-pro avatar avatar-xxl rounded-circle mb-3 p-1">
                                  <ImageWithBasePath
                                    src={
                                      avatarPreview ||
                                      formData.avatarUrl ||
                                      profile?.avatarUrl ||
                                      "assets/img/profiles/avatar-16.jpg"
                                    }
                                    className="rounded-circle"
                                    alt="user"
                                  />
                                  {/* Input file ẩn */}
                                  <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    disabled={!isEditing || uploadingAvatar}
                                    style={{ display: "none" }}
                                  />
                                  {/* Icon click để chọn file */}
                                  <span
                                    className="add avatar avatar-sm d-flex justify-content-center align-items-center"
                                    style={{
                                      cursor:
                                        isEditing && !uploadingAvatar
                                          ? "pointer"
                                          : "not-allowed",
                                      opacity:
                                        isEditing && !uploadingAvatar ? 1 : 0.5,
                                    }}
                                    onClick={handleAvatarClick}
                                  >
                                    {uploadingAvatar ? (
                                      <i
                                        className="ti ti-loader-2"
                                        style={{
                                          animation: "spin 1s linear infinite",
                                        }}
                                      />
                                    ) : (
                                      <i className="ti ti-plus rounded-circle d-flex justify-content-center align-items-center" />
                                    )}
                                  </span>
                                </span>
                              </div>
                              <div className="row">
                                <div className="col-lg-12">
                                  <div className="mb-3">
                                    <label className="form-label fs-14 mb-2">
                                      Họ và tên
                                    </label>
                                    <div className="input-icon position-relative">
                                      <input
                                        type="text"
                                        value={formData.fullName}
                                        onChange={(e) =>
                                          handleInputChange(
                                            "fullName",
                                            e.target.value
                                          )
                                        }
                                        disabled={!isEditing}
                                        className="form-control"
                                      />
                                      <span className="icon-addon">
                                        <i className="ti ti-user" />
                                      </span>
                                    </div>
                                    {errors.fullName && (
                                      <small className="text-danger fs-13 fw-medium mt-1 d-flex align-items-center">
                                        <i
                                          className="ti ti-alert-circle me-1"
                                          style={{ fontSize: "0.75rem" }}
                                        />
                                        {errors.fullName}
                                      </small>
                                    )}
                                  </div>
                                </div>
                                <div className="col-lg-12">
                                  <div className="mb-3">
                                    <label className="form-label fs-14 mb-2">
                                      Giới tính
                                    </label>
                                    <div className="input-icon position-relative">
                                      <select
                                        className="form-select"
                                        value={formData.gender}
                                        onChange={(e) =>
                                          handleInputChange(
                                            "gender",
                                            e.target.value
                                          )
                                        }
                                        disabled={!isEditing}
                                        style={{ paddingLeft: "0.75rem" }}
                                      >
                                        <option value="MALE">Nam</option>
                                        <option value="FEMALE">Nữ</option>
                                        <option value="UNKNOWN">
                                          Không rõ
                                        </option>
                                      </select>
                                      <span className="icon-addon">
                                        <i className="ti ti-user-star" />
                                      </span>
                                    </div>
                                    {errors.gender && (
                                      <small className="text-danger fs-13 fw-medium mt-1 d-flex align-items-center">
                                        <i
                                          className="ti ti-alert-circle me-1"
                                          style={{ fontSize: "0.75rem" }}
                                        />
                                        {errors.gender}
                                      </small>
                                    )}
                                  </div>
                                </div>
                                <div className="col-lg-12">
                                  <div className="mb-3">
                                    <label className="form-label fs-14 mb-2">
                                      Ngày sinh
                                    </label>
                                    <div className="input-icon position-relative">
                                      <DatePicker
                                        getPopupContainer={(trigger) =>
                                          trigger.parentElement || document.body
                                        }
                                        className="form-control datetimepicker"
                                        onChange={onChange}
                                        value={formData.dob}
                                        disabled={!isEditing}
                                        format="DD/MM/YYYY"
                                        placeholder="Chọn ngày sinh"
                                        disabledDate={disabledDate}
                                      />
                                      <span className="icon-addon">
                                        <i className="ti ti-calendar-event" />
                                      </span>
                                    </div>
                                    {errors.dob && (
                                      <small className="text-danger fs-13 fw-medium mt-1 d-flex align-items-center">
                                        <i
                                          className="ti ti-alert-circle me-1"
                                          style={{ fontSize: "0.75rem" }}
                                        />
                                        {errors.dob}
                                      </small>
                                    )}
                                  </div>
                                </div>
                                <div className="col-lg-12">
                                  <div className="mb-3">
                                    <label className="form-label fs-14 mb-2">
                                      Email
                                    </label>
                                    <div className="input-icon position-relative">
                                      <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) =>
                                          handleInputChange(
                                            "email",
                                            e.target.value
                                          )
                                        }
                                        disabled={!isEditing}
                                        className="form-control"
                                      />
                                      <span className="icon-addon">
                                        <i className="ti ti-mail" />
                                      </span>
                                    </div>
                                    {errors.email && (
                                      <small className="text-danger fs-13 fw-medium mt-1 d-flex align-items-center">
                                        <i
                                          className="ti ti-alert-circle me-1"
                                          style={{ fontSize: "0.75rem" }}
                                        />
                                        {errors.email}
                                      </small>
                                    )}
                                  </div>
                                </div>
                                <div className="col-lg-12">
                                  <div className="mb-3">
                                    <label className="form-label fs-14 mb-2">
                                      Mô tả
                                    </label>
                                    <textarea
                                      className="form-control"
                                      value={formData.bio}
                                      onChange={(e) =>
                                        handleInputChange("bio", e.target.value)
                                      }
                                      disabled={!isEditing}
                                      rows={3}
                                    />
                                    {errors.bio && (
                                      <small className="text-danger fs-13 fw-medium mt-1 d-flex align-items-center">
                                        <i
                                          className="ti ti-alert-circle me-1"
                                          style={{ fontSize: "0.75rem" }}
                                        />
                                        {errors.bio}
                                      </small>
                                    )}
                                  </div>
                                </div>
                                <div className="col-lg-12 d-flex gap-2">
                                  {isEditing ? (
                                    <>
                                      <Link
                                        to="#"
                                        className="btn btn-primary flex-fill"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          handleSaveClick();
                                        }}
                                      >
                                        <i className="ti ti-device-floppy me-2" />
                                        Lưu thay đổi
                                      </Link>
                                      <Link
                                        to="#"
                                        className="btn btn-danger flex-fill"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          handleCancel();
                                        }}
                                      >
                                        <i className="ti ti-x me-2" />
                                        Hủy
                                      </Link>
                                    </>
                                  ) : (
                                    <Link
                                      to="#"
                                      className="btn btn-primary flex-fill"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handleEditClick();
                                      }}
                                    >
                                      <i className="ti ti-edit me-2" />
                                      Chỉnh sửa
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* <div className="accordion-item others mb-3">
                        <h2 className="accordion-header">
                          <Link
                            to="#"
                            className="accordion-button collapsed"
                            data-bs-toggle="collapse"
                            data-bs-target="#social-id"
                            aria-expanded="false"
                            aria-controls="social-id"
                          >
                            <i className="ti ti-social me-2" />
                            Social Profiles
                          </Link>
                        </h2>
                        <div
                          id="social-id"
                          className="accordion-collapse collapse"
                          data-bs-parent="#account-setting"
                        >
                          <div className="accordion-body">
                            <div className="chat-video">
                              <div className="row">
                                <div className="col-lg-12">
                                  <div className="input-icon mb-3 position-relative">
                                    <input
                                      type="text"
                                      defaultValue=""
                                      className="form-control"
                                      placeholder="Facebook"
                                    />
                                    <span className="icon-addon">
                                      <i className="ti ti-brand-facebook" />
                                    </span>
                                  </div>
                                </div>
                                <div className="col-lg-12">
                                  <div className="input-icon mb-3 position-relative">
                                    <input
                                      type="text"
                                      defaultValue=""
                                      className="form-control"
                                      placeholder="Google"
                                    />
                                    <span className="icon-addon">
                                      <i className="ti ti-brand-google" />
                                    </span>
                                  </div>
                                </div>
                                <div className="col-lg-12">
                                  <div className="input-icon mb-3 position-relative">
                                    <input
                                      type="text"
                                      defaultValue=""
                                      className="form-control"
                                      placeholder="Twitter"
                                    />
                                    <span className="icon-addon">
                                      <i className="ti ti-brand-twitter" />
                                    </span>
                                  </div>
                                </div>
                                <div className="col-lg-12">
                                  <div className="input-icon mb-3 position-relative">
                                    <input
                                      type="text"
                                      defaultValue=""
                                      className="form-control"
                                      placeholder="Linkedin"
                                    />
                                    <span className="icon-addon">
                                      <i className="ti ti-brand-linkedin" />
                                    </span>
                                  </div>
                                </div>
                                <div className="col-lg-12">
                                  <div className="input-icon mb-3 position-relative">
                                    <input
                                      type="text"
                                      defaultValue=""
                                      className="form-control"
                                      placeholder="youtube"
                                    />
                                    <span className="icon-addon">
                                      <i className="ti ti-brand-youtube" />
                                    </span>
                                  </div>
                                </div>
                                <div className="col-lg-12 d-flex">
                                  <Link
                                    to="#"
                                    className="btn btn-primary flex-fill"
                                  >
                                    <i className="ti ti-device-floppy me-2" />
                                    Save Changes
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fs-14">
                          <Link to="#">
                            <i className="ti ti-lock-square text-gray me-2" />
                            Screen Lock
                          </Link>
                        </h6>
                        <div className="form-check form-switch d-flex justify-content-end align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                          />
                        </div>
                      </div> */}
                    </div>
                  </div>
                </div>
              </div>
              {/* /Account setting */}
              {/* Security setting */}
              <div className="content-wrapper">
                <h5 className="sub-title">Bảo mật</h5>
                <div className="chat-file">
                  <div className="file-item">
                    <div
                      className="accordion accordion-flush chat-accordion"
                      id="pwd-setting"
                    >
                      <div className="accordion-item others mb-3">
                        <h2 className="accordion-header">
                          <Link
                            to="#"
                            className="accordion-button collapsed"
                            data-bs-toggle="collapse"
                            data-bs-target="#set-pwd"
                            aria-expanded="false"
                            aria-controls="set-pwd"
                          >
                            <i className="ti ti-key me-2" />
                            Đổi mật khẩu
                          </Link>
                        </h2>
                        <div
                          id="set-pwd"
                          className="accordion-collapse collapse"
                          data-bs-parent="#pwd-setting"
                        >
                          <div className="accordion-body">
                            <div className="row">
                              <div className="col-lg-12">
                                <div className="mb-3">
                                  <label className="form-label fs-14 mb-2">
                                    Mật khẩu hiện tại
                                  </label>
                                  <div className="input-icon position-relative">
                                    <input
                                      type={
                                        passwordVisibility.oldpassword
                                          ? "text"
                                          : "password"
                                      }
                                      value={passwordData.oldPassword}
                                      onChange={(e) =>
                                        handlePasswordInputChange(
                                          "oldPassword",
                                          e.target.value
                                        )
                                      }
                                      disabled={!isEditingPassword}
                                      className="form-control"
                                    />
                                    <span
                                      className={`ti toggle-passwords ${
                                        passwordVisibility.oldpassword
                                          ? "ti-eye"
                                          : "ti-eye-off"
                                      }`}
                                      onClick={() =>
                                        togglePasswordVisibility("oldpassword")
                                      }
                                    />
                                  </div>
                                  {passwordErrors.oldPassword && (
                                    <small className="text-danger fs-13 fw-medium mt-1 d-flex align-items-center">
                                      <i
                                        className="ti ti-alert-circle me-1"
                                        style={{ fontSize: "0.75rem" }}
                                      />
                                      {passwordErrors.oldPassword}
                                    </small>
                                  )}
                                </div>
                              </div>

                              <div className="col-lg-12">
                                <div className="mb-3">
                                  <label className="form-label fs-14 mb-2">
                                    Mật khẩu mới
                                  </label>
                                  <div className="input-icon position-relative">
                                    <input
                                      type={
                                        passwordVisibility.newpassword
                                          ? "text"
                                          : "password"
                                      }
                                      value={passwordData.newPassword}
                                      onChange={(e) =>
                                        handlePasswordInputChange(
                                          "newPassword",
                                          e.target.value
                                        )
                                      }
                                      disabled={!isEditingPassword}
                                      className="form-control"
                                    />
                                    <span
                                      className={`ti toggle-passwords ${
                                        passwordVisibility.newpassword
                                          ? "ti-eye"
                                          : "ti-eye-off"
                                      }`}
                                      onClick={() =>
                                        togglePasswordVisibility("newpassword")
                                      }
                                    />
                                  </div>
                                  {passwordErrors.newPassword && (
                                    <small className="text-danger fs-13 fw-medium mt-1 d-flex align-items-center">
                                      <i
                                        className="ti ti-alert-circle me-1"
                                        style={{ fontSize: "0.75rem" }}
                                      />
                                      {passwordErrors.newPassword}
                                    </small>
                                  )}
                                </div>
                              </div>

                              <div className="col-lg-12">
                                <div className="mb-3">
                                  <label className="form-label fs-14 mb-2">
                                    Xác nhận mật khẩu mới
                                  </label>
                                  <div className="input-icon position-relative">
                                    <input
                                      type={
                                        passwordVisibility.confirmPassword
                                          ? "text"
                                          : "password"
                                      }
                                      value={passwordData.confirmPassword}
                                      onChange={(e) =>
                                        handlePasswordInputChange(
                                          "confirmPassword",
                                          e.target.value
                                        )
                                      }
                                      disabled={!isEditingPassword}
                                      className="form-control"
                                    />
                                    <span
                                      className={`ti toggle-passwords ${
                                        passwordVisibility.confirmPassword
                                          ? "ti-eye"
                                          : "ti-eye-off"
                                      }`}
                                      onClick={() =>
                                        togglePasswordVisibility(
                                          "confirmPassword"
                                        )
                                      }
                                    />
                                  </div>
                                  {passwordErrors.confirmPassword && (
                                    <small className="text-danger fs-13 fw-medium mt-1 d-flex align-items-center">
                                      <i
                                        className="ti ti-alert-circle me-1"
                                        style={{ fontSize: "0.75rem" }}
                                      />
                                      {passwordErrors.confirmPassword}
                                    </small>
                                  )}
                                </div>
                              </div>

                              <div className="col-lg-12 d-flex gap-2">
                                {isEditingPassword ? (
                                  <>
                                    <Link
                                      to="#"
                                      className="btn btn-primary flex-fill"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handlePasswordSaveClick();
                                      }}
                                    >
                                      <i className="ti ti-device-floppy me-2" />
                                      Lưu thay đổi
                                    </Link>
                                    <Link
                                      to="#"
                                      className="btn btn-danger flex-fill"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handlePasswordCancel();
                                      }}
                                    >
                                      <i className="ti ti-x me-2" />
                                      Hủy
                                    </Link>
                                  </>
                                ) : (
                                  <Link
                                    to="#"
                                    className="btn btn-primary flex-fill"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handlePasswordEditClick();
                                    }}
                                  >
                                    <i className="ti ti-edit me-2" />
                                    Chỉnh sửa
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fs-14">
                          <i className="ti ti-shield text-gray me-2" />
                          Xác thực hai yếu tố
                        </h6>
                        <div className="form-check form-switch d-flex justify-content-end align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* /Security setting */}
              {/* Privacy setting */}
              {/* <div className="content-wrapper">
                <h5 className="sub-title">Privacy</h5>
                <div className="chat-file">
                  <div className="file-item ">
                    <div
                      className="accordion accordion-flush chat-accordion"
                      id="privacy-setting"
                    >
                      <div className="mb-3">
                        <div className="accordion-item border-0 border-bottom">
                          <h2 className="accordion-header others">
                            <Link
                              to="#"
                              className="accordion-button collapsed"
                              data-bs-toggle="collapse"
                              data-bs-target="#chatuser-collapse3"
                              aria-expanded="true"
                              aria-controls="chatuser-collapse3"
                            >
                              <i className="ti ti-mood-smile me-2" />
                              Profile Info
                            </Link>
                          </h2>
                          <div
                            id="chatuser-collapse3"
                            className="accordion-collapse collapse "
                            data-bs-parent="#privacy-setting"
                          >
                            <div className="accordion-body">
                              <div>
                                <div className="row">
                                  <div className="col-lg-12">
                                    <select className="form-select">
                                      <option>Everyone</option>
                                      <option>Except</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="accordion-item border-0 border-bottom">
                          <h2 className="accordion-header others">
                            <Link
                              to="#"
                              className="accordion-button collapsed"
                              data-bs-toggle="collapse"
                              data-bs-target="#chatuser-collapse3-1"
                              aria-expanded="true"
                              aria-controls="chatuser-collapse3-1"
                            >
                              <i className="ti ti-eye me-2" />
                              Last Seen
                            </Link>
                          </h2>
                          <div
                            id="chatuser-collapse3-1"
                            className="accordion-collapse collapse "
                            data-bs-parent="#privacy-setting"
                          >
                            <div className="accordion-body">
                              <div>
                                <div className="row">
                                  <div className="col-lg-12">
                                    <select className="form-select">
                                      <option>Everyone</option>
                                      <option>Except</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="accordion-item border-0 border-bottom">
                          <h2 className="accordion-header others">
                            <Link
                              to="#"
                              className="accordion-button collapsed"
                              data-bs-toggle="collapse"
                              data-bs-target="#chatuser-collapse3-2"
                              aria-expanded="true"
                              aria-controls="chatuser-collapse3-2"
                            >
                              <i className="ti ti-users-group me-2" />
                              Groups
                            </Link>
                          </h2>
                          <div
                            id="chatuser-collapse3-2"
                            className="accordion-collapse collapse "
                            data-bs-parent="#privacy-setting"
                          >
                            <div className="accordion-body">
                              <div>
                                <div className="row">
                                  <div className="col-lg-12">
                                    <select className="form-select">
                                      <option>Everyone</option>
                                      <option>Except</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="accordion-item border-0 border-bottom">
                          <h2 className="accordion-header others">
                            <Link
                              to="#"
                              className="accordion-button collapsed"
                              data-bs-toggle="collapse"
                              data-bs-target="#chatuser-collapse3-3"
                              aria-expanded="true"
                              aria-controls="chatuser-collapse3-3"
                            >
                              <i className="ti ti-circle-dot me-2" />
                              Status
                            </Link>
                          </h2>
                          <div
                            id="chatuser-collapse3-3"
                            className="accordion-collapse collapse "
                            data-bs-parent="#privacy-setting"
                          >
                            <div className="accordion-body">
                              <div>
                                <div className="row">
                                  <div className="col-lg-12">
                                    <select className="form-select mb-3">
                                      <option>Everyone</option>
                                      <option>Except</option>
                                    </select>
                                  </div>
                                  <div className="col-lg-12 d-flex">
                                    <Link
                                      to="#"
                                      className="btn btn-primary flex-fill"
                                    >
                                      <i className="ti ti-device-floppy me-2" />
                                      Save Changes
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fs-14">
                          <Link to="#">
                            <i className="ti ti-checks text-gray me-2" />
                            Read Receipients
                          </Link>
                        </h6>
                        <div className="form-check form-switch d-flex justify-content-end align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div> */}
              {/* /Privacy setting */}
              {/* Chat setting */}
              {/* <div className="content-wrapper">
                <h5 className="sub-title">Chat</h5>
                <div className="chat-file">
                  <div className="file-item ">
                    <div
                      className="accordion accordion-flush chat-accordion"
                      id="chat-setting"
                    >
                      <div className="border-0 profile-list mb-3">
                        <div className="accordion-item border-0 border-bottom">
                          <h2 className="accordion-header border-0">
                            <Link
                              to="#"
                              className="accordion-button border-0 collapsed"
                              data-bs-toggle="collapse"
                              data-bs-target="#chatuser-collapse4"
                              aria-expanded="true"
                              aria-controls="chatuser-collapse4"
                            >
                              <i className="ti ti-photo me-2" />
                              Background Images
                            </Link>
                          </h2>
                          <div
                            id="chatuser-collapse4"
                            className="accordion-collapse border-0 collapse "
                            data-bs-parent="#chat-setting"
                          >
                            <div className="accordion-body border-0 pb-0">
                              <div className="chat-user-photo">
                                <div className="chat-img contact-gallery mb-3">
                                  <div className="img-wrap">
                                    <ImageWithBasePath
                                      src="assets/img/gallery/gallery-01.jpg"
                                      alt="img"
                                    />
                                    <div className="img-overlay-1">
                                      <Link
                                        className="gallery-img"
                                        data-fancybox="gallery-img"
                                        to="assets/img/gallery/gallery-01.jpg"
                                        title="Demo 01"
                                      />
                                      <span className="check-icon avatar avatar-md d-flex justify-content-center align-items-center">
                                        <i className="ti ti-check  d-flex justify-content-center align-items-center" />
                                      </span>
                                    </div>
                                  </div>
                                  <div className="img-wrap">
                                    <ImageWithBasePath
                                      src="assets/img/gallery/gallery-02.jpg"
                                      alt="img"
                                    />
                                    <div className="img-overlay-1">
                                      <Link
                                        className="gallery-img"
                                        data-fancybox="gallery-img"
                                        to="assets/img/gallery/gallery-02.jpg"
                                        title="Demo 02"
                                      />
                                      <span className="check-icon avatar avatar-md d-flex justify-content-center align-items-center">
                                        <i className="ti ti-check  d-flex justify-content-center align-items-center" />
                                      </span>
                                    </div>
                                  </div>
                                  <div className="img-wrap">
                                    <ImageWithBasePath
                                      src="assets/img/gallery/gallery-03.jpg"
                                      alt="img"
                                    />
                                    <div className="img-overlay-1">
                                      <Link
                                        className="gallery-img"
                                        data-fancybox="gallery-img"
                                        to="assets/img/gallery/gallery-03.jpg"
                                        title="Demo 03"
                                      />
                                      <span className="check-icon avatar avatar-md d-flex justify-content-center align-items-center">
                                        <i className="ti ti-check  d-flex justify-content-center align-items-center" />
                                      </span>
                                    </div>
                                  </div>
                                  <div className="img-wrap">
                                    <ImageWithBasePath
                                      src="assets/img/gallery/gallery-04.jpg"
                                      alt="img"
                                    />
                                    <div className="img-overlay-1">
                                      <Link
                                        className="gallery-img"
                                        data-fancybox="gallery-img"
                                        to="assets/img/gallery/gallery-04.jpg"
                                        title="Demo 04"
                                      />
                                      <span className="check-icon avatar avatar-md d-flex justify-content-center align-items-center">
                                        <i className="ti ti-check  d-flex justify-content-center align-items-center" />
                                      </span>
                                    </div>
                                  </div>
                                  <div className="img-wrap">
                                    <ImageWithBasePath
                                      src="assets/img/gallery/gallery-05.jpg"
                                      alt="img"
                                    />
                                    <div className="img-overlay-1">
                                      <Link
                                        className="gallery-img"
                                        data-fancybox="gallery-img"
                                        to="assets/img/gallery/gallery-05.jpg"
                                        title="Demo 04"
                                      />
                                      <span className="check-icon avatar avatar-md d-flex justify-content-center align-items-center">
                                        <i className="ti ti-check  d-flex justify-content-center align-items-center" />
                                      </span>
                                    </div>
                                  </div>
                                  <div className="img-wrap">
                                    <ImageWithBasePath
                                      src="assets/img/gallery/gallery-06.jpg"
                                      alt="img"
                                    />
                                    <div className="img-overlay-1">
                                      <Link
                                        className="gallery-img"
                                        data-fancybox="gallery-img"
                                        to="assets/img/gallery/gallery-06.jpg"
                                        title="Demo 04"
                                      />
                                      <span className="check-icon avatar avatar-md d-flex justify-content-center align-items-center">
                                        <i className="ti ti-check  d-flex justify-content-center align-items-center" />
                                      </span>
                                    </div>
                                  </div>
                                  <div className="img-wrap">
                                    <ImageWithBasePath
                                      src="assets/img/gallery/gallery-07.jpg"
                                      alt="img"
                                    />
                                    <div className="img-overlay-1">
                                      <Link
                                        className="gallery-img"
                                        data-fancybox="gallery-img"
                                        to="assets/img/gallery/gallery-07.jpg"
                                        title="Demo 04"
                                      />
                                      <span className="check-icon avatar avatar-md d-flex justify-content-center align-items-center">
                                        <i className="ti ti-check  d-flex justify-content-center align-items-center" />
                                      </span>
                                    </div>
                                  </div>
                                  <div className="img-wrap">
                                    <ImageWithBasePath
                                      src="assets/img/gallery/gallery-08.jpg"
                                      alt="img"
                                    />
                                    <div className="img-overlay-1">
                                      <Link
                                        className="gallery-img"
                                        data-fancybox="gallery-img"
                                        to="assets/img/gallery/gallery-08.jpg"
                                        title="Demo 04"
                                      />
                                      <span className="check-icon avatar avatar-md d-flex justify-content-center align-items-center">
                                        <i className="ti ti-check  d-flex justify-content-center align-items-center" />
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="col-lg-12 d-flex">
                                  <Link
                                    to="#"
                                    className="btn btn-primary flex-fill mb-3"
                                  >
                                    <i className="ti ti-device-floppy me-2" />
                                    Save Changes
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="d-flex justify-content-between profile-list align-items-center border-bottom pb-3 mb-3">
                        <h6 className="fs-14">
                          <Link to="#">
                            <i className="ti ti-clear-all text-gray me-2 " />
                            Clear All Chat
                          </Link>
                        </h6>
                        <div className="form-check form-switch d-flex justify-content-end align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                          />
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center profile-list border-bottom pb-3 mb-3">
                        <h6 className="fs-14">
                          <Link to="#">
                            <i className="ti ti-trash text-gray me-2 " />
                            Delete All Chat
                          </Link>
                        </h6>
                        <div className="form-check form-switch d-flex justify-content-end align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                          />
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fs-14">
                          <Link to="#">
                            <i className="ti ti-restore text-gray me-2 " />
                            Chat Backup
                          </Link>
                        </h6>
                        <div className="form-check form-switch d-flex justify-content-end align-items-center">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div> */}
              {/* /Chat setting */}
              {/* Notification setting */}
              {/* <div className="content-wrapper">
                <h5 className="sub-title">Notifications</h5>
                <div className="chat-file">
                  <div className="file-item ">
                    <div className="card">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center profile-list border-bottom pb-3 mb-3">
                          <h6 className="fs-14">
                            <Link to="#">
                              <i className="ti ti-message text-gray me-2 " />
                              Message Notifications
                            </Link>
                          </h6>
                          <div className="form-check form-switch d-flex justify-content-end align-items-center">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              role="switch"
                            />
                          </div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center profile-list border-bottom pb-3 mb-3">
                          <h6 className="fs-14">
                            <Link to="#">
                              <i className="ti ti-trash text-gray me-2 " />
                              Show Previews
                            </Link>
                          </h6>
                          <div className="form-check form-switch d-flex justify-content-end align-items-center">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              role="switch"
                            />
                          </div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center profile-list border-bottom pb-3 mb-3">
                          <h6 className="fs-14">
                            <Link to="#">
                              <i className="ti ti-mood-smile text-gray me-2 " />
                              Show Reaction Notifications
                            </Link>
                          </h6>
                          <div className="form-check form-switch d-flex justify-content-end align-items-center">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              role="switch"
                            />
                          </div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center ">
                          <h6 className="fs-14">
                            <Link to="#">
                              <i className="ti ti-bell-ringing text-gray me-2 " />
                              Notification Sound
                            </Link>
                          </h6>
                          <div className="form-check form-switch d-flex justify-content-end align-items-center">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              role="switch"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div> */}
              {/* /Notification setting */}
              {/* Language setting */}
              {/* <div className="content-wrapper">
                <h5 className="sub-title">Language</h5>
                <div className="chat-file">
                  <div className="file-item ">
                    <div
                      className="accordion accordion-flush chat-accordion"
                      id="language-setting"
                    >
                      <div>
                        <div className="accordion-item border-0">
                          <h2 className="accordion-header">
                            <Link
                              to="#"
                              className="accordion-button collapsed"
                              data-bs-toggle="collapse"
                              data-bs-target="#chatuser-collapse5"
                              aria-expanded="false"
                              aria-controls="chatuser-collapse5"
                            >
                              <i className="ti ti-language me-2" />
                              Language
                            </Link>
                          </h2>
                          <div
                            id="chatuser-collapse5"
                            className="accordion-collapse collapse "
                            data-bs-parent="#Language-setting"
                          >
                            <div className="accordion-body">
                              <div>
                                <div className="row">
                                  <div className="col-lg-12">
                                    <select className="form-select">
                                      <option>English</option>
                                      <option>French</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div> */}
              {/* /Language setting */}
              {/* Manage Device */}
              {/* <div className="content-wrapper">
                <h5 className="sub-title">Manage Device</h5>
                <div className="chat-file">
                  <div className="file-item ">
                    <div
                      className="accordion accordion-flush chat-accordion"
                      id="device-setting"
                    >
                      <div>
                        <div className="accordion-item border-0">
                          <h2 className="accordion-header">
                            <Link
                              to="#"
                              className="accordion-button collapsed"
                              data-bs-toggle="collapse"
                              data-bs-target="#chatuser-collapse6"
                              aria-expanded="false"
                              aria-controls="chatuser-collapse6"
                            >
                              <i className="ti ti-eye me-2" />
                              Device History
                            </Link>
                          </h2>
                          <div
                            id="chatuser-collapse6"
                            className="accordion-collapse collapse "
                            data-bs-parent="#device-setting"
                          >
                            <div className="accordion-body">
                              <div className="device-option">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                  <div className="d-flex align-items-center">
                                    <span className="device-icon d-flex justify-content-center align-items-center bg-transparent-dark rounded-circle me-2">
                                      <i className="ti ti-device-laptop" />
                                    </span>
                                    <div>
                                      <h6 className="fs-16">
                                        Mac OS Safari 15.1
                                      </h6>
                                      <span className="fs-16">
                                        13 Jul 2024 at 03:15 PM
                                      </span>
                                    </div>
                                  </div>
                                  <div className="d-flex justify-content-end align-items-center">
                                    <div className="form-check">
                                      <input
                                        className="form-check-input"
                                        type="radio"
                                        name="mute"
                                        defaultChecked
                                      />
                                    </div>
                                    <Link to="#">
                                      <i className="ti ti-trash fs-16" />
                                    </Link>
                                  </div>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                  <div className="d-flex align-items-center">
                                    <span className="device-icon d-flex justify-content-center align-items-center bg-transparent-dark rounded-circle me-2">
                                      <i className="ti ti-device-laptop" />
                                    </span>
                                    <div>
                                      <h6 className="fs-16">
                                        Windows 11 Mozilla Firefox
                                      </h6>
                                      <span className="fs-16">
                                        06 Jul 2024 at 09:30 AM
                                      </span>
                                    </div>
                                  </div>
                                  <div className="d-flex justify-content-end align-items-center">
                                    <div className="form-check">
                                      <input
                                        className="form-check-input"
                                        type="radio"
                                        name="mute"
                                      />
                                    </div>
                                    <Link to="#">
                                      <i className="ti ti-trash fs-16" />
                                    </Link>
                                  </div>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                  <div className="d-flex align-items-center">
                                    <span className="device-icon d-flex justify-content-center align-items-center bg-transparent-dark rounded-circle me-2">
                                      <i className="ti ti-device-mobile" />
                                    </span>
                                    <div>
                                      <h6 className="fs-16">IOS Safari 15.1</h6>
                                      <span className="fs-16">
                                        28 Jun 2024 at 04:00 PM
                                      </span>
                                    </div>
                                  </div>
                                  <div className="d-flex justify-content-end align-items-center">
                                    <div className="form-check">
                                      <input
                                        className="form-check-input"
                                        type="radio"
                                        name="mute"
                                      />
                                    </div>
                                    <Link to="#">
                                      <i className="ti ti-trash fs-16" />
                                    </Link>
                                  </div>
                                </div>
                                <div className="d-flex">
                                  <Link
                                    to="#"
                                    className="btn btn-primary flex-fill"
                                  >
                                    <i className="ti ti-logout-2 me-2" />
                                    Logout From All Devices
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div> */}
              {/* /Manage Device */}
              {/* Others */}
              <div className="content-wrapper mb-0">
                <h5 className="sub-title">Cài đặt khác</h5>
                <div className="card mb-0">
                  <div className="card-body list-group profile-item">
                    <div
                      className="accordion accordion-flush chat-accordion list-group-item"
                      id="other-term"
                    >
                      <div className="accordion-item w-100">
                        <h2 className="accordion-header">
                          <Link
                            to="#"
                            className="accordion-button py-0 collapsed"
                            data-bs-toggle="collapse"
                            data-bs-target="#terms"
                            aria-expanded="false"
                            aria-controls="terms"
                          >
                            <i className="ti ti-file-text me-2" />
                            Điều khoản &amp; Điều kiện
                          </Link>
                        </h2>
                        <div
                          id="terms"
                          className="accordion-collapse collapse"
                          data-bs-parent="#other-term"
                        >
                          <div className="accordion-body p-0 pt-3">
                            <textarea
                              className="form-control"
                              defaultValue={""}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div
                      className="accordion accordion-flush chat-accordion list-group-item"
                      id="other-policy"
                    >
                      <div className="accordion-item w-100">
                        <h2 className="accordion-header">
                          <Link
                            to="#"
                            className="accordion-button py-0 collapsed"
                            data-bs-toggle="collapse"
                            data-bs-target="#privacy"
                            aria-expanded="false"
                            aria-controls="privacy"
                          >
                            <i className="ti ti-file-text me-2" />
                            Chính sách bảo mật
                          </Link>
                        </h2>
                        <div
                          id="privacy"
                          className="accordion-collapse collapse"
                          data-bs-parent="#other-policy"
                        >
                          <div className="accordion-body p-0 pt-3">
                            <textarea
                              className="form-control"
                              defaultValue={""}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* <Link
                      to="#"
                      className="list-group-item"
                      data-bs-toggle="modal"
                      data-bs-target="#block-user"
                    >
                      <div className="profile-info">
                        <h6>
                          <i className="ti ti-ban text-gray me-2" />
                          Blocked User
                        </h6>
                      </div>
                      <div>
                        <span className="link-icon">
                          <i className="ti ti-chevron-right" />
                        </span>
                      </div>
                    </Link>
                    <Link
                      to="#"
                      className="list-group-item"
                      data-bs-toggle="modal"
                      data-bs-target="#mute-user"
                    >
                      <div className="profile-info">
                        <h6>
                          <i className="ti ti-volume-off text-gray me-2" />
                          Mute User
                        </h6>
                      </div>
                      <div>
                        <span className="link-icon">
                          <i className="ti ti-chevron-right" />
                        </span>
                      </div>
                    </Link> */}
                    <Link
                      to="#"
                      className="list-group-item"
                      data-bs-toggle="modal"
                      data-bs-target="#delete-account"
                    >
                      <div className="profile-info">
                        <h6 className="text-danger">
                          <i className="ti ti-trash-x text-danger me-2" />
                          Xóa tài khoản
                        </h6>
                      </div>
                      <div>
                        <span className="link-icon">
                          <i className="ti ti-chevron-right" />
                        </span>
                      </div>
                    </Link>
                    <Link
                      to="#"
                      className="list-group-item"
                      onClick={() => setShowModal(true)}
                    >
                      <div
                        className="profile-info"
                        onClick={handleLogout}
                        style={{ cursor: "pointer" }}
                      >
                        <h6 className="text-danger">
                          <i className="ti ti-logout text-danger me-2" />
                          Đăng xuất
                        </h6>
                      </div>
                      <div>
                        <span className="link-icon">
                          <i className="ti ti-chevron-right" />
                        </span>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
              {/* Others */}
            </div>
          </div>
        </OverlayScrollbarsComponent>
      </div>
      {/* / Chats sidebar */}
      <LogoutModal showModal={showModal} setShowModal={setShowModal} />
    </>
  );
};

export default SettingsTab;
