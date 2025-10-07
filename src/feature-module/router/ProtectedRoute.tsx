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
        // Redirect to signin and save attempted location
        return <Navigate to={all_routes.signin} state={{ from: location }} replace />;
    }

    return children;
};
