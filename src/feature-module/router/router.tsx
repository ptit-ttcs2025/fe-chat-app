import { useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

// Route Protection Components
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { AdminGuard } from '@/core/guards/AdminGuard';

// Error Handling
import ErrorBoundary from '@/core/components/ErrorBoundary';

// Layout Components
import Feature from '../feature';
import AdminFeature from '../adminFeature';
import AdminAuthFeature from '../adminAuthFeature';

// Auth Pages
import Signin from '../auth/signin';
import Signup from '../auth/signup';
import ForgotPassword from '../auth/forgotPassword';
import ResetPassword from '../auth/resetPassword';
import Success from '../auth/success';
import AdminLogin from '../admin/authentication/login';

// Routes Config
import { userRoutes, authRoutes, adminRoutes, adminAuth } from './router.link';
import { all_routes } from './all_routes';

// Toast Notification Manager
import NotificationToastManager from '@/core/components/NotificationToastManager';


const Mainapp: React.FC = () => {
  const location = useLocation();

  // Find the current route in either public or auth routes
  const currentRoute = userRoutes.find(route => route.path === location.pathname) ||
                       authRoutes.find(route => route.path === location.pathname);

  // Construct the full title
  const fullTitle = currentRoute?.title 
    ? `${currentRoute.title} - DreamsChat`
    : "DreamsChat";

  useEffect(() => {
    document.title = fullTitle;
  }, [fullTitle]);

  const [styleLoaded, setStyleLoaded] = useState(false);
  const [currentStyleContext, setCurrentStyleContext] = useState<'admin' | 'user' | null>(null);

  useEffect(() => {
    const isAdminRoute = location.pathname.includes("/admin");
    const newContext = isAdminRoute ? 'admin' : 'user';
    
    // Initial load hoặc chuyển context (admin <-> user)
    if (currentStyleContext === null || currentStyleContext !== newContext) {
      setStyleLoaded(false);
      setCurrentStyleContext(newContext);

      const loadStyle = async () => {
        try {
          if (isAdminRoute) {
            await import("../../assets/style/admin/main.scss");
          } else {
            await import("../../assets/style/scss/main.scss");
          }
          // Đợi một chút để đảm bảo style được apply và DOM được update
          await new Promise(resolve => setTimeout(resolve, 150));
          setStyleLoaded(true);
        } catch (err) {
          console.error(`${isAdminRoute ? 'Admin' : 'Main'} style load error: `, err);
          // Vẫn set styleLoaded = true để không bị màn hình trắng vĩnh viễn
          // Nhưng đợi một chút để component có thời gian render
          await new Promise(resolve => setTimeout(resolve, 150));
          setStyleLoaded(true);
        }
      };

      loadStyle();
    } else {
      // Đã ở cùng context, không cần load lại style
      if (!styleLoaded) {
        setStyleLoaded(true);
      }
    }
  }, [location.pathname, currentStyleContext]);
  
  if (!styleLoaded) {
    // Show loading spinner while styles are loading
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#fff'
      }}>
        <div className="spinner-border text-primary" role="status" style={{
          width: '48px',
          height: '48px',
          borderWidth: '4px'
        }}>
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }
    return (
        <>
            <Helmet>
                <title>{fullTitle}</title>
            </Helmet>

            {/* Toast Notification Manager - Display toast notifications */}
            <NotificationToastManager />

            <Routes>
                {/* Public Auth Routes - Restricted for authenticated users */}
                <Route path="/" element={
                    <PublicRoute restricted>
                        <Signin />
                    </PublicRoute>
                } />

                <Route path="/signin" element={
                    <PublicRoute restricted>
                        <Signin />
                    </PublicRoute>
                } />

                <Route path="/signup" element={
                    <PublicRoute restricted>
                        <Signup />
                    </PublicRoute>
                } />

                <Route path="/forgot-password" element={
                    <PublicRoute restricted>
                        <ForgotPassword />
                    </PublicRoute>
                } />

                <Route path="/reset-password" element={
                    <PublicRoute restricted>
                        <ResetPassword />
                    </PublicRoute>
                } />

                <Route path="/success" element={
                    <PublicRoute>
                        <Success />
                    </PublicRoute>
                } />

                {/*/!*  Routes - No authentication needed *!/*/}
                {/*<Route element={<Feature />}>*/}
                {/*    {publicRoutes.map((route, idx) => (*/}
                {/*        <Route*/}
                {/*            key={idx}*/}
                {/*            path={route.path}*/}
                {/*            element={*/}
                {/*                <PublicRoute>*/}
                {/*                    {route.element}*/}
                {/*                </PublicRoute>*/}
                {/*            }*/}
                {/*        />*/}
                {/*    ))}*/}
                {/*</Route>*/}

                {/* Protected Admin Routes - Need admin authentication + admin role */}
                {/* Đặt AdminFeature trước Feature để đảm bảo admin routes được match trước */}
                <Route element={
                    <ProtectedRoute>
                        <ErrorBoundary>
                            <AdminFeature />
                        </ErrorBoundary>
                    </ProtectedRoute>
                }>
                    {adminRoutes.map((route, idx) => (
                        <Route
                            key={idx}
                            path={route.path}
                            element={
                                <AdminGuard>
                                    {route.element}
                                </AdminGuard>
                            }
                        />
                    ))}
                </Route>

                {/* Protected Auth Routes - Need authentication */}
                <Route element={
                    <ProtectedRoute>
                        <Feature />
                    </ProtectedRoute>
                }>
                    {userRoutes.map((route, idx) => (
                        <Route
                            key={idx}
                            path={route.path}
                            element={route.element}
                        />
                    ))}
                </Route>

                {/* Admin fallback route - redirect /admin to /admin/login if not authenticated, or /admin/index if authenticated */}
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute>
                            <AdminGuard>
                                <Navigate to={all_routes.dashboard} replace />
                            </AdminGuard>
                        </ProtectedRoute>
                    }
                />

                {/* Admin Auth Routes - /admin/ redirects to /admin/login for consistency */}
                <Route path="/admin/" element={
                    <Navigate to={all_routes.login} replace />
                } />

                <Route element={<AdminAuthFeature />}>
                    {adminAuth.map((route, idx) => (
                        <Route
                            key={idx}
                            path={route.path}
                            element={route.element}
                        />
                    ))}
                </Route>

                {/* 404 Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
};

export default Mainapp;
