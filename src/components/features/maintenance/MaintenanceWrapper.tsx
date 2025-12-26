import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { isMaintenanceModeEnabled } from '@/lib/utils/maintenance';
import Maintenance from '@/pages/Maintenance';

interface MaintenanceWrapperProps {
    children: React.ReactNode;
}

/**
 * Wrapper component that checks maintenance mode and redirects non-admin users
 */
export function MaintenanceWrapper({ children }: MaintenanceWrapperProps) {
    const { user, role } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const maintenanceEnabled = isMaintenanceModeEnabled();

    useEffect(() => {
        // If maintenance is enabled
        if (maintenanceEnabled) {
            const isAdmin = user && role === 'super_admin';
            const isMaintenancePage = location.pathname === '/maintenance';
            const isAdminRoute = location.pathname.startsWith('/admin');
            const isLoginPage = location.pathname === '/login';

            // Always allow access to login page (for admin login)
            if (isLoginPage) {
                return; // Allow access to login
            }

            // Allow admins to access admin routes
            if (isAdmin && isAdminRoute) {
                return; // Allow access to admin routes
            }

            // Redirect non-admins to maintenance page (unless already there)
            if (!isAdmin && !isMaintenancePage) {
                navigate('/maintenance', { replace: true });
            }

            // If admin is on maintenance page and logged in, redirect to admin
            if (isAdmin && isMaintenancePage) {
                navigate('/admin', { replace: true });
            }

            // After successful login, if admin, redirect to admin panel
            if (isAdmin && isLoginPage) {
                navigate('/admin', { replace: true });
            }
        }
    }, [maintenanceEnabled, user, role, location.pathname, navigate]);

    // If maintenance is enabled and user is not admin, show maintenance page
    if (maintenanceEnabled) {
        const isAdmin = user && role === 'super_admin';
        const isAdminRoute = location.pathname.startsWith('/admin');
        const isLoginPage = location.pathname === '/login';
        const isMaintenancePage = location.pathname === '/maintenance';

        // Allow admins to access admin routes and login
        if (isAdmin && (isAdminRoute || isLoginPage)) {
            return <>{children}</>;
        }

        // Allow login page
        if (isLoginPage) {
            return <>{children}</>;
        }

        // Show maintenance page for everyone else
        if (!isMaintenancePage) {
            return <Maintenance />;
        }

        return <>{children}</>;
    }

    // Normal operation - no maintenance
    return <>{children}</>;
}

