import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pushPublishingApi, streamsApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export function PushPublishingPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showStartForm, setShowStartForm] = useState(false);
  const [selectedStream, setSelectedStream] = useState('');
  const [protocol, setProtocol] = useState('rtmp');
  const [url, setUrl] = useState('');
  const [streamKey, setStreamKey] = useState('');

  const { data: streamsData, isLoading: streamsLoading } = useQuery({
    queryKey: ['streams'],
    queryFn: async () => {
      const response = await streamsApi.getAll();
      return response.data;
    },
  });

  const canModify = user?.role === 'ADMIN' || user?.role === 'OPERATOR';

  const startPushMutation = useMutation({
    mutationFn: ({ streamName, data }: { streamName: string; data: { protocol: string; url: string; streamKey?: string } }) =>
      pushPublishingApi.start(streamName, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['push-publishing'] });
      toast.success('Push publishing started successfully');
      setShowStartForm(false);
      setSelectedStream('');
      setProtocol('rtmp');
      setUrl('');
      setStreamKey('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to start push publishing');
    },
  });

  const stopPushMutation = useMutation({
    mutationFn: ({ streamName, id }: { streamName: string; id: string }) =>
      pushPublishingApi.stop(streamName, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['push-publishing'] });
      toast.success('Push publishing stopped successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to stop push publishing');
    },
  });

  const handleStartPush = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStream || !protocol || !url) {
      toast.error('Stream name, protocol, and URL are required');
      return;
    }
    startPushMutation.mutate({
      streamName: selectedStream,
      data: {
        protocol,
        url,
        streamKey: streamKey || undefined
      }
    });
  };

  const streams = streamsData?.streams || [];

  if (streamsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Push Publishing</h1>
        {canModify && (
          <Button onClick={() => setShowStartForm(true)}>Start Push Publishing</Button>
        )}
      </div>

      {showStartForm && canModify && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Start Push Publishing</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStartPush} className="space-y-4">
              <div>
                <label htmlFor="streamName" className="block text-sm font-medium mb-2">
                  Stream Name *
                </label>
                <select
                  id="streamName"
                  value={selectedStream}
                  onChange={(e) => setSelectedStream(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">Select a stream</option>
                  {streams.map((stream: any) => (
                    <option key={stream.name} value={stream.name}>
                      {stream.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="protocol" className="block text-sm font-medium mb-2">
                  Protocol *
                </label>
                <select
                  id="protocol"
                  value={protocol}
                  onChange={(e) => setProtocol(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="rtmp">RTMP</option>
                  <option value="srt">SRT</option>
                  <option value="mpegts">MPEG-TS</option>
                </select>
              </div>
              <div>
                <label htmlFor="url" className="block text-sm font-medium mb-2">
                  URL *
                </label>
                <Input
                  id="url"
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="rtmp://example.com:1935/app"
                  required
                />
              </div>
              <div>
                <label htmlFor="streamKey" className="block text-sm font-medium mb-2">
                  Stream Key (optional)
                </label>
                <Input
                  id="streamKey"
                  type="text"
                  value={streamKey}
                  onChange={(e) => setStreamKey(e.target.value)}
                  placeholder="stream_key"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={startPushMutation.isPending}>
                  {startPushMutation.isPending ? 'Starting...' : 'Start Push Publishing'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowStartForm(false);
                    setSelectedStream('');
                    setProtocol('rtmp');
                    setUrl('');
                    setStreamKey('');
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
          <CardTitle>Active Push Publishing</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stream Name</TableHead>
                <TableHead>Protocol</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {streams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No active streams available
                  </TableCell>
                </TableRow>
              ) : (
                streams.map((stream: any) => (
                  <PushPublishingRow
                    key={stream.name}
                    stream={stream}
                    onStop={stopPushMutation.mutate}
                    canModify={canModify}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function PushPublishingRow({ stream, onStop, canModify }: { stream: any; onStop: (data: { streamName: string; id: string }) => void; canModify: boolean }) {
  const { data: statusData } = useQuery({
    queryKey: ['push-publishing-status', stream.name],
    queryFn: async () => {
      const response = await pushPublishingApi.getStatus(stream.name);
      return response.data;
    },
    refetchInterval: 5000,
  });

  const pushPublishing = statusData?.pushPublishing;
  const activePushes = pushPublishing?.items || [];

  return (
    <>
      {activePushes.length === 0 ? (
        <TableRow>
          <TableCell className="font-medium">{stream.name}</TableCell>
          <TableCell colSpan={4} className="text-muted-foreground">No active push publishing</TableCell>
        </TableRow>
      ) : (
        activePushes.map((push: any) => (
          <TableRow key={push.id}>
            <TableCell className="font-medium">{stream.name}</TableCell>
            <TableCell>{push.protocol || '-'}</TableCell>
            <TableCell className="font-mono text-xs">{push.url || '-'}</TableCell>
            <TableCell>
              <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                Active
              </span>
            </TableCell>
            <TableCell>
              {canModify && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onStop({ streamName: stream.name, id: push.id })}
                >
                  Stop
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))
      )}
    </>
  );
}

