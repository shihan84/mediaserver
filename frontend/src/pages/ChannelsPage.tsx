import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { channelsApi, streamsApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { formatDate } from '../lib/utils';
import { ChannelDetailModal } from '../components/streaming/ChannelDetailModal';
import { StreamDetailModal } from '../components/streaming/StreamDetailModal';
import { ChannelMetricsCard } from '../components/streaming/ChannelMetricsCard';
import { Settings } from 'lucide-react';

export function ChannelsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const [channelAppName, setChannelAppName] = useState('app');
  const [channelStreamKey, setChannelStreamKey] = useState('');
  const [vodFallbackEnabled, setVodFallbackEnabled] = useState(false);
  const [vodFallbackFiles, setVodFallbackFiles] = useState<string[]>([]);
  const [vodFallbackDelay, setVodFallbackDelay] = useState(5);
  const [newVodFile, setNewVodFile] = useState('');
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [editChannelName, setEditChannelName] = useState('');
  const [editChannelDescription, setEditChannelDescription] = useState('');
  const [editChannelAppName, setEditChannelAppName] = useState('app');
  const [editChannelStreamKey, setEditChannelStreamKey] = useState('');
  const [editVodFallbackEnabled, setEditVodFallbackEnabled] = useState(false);
  const [editVodFallbackFiles, setEditVodFallbackFiles] = useState<string[]>([]);
  const [editVodFallbackDelay, setEditVodFallbackDelay] = useState(5);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [selectedStream, setSelectedStream] = useState<{ streamName: string; channel?: any } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['channels'],
    queryFn: async () => {
      const response = await channelsApi.getAll();
      return response.data;
    },
    refetchInterval: 15000, // Refresh every 15 seconds to reduce load
  });

  // Fetch active streams to match with channels
  const { data: streamsData } = useQuery({
    queryKey: ['streams'],
    queryFn: async () => {
      try {
        const response = await streamsApi.getAll();
        return response.data;
      } catch (err: any) {
        console.error('Error fetching streams:', err);
        return { streams: [], channels: [] };
      }
    },
    refetchInterval: 15000, // Refresh every 15 seconds for live metrics (reduced to avoid rate limits)
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; appName?: string; streamKey?: string; vodFallbackEnabled?: boolean; vodFallbackFiles?: string[]; vodFallbackDelay?: number }) => channelsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      toast.success('Channel created successfully');
      setShowCreateForm(false);
      setChannelName('');
      setChannelDescription('');
      setChannelAppName('app');
      setChannelStreamKey('');
      setVodFallbackEnabled(false);
      setVodFallbackFiles([]);
      setVodFallbackDelay(5);
      setNewVodFile('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create channel');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; description?: string; appName?: string; streamKey?: string; vodFallbackEnabled?: boolean; vodFallbackFiles?: string[]; vodFallbackDelay?: number } }) => 
      channelsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      toast.success('Channel updated successfully');
      setEditingChannelId(null);
      setEditChannelName('');
      setEditChannelDescription('');
      setEditChannelAppName('app');
      setEditChannelStreamKey('');
      setEditVodFallbackEnabled(false);
      setEditVodFallbackFiles([]);
      setEditVodFallbackDelay(5);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update channel');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => channelsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      toast.success('Channel deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to delete channel');
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim()) {
      toast.error('Channel name is required');
      return;
    }
    if (!channelStreamKey.trim()) {
      toast.error('Stream key is required');
      return;
    }
    if (vodFallbackEnabled && vodFallbackFiles.length === 0) {
      toast.error('At least one VOD file is required when VOD fallback is enabled');
      return;
    }
    createMutation.mutate({
      name: channelName.trim(),
      description: channelDescription.trim() || undefined,
      appName: channelAppName.trim() || 'app',
      streamKey: channelStreamKey.trim(),
      vodFallbackEnabled,
      vodFallbackFiles: vodFallbackEnabled ? vodFallbackFiles : undefined,
      vodFallbackDelay: vodFallbackEnabled ? vodFallbackDelay : undefined
    });
  };

  const addVodFile = () => {
    if (newVodFile.trim()) {
      setVodFallbackFiles([...vodFallbackFiles, newVodFile.trim()]);
      setNewVodFile('');
    }
  };

  const removeVodFile = (index: number) => {
    setVodFallbackFiles(vodFallbackFiles.filter((_, i) => i !== index));
  };


  const handleEdit = (channel: any) => {
    setEditingChannelId(channel.id);
    setEditChannelName(channel.name);
    setEditChannelDescription(channel.description || '');
    setEditChannelAppName(channel.appName || 'app');
    setEditChannelStreamKey(channel.streamKey || '');
    setEditVodFallbackEnabled(channel.vodFallbackEnabled || false);
    setEditVodFallbackFiles((channel.vodFallbackFiles as string[]) || []);
    setEditVodFallbackDelay(channel.vodFallbackDelay || 5);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChannelId || !editChannelName.trim()) {
      toast.error('Channel name is required');
      return;
    }
    if (!editChannelStreamKey.trim()) {
      toast.error('Stream key is required');
      return;
    }
    if (editVodFallbackEnabled && editVodFallbackFiles.length === 0) {
      toast.error('At least one VOD file is required when VOD fallback is enabled');
      return;
    }
    updateMutation.mutate({
      id: editingChannelId,
      data: {
        name: editChannelName.trim(),
        description: editChannelDescription.trim() || undefined,
        appName: editChannelAppName.trim() || 'app',
        streamKey: editChannelStreamKey.trim(),
        vodFallbackEnabled: editVodFallbackEnabled,
        vodFallbackFiles: editVodFallbackEnabled ? editVodFallbackFiles : undefined,
        vodFallbackDelay: editVodFallbackEnabled ? editVodFallbackDelay : undefined
      }
    });
  };

  const handleCancelEdit = () => {
    setEditingChannelId(null);
    setEditChannelName('');
    setEditChannelDescription('');
    setEditChannelAppName('app');
    setEditChannelStreamKey('');
      setEditVodFallbackEnabled(false);
      setEditVodFallbackFiles([]);
      setEditVodFallbackDelay(5);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const canModify = user?.role === 'ADMIN' || user?.role === 'OPERATOR';
  
  // Match streams with channels
  const streams = streamsData?.streams || [];
  const allChannels = data?.channels || [];
  
  // Create stream map by streamKey and appName for accurate matching
  const streamMap = new Map(
    streams.map((s: any) => [`${s.appName || 'app'}:${s.name}`, s])
  );
  
  // Check which channels have active streams (match by streamKey AND appName)
  const channelsWithStreams = allChannels.map((ch: any) => {
    const streamKey = `${ch.appName || 'app'}:${ch.streamKey}`;
    const matchedStream = streamMap.get(streamKey);
    
    return {
      ...ch,
      hasActiveStream: !!matchedStream,
      activeStream: matchedStream || null
    };
  });
  
  const activeChannels = channelsWithStreams.filter((ch: any) => ch.hasActiveStream);
  const inactiveChannels = channelsWithStreams.filter((ch: any) => !ch.hasActiveStream);

  return (
    <div className="space-y-6">
      {/* Stream Detail Modal */}
      <StreamDetailModal
        streamName={selectedStream?.streamName || null}
        channel={selectedStream?.channel}
        open={!!selectedStream}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedStream(null);
          }
        }}
      />
      
      {/* Channel Detail Modal */}
      <ChannelDetailModal
        channelId={selectedChannelId}
        open={!!selectedChannelId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedChannelId(null);
          }
        }}
      />

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Channel Management</h1>
          <p className="text-muted-foreground mt-1">Configure and manage your streaming channel endpoints and settings</p>
        </div>
        {canModify && (
          <Button 
            type="button"
            onClick={() => {
              setShowCreateForm(!showCreateForm);
            }}
          >
            {showCreateForm ? 'Cancel' : 'Create Channel'}
          </Button>
        )}
      </div>

      {showCreateForm && canModify && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Channel</CardTitle>
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
              <div>
                <label htmlFor="channelDescription" className="block text-sm font-medium mb-2">
                  Description
                </label>
                <Input
                  id="channelDescription"
                  type="text"
                  value={channelDescription}
                  onChange={(e) => setChannelDescription(e.target.value)}
                  placeholder="Enter channel description (optional)"
                />
              </div>
              <div>
                <label htmlFor="channelAppName" className="block text-sm font-medium mb-2">
                  OME Application Name *
                </label>
                <Input
                  id="channelAppName"
                  type="text"
                  value={channelAppName}
                  onChange={(e) => setChannelAppName(e.target.value)}
                  placeholder="app (default)"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  OME application name where the stream will be ingested (e.g., "app", "live")
                </p>
              </div>
              <div>
                <label htmlFor="channelStreamKey" className="block text-sm font-medium mb-2">
                  Stream Key *
                </label>
                <Input
                  id="channelStreamKey"
                  type="text"
                  value={channelStreamKey}
                  onChange={(e) => setChannelStreamKey(e.target.value)}
                  placeholder="Enter stream key (e.g., my-stream-key)"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This will be used to ingest streams to OME
                </p>
              </div>
              
              {/* VOD Fallback Configuration */}
              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="vodFallbackEnabled"
                    checked={vodFallbackEnabled}
                    onChange={(e) => setVodFallbackEnabled(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="vodFallbackEnabled" className="text-sm font-medium">
                    Enable VOD Fallback (Play VOD files when stream drops)
                  </label>
                </div>
                
                {vodFallbackEnabled && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        VOD Fallback Delay (seconds)
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={vodFallbackDelay}
                        onChange={(e) => setVodFallbackDelay(parseInt(e.target.value) || 5)}
                        placeholder="5"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Wait time before activating VOD fallback when stream drops
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        VOD Fallback Files *
                      </label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          type="text"
                          value={newVodFile}
                          onChange={(e) => setNewVodFile(e.target.value)}
                          placeholder="File path or URL (e.g., /path/to/video.mp4 or http://example.com/video.mp4)"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addVodFile();
                            }
                          }}
                        />
                        <Button type="button" onClick={addVodFile} variant="outline">
                          Add
                        </Button>
                      </div>
                      {vodFallbackFiles.length > 0 && (
                        <div className="space-y-1">
                          {vodFallbackFiles.map((file, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                              <span className="text-sm flex-1">{file}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeVodFile(index)}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Add VOD files that will play automatically when the stream drops
                      </p>
                    </div>
                  </>
                )}
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
                    setChannelDescription('');
                    setChannelAppName('app');
                    setChannelStreamKey('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{allChannels.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Channels</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{activeChannels.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active Streams</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{inactiveChannels.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready to Stream</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {activeChannels.length > 0 ? activeChannels.length * 0 : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total Viewers</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Channels with Live Metrics */}
      {activeChannels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Active Channels ({activeChannels.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">Channels with live streams and real-time metrics</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeChannels.map((channel: any) => (
                <ChannelMetricsCard
                  key={channel.id}
                  channel={channel}
                  stream={channel.activeStream}
                  canModify={canModify}
                  onEdit={handleEdit}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inactive Channels */}
      {inactiveChannels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
              Inactive Channels ({inactiveChannels.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">Channels ready to stream</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inactiveChannels.map((channel: any) => (
                <ChannelMetricsCard
                  key={channel.id}
                  channel={channel}
                  stream={null}
                  canModify={canModify}
                  onEdit={handleEdit}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table View (fallback/editing) */}
      <Card>
        <CardHeader>
          <CardTitle>All Channels (Table View)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>App Name</TableHead>
                <TableHead>Stream Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.channels?.map((channel: any) => (
                <TableRow key={channel.id}>
                  {editingChannelId === channel.id ? (
                    <>
                      <TableCell>
                        <Input
                          type="text"
                          value={editChannelName}
                          onChange={(e) => setEditChannelName(e.target.value)}
                          className="w-full"
                          required
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          value={editChannelDescription}
                          onChange={(e) => setEditChannelDescription(e.target.value)}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          value={editChannelStreamKey}
                          onChange={(e) => setEditChannelStreamKey(e.target.value)}
                          className="w-full font-mono text-xs"
                          required
                        />
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            channel.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {channel.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(channel.createdAt)}</TableCell>
                      <TableCell>
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
                            onClick={handleCancelEdit}
                            disabled={updateMutation.isPending}
                          >
                            Cancel
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="font-medium">{channel.name}</TableCell>
                      <TableCell>{channel.description || '-'}</TableCell>
                      <TableCell className="font-mono text-xs">{channel.streamKey}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            channel.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {channel.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(channel.createdAt)}</TableCell>
                      <TableCell>
                        {canModify && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedChannelId(channel.id)}
                              title="View channel URLs and details"
                            >
                              <Settings className="w-4 h-4 mr-1" />
                              URLs
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(channel)}
                              disabled={editingChannelId !== null}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteMutation.mutate(channel.id)}
                              disabled={editingChannelId !== null}
                            >
                              Delete
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


