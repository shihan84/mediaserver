import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduledChannelsApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export function ScheduledChannelsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [editingChannel, setEditingChannel] = useState<string | null>(null);
  const [editSchedule, setEditSchedule] = useState<any[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['scheduled-channels'],
    queryFn: async () => {
      const response = await scheduledChannelsApi.getAll();
      return response.data;
    },
  });

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

  if (isLoading) {
    return <div>Loading...</div>;
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
                          {canModify && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(channel)}
                                disabled={editingChannel !== null}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteMutation.mutate(channel.name)}
                                disabled={editingChannel !== null}
                              >
                                Delete
                              </Button>
                            </div>
                          )}
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
    </div>
  );
}

