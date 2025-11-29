import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { streamsApi, channelsApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { Copy, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

export function StreamsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [expandedStreams, setExpandedStreams] = useState<Set<string>>(new Set());

  const { data, isLoading, error } = useQuery({
    queryKey: ['streams'],
    queryFn: async () => {
      try {
        const response = await streamsApi.getAll();
        return response.data;
      } catch (err: any) {
        console.error('Error fetching streams:', err);
        toast.error(err.response?.data?.error?.message || 'Failed to fetch streams');
        throw err;
      }
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

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-red-800">Error loading streams: {error.message || 'Unknown error'}</p>
        <p className="text-sm text-red-600 mt-2">Check browser console for details.</p>
      </div>
    );
  }

  const streams = (data as any)?.streams || [];
  const channels = (data as any)?.channels || [];

  // Debug: Log streams data
  if (data) {
    console.log('Streams data:', { streams, channels, rawData: data });
  }

  const toggleStreamExpanded = (streamName: string) => {
    setExpandedStreams(prev => {
      const newSet = new Set(prev);
      if (newSet.has(streamName)) {
        newSet.delete(streamName);
      } else {
        newSet.add(streamName);
      }
      return newSet;
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

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
                  <StreamCard
                    key={stream.name}
                    stream={stream}
                    isExpanded={expandedStreams.has(stream.name)}
                    onToggleExpand={() => toggleStreamExpanded(stream.name)}
                    onCopy={copyToClipboard}
                  />
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
                    <TableHead>Output URLs</TableHead>
                    {canModify && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {channels.map((channel: any) => (
                    <ChannelRow
                      key={channel.id}
                      channel={channel}
                      canModify={canModify}
                      onStart={() => startStreamMutation.mutate(channel.id)}
                      onStop={() => stopStreamMutation.mutate(channel.id)}
                      isStarting={startStreamMutation.isPending}
                      isStopping={stopStreamMutation.isPending}
                    />
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

function StreamCard({ stream, isExpanded, onToggleExpand, onCopy }: { 
  stream: any; 
  isExpanded: boolean; 
  onToggleExpand: () => void;
  onCopy: (text: string, label: string) => void;
}) {
  const { data: outputsData, isLoading: outputsLoading } = useQuery({
    queryKey: ['stream-outputs', stream.name],
    queryFn: async () => {
      const response = await streamsApi.getOutputs(stream.name);
      return response.data;
    },
    enabled: isExpanded, // Only fetch when expanded
  });

  const outputs = outputsData?.outputs;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className="p-3 cursor-pointer hover:bg-accent flex justify-between items-center"
        onClick={onToggleExpand}
      >
        <div className="flex-1">
          <p className="font-medium">{stream.name || 'Unknown Stream'}</p>
          <p className="text-sm text-muted-foreground">
            {stream.input?.sourceType || stream.sourceType || 'Unknown source'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
            Active
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-4 border-t bg-muted/50 space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">
              <strong>Created:</strong> {new Date(stream.createdTime || Date.now()).toLocaleString()}
            </p>
            {stream.meta && (
              <p className="text-xs text-muted-foreground">
                <strong>Metadata:</strong> {JSON.stringify(stream.meta)}
              </p>
            )}
          </div>

          {outputsLoading ? (
            <p className="text-sm text-muted-foreground">Loading output URLs...</p>
          ) : outputs ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Output URLs</h4>
                <div className="space-y-2">
                  <OutputUrlRow
                    label="LLHLS (Low Latency HLS)"
                    url={outputs.llhls}
                    onCopy={onCopy}
                  />
                  <OutputUrlRow
                    label="HLS"
                    url={outputs.hls}
                    onCopy={onCopy}
                  />
                  <OutputUrlRow
                    label="DASH (MPD)"
                    url={outputs.dash}
                    onCopy={onCopy}
                  />
                  <OutputUrlRow
                    label="WebRTC"
                    url={outputs.webrtc}
                    onCopy={onCopy}
                  />
                  <OutputUrlRow
                    label="SRT"
                    url={outputs.srt}
                    onCopy={onCopy}
                  />
                  {outputs.thumbnail && (
                    <OutputUrlRow
                      label="Thumbnail"
                      url={outputs.thumbnail}
                      onCopy={onCopy}
                      isImage={true}
                    />
                  )}
                </div>
              </div>

              {outputs.profiles && outputs.profiles.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Output Profiles</h4>
                  <div className="space-y-3">
                    {outputs.profiles.map((profile: any) => (
                      <div key={profile.name} className="pl-4 border-l-2">
                        <p className="text-xs font-medium mb-2">{profile.name}</p>
                        <div className="space-y-2">
                          <OutputUrlRow
                            label="LLHLS"
                            url={profile.llhls}
                            onCopy={onCopy}
                            small={true}
                          />
                          <OutputUrlRow
                            label="HLS"
                            url={profile.hls}
                            onCopy={onCopy}
                            small={true}
                          />
                          <OutputUrlRow
                            label="DASH"
                            url={profile.dash}
                            onCopy={onCopy}
                            small={true}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Output URLs not available</p>
          )}
        </div>
      )}
    </div>
  );
}

function ChannelRow({ channel, canModify, onStart, onStop, isStarting, isStopping }: {
  channel: any;
  canModify: boolean;
  onStart: () => void;
  onStop: () => void;
  isStarting: boolean;
  isStopping: boolean;
}) {
  const [showOutputs, setShowOutputs] = useState(false);

  const { data: outputsData, isLoading: outputsLoading } = useQuery({
    queryKey: ['channel-outputs', channel.id],
    queryFn: async () => {
      const response = await channelsApi.getOutputs(channel.id);
      return response.data;
    },
    enabled: showOutputs && channel.isActive, // Only fetch when expanded and active
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const outputs = outputsData?.outputs;
  const distributors = outputsData?.distributors || [];

  return (
    <>
      <TableRow>
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
        <TableCell>
          {channel.isActive ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowOutputs(!showOutputs)}
              className="h-8"
            >
              {showOutputs ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Hide URLs
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Show URLs
                </>
              )}
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">Stream inactive</span>
          )}
        </TableCell>
                      {canModify && (
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                onClick={onStart}
                disabled={channel.isActive || isStarting}
                            >
                              Start
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                onClick={onStop}
                disabled={!channel.isActive || isStopping}
                            >
                              Stop
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
      {showOutputs && channel.isActive && (
        <TableRow>
          <TableCell colSpan={canModify ? 5 : 4} className="bg-muted/50 p-4">
            {outputsLoading ? (
              <p className="text-sm text-muted-foreground">Loading output URLs...</p>
            ) : outputs ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-3">Output URLs</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <OutputUrlRow
                      label="LLHLS (Low Latency HLS)"
                      url={outputs.llhls}
                      onCopy={copyToClipboard}
                    />
                    <OutputUrlRow
                      label="HLS"
                      url={outputs.hls}
                      onCopy={copyToClipboard}
                    />
                    <OutputUrlRow
                      label="DASH (MPD)"
                      url={outputs.dash}
                      onCopy={copyToClipboard}
                    />
                    <OutputUrlRow
                      label="WebRTC"
                      url={outputs.webrtc}
                      onCopy={copyToClipboard}
                    />
                    <OutputUrlRow
                      label="SRT"
                      url={outputs.srt}
                      onCopy={copyToClipboard}
                    />
                    {outputs.thumbnail && (
                      <OutputUrlRow
                        label="Thumbnail"
                        url={outputs.thumbnail}
                        onCopy={copyToClipboard}
                        isImage={true}
                      />
                    )}
                  </div>
                </div>

                {outputs.profiles && outputs.profiles.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Output Profiles</h4>
                    <div className="space-y-3">
                      {outputs.profiles.map((profile: any) => (
                        <div key={profile.name} className="pl-4 border-l-2">
                          <p className="text-xs font-medium mb-2">{profile.name}</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <OutputUrlRow
                              label="LLHLS"
                              url={profile.llhls}
                              onCopy={copyToClipboard}
                              small={true}
                            />
                            <OutputUrlRow
                              label="HLS"
                              url={profile.hls}
                              onCopy={copyToClipboard}
                              small={true}
                            />
                            <OutputUrlRow
                              label="DASH"
                              url={profile.dash}
                              onCopy={copyToClipboard}
                              small={true}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {distributors.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Distributor URLs (CDN)</h4>
                    <div className="space-y-2">
                      {distributors.map((dist: any) => (
                        <div key={dist.id} className="pl-4 border-l-2">
                          <p className="text-xs font-medium mb-2">{dist.name} ({dist.type})</p>
                          <div className="space-y-2">
                            {dist.hlsUrl && (
                              <OutputUrlRow
                                label="HLS (CDN)"
                                url={dist.hlsUrl}
                                onCopy={copyToClipboard}
                                small={true}
                              />
                            )}
                            {dist.mpdUrl && (
                              <OutputUrlRow
                                label="MPD (CDN)"
                                url={dist.mpdUrl}
                                onCopy={copyToClipboard}
                                small={true}
                              />
                            )}
                            {dist.srtEndpoint && dist.srtStreamKey && (
                              <OutputUrlRow
                                label="SRT (CDN)"
                                url={`${dist.srtEndpoint}?streamid=${dist.srtStreamKey}`}
                                onCopy={copyToClipboard}
                                small={true}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Output URLs not available</p>
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function OutputUrlRow({ label, url, onCopy, isImage = false, small = false }: {
  label: string;
  url: string;
  onCopy: (text: string, label: string) => void;
  isImage?: boolean;
  small?: boolean;
}) {
  const textSize = small ? 'text-xs' : 'text-sm';
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className={`${textSize} font-medium text-muted-foreground`}>{label}:</span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2"
            onClick={(e) => {
              e.stopPropagation();
              onCopy(url, label);
            }}
            title="Copy URL"
          >
            <Copy className="w-3 h-3" />
          </Button>
          {!isImage && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={(e) => {
                e.stopPropagation();
                window.open(url, '_blank');
              }}
              title="Open in new tab"
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={url}
          readOnly
          className={`font-mono ${textSize} bg-background`}
          onClick={(e) => {
            e.stopPropagation();
            (e.target as HTMLInputElement).select();
          }}
        />
      </div>
      {isImage && url && (
        <div className="mt-2">
          <img
            src={url}
            alt="Stream thumbnail"
            className="max-w-xs border rounded"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
    </div>
  );
}


