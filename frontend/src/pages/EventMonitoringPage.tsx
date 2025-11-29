import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { omeApi } from '../lib/api';
import { Activity, Filter, RefreshCw, AlertCircle, CheckCircle, XCircle, Info, Clock } from 'lucide-react';
import { formatDate } from '../lib/utils';

export function EventMonitoringPage() {
  const [vhostName, setVhostName] = useState('default');
  const [limit, setLimit] = useState(100);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['ome-events', vhostName, limit],
    queryFn: async () => {
      const response = await omeApi.getEvents({ vhostName, limit, offset: 0 });
      return response.data;
    },
    refetchInterval: autoRefresh ? 5000 : false, // Auto-refresh every 5 seconds if enabled
  });

  const events = data?.events || [];
  
  // Filter events by type if filter is set
  const filteredEvents = eventTypeFilter === 'all' 
    ? events 
    : events.filter((event: any) => event.type === eventTypeFilter || event.eventType === eventTypeFilter);

  // Get unique event types for filter
  const eventTypes = Array.from(new Set(events.map((e: any) => e.type || e.eventType || 'unknown')));

  const getEventIcon = (eventType: string) => {
    const type = (eventType || '').toLowerCase();
    if (type.includes('error') || type.includes('fail')) return <XCircle className="w-4 h-4 text-red-500" />;
    if (type.includes('success') || type.includes('create') || type.includes('start')) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (type.includes('stop') || type.includes('delete')) return <XCircle className="w-4 h-4 text-orange-500" />;
    return <Info className="w-4 h-4 text-blue-500" />;
  };

  const getEventColor = (eventType: string) => {
    const type = (eventType || '').toLowerCase();
    if (type.includes('error') || type.includes('fail')) return 'border-red-200 bg-red-50';
    if (type.includes('success') || type.includes('create') || type.includes('start')) return 'border-green-200 bg-green-50';
    if (type.includes('stop') || type.includes('delete')) return 'border-orange-200 bg-orange-50';
    return 'border-blue-200 bg-blue-50';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="w-8 h-8" />
            Event Monitoring
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time monitoring of OME system events and stream lifecycle
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters & Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Virtual Host</label>
              <Input
                value={vhostName}
                onChange={(e) => setVhostName(e.target.value)}
                placeholder="default"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Limit</label>
              <Input
                type="number"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value) || 100)}
                min={1}
                max={1000}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Event Type</label>
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Events</option>
                {eventTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Auto-refresh (5s)</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Events</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {events.filter((e: any) => (e.type || e.eventType || '').toLowerCase().includes('success') || (e.type || e.eventType || '').toLowerCase().includes('create')).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Success Events</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {events.filter((e: any) => (e.type || e.eventType || '').toLowerCase().includes('error') || (e.type || e.eventType || '').toLowerCase().includes('fail')).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Error Events</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{filteredEvents.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Filtered Events</p>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Events ({filteredEvents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading events...</div>
          ) : error ? (
            <div className="py-8 text-center text-red-600">
              Error loading events. {error instanceof Error ? error.message : 'Unknown error'}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No events found. Events will appear here when OME generates them.
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredEvents.map((event: any, index: number) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg ${getEventColor(event.type || event.eventType || 'info')}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getEventIcon(event.type || event.eventType || 'info')}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">
                            {event.type || event.eventType || 'Unknown Event'}
                          </span>
                          {event.timestamp && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(event.timestamp)}
                            </span>
                          )}
                        </div>
                        {event.message && (
                          <p className="text-sm text-muted-foreground mb-2">{event.message}</p>
                        )}
                        {event.streamName && (
                          <div className="text-xs">
                            <span className="font-medium">Stream:</span>{' '}
                            <code className="px-1 py-0.5 bg-background rounded">{event.streamName}</code>
                          </div>
                        )}
                        {event.application && (
                          <div className="text-xs mt-1">
                            <span className="font-medium">Application:</span>{' '}
                            <code className="px-1 py-0.5 bg-background rounded">{event.application}</code>
                          </div>
                        )}
                        {event.vhost && (
                          <div className="text-xs mt-1">
                            <span className="font-medium">Virtual Host:</span>{' '}
                            <code className="px-1 py-0.5 bg-background rounded">{event.vhost}</code>
                          </div>
                        )}
                        {event.data && (
                          <details className="mt-2">
                            <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                              View Details
                            </summary>
                            <pre className="mt-2 text-xs bg-background p-2 rounded overflow-auto max-h-40">
                              {JSON.stringify(event.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

