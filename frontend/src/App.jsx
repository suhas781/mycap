import { Routes, Route, Navigate } from 'react-router-dom';
import { getStoredUser } from './api';
import ThemeToggle from './components/ThemeToggle';
import Login from './pages/Login';
import TeamLeadDashboard from './pages/TeamLeadDashboard';
import BOEDashboard from './pages/BOEDashboard';
import BOELeadsPage from './pages/BOELeadsPage';
import BOECampaignsPage from './pages/BOECampaignsPage';
import HRDashboard from './pages/HRDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ClusterManagerDashboard from './pages/ClusterManagerDashboard';
import CampaignAnalyticsPage from './pages/CampaignAnalyticsPage';

function PrivateRoute({ children, allowedRoles }) {
  const user = getStoredUser();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallback = {
      team_lead: '/team-lead', boe: '/boe', hr: '/hr', admin: '/admin',
      cluster_manager: '/cluster-manager', architect: '/campaign-analytics',
    }[user.role] || '/login';
    return <Navigate to={fallback} replace />;
  }
  return children;
}

export default function App() {
  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-[#0a0a0a]">
      <div className="relative z-20 shrink-0 flex items-center justify-between gap-3 px-4 py-2 border-b border-slate-200/80 dark:border-dark-border bg-white/90 dark:bg-surface/90 backdrop-blur-md pointer-events-auto">
        <span className="font-display text-sm font-bold text-slate-700 dark:text-white/90 tracking-tight">MyCaptain</span>
        <ThemeToggle />
      </div>
      <div className="flex-1 min-h-0">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/team-lead"
            element={
              <PrivateRoute allowedRoles={['team_lead']}>
                <TeamLeadDashboard />
              </PrivateRoute>
            }
          />
          <Route path="/boe" element={<PrivateRoute allowedRoles={['boe']}><BOEDashboard /></PrivateRoute>}>
            <Route index element={<Navigate to="leads" replace />} />
            <Route path="leads" element={<BOELeadsPage />} />
            <Route path="campaigns" element={<BOECampaignsPage />} />
          </Route>
          <Route
            path="/hr"
            element={
              <PrivateRoute allowedRoles={['hr']}>
                <HRDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/cluster-manager"
            element={
              <PrivateRoute allowedRoles={['cluster_manager']}>
                <ClusterManagerDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/campaign-analytics"
            element={
              <PrivateRoute allowedRoles={['architect']}>
                <CampaignAnalyticsPage />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}
