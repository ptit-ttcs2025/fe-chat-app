import React, { useCallback, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@/slices/auth/reducer';
import { useLogin } from '@/apis/auth/auth.api';
import { authApis } from '@/apis/auth/auth.api';
import type { IAuth } from '@/apis/auth/auth.type';
import { all_routes } from '@/feature-module/router/all_routes';
import ImageWithBasePath from '@/core/common/imageWithBasePath';
import authStorage from '@/lib/authStorage';

const Signin: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { mutate: login, isPending } = useLogin();

    // ✅ Clear tokens/cookies khi vào trang login
    useEffect(() => {
        console.log('🧹 Clearing old tokens on login page...');
        authStorage.clearAuthData();
    }, []);

    // Form state
    const [formData, setFormData] = useState<IAuth>({
        username: '',
        password: '',
    });

    // Validation errors
    const [errors, setErrors] = useState<Partial<Record<keyof IAuth, string>>>({});

    // API error
    const [apiError, setApiError] = useState<string>('');

    // Show/hide password
    const [showPassword, setShowPassword] = useState(false);

    // ✅ Helper function to determine redirect path based on user role
    const getRedirectPath = useCallback((user: any): string => {
        // Priority 1: Use the intended path if exists
        if (location.state?.from?.pathname) {
            return location.state.from.pathname;
        }

        // Priority 2: Check user role
        const userRole = user?.role || 'USER';

        if (userRole === 'ROLE_ADMIN') {
            console.log('🔐 Admin login detected, redirecting to dashboard');
            return all_routes.dashboard;
        }

        // Priority 3: Default to chat for regular users
        console.log('👤 Regular user login, redirecting to chat');
        return all_routes.chat;
    }, [location]);

    // Validate form fields
    const validateForm = useCallback((): boolean => {
        const newErrors: Partial<Record<keyof IAuth, string>> = {};

        if (!formData.username.trim()) {
            newErrors.username = 'Tên đăng nhập không được để trống';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
        }

        if (!formData.password) {
            newErrors.password = 'Mật khẩu không được để trống';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    // Handle input change
    const handleChange = useCallback((field: keyof IAuth, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
        if (apiError) {
            setApiError('');
        }
    }, [errors, apiError]);

    // Handle form submit
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        login(formData, {
            onSuccess: async (response) => {
                console.log('✅ Đăng nhập thành công:', response);

                try {
                    // ✅ Fetch user profile để lấy đầy đủ thông tin (bao gồm role)
                    console.log('📡 Fetching user profile...');
                    const profileResponse = await authApis.me();

                    console.log('✅ Profile data:', profileResponse);

                    // ✅ Lưu thông tin đầy đủ vào Redux (bao gồm role)
                    const userWithRole = {
                        ...response.user,
                        role: profileResponse.role,  // ← Thêm role từ profile
                        dob: profileResponse.dob,
                        bio: profileResponse.bio,
                        createdAt: profileResponse.createdAt,
                    };

                    dispatch(setCredentials({
                        user: userWithRole,
                        accessToken: response.accessToken,
                        refreshToken: response.refreshToken,
                    }));

                    console.log('✅ User with role saved:', userWithRole);

                    // ✅ Role-based redirect
                    const redirectPath = getRedirectPath(userWithRole);
                    navigate(redirectPath, { replace: true });
                } catch (error) {
                    console.error('❌ Failed to fetch profile:', error);
                    // Fallback: lưu user info từ login response (có thể có role)
                    const userWithFallbackRole = {
                        ...response.user,
                        role: response.user.role || 'USER', // Use role from login response if available
                    };

                    dispatch(setCredentials({
                        user: userWithFallbackRole,
                        accessToken: response.accessToken,
                        refreshToken: response.refreshToken,
                    }));

                    // ✅ Role-based redirect for fallback
                    const redirectPath = getRedirectPath(userWithFallbackRole);
                    navigate(redirectPath, { replace: true });
                }
            },
            onError: (error: any) => {
                const errorMessage =
                    error?.message ||
                    'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
                setApiError(errorMessage);
                console.error('❌ Lỗi đăng nhập:', error);
            },
        });
    }, [formData, validateForm, login, dispatch, navigate, getRedirectPath]);

    return (
        <div className="container-fuild">
            <div className="w-100 overflow-hidden position-relative flex-wrap d-block vh-100">
                <div className="row">
                    {/* Left Column - Login Form */}
                    <div className="col-lg-6 col-md-12 col-sm-12">
                        <div className="row justify-content-center align-items-center vh-100 overflow-auto flex-wrap login-bg1">
                            <div className="col-md-9 mx-auto p-4">
                                <form onSubmit={handleSubmit}>
                                    <div>
                                        {/* Logo */}
                                        <div className="mx-auto mb-5 text-center">
                                            <ImageWithBasePath
                                                src="assets/img/full-logo.svg"
                                                className="img-fluid"
                                                alt="Logo"
                                            />
                                        </div>

                                        <div className="card">
                                            <div className="card-body">
                                                {/* Header */}
                                                <div className="mb-4">
                                                    <h2 className="mb-2">Welcome Back!</h2>
                                                    <p className="mb-0 fs-16">
                                                        Đăng nhập để tiếp tục
                                                    </p>
                                                </div>

                                                {/* API Error Alert */}
                                                {apiError && (
                                                    <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
                                                        <i className="ti ti-alert-circle me-2" />
                                                        <div>{apiError}</div>
                                                    </div>
                                                )}

                                                {/* Username Field */}
                                                <div className="mb-3">
                                                    <label className="form-label">Tên đăng nhập</label>
                                                    <div className="input-icon mb-3 position-relative">
                                                        <input
                                                            type="text"
                                                            className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                                                            placeholder="Nhập tên đăng nhập"
                                                            value={formData.username}
                                                            onChange={(e) => handleChange('username', e.target.value)}
                                                            disabled={isPending}
                                                        />
                                                        <span className="input-icon-addon">
                                                            <i className="ti ti-user" />
                                                        </span>
                                                    </div>
                                                    {errors.username && (
                                                        <div className="invalid-feedback d-block">
                                                            {errors.username}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Password Field */}
                                                <div className="mb-3">
                                                    <label className="form-label">Mật khẩu</label>
                                                    <div className="pass-group">
                                                        <input
                                                            type={showPassword ? "text" : "password"}
                                                            className={`form-control pass-input ${errors.password ? 'is-invalid' : ''}`}
                                                            placeholder="Nhập mật khẩu"
                                                            value={formData.password}
                                                            onChange={(e) => handleChange('password', e.target.value)}
                                                            disabled={isPending}
                                                        />
                                                        <span
                                                            className={`ti toggle-password ${showPassword ? "ti-eye" : "ti-eye-off"}`}
                                                            onClick={() => setShowPassword(!showPassword)}
                                                        />
                                                    </div>
                                                    {errors.password && (
                                                        <div className="invalid-feedback d-block">
                                                            {errors.password}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Remember Me & Forgot Password */}
                                                <div className="form-wrap form-wrap-checkbox">
                                                    <div className="d-flex align-items-center">
                                                        <div className="form-check">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                id="remember"
                                                            />
                                                            <label className="form-check-label" htmlFor="remember">
                                                                Ghi nhớ đăng nhập
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <div className="text-end">
                                                        <Link className="link-danger" to={all_routes.forgotPassword}>
                                                            Quên mật khẩu?
                                                        </Link>
                                                    </div>
                                                </div>

                                                {/* Submit Button */}
                                                <div className="mb-3">
                                                    <button
                                                        type="submit"
                                                        className="btn btn-primary w-100"
                                                        disabled={isPending}
                                                    >
                                                        {isPending ? (
                                                            <>
                                                                <span className="spinner-border spinner-border-sm me-2" />
                                                                Đang đăng nhập...
                                                            </>
                                                        ) : (
                                                            'Đăng nhập'
                                                        )}
                                                    </button>
                                                </div>

                                                {/* Signup Link */}
                                                <div className="text-center">
                                                    <p className="mb-0">
                                                        Chưa có tài khoản?{" "}
                                                        <Link className="text-primary" to={all_routes.signup}>
                                                            Đăng ký ngay
                                                        </Link>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Background Image */}
                    <div className="col-lg-6 p-0">
                        <div className="d-lg-flex align-items-center justify-content-center position-relative d-lg-block d-none flex-wrap vh-100 overflowy-auto login-bg2">
                            {/* Floating Background Elements */}
                            <div className="floating-bg">
                                <ImageWithBasePath src="assets/img/bg/circle-1.png" alt="Img" />
                                <ImageWithBasePath src="assets/img/bg/circle-2.png" alt="Img" />
                                <ImageWithBasePath src="assets/img/bg/emoji-01.svg" alt="Img" />
                                <ImageWithBasePath src="assets/img/bg/emoji-02.svg" alt="Img" />
                                <ImageWithBasePath src="assets/img/bg/emoji-03.svg" alt="Img" />
                                <ImageWithBasePath src="assets/img/bg/emoji-04.svg" alt="Img" />
                                <ImageWithBasePath src="assets/img/bg/right-arrow-01.svg" alt="Img" />
                                <ImageWithBasePath src="assets/img/bg/right-arrow-02.svg" alt="Img" />
                            </div>

                            {/* Floating Avatars */}
                            <div className="floating-avatar">
                                <span className="avatar avatar-xl avatar-rounded border border-white">
                                    <ImageWithBasePath src="assets/img/profiles/avatar-02.png" alt="img" />
                                </span>
                                <span className="avatar avatar-xl avatar-rounded border border-white">
                                    <ImageWithBasePath src="assets/img/profiles/avatar-03.png" alt="img" />
                                </span>
                                <span className="avatar avatar-xl avatar-rounded border border-white">
                                    <ImageWithBasePath src="assets/img/profiles/avatar-04.png" alt="img" />
                                </span>
                                <span className="avatar avatar-xl avatar-rounded border border-white">
                                    <ImageWithBasePath src="assets/img/profiles/avatar-05.png" alt="img" />
                                </span>
                            </div>

                            {/* Main Illustration */}
                            <div className="text-center">
                                <ImageWithBasePath
                                    src="assets/img/bg/login-bg-1.png"
                                    className="login-img"
                                    alt="Img"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signin;

