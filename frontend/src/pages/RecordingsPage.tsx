import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recordingsApi, streamsApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export function RecordingsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [selectedStream, setSelectedStream] = useState<string>('');
  const [filePath, setFilePath] = useState('');
  const [infoPath, setInfoPath] = useState('');

  const { data: streamsData, isLoading: streamsLoading } = useQuery({
    queryKey: ['streams'],
    queryFn: async () => {
      const response = await streamsApi.getAll();
      return response.data;
    },
  });

  const canModify = user?.role === 'ADMIN' || user?.role === 'OPERATOR';

  const startRecordingMutation = useMutation({
    mutationFn: ({ streamName, data }: { streamName: string; data: { filePath: string; infoPath?: string } }) =>
      recordingsApi.start(streamName, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      toast.success('Recording started successfully');
      setShowStartDialog(false);
      setSelectedStream('');
      setFilePath('');
      setInfoPath('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to start recording');
    },
  });

  const stopRecordingMutation = useMutation({
    mutationFn: (streamName: string) => recordingsApi.stop(streamName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      toast.success('Recording stopped successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to stop recording');
    },
  });

  const handleStartRecording = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStream || !filePath) {
      toast.error('Stream name and file path are required');
      return;
    }
    startRecordingMutation.mutate({
      streamName: selectedStream,
      data: {
        filePath,
        infoPath: infoPath || undefined
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
        <h1 className="text-3xl font-bold">Recordings</h1>
        {canModify && (
          <Button onClick={() => setShowStartDialog(true)}>Start Recording</Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Recordings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stream Name</TableHead>
                <TableHead>File Path</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {streams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No active streams available
                  </TableCell>
                </TableRow>
              ) : (
                streams.map((stream: any) => (
                  <RecordingRow
                    key={stream.name}
                    stream={stream}
                    onStop={stopRecordingMutation.mutate}
                    canModify={canModify}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {showStartDialog && canModify && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Start Recording</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStartRecording} className="space-y-4">
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
                <label htmlFor="filePath" className="block text-sm font-medium mb-2">
                  File Path *
                </label>
                <Input
                  id="filePath"
                  type="text"
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  placeholder="/path/to/recording.ts"
                  required
                />
              </div>
              <div>
                <label htmlFor="infoPath" className="block text-sm font-medium mb-2">
                  Info Path (optional)
                </label>
                <Input
                  id="infoPath"
                  type="text"
                  value={infoPath}
                  onChange={(e) => setInfoPath(e.target.value)}
                  placeholder="/path/to/info.xml"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={startRecordingMutation.isPending}>
                  {startRecordingMutation.isPending ? 'Starting...' : 'Start Recording'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowStartDialog(false);
                    setSelectedStream('');
                    setFilePath('');
                    setInfoPath('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RecordingRow({ stream, onStop, canModify }: { stream: any; onStop: (streamName: string) => void; canModify: boolean }) {
  const { data: statusData } = useQuery({
    queryKey: ['recording-status', stream.name],
    queryFn: async () => {
      const response = await recordingsApi.getStatus(stream.name);
      return response.data;
    },
    refetchInterval: 5000,
  });

  const recording = statusData?.recording;
  const isRecording = recording?.state === 'recording';

  return (
    <TableRow>
      <TableCell className="font-medium">{stream.name}</TableCell>
      <TableCell>{recording?.filePath || '-'}</TableCell>
      <TableCell>
        <span
          className={`px-2 py-1 rounded text-xs ${
            isRecording
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {isRecording ? 'Recording' : 'Not Recording'}
        </span>
      </TableCell>
      <TableCell>
        {canModify && (
          <Button
            variant={isRecording ? 'destructive' : 'default'}
            size="sm"
            onClick={() => onStop(stream.name)}
            disabled={!isRecording}
          >
            {isRecording ? 'Stop' : 'Stopped'}
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

