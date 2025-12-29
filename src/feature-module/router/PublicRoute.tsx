// src/feature-module/router/PublicRoute.tsx
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectCurrentUser } from '@/slices/auth/reducer';
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
    const user = useSelector(selectCurrentUser);

    // If route is restricted and user is authenticated, redirect based on role
    if (restricted && isAuthenticated) {
        // Check user role and redirect accordingly
        const userRole = (user as any)?.role || 'USER';

        if (userRole === 'ROLE_ADMIN') {
            console.log('🔐 Admin user detected, redirecting to admin dashboard');
            return <Navigate to={all_routes.dashboard} replace />;
        }

        console.log('👤 Regular user detected, redirecting to chat');
        return <Navigate to={all_routes.chat} replace />;
    }

    return children;
};
