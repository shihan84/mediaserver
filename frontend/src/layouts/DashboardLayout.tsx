import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import {
  LayoutDashboard,
  Users,
  Radio,
  Calendar,
  Settings,
  MessageSquare,
  ListTodo,
  Activity,
  LogOut,
  Video,
  Send,
  Clock,
  Server,
  Share2,
  Play,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Channels', href: '/channels', icon: Radio },
  { name: 'Schedules', href: '/schedules', icon: Calendar },
  { name: 'SCTE-35', href: '/scte35', icon: Activity },
  { name: 'Streams', href: '/streams', icon: Play },
  { name: 'Recordings', href: '/recordings', icon: Video },
  { name: 'Push Publishing', href: '/push-publishing', icon: Send },
  { name: 'Scheduled Channels', href: '/scheduled-channels', icon: Clock },
  { name: 'Distributors', href: '/distributors', icon: Share2 },
  { name: 'OME Management', href: '/ome-management', icon: Server },
  { name: 'Event Monitoring', href: '/event-monitoring', icon: Activity },
  { name: 'Tasks', href: '/tasks', icon: ListTodo },
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function DashboardLayout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-card border-r">
          <div className="flex flex-col h-full">
            <div className="p-6 border-b">
              <h1 className="text-xl font-bold">OME Enterprise</h1>
            </div>
            <nav className="flex-1 p-4 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t">
              <div className="mb-2 px-4 py-2">
                <p className="text-sm font-medium">{user?.username}</p>
                <p className="text-xs text-muted-foreground">{user?.role}</p>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={logout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}


