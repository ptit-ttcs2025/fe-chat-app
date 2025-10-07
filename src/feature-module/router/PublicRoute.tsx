// src/feature-module/router/PublicRoute.tsx
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '@/slices/auth/reducer';
import { all_routes } from './all_routes';

interface PublicRouteProps {
    children: React.ReactElement;
    restricted?: boolean; // If true, authenticated users cannot access
}

export const PublicRoute: React.FC<PublicRouteProps> = ({
                                                            children,
                                                            restricted = false
                                                        }) => {
    const isAuthenticated = useSelector(selectIsAuthenticated);

    // If route is restricted and user is authenticated, redirect to chat
    if (restricted && isAuthenticated) {
        return <Navigate to={all_routes.chat} replace />;
    }

    return children;
};
