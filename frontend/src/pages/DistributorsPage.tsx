import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { distributorsApi, channelsApi, scte35Api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export function DistributorsPage() {
  const { channelId } = useParams<{ channelId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [distributorType, setDistributorType] = useState<'HLS_MPD' | 'SRT'>('HLS_MPD');
  const [distributorName, setDistributorName] = useState('');
  const [hlsUrl, setHlsUrl] = useState('');
  const [mpdUrl, setMpdUrl] = useState('');
  const [srtEndpoint, setSrtEndpoint] = useState('');
  const [srtStreamKey, setSrtStreamKey] = useState('');
  const [scte35Enabled, setScte35Enabled] = useState(true);
  const [autoPreroll, setAutoPreroll] = useState(false);
  const [selectedPrerollMarker, setSelectedPrerollMarker] = useState<string>('');

  const canModify = user?.role === 'ADMIN' || user?.role === 'OPERATOR';

  // Get channels for selection if no channelId provided
  const { data: channelsData } = useQuery({
    queryKey: ['channels'],
    queryFn: async () => {
      const response = await channelsApi.getAll();
      return response.data;
    },
    enabled: !channelId
  });

  // Get SCTE-35 markers for preroll selection
  const { data: markersData } = useQuery({
    queryKey: ['scte35-markers'],
    queryFn: async () => {
      const response = await scte35Api.getAll();
      return response.data;
    }
  });

  // Get distributors for selected channel
  const { data: distributorsData, isLoading } = useQuery({
    queryKey: ['distributors', channelId],
    queryFn: async () => {
      if (!channelId) return { distributors: [] };
      const response = await distributorsApi.getByChannel(channelId);
      return response.data;
    },
    enabled: !!channelId
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => distributorsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distributors'] });
      toast.success('Distributor created successfully');
      setShowCreateForm(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create distributor');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => distributorsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distributors'] });
      toast.success('Distributor deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to delete distributor');
    },
  });

  const insertPrerollMutation = useMutation({
    mutationFn: (id: string) => distributorsApi.insertPreroll(id),
    onSuccess: () => {
      toast.success('Preroll marker inserted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to insert preroll marker');
    },
  });

  const resetForm = () => {
    setDistributorName('');
    setHlsUrl('');
    setMpdUrl('');
    setSrtEndpoint('');
    setSrtStreamKey('');
    setScte35Enabled(true);
    setAutoPreroll(false);
    setSelectedPrerollMarker('');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelId) {
      toast.error('Please select a channel');
      return;
    }
    if (!distributorName.trim()) {
      toast.error('Distributor name is required');
      return;
    }
    if (distributorType === 'HLS_MPD' && !hlsUrl && !mpdUrl) {
      toast.error('HLS URL or MPD URL is required');
      return;
    }
    if (distributorType === 'SRT' && (!srtEndpoint || !srtStreamKey)) {
      toast.error('SRT endpoint and stream key are required');
      return;
    }

    createMutation.mutate({
      channelId,
      name: distributorName.trim(),
      type: distributorType,
      hlsUrl: distributorType === 'HLS_MPD' ? hlsUrl.trim() || undefined : undefined,
      mpdUrl: distributorType === 'HLS_MPD' ? mpdUrl.trim() || undefined : undefined,
      srtEndpoint: distributorType === 'SRT' ? srtEndpoint.trim() : undefined,
      srtStreamKey: distributorType === 'SRT' ? srtStreamKey.trim() : undefined,
      scte35Enabled,
      prerollMarkerId: selectedPrerollMarker || undefined,
      autoPreroll: distributorType === 'HLS_MPD' ? autoPreroll : false
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const distributors = distributorsData?.distributors || [];
  const markers = markersData?.markers || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Distributors</h1>
        {canModify && channelId && (
          <Button onClick={() => setShowCreateForm(true)}>Add Distributor</Button>
        )}
      </div>

      {!channelId && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Channel</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Please select a channel to manage distributors</p>
            <div className="space-y-2">
              {channelsData?.channels?.map((channel: any) => (
                <Button
                  key={channel.id}
                  variant="outline"
                  onClick={() => navigate(`/distributors/${channel.id}`)}
                  className="w-full justify-start"
                >
                  {channel.name} - {channel.streamKey}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showCreateForm && canModify && channelId && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add Distributor</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Distributor Type *</label>
                <select
                  value={distributorType}
                  onChange={(e) => setDistributorType(e.target.value as 'HLS_MPD' | 'SRT')}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="HLS_MPD">HLS/MPD (DASH)</option>
                  <option value="SRT">SRT</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Distributor Name *</label>
                <Input
                  type="text"
                  value={distributorName}
                  onChange={(e) => setDistributorName(e.target.value)}
                  placeholder="e.g., Main Distributor, CDN Provider"
                  required
                />
              </div>

              {distributorType === 'HLS_MPD' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">HLS URL (optional)</label>
                    <Input
                      type="url"
                      value={hlsUrl}
                      onChange={(e) => setHlsUrl(e.target.value)}
                      placeholder="https://example.com/hls/stream.m3u8"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      HLS/LLHLS playback URL (SCTE-35 markers will appear in playlist)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">MPD URL (optional)</label>
                    <Input
                      type="url"
                      value={mpdUrl}
                      onChange={(e) => setMpdUrl(e.target.value)}
                      placeholder="https://example.com/dash/stream.mpd"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      DASH MPD URL (SCTE-35 markers will appear in manifest)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="autoPreroll"
                      checked={autoPreroll}
                      onChange={(e) => setAutoPreroll(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="autoPreroll" className="text-sm font-medium">
                      Auto-insert preroll on stream start
                    </label>
                  </div>
                </>
              )}

              {distributorType === 'SRT' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">SRT Endpoint *</label>
                    <Input
                      type="url"
                      value={srtEndpoint}
                      onChange={(e) => setSrtEndpoint(e.target.value)}
                      placeholder="srt://distributor.example.com:9000"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      SRT endpoint provided by distributor (SCTE-35 markers embedded in stream)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">SRT Stream Key *</label>
                    <Input
                      type="text"
                      value={srtStreamKey}
                      onChange={(e) => setSrtStreamKey(e.target.value)}
                      placeholder="stream-key-123"
                      required
                    />
                  </div>
                </>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="scte35Enabled"
                  checked={scte35Enabled}
                  onChange={(e) => setScte35Enabled(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="scte35Enabled" className="text-sm font-medium">
                  Enable SCTE-35 markers
                </label>
              </div>

              {scte35Enabled && distributorType === 'HLS_MPD' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Preroll Marker (optional)</label>
                  <select
                    value={selectedPrerollMarker}
                    onChange={(e) => setSelectedPrerollMarker(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Select preroll marker</option>
                    {markers.map((marker: any) => (
                      <option key={marker.id} value={marker.id}>
                        {marker.name} ({marker.type})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    SCTE-35 marker to insert as preroll in HLS/MPD playlists
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Distributor'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {channelId && (
        <Card>
          <CardHeader>
            <CardTitle>Channel Distributors</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Endpoint/URL</TableHead>
                  <TableHead>SCTE-35</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {distributors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No distributors configured
                    </TableCell>
                  </TableRow>
                ) : (
                  distributors.map((distributor: any) => (
                    <TableRow key={distributor.id}>
                      <TableCell className="font-medium">{distributor.name}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                          {distributor.type}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {distributor.type === 'HLS_MPD' 
                          ? (distributor.hlsUrl || distributor.mpdUrl || '-')
                          : (distributor.srtEndpoint || '-')
                        }
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          distributor.scte35Enabled
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {distributor.scte35Enabled ? 'Enabled' : 'Disabled'}
                        </span>
                        {distributor.autoPreroll && (
                          <span className="ml-2 px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                            Auto-Preroll
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          distributor.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {distributor.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {canModify && (
                          <div className="flex gap-2">
                            {distributor.type === 'HLS_MPD' && distributor.prerollMarker && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => insertPrerollMutation.mutate(distributor.id)}
                                disabled={insertPrerollMutation.isPending}
                              >
                                Insert Preroll
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteMutation.mutate(distributor.id)}
                              disabled={deleteMutation.isPending}
                            >
                              Delete
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

