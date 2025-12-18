import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduledChannelsApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { Eye, Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';

export function ScheduledChannelsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [editingChannel, setEditingChannel] = useState<string | null>(null);
  const [editSchedule, setEditSchedule] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [viewChannel, setViewChannel] = useState<any>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['scheduled-channels'],
    queryFn: async () => {
      try {
        const response = await scheduledChannelsApi.getAll();
        return response.data;
      } catch (err: any) {
        toast.error(err.response?.data?.error?.message || 'Failed to fetch scheduled channels');
        throw err;
      }
    },
  });

  // Fetch selected channel details
  const { data: channelDetailData } = useQuery({
    queryKey: ['scheduled-channel-detail', selectedChannel],
    queryFn: async () => {
      if (!selectedChannel) return null;
      try {
        const response = await scheduledChannelsApi.getById(selectedChannel);
        return response.data;
      } catch (err: any) {
        toast.error(err.response?.data?.error?.message || 'Failed to fetch channel details');
        return null;
      }
    },
    enabled: !!selectedChannel,
  });

  // Update view channel when detail data is fetched
  useEffect(() => {
    if (channelDetailData?.scheduledChannel) {
      const channel = channelDetailData.scheduledChannel;
      // Ensure schedule is always an array to prevent .map() errors
      if (channel && !Array.isArray(channel.schedule)) {
        channel.schedule = [];
      }
      // Ensure items in schedule are arrays
      if (channel && Array.isArray(channel.schedule)) {
        channel.schedule = channel.schedule.map((item: any) => ({
          ...item,
          items: Array.isArray(item.items) ? item.items : (item.items ? [item.items] : [])
        }));
      }
      setViewChannel(channel);
    }
  }, [channelDetailData]);

  const canModify = user?.role === 'ADMIN' || user?.role === 'OPERATOR';

  const createMutation = useMutation({
    mutationFn: (data: { name: string; schedule: any[] }) => scheduledChannelsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-channels'] });
      toast.success('Scheduled channel created successfully');
      setShowCreateForm(false);
      setChannelName('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create scheduled channel');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ channelName, schedule }: { channelName: string; schedule: any[] }) =>
      scheduledChannelsApi.update(channelName, { schedule }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-channels'] });
      toast.success('Scheduled channel updated successfully');
      setEditingChannel(null);
      setEditSchedule([]);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update scheduled channel');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (channelName: string) => scheduledChannelsApi.delete(channelName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-channels'] });
      toast.success('Scheduled channel deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to delete scheduled channel');
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim()) {
      toast.error('Channel name is required');
      return;
    }
    // Default empty schedule - user can update it later
    createMutation.mutate({
      name: channelName.trim(),
      schedule: []
    });
  };

  const handleEdit = (channel: any) => {
    setEditingChannel(channel.name);
    setEditSchedule(JSON.parse(JSON.stringify(channel.schedule || [])));
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChannel) return;
    updateMutation.mutate({
      channelName: editingChannel,
      schedule: editSchedule
    });
  };

  const handleViewChannel = (channel: any) => {
    setSelectedChannel(channel.name);
    setViewChannel(channel);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading scheduled channels...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading scheduled channels</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['scheduled-channels'] })}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const channels = data?.scheduledChannels || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Scheduled Channels</h1>
        {canModify && (
          <Button onClick={() => setShowCreateForm(true)}>Create Scheduled Channel</Button>
        )}
      </div>

      {showCreateForm && canModify && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create Scheduled Channel</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label htmlFor="channelName" className="block text-sm font-medium mb-2">
                  Channel Name *
                </label>
                <Input
                  id="channelName"
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="Enter channel name"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Channel'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setChannelName('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Scheduled Channels</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel Name</TableHead>
                <TableHead>Schedule Items</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No scheduled channels
                  </TableCell>
                </TableRow>
              ) : (
                channels.map((channel: any) => (
                  <TableRow key={channel.name}>
                    {editingChannel === channel.name ? (
                      <>
                        <TableCell className="font-medium">{channel.name}</TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <textarea
                              value={JSON.stringify(editSchedule, null, 2)}
                              onChange={(e) => {
                                try {
                                  setEditSchedule(JSON.parse(e.target.value));
                                } catch {
                                  // Invalid JSON, keep as is
                                }
                              }}
                              className="w-full px-3 py-2 border rounded-md font-mono text-xs"
                              rows={4}
                              placeholder='[{"startTime": "2024-01-01T00:00:00Z", "endTime": "2024-01-01T01:00:00Z", "url": "rtmp://..."}]'
                            />
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                onClick={handleUpdate}
                                disabled={updateMutation.isPending}
                              >
                                {updateMutation.isPending ? 'Saving...' : 'Save'}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingChannel(null);
                                  setEditSchedule([]);
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell></TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="font-medium">{channel.name}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {channel.schedule?.length || 0} schedule item(s)
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewChannel(channel)}
                              title="View channel details"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            {canModify && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(channel)}
                                  disabled={editingChannel !== null}
                                  title="Edit channel schedule"
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => deleteMutation.mutate(channel.name)}
                                  disabled={editingChannel !== null}
                                  title="Delete scheduled channel"
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Delete
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Scheduled Channel Detail Modal */}
      <Dialog open={!!selectedChannel} onOpenChange={(open) => {
        if (!open) {
          setSelectedChannel(null);
          setViewChannel(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Scheduled Channel Details</DialogTitle>
            <DialogDescription>
              View and manage scheduled channel: {selectedChannel}
            </DialogDescription>
          </DialogHeader>
          
          {viewChannel ? (
            <div className="space-y-6">
              {/* Channel Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Channel Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Channel Name</p>
                      <p className="text-base font-semibold">{viewChannel.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Schedule Items</p>
                      <p className="text-base font-semibold">{viewChannel.schedule?.length || 0} items</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Schedule Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Schedule Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  {viewChannel.schedule && Array.isArray(viewChannel.schedule) && viewChannel.schedule.length > 0 ? (
                    <div className="space-y-4">
                      {viewChannel.schedule.map((item: any, index: number) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold">Item {index + 1}</h4>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {item.type || 'Program'}
                            </span>
                          </div>
                          <div className="space-y-2 text-sm">
                            {item.name && (
                              <div>
                                <span className="font-medium">Name: </span>
                                <span>{item.name}</span>
                              </div>
                            )}
                            {item.scheduled && (
                              <div>
                                <span className="font-medium">Scheduled: </span>
                                <span>{new Date(item.scheduled).toLocaleString()}</span>
                              </div>
                            )}
                            {item.repeat !== undefined && (
                              <div>
                                <span className="font-medium">Repeat: </span>
                                <span>{item.repeat ? 'Yes' : 'No'}</span>
                              </div>
                            )}
                            {item.items && Array.isArray(item.items) && item.items.length > 0 ? (
                              <div>
                                <span className="font-medium">Items: </span>
                                <div className="ml-4 mt-1 space-y-1">
                                  {item.items.map((subItem: any, subIndex: number) => (
                                    <div key={subIndex} className="text-xs">
                                      <span className="font-medium">URL: </span>
                                      <code className="bg-muted px-1 py-0.5 rounded">
                                        {subItem.url || 'N/A'}
                                      </code>
                                      {subItem.duration && (
                                        <span className="ml-2">
                                          Duration: {subItem.duration === -1 ? 'Indefinite' : `${subItem.duration}s`}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No schedule items configured</p>
                      <p className="text-xs mt-2">Edit the channel to add schedule items</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Raw JSON View */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Raw Schedule JSON</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-xs">
                    {JSON.stringify(viewChannel.schedule || [], null, 2)}
                  </pre>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                {canModify && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleEdit(viewChannel);
                      setSelectedChannel(null);
                      setViewChannel(null);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Schedule
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedChannel(null);
                    setViewChannel(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

