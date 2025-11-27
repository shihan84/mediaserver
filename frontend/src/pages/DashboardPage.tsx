import { useQuery } from '@tanstack/react-query';
import { metricsApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Users, Radio, Calendar, Activity, ListTodo } from 'lucide-react';

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await metricsApi.getDashboard();
      return response.data;
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const stats = data?.statistics || {};

  const statCards = [
    {
      title: 'Users',
      value: stats.users?.total || 0,
      icon: Users,
      description: 'Total users',
    },
    {
      title: 'Channels',
      value: stats.channels?.total || 0,
      icon: Radio,
      description: `${stats.channels?.active || 0} active`,
    },
    {
      title: 'Schedules',
      value: stats.schedules?.total || 0,
      icon: Calendar,
      description: `${stats.schedules?.active || 0} active`,
    },
    {
      title: 'Tasks',
      value: stats.tasks?.total || 0,
      icon: ListTodo,
      description: `${stats.tasks?.pending || 0} pending`,
    },
    {
      title: 'SCTE-35 Markers',
      value: stats.scte35Markers?.total || 0,
      icon: Activity,
      description: 'Total markers',
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}


