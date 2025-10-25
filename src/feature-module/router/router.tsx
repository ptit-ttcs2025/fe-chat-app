import { useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

// Route Protection Components
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';

// Layout Components
import Feature from '../feature';
import AuthFeature from '../authFeature';
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

  useEffect(() => {
    setStyleLoaded(false); // Reset styleLoaded when pathname changes

    if (location.pathname.includes("/admin")) {
      import("../../assets/style/admin/main.scss")
        .then(() => setStyleLoaded(true))
        .catch((err) => console.error("Admin style load error: ", err));
    } else {
      import("../../assets/style/scss/main.scss")
        .then(() => setStyleLoaded(true))
        .catch((err) => console.error("Main style load error: ", err));
    }
  }, [location.pathname]);
  if (!styleLoaded) {
    return null; // You could show a loading spinner here if necessary
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

                {/* Protected Admin Routes - Need admin authentication */}
                {/*<Route element={*/}
                {/*    <ProtectedRoute>*/}
                {/*        <AdminFeature />*/}
                {/*    </ProtectedRoute>*/}
                {/*}>*/}
                {/*    {adminRoutes.map((route, idx) => (*/}
                {/*        <Route*/}
                {/*            key={idx}*/}
                {/*            path={route.path}*/}
                {/*            element={route.element}*/}
                {/*        />*/}
                {/*    ))}*/}
                {/*</Route>*/}

                {/* Admin Auth Routes */}
                <Route path="/admin/" element={
                    <PublicRoute restricted>
                        <AdminLogin />
                    </PublicRoute>
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
