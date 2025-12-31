import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
    allowedRoles?: ('visitor' | 'advertiser' | 'super_admin')[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
    const { user, role, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && role && !allowedRoles.includes(role as 'visitor' | 'advertiser' | 'super_admin')) {
        // Optional: Redirect to unauthorized page or home
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
