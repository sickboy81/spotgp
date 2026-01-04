import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/query-client';
import { Layout } from './components/layout/Layout';
import Home from './pages/Home';
import ProfileDetails from './pages/ProfileDetails';
import Favorites from './pages/Favorites';

import { AuthProvider } from './context/AuthContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import DashboardLayout from './components/layout/DashboardLayout';
import Overview from './pages/dashboard/Overview';
import MyAds from './pages/dashboard/MyAds';
import Analytics from './pages/dashboard/Analytics';
import Messages from './pages/dashboard/Messages';
import Notifications from './pages/dashboard/Notifications';
import EditProfile from './pages/dashboard/EditProfile';
import Settings from './pages/dashboard/Settings';
import Verification from './pages/dashboard/Verification';
import MessagesPage from './pages/Messages';
import ProtectedRoute from './components/features/auth/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import AdminStats from './pages/admin/AdminStats';
import Moderation from './pages/admin/Moderation';
import UserManagement from './pages/admin/UserManagement';
import VerificationReview from './pages/admin/VerificationReview';
import ContentManagement from './pages/admin/ContentManagement';
import ActivityLogs from './pages/admin/ActivityLogs';
import SystemSettings from './pages/admin/SystemSettings';
import AdsManagement from './pages/admin/AdsManagement';
import FinancialManagement from './pages/admin/FinancialManagement';
import CategoriesManagement from './pages/admin/CategoriesManagement';
import AnalyticsAdvanced from './pages/admin/AnalyticsAdvanced';
import EmailManagement from './pages/admin/EmailManagement';
import BackupManagement from './pages/admin/BackupManagement';
import LocationsManagement from './pages/admin/LocationsManagement';
import PermissionsManagement from './pages/admin/PermissionsManagement';
import MediaManagement from './pages/admin/MediaManagement';
import ActiveSessions from './pages/admin/ActiveSessions';
import BanManagement from './pages/admin/BanManagement';
import ChatManagement from './pages/admin/ChatManagement';
import PlansManagement from './pages/admin/PlansManagement';
import CouponsManagement from './pages/admin/CouponsManagement';
import Search from './pages/Search';
import Golpes from './pages/Golpes';
import TermosUso from './pages/TermosUso';
import Privacidade from './pages/Privacidade';
import Pricing from './pages/Pricing';
import Maintenance from './pages/Maintenance';
import { InstallPrompt } from './components/features/pwa/InstallPrompt';
import { MaintenanceWrapper } from './components/features/maintenance/MaintenanceWrapper';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <MaintenanceWrapper>
            <Layout>
              <InstallPrompt />
              <Routes>
                <Route path="/maintenance" element={<Maintenance />} />
                <Route path="/" element={<Home />} />
                <Route path="/profile/:id" element={<ProfileDetails />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Advertiser Routes */}
                <Route element={<ProtectedRoute allowedRoles={['advertiser', 'super_admin']} />}>
                  <Route path="/dashboard" element={<DashboardLayout />}>
                    <Route index element={<Overview />} />
                    <Route path="ads" element={<MyAds />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="messages" element={<Messages />} />
                    <Route path="notifications" element={<Notifications />} />
                    <Route path="profile" element={<EditProfile />} />
                    <Route path="verification" element={<Verification />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>
                </Route>

                <Route path="/messages/:profileId?" element={<MessagesPage />} />

                {/* Protected Admin Routes */}
                <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminStats />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="verification" element={<VerificationReview />} />
                    <Route path="moderation" element={<Moderation />} />
                    <Route path="content" element={<ContentManagement />} />
                    <Route path="ads" element={<AdsManagement />} />
                    <Route path="financial" element={<FinancialManagement />} />
                    <Route path="categories" element={<CategoriesManagement />} />
                    <Route path="analytics" element={<AnalyticsAdvanced />} />
                    <Route path="emails" element={<EmailManagement />} />
                    <Route path="chat" element={<ChatManagement />} />
                    <Route path="plans" element={<PlansManagement />} />
                    <Route path="coupons" element={<CouponsManagement />} />
                    <Route path="backup" element={<BackupManagement />} />
                    <Route path="locations" element={<LocationsManagement />} />
                    <Route path="permissions" element={<PermissionsManagement />} />
                    <Route path="media" element={<MediaManagement />} />
                    <Route path="sessions" element={<ActiveSessions />} />
                    <Route path="bans" element={<BanManagement />} />
                    <Route path="logs" element={<ActivityLogs />} />
                    <Route path="settings" element={<SystemSettings />} />
                  </Route>
                </Route>

                <Route path="/favorites" element={<Favorites />} />
                <Route path="/search" element={<Search />} />
                <Route path="/precos" element={<Pricing />} />
                <Route path="/golpes" element={<Golpes />} />
                <Route path="/termos" element={<TermosUso />} />
                <Route path="/privacidade" element={<Privacidade />} />
                <Route path="*" element={<div className="container pt-20">Page Not Found</div>} />
              </Routes>
            </Layout>
          </MaintenanceWrapper>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
