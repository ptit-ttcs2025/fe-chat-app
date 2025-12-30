import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { all_routes } from "../../router/all_routes";
import { useLogin } from "@/apis/auth/auth.api";
import { authApis } from "@/apis/auth/auth.api";
import { setCredentials } from "@/slices/auth/reducer";
import type { IAuth } from "@/apis/auth/auth.type";
import authStorage from "@/lib/authStorage";

const AdminLogin = () => {
  const routes = all_routes;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { mutate: login, isPending } = useLogin();
  
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [formData, setFormData] = useState<IAuth>({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof IAuth, string>>>({});
  const [apiError, setApiError] = useState<string>("");

  const togglePasswordVisibility = () => {
    setPasswordVisible((prevState) => !prevState);
  };

  useEffect(() => {
    localStorage.setItem('menuOpened', '');
    // Clear old tokens when entering login page
    authStorage.clearAuthData();
  }, []);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof IAuth, string>> = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username không được để trống";
    }

    if (!formData.password) {
      newErrors.password = "Mật khẩu không được để trống";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle input change
  const handleChange = useCallback((field: keyof IAuth, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (apiError) {
      setApiError("");
    }
  }, [errors, apiError]);

  // Handle form submit
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) return;

      login(formData, {
        onSuccess: async (response) => {
          try {
            // ✅ Lưu credentials trước để token được set vào cookies
            dispatch(
              setCredentials({
                user: response.user,
                accessToken: response.accessToken,
                refreshToken: response.refreshToken,
              })
            );

            // ✅ Đợi một chút để đảm bảo cookies được set
            await new Promise(resolve => setTimeout(resolve, 100));

            // Fetch user profile to get full information (including role)
            let userWithRole = response.user;
            try {
              const profileResponse = await authApis.me();
              if (profileResponse) {
                // Save full information to Redux (including role)
                userWithRole = {
                  ...response.user,
                  role: profileResponse.role || response.user.role,
                  dob: profileResponse.dob,
                  bio: profileResponse.bio,
                  createdAt: profileResponse.createdAt,
                };
              }
            } catch (profileError) {
              console.warn("⚠️ Could not fetch profile, using login response:", profileError);
              // Use role from login response if available
              userWithRole = {
                ...response.user,
                role: response.user.role || "USER",
              };
            }

            dispatch(
              setCredentials({
                user: userWithRole,
                accessToken: response.accessToken,
                refreshToken: response.refreshToken,
              })
            );

            // ✅ Đợi một chút để đảm bảo state được update
            await new Promise(resolve => setTimeout(resolve, 100));

            // Navigate to dashboard
            navigate(routes.dashboard, { replace: true });
          } catch (error) {
            console.error("❌ Failed to fetch profile:", error);
            // Fallback: save user info from login response
            const userWithFallbackRole = {
              ...response.user,
              role: response.user.role || "USER",
            };

            dispatch(
              setCredentials({
                user: userWithFallbackRole,
                accessToken: response.accessToken,
                refreshToken: response.refreshToken,
              })
            );

            // ✅ Đợi một chút để đảm bảo state được update
            await new Promise(resolve => setTimeout(resolve, 100));

            // Navigate to dashboard
            navigate(routes.dashboard, { replace: true });
          }
        },
        onError: (error: any) => {
          const errorMessage =
            error?.response?.data?.message ||
            error?.message ||
            "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
          setApiError(errorMessage);
          console.error("❌ Lỗi đăng nhập:", error);
        },
      });
    },
    [formData, validateForm, login, dispatch, navigate, routes.dashboard]
  );

  return (
    <>
      {/* Main Wrapper */}
      <div className="container-fluid">
        <div className="login-wrapper">
          <header className="logo-header">
            <Link to="#" className="logo-brand">
              <ImageWithBasePath
                src="assets/admin/img/full-logo.svg"
                alt="Logo"
                className="img-fluid logo-dark"
              />
            </Link>
          </header>
          <div className="login-inbox admin-login">
            <div className="log-auth">
              <div className="login-auth-wrap">
                <div className="login-content-head">
                  <h3>Đăng nhập</h3>
                </div>
              </div>
              <form onSubmit={handleSubmit}>
                {/* API Error Alert */}
                {apiError && (
                  <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
                    <i className="ti ti-alert-circle me-2" />
                    <div>{apiError}</div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">
                    Tên đăng nhập <span>*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.username ? "is-invalid" : ""}`}
                    placeholder="Nhập tên đăng nhập"
                    value={formData.username}
                    onChange={(e) => handleChange("username", e.target.value)}
                    disabled={isPending}
                  />
                  {errors.username && (
                    <div className="invalid-feedback d-block">{errors.username}</div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Mật khẩu <span>*</span>
                  </label>
                  <div className="pass-group">
                    <input
                      type={isPasswordVisible ? "text" : "password"}
                      className={`form-control pass-inputs ${errors.password ? "is-invalid" : ""}`}
                      placeholder="Nhập mật khẩu"
                      value={formData.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      disabled={isPending}
                    />
                    <span
                      className={`ti toggle-passwords ${
                        isPasswordVisible ? "ti-eye" : "ti-eye-off"
                      }`}
                      onClick={togglePasswordVisibility}
                    />
                  </div>
                  {errors.password && (
                    <div className="invalid-feedback d-block">{errors.password}</div>
                  )}
                </div>
                <div className="form-group form-remember d-flex align-items-center justify-content-between">
                  <div className="form-check d-flex align-items-center justify-content-start ps-0">
                    <label className="custom-check mt-0 mb-0">
                      <span className="remember-me">Ghi nhớ đăng nhập</span>
                      <input type="checkbox" name="remeber" />
                      <span className="checkmark" />
                    </label>
                  </div>
                  <span className="forget-pass">
                    <Link to={routes.adminForgotPassword}>Quên mật khẩu?</Link>
                  </span>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary w-100 btn-size justify-content-center"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Đang đăng nhập...
                    </>
                  ) : (
                    "Đăng nhập"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /Main Wrapper */}
    </>
  );
};

export default AdminLogin;
