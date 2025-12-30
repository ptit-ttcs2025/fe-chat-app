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
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

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

    // Handle social login coming soon notification
    const handleSocialLogin = useCallback((provider: 'Google' | 'Facebook') => {
        MySwal.fire({
            toast: true,
            position: 'top-end',
            icon: 'info',
            title: `Đăng nhập với ${provider}`,
            html: `<div style="text-align: left;">
                <p style="margin: 0; font-size: 14px; color: #6c757d;">
                    Tính năng này sẽ được phát triển trong phiên bản tiếp theo 🚀
                </p>
            </div>`,
            showConfirmButton: false,
            timer: 4000,
            timerProgressBar: true,
            showClass: {
                popup: 'animate__animated animate__fadeInRight'
            },
            hideClass: {
                popup: 'animate__animated animate__fadeOutRight'
            },
            customClass: {
                popup: 'colored-toast'
            }
        });
    }, []);

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
                    // ✅ Lưu credentials trước để token được set vào cookies
                    dispatch(setCredentials({
                        user: response.user,
                        accessToken: response.accessToken,
                        refreshToken: response.refreshToken,
                    }));

                    // ✅ Đợi một chút để đảm bảo cookies được set
                    await new Promise(resolve => setTimeout(resolve, 100));

                    // ✅ Fetch user profile để lấy đầy đủ thông tin (bao gồm role)
                    console.log('📡 Fetching user profile...');
                    let userWithRole = response.user;
                    
                    try {
                        const profileResponse = await authApis.me();
                        if (profileResponse) {
                            console.log('✅ Profile data:', profileResponse);
                            // ✅ Lưu thông tin đầy đủ vào Redux (bao gồm role)
                            userWithRole = {
                                ...response.user,
                                role: profileResponse.role || response.user.role,
                                dob: profileResponse.dob,
                                bio: profileResponse.bio,
                                createdAt: profileResponse.createdAt,
                            };
                        }
                    } catch (profileError) {
                        console.warn('⚠️ Could not fetch profile, using login response:', profileError);
                        // Use role from login response if available
                        userWithRole = {
                            ...response.user,
                            role: response.user.role || 'USER',
                        };
                    }

                    // ✅ Update với thông tin đầy đủ
                    dispatch(setCredentials({
                        user: userWithRole,
                        accessToken: response.accessToken,
                        refreshToken: response.refreshToken,
                    }));

                    console.log('✅ User with role saved:', userWithRole);

                    // ✅ Role-based redirect
                    const redirectPath = getRedirectPath(userWithRole);
                    
                    // ✅ Nếu là admin, preload admin style trước khi navigate
                    if (userWithRole.role === 'ROLE_ADMIN' && redirectPath.includes('/admin')) {
                        console.log('🔐 Preloading admin styles before navigation...');
                        try {
                            await import("../../assets/style/admin/main.scss");
                            // Đợi style được apply
                            await new Promise(resolve => setTimeout(resolve, 150));
                            console.log('✅ Admin styles preloaded');
                        } catch (styleError) {
                            console.warn('⚠️ Could not preload admin styles:', styleError);
                        }
                    }

                    // ✅ Đợi một chút để đảm bảo state được update
                    await new Promise(resolve => setTimeout(resolve, 100));

                    // Navigate to dashboard
                    navigate(redirectPath, { replace: true });
                } catch (error) {
                    console.error('❌ Failed to process login:', error);
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
                    
                    // ✅ Nếu là admin, preload admin style trước khi navigate
                    if (userWithFallbackRole.role === 'ROLE_ADMIN' && redirectPath.includes('/admin')) {
                        console.log('🔐 Preloading admin styles before navigation (fallback)...');
                        try {
                            await import("../../assets/style/admin/main.scss");
                            // Đợi style được apply
                            await new Promise(resolve => setTimeout(resolve, 150));
                            console.log('✅ Admin styles preloaded');
                        } catch (styleError) {
                            console.warn('⚠️ Could not preload admin styles:', styleError);
                        }
                    }

                    // ✅ Đợi một chút để đảm bảo state được update
                    await new Promise(resolve => setTimeout(resolve, 100));

                    // Navigate to dashboard
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
                                                    <div className="input-icon position-relative">
                                                        <input
                                                            type={showPassword ? "text" : "password"}
                                                            className={`pass-input form-control ${errors.password ? 'is-invalid' : ''}`}
                                                            placeholder="Nhập mật khẩu"
                                                            value={formData.password}
                                                            onChange={(e) => handleChange('password', e.target.value)}
                                                            disabled={isPending}
                                                        />
                                                        <span
                                                            className={`ti toggle-password ${
                                                                showPassword ? "ti-eye" : "ti-eye-off"
                                                            }`}
                                                            onClick={() => setShowPassword(!showPassword)}
                                                        />
                                                    </div>
                                                    {errors.password && (
                                                        <div className="invalid-feedback d-block">
                                                            {errors.password}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Forgot Password */}
                                                <div className="text-end mb-3">
                                                    <Link to={all_routes.forgotPassword} className="link-primary">
                                                        Quên mật khẩu?
                                                    </Link>
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

                                                {/* Social Login Divider */}
                                                <div className="login-or mb-3">
                                                    <span className="span-or">Hoặc đăng nhập với</span>
                                                </div>

                                                {/* Social Login Buttons */}
                                                <div className="d-flex align-items-center justify-content-center flex-wrap">
                                                    <div className="text-center me-2 flex-fill">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSocialLogin('Google')}
                                                            className="fs-16 btn btn-white btn-shadow d-flex align-items-center justify-content-center w-100"
                                                        >
                                                            <ImageWithBasePath
                                                                className="img-fluid me-3"
                                                                src="assets/img/icons/google.svg"
                                                                alt="Google"
                                                            />
                                                            Google
                                                        </button>
                                                    </div>
                                                    <div className="text-center flex-fill">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSocialLogin('Facebook')}
                                                            className="fs-16 btn btn-white btn-shadow d-flex align-items-center justify-content-center w-100"
                                                        >
                                                            <ImageWithBasePath
                                                                className="img-fluid me-3"
                                                                src="assets/img/icons/facebook.svg"
                                                                alt="Facebook"
                                                            />
                                                            Facebook
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Signup Link */}
                                                <div className="mt-5 text-center">
                                                    <p className="mb-0 text-gray-9">
                                                        Chưa có tài khoản?{' '}
                                                        <Link to={all_routes.signup} className="link-primary">
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
                                    <ImageWithBasePath src="assets/img/profiles/avatar-02.png" alt="img" />
                                </span>
                                <span className="avatar avatar-xl avatar-rounded border border-white">
                                    <ImageWithBasePath src="assets/img/profiles/avatar-02.png" alt="img" />
                                </span>
                                <span className="avatar avatar-xl avatar-rounded border border-white">
                                    <ImageWithBasePath src="assets/img/profiles/avatar-02.png" alt="img" />
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

