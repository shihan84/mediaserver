import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduledChannelsApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { Calendar, Repeat, Plus, Edit, Trash2 } from 'lucide-react';

// Simple Badge component
const Badge = ({ children, variant = 'default', className = '' }: { children: React.ReactNode; variant?: 'default' | 'secondary' | 'outline'; className?: string }) => {
  const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold';
  const variantStyles = variant === 'default' 
    ? 'bg-primary text-primary-foreground' 
    : variant === 'secondary'
    ? 'bg-secondary text-secondary-foreground'
    : 'border border-input bg-background';
  return <span className={`${baseStyles} ${variantStyles} ${className}`}>{children}</span>;
};
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';

export function SchedulesPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingChannel, setEditingChannel] = useState<any | null>(null);
  const [channelName, setChannelName] = useState('');
  const [programName, setProgramName] = useState('');
  const [scheduled, setScheduled] = useState('');
  const [repeat, setRepeat] = useState(false);
  const [items, setItems] = useState<Array<{ url: string; start?: number; duration?: number }>>([]);
  const [newItemUrl, setNewItemUrl] = useState('');
  const [newItemStart, setNewItemStart] = useState('');
  const [newItemDuration, setNewItemDuration] = useState('');

  // Simple query - fetch scheduled channels from OME
  const { data, isLoading, error } = useQuery({
    queryKey: ['scheduled-channels'],
    queryFn: async () => {
      const response = await scheduledChannelsApi.getAll();
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const scheduledChannels = data?.scheduledChannels || [];

  const canModify = user?.role === 'ADMIN' || user?.role === 'OPERATOR';

  const createMutation = useMutation({
    mutationFn: (data: any) => scheduledChannelsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-channels'] });
      toast.success('Scheduled channel created successfully');
      setShowCreateForm(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create scheduled channel');
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

  const resetForm = () => {
    setChannelName('');
    setProgramName('');
    setScheduled('');
    setRepeat(false);
    setItems([]);
    setNewItemUrl('');
    setNewItemStart('');
    setNewItemDuration('');
  };

  const addItem = () => {
    if (!newItemUrl.trim()) {
      toast.error('Please enter an item URL');
      return;
    }

    if (!newItemUrl.startsWith('file://') && !newItemUrl.startsWith('stream://')) {
      toast.error('URL must start with file:// or stream://');
      return;
    }

    const item: { url: string; start?: number; duration?: number } = {
      url: newItemUrl.trim(),
    };

    if (newItemStart.trim()) {
      item.start = parseInt(newItemStart.trim());
    }

    if (newItemDuration.trim()) {
      item.duration = parseInt(newItemDuration.trim());
    }

    setItems([...items, item]);
    setNewItemUrl('');
    setNewItemStart('');
    setNewItemDuration('');
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!channelName.trim()) {
      toast.error('Channel name is required');
      return;
    }

    if (items.length === 0) {
      toast.error('At least one item is required');
      return;
    }

    const scheduleData: any = {
      channelName: channelName.trim(),
      programName: programName.trim() || undefined,
      scheduled: scheduled || undefined,
      repeat,
      items,
    };

    createMutation.mutate(scheduleData);
  };

  const handleEdit = (channel: any) => {
    setEditingChannel(channel);
    setChannelName(channel.name);
    // Extract program info if available
    if (channel.schedule && Array.isArray(channel.schedule) && channel.schedule.length > 0) {
      const program = channel.schedule[0];
      setProgramName(program.name || '');
      setScheduled(program.scheduled || '');
      setRepeat(program.repeat || false);
      setItems(program.items || []);
    }
    setShowCreateForm(true);
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
      <Card className="m-4">
        <CardContent className="p-6">
          <p className="text-red-600">Error loading scheduled channels: {(error as any).message || 'Unknown error'}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Content Schedules
          </h1>
          <p className="text-muted-foreground mt-1">
            OME Scheduled Channels - Manage VOD playlists and live stream scheduling
          </p>
        </div>
        {canModify && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Scheduled Channel
          </Button>
        )}
      </div>

      {scheduledChannels.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground text-lg">No scheduled channels found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Create a scheduled channel to manage VOD playlists or schedule live streams
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Channels ({scheduledChannels.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Channel Name</TableHead>
                  <TableHead>Programs</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Repeat</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduledChannels.map((channel: any) => {
                  const schedule = Array.isArray(channel.schedule) ? channel.schedule : [];
                  const totalItems = schedule.reduce((sum: number, prog: any) => {
                    return sum + (Array.isArray(prog.items) ? prog.items.length : 0);
                  }, 0);

                  return (
                    <TableRow key={channel.name}>
                      <TableCell className="font-medium">{channel.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{schedule.length}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{totalItems}</Badge>
                      </TableCell>
                      <TableCell>
                        {schedule.some((p: any) => p.repeat) ? (
                          <Badge variant="default">
                            <Repeat className="w-3 h-3 mr-1" />
                            Yes
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {canModify && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(channel)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Delete scheduled channel "${channel.name}"?`)) {
                                  deleteMutation.mutate(channel.name);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingChannel ? 'Edit Scheduled Channel' : 'Create Scheduled Channel'}
            </DialogTitle>
            <DialogDescription>
              Create a scheduled channel for VOD playlist management or live stream scheduling
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Channel Name *</label>
              <Input
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="my-channel"
                required
                disabled={!!editingChannel}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Program Name (Optional)</label>
              <Input
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                placeholder="morning-show"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Scheduled Time (Optional)</label>
              <Input
                type="datetime-local"
                value={scheduled}
                onChange={(e) => setScheduled(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="repeat"
                checked={repeat}
                onChange={(e) => setRepeat(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="repeat" className="text-sm font-medium">
                Repeat Program
              </label>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Items (file:// or stream:// URLs) *</label>
              <div className="flex gap-2">
                <Input
                  value={newItemUrl}
                  onChange={(e) => setNewItemUrl(e.target.value)}
                  placeholder="file:///path/to/video.mp4 or stream://app/stream"
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={newItemStart}
                  onChange={(e) => setNewItemStart(e.target.value)}
                  placeholder="Start (sec)"
                  className="w-24"
                />
                <Input
                  type="number"
                  value={newItemDuration}
                  onChange={(e) => setNewItemDuration(e.target.value)}
                  placeholder="Duration (sec)"
                  className="w-24"
                />
                <Button type="button" onClick={addItem} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {items.length > 0 && (
                <div className="border rounded-md p-2 space-y-1 max-h-40 overflow-y-auto">
                  {items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm bg-muted p-2 rounded">
                      <span className="truncate flex-1">{item.url}</span>
                      {item.start !== undefined && <span className="mx-2 text-muted-foreground">Start: {item.start}s</span>}
                      {item.duration !== undefined && <span className="mx-2 text-muted-foreground">Duration: {item.duration}s</span>}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  resetForm();
                  setEditingChannel(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {editingChannel ? 'Update' : 'Create'} Scheduled Channel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
