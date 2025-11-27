import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { streamsApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export function StreamsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedStream, setSelectedStream] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['streams'],
    queryFn: async () => {
      const response = await streamsApi.getAll();
      return response.data;
    },
    refetchInterval: 5000,
  });

  const canModify = user?.role === 'ADMIN' || user?.role === 'OPERATOR';

  const startStreamMutation = useMutation({
    mutationFn: (channelId: string) => streamsApi.start(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      toast.success('Stream started successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to start stream');
    },
  });

  const stopStreamMutation = useMutation({
    mutationFn: (channelId: string) => streamsApi.stop(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      toast.success('Stream stopped successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to stop stream');
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const streams = data?.streams || [];
  const channels = data?.channels || [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Streams</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>OME Active Streams</CardTitle>
          </CardHeader>
          <CardContent>
            {streams.length === 0 ? (
              <p className="text-muted-foreground">No active streams in OME</p>
            ) : (
              <div className="space-y-2">
                {streams.map((stream: any) => (
                  <div
                    key={stream.name}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-accent"
                    onClick={() => setSelectedStream(selectedStream === stream.name ? null : stream.name)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{stream.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {stream.sourceType || 'Unknown source'}
                        </p>
                      </div>
                      <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                    {selectedStream === stream.name && (
                      <div className="mt-3 pt-3 border-t text-xs space-y-1">
                        <p><strong>Created:</strong> {new Date(stream.createdTime || Date.now()).toLocaleString()}</p>
                        {stream.meta && (
                          <p><strong>Metadata:</strong> {JSON.stringify(stream.meta)}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Channels</CardTitle>
          </CardHeader>
          <CardContent>
            {channels.length === 0 ? (
              <p className="text-muted-foreground">No channels configured</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Stream Key</TableHead>
                    {canModify && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {channels.map((channel: any) => (
                    <TableRow key={channel.id}>
                      <TableCell className="font-medium">{channel.name}</TableCell>
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
                      <TableCell className="font-mono text-xs">{channel.streamKey}</TableCell>
                      {canModify && (
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startStreamMutation.mutate(channel.id)}
                              disabled={channel.isActive || startStreamMutation.isPending}
                            >
                              Start
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => stopStreamMutation.mutate(channel.id)}
                              disabled={!channel.isActive || stopStreamMutation.isPending}
                            >
                              Stop
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


