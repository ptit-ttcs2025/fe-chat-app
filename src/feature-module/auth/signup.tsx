import React, {useCallback, useState} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { all_routes } from '../router/all_routes'
import ImageWithBasePath from '../../core/common/imageWithBasePath';
import { ISignupRequest } from "src/apis/auth/auth.type";
import { useSignup } from "@/apis/auth/auth.api.ts";
import { message } from "antd";


const Signup = () => {
    const routes = all_routes;
    const navigate = useNavigate();
    const { mutate: signup, isPending } = useSignup();

    // Form state
    const [formData, setFormData] = useState<ISignupRequest>({
        fullName: '',
        email: '',
        username: '',
        password: ''
    });
    // Password visibility
    const [isPasswordVisible, setPasswordVisible] = useState(false);
    // Agreed to terms
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    // Validate form errors
    const [errors, setErrors] = useState<Partial<Record<keyof ISignupRequest , string>>>({});
    // Api error
    const [apiError, setApiError] = useState<string>('');

    const togglePasswordVisibility = () => {
        setPasswordVisible((prevState) => !prevState);
    };

    const validateForm = useCallback((): boolean => {
        const newErrors: Partial<Record<keyof ISignupRequest, string>> = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Họ và tên là bắt buộc';
        }
        if (!formData.email.trim()) {
            newErrors.email = 'Email là bắt buộc';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ';
        }
        if (!formData.username.trim()) {
            newErrors.username = 'Tên đăng nhập là bắt buộc';
        } else if (formData.username.length < 4) {
            newErrors.username = 'Tên đăng nhập phải có ít nhất 4 ký tự';
        }
        if (!formData.password.trim()) {
            newErrors.password = 'Mật khẩu là bắt buộc';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    const handleChange = useCallback( (field: keyof ISignupRequest, value: string) => {
        setFormData(prev => ({...prev, [field]: value}));
        // Clear field-specific error
        if (errors[field]) {
            setErrors(prev => ({...prev, [field]: undefined}));
        }
        // Clear api error
        if (apiError) {
            setApiError('');
        }
    }, [errors, apiError]);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault(); // Chặn hành vi submit mặc định
        if (!agreedToTerms) return; // Kiểm tra điều khoản
        if (!validateForm()) return; // Validate form

        signup(formData, {
            onSuccess: (response) => {
                message.success('Đăng ký thành công!');
                //TODO: Có thể thêm xác thực email ở đây
                // TODO: Có thể tự động login sau khi đăng ký thành công
                navigate(routes.signin, {replace: true});
            },
            onError: (error: any) => {
                const errorMsg = error?.response?.data?.message ||
                    error?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
                setApiError(errorMsg);
            },
        });
    }, [agreedToTerms, validateForm, signup, formData, navigate, routes.signin]);

    return (
        <div className="container-fuild">
            <div className="w-100 overflow-hidden position-relative flex-wrap d-block vh-100">
                <div className="row">
                    {/* Left Column - Signup Form */}
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
                                                {/*Header */}
                                                <div className="mb-4">
                                                    <h2 className="mb-2">Đăng ký tài khoản</h2>
                                                    <p className="mb-0 fs-16">
                                                        Chia sẻ khoảnh khắc với bạn bè!
                                                    </p>
                                                </div>
                                                {/* API Error Alert */}
                                                {apiError && (
                                                    <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
                                                        <i className="ti ti-alert-circle me-2" />
                                                        <div>{apiError}</div>
                                                    </div>
                                                )}

                                                <div className="row">
                                                    {/*FullName Fields*/}
                                                    <div className="col-md-12">
                                                        <div className="mb-3">
                                                            <label className="form-label">Họ và tên</label>
                                                            <div className="input-icon mb-3 position-relative">
                                                                <input
                                                                    type="text"
                                                                    name="fullName"
                                                                    value={formData.fullName}
                                                                    onChange={e => handleChange('fullName', e.target.value)}
                                                                    className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
                                                                    disabled={isPending}
                                                                />
                                                                <span className="input-icon-addon">
                                                                    <i className="ti ti-user" />
                                                                </span>
                                                            </div>
                                                            {errors.fullName && (
                                                                <div className="text-danger fs-12">{errors.fullName}</div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/*Email Fields*/}
                                                    <div className="col-md-12">
                                                        <div className="mb-3">
                                                            <label className="form-label">Email</label>
                                                            <div className="input-icon mb-3 position-relative">
                                                                <input
                                                                    type="email"
                                                                    name="email"
                                                                    value={formData.email}
                                                                    onChange={e => handleChange('email', e.target.value)}
                                                                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                                                    disabled={isPending}
                                                                />
                                                                <span className="input-icon-addon">
                                                                    <i className="ti ti-mail" />
                                                                </span>
                                                            </div>
                                                            {errors.email && (
                                                                <div className="text-danger fs-12">{errors.email}</div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/*Username Fields*/}
                                                    <div className="col-lg-6 col-md-12">
                                                        <div className="mb-3">
                                                            <label className="form-label">Tên đăng nhập</label>
                                                            <div className="input-icon mb-3 position-relative">
                                                                <input
                                                                    type="text"
                                                                    name="username"
                                                                    value={formData.username}
                                                                    onChange={e => handleChange('username', e.target.value)}
                                                                    className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                                                                    disabled={isPending}
                                                                />
                                                                <span className="input-icon-addon">
                                                                    <i className="ti ti-user" />
                                                                </span>
                                                            </div>
                                                            {errors.username && (
                                                                <div className="text-danger fs-12">{errors.username}</div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/*Password Fields*/}
                                                    <div className="col-lg-6 col-md-12">
                                                        <div className="mb-3">
                                                            <label className="form-label">Mật khẩu</label>
                                                            <div className="input-icon position-relative">
                                                                <input
                                                                    type={isPasswordVisible ? "text" : "password"}
                                                                    name="password"
                                                                    value={formData.password}
                                                                    onChange={e => handleChange('password', e.target.value)}
                                                                    className={`pass-input form-control ${errors.password ? 'is-invalid' : ''}`}
                                                                    disabled={isPending}
                                                                />
                                                                <span
                                                                    className={`ti toggle-password ${isPasswordVisible ? "ti-eye" : "ti-eye-off"}`}
                                                                    onClick={togglePasswordVisibility}
                                                                />
                                                            </div>
                                                            {errors.password && (
                                                                <div className="text-danger fs-12 mt-1">{errors.password}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="form-wrap form-wrap-checkbox mb-3">
                                                    <div className="d-flex align-items-center">
                                                        <div className="form-check form-check-md mb-0">
                                                            <input
                                                                className="form-check-input mt-0"
                                                                type="checkbox"
                                                                checked={agreedToTerms}
                                                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                                            />
                                                        </div>
                                                        <p className="mb-0">
                                                            Tôi đồng ý với
                                                            <Link to="#" className="link-primary"> Điều khoản </Link>
                                                            &amp;
                                                            <Link to="#" className="link-primary"> Chính sách bảo mật</Link>
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mb-4">
                                                    <button
                                                        type="submit"
                                                        className="btn btn-primary w-100 justify-content-center"
                                                        disabled={isPending}
                                                    >
                                                        {isPending ? 'Đăng ký...' : 'Đăng ký'}
                                                    </button>
                                                </div>
                                                <div className="login-or mb-3">
                                                    <span className="span-or">Đăng nhập với</span>
                                                </div>
                                                <div className="d-flex align-items-center justify-content-center flex-wrap">
                                                    <div className="text-center me-2 flex-fill">
                                                        <Link to="#" className="fs-16 btn btn-white btn-shadow d-flex align-items-center justify-content-center">
                                                            <ImageWithBasePath className="img-fluid me-3" src="assets/img/icons/google.svg" alt="Google" />
                                                            Google
                                                        </Link>
                                                    </div>
                                                    <div className="text-center flex-fill">
                                                        <Link to="#" className="fs-16 btn btn-white btn-shadow d-flex align-items-center justify-content-center">
                                                            <ImageWithBasePath className="img-fluid me-3" src="assets/img/icons/facebook.svg" alt="Facebook" />
                                                            Facebook
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-5 text-center">
                                            <p className="mb-0 text-gray-9">
                                                Đã có tài khoản?{" "}
                                                <Link to={routes.signin} className="link-primary">Đăng nhập</Link>
                                            </p>
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
                                    <ImageWithBasePath src="assets/img/profiles/avatar-12.jpg" alt="img" />
                                </span>
                                <span className="avatar avatar-xl avatar-rounded border border-white">
                                    <ImageWithBasePath src="assets/img/profiles/avatar-03.jpg" alt="img" />
                                </span>
                                <span className="avatar avatar-xl avatar-rounded border border-white">
                                    <ImageWithBasePath src="assets/img/profiles/avatar-02.jpg" alt="img" />
                                </span>
                                <span className="avatar avatar-xl avatar-rounded border border-white">
                                    <ImageWithBasePath src="assets/img/profiles/avatar-05.jpg" alt="img" />
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

export default Signup