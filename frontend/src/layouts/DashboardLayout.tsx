import { useState } from 'react';
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
  Server,
  Share2,
  Play,
  ChevronDown,
  ChevronRight,
  Tv,
  Folder,
  Shield,
} from 'lucide-react';
import { cn } from '../lib/utils';

// Navigation structure with groups
interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
  defaultOpen?: boolean;
}

const navigationGroups: NavGroup[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: LayoutDashboard,
    items: [
      { name: 'Overview', href: '/', icon: LayoutDashboard },
    ],
    defaultOpen: true,
  },
  {
    id: 'streaming',
    name: 'Streaming',
    icon: Tv,
    items: [
      { name: 'Streams', href: '/streams', icon: Play },
      { name: 'Channels', href: '/channels', icon: Radio },
    ],
    defaultOpen: true,
  },
  {
    id: 'content',
    name: 'Content Management',
    icon: Folder,
    items: [
      { name: 'Content Schedules', href: '/schedules', icon: Calendar },
      { name: 'SCTE-35 Markers', href: '/scte35', icon: Activity },
      { name: 'Distributors', href: '/distributors', icon: Share2 },
      { name: 'Recordings', href: '/recordings', icon: Video },
      { name: 'Push Publishing', href: '/push-publishing', icon: Send },
    ],
    defaultOpen: true,
  },
  {
    id: 'system',
    name: 'System Management',
    icon: Server,
    items: [
      { name: 'OME Management', href: '/ome-management', icon: Server },
      { name: 'Access Control', href: '/access-control', icon: Shield },
      { name: 'Event Monitoring', href: '/event-monitoring', icon: Activity },
    ],
    defaultOpen: false,
  },
  {
    id: 'administration',
    name: 'Administration',
    icon: Shield,
    items: [
      { name: 'Users', href: '/users', icon: Users },
      { name: 'Tasks', href: '/tasks', icon: ListTodo },
      { name: 'Chat', href: '/chat', icon: MessageSquare },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
    defaultOpen: false,
  },
];

function NavGroup({ group }: { group: NavGroup }) {
  const location = useLocation();
  
  // Check if any item in group is active
  const hasActiveItem = group.items.some(
    (item) => location.pathname === item.href
  );
  
  // Auto-expand if group has active item or use default
  const [isOpen, setIsOpen] = useState(
    hasActiveItem || (group.defaultOpen ?? false)
  );
  
  const GroupIcon = group.icon;

  // Special handling for dashboard - no grouping
  if (group.id === 'dashboard') {
    const item = group.items[0];
    const ItemIcon = item.icon;
    const isActive = location.pathname === item.href;
    return (
      <Link
        to={item.href}
        className={cn(
          'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-accent'
        )}
      >
        <ItemIcon className="w-5 h-5" />
        <span>{item.name}</span>
      </Link>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-4 py-2 rounded-lg transition-colors',
          hasActiveItem && !isOpen
            ? 'bg-accent text-accent-foreground'
            : 'hover:bg-accent'
        )}
      >
        <div className="flex items-center gap-2">
          <GroupIcon className="w-4 h-4" />
          <span className="text-sm font-medium">{group.name}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>
      {isOpen && (
        <div className="ml-4 space-y-1 border-l-2 border-border pl-2">
          {group.items.map((item) => {
            const ItemIcon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                )}
              >
                <ItemIcon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DashboardLayout() {
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
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {navigationGroups.map((group) => (
                <NavGroup key={group.id} group={group} />
              ))}
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


