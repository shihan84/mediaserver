import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { LoginPage } from './pages/LoginPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { ChannelsPage } from './pages/ChannelsPage';
import { SchedulesPage } from './pages/SchedulesPage';
import { Scte35Page } from './pages/Scte35Page';
import { StreamsPage } from './pages/StreamsPage';
import { TasksPage } from './pages/TasksPage';
import { ChatPage } from './pages/ChatPage';
import { SettingsPage } from './pages/SettingsPage';
import { RecordingsPage } from './pages/RecordingsPage';
import { PushPublishingPage } from './pages/PushPublishingPage';
import { ScheduledChannelsPage } from './pages/ScheduledChannelsPage';
import { OMEManagementPage } from './pages/OMEManagementPage';
import { DistributorsPage } from './pages/DistributorsPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="channels" element={<ChannelsPage />} />
        <Route path="schedules" element={<SchedulesPage />} />
        <Route path="scte35" element={<Scte35Page />} />
        <Route path="streams" element={<StreamsPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="recordings" element={<RecordingsPage />} />
        <Route path="push-publishing" element={<PushPublishingPage />} />
        <Route path="scheduled-channels" element={<ScheduledChannelsPage />} />
        <Route path="ome-management" element={<OMEManagementPage />} />
        <Route path="distributors/:channelId" element={<DistributorsPage />} />
        <Route path="distributors" element={<DistributorsPage />} />
      </Route>
    </Routes>
  );
}

export default App;


