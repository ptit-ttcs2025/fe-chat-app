// src/feature-module/router/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '@/slices/auth/reducer';
import { all_routes } from './all_routes';

interface ProtectedRouteProps {
    children: React.ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const location = useLocation();

    if (!isAuthenticated) {
        // Nếu đang ở route admin, redirect về admin login
        // Ngược lại, redirect về user signin
        const isAdminRoute = location.pathname.includes("/admin");
        const redirectTo = isAdminRoute ? all_routes.login : all_routes.signin;
        
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    return children;
};
