import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { streamsApi, channelsApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { Copy, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

// Get OME host from environment or use default
const OME_HOST = (import.meta.env.VITE_OME_HOST as string) || 'ome.imagetv.in';

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

  // Map streams to channels by streamKey
  const streamMap = new Map(streams.map((s: any) => [s.name, s]));
  const activeStreamKeys = new Set(streams.map((s: any) => s.name));
  
  // Organize channels: active vs inactive
  const channelsWithStreams = channels.map((ch: any) => ({
    ...ch,
    hasActiveStream: activeStreamKeys.has(ch.streamKey),
    activeStream: streamMap.get(ch.streamKey) || null
  }));
  
  const activeChannels = channelsWithStreams.filter((ch: any) => ch.hasActiveStream);
  const inactiveChannels = channelsWithStreams.filter((ch: any) => !ch.hasActiveStream);
  
  // Streams without matching channels
  const orphanStreams = streams.filter((s: any) => 
    !channels.some((ch: any) => ch.streamKey === s.name)
  );

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

  const getRtmpUrl = (streamKey: string, appName?: string) => {
    const app = appName || 'app';
    return `rtmp://${OME_HOST}:1935/${app}/${streamKey}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Streams & Channels</h1>
          <p className="text-muted-foreground mt-1">Manage active streams and channel configurations</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{streams.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active Streams</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{channels.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Channels</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{activeChannels.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Channels Streaming</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{inactiveChannels.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Channels Ready</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Channels with Streams */}
      {activeChannels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Active Channels ({activeChannels.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">Channels that are currently streaming</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeChannels.map((channel: any) => (
                <ChannelStreamCard
                  key={channel.id}
                  channel={channel}
                  stream={channel.activeStream}
                  canModify={canModify}
                  onStop={() => stopStreamMutation.mutate(channel.id)}
                  isStopping={stopStreamMutation.isPending}
                  onCopy={copyToClipboard}
                  expandedStreams={expandedStreams}
                  onToggleStream={toggleStreamExpanded}
                  getRtmpUrl={getRtmpUrl}
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
              Available Channels ({inactiveChannels.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">Channels ready to stream but not currently active</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inactiveChannels.map((channel: any) => (
                <div key={channel.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{channel.name}</h3>
                        <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                          {channel.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {channel.description && (
                        <p className="text-sm text-muted-foreground mb-2">{channel.description}</p>
                      )}
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="font-medium">Stream Key:</span>
                          <code className="ml-2 px-2 py-1 bg-muted rounded text-xs">{channel.streamKey}</code>
                        </div>
                        <div>
                          <span className="font-medium">RTMP URL:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="flex-1 px-2 py-1 bg-muted rounded text-xs">{getRtmpUrl(channel.streamKey, channel.appName)}</code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7"
                              onClick={() => copyToClipboard(getRtmpUrl(channel.streamKey, channel.appName), 'RTMP URL')}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    {canModify && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startStreamMutation.mutate(channel.id)}
                          disabled={channel.isActive || startStreamMutation.isPending}
                        >
                          {startStreamMutation.isPending ? 'Starting...' : 'Start'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orphan Streams (streams without matching channels) */}
      {orphanStreams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Unmanaged Streams ({orphanStreams.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">Active streams not associated with any channel</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {orphanStreams.map((stream: any) => (
                <StreamCard
                  key={stream.name}
                  stream={stream}
                  isExpanded={expandedStreams.has(stream.name)}
                  onToggleExpand={() => toggleStreamExpanded(stream.name)}
                  onCopy={copyToClipboard}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty States */}
      {streams.length === 0 && channels.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No streams or channels configured</p>
            <p className="text-sm text-muted-foreground">
              Create a channel first, then connect via RTMP to start streaming
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ChannelStreamCard({ 
  channel, 
  stream, 
  canModify, 
  onStop, 
  isStopping,
  onCopy,
  expandedStreams,
  onToggleStream,
  getRtmpUrl
}: {
  channel: any;
  stream: any;
  canModify: boolean;
  onStop: () => void;
  isStopping: boolean;
  onCopy: (text: string, label: string) => void;
  expandedStreams: Set<string>;
  onToggleStream: (streamName: string) => void;
  getRtmpUrl: (streamKey: string) => string;
}) {
  const [showDetails, setShowDetails] = useState(false);
  
  const { data: outputsData, isLoading: outputsLoading } = useQuery({
    queryKey: ['channel-outputs', channel.id],
    queryFn: async () => {
      const response = await channelsApi.getOutputs(channel.id);
      return response.data;
    },
    enabled: showDetails && channel.isActive,
  });

  const outputs = outputsData?.outputs;
  const isStreamExpanded = expandedStreams.has(stream.name);

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold">{channel.name}</h3>
              <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                Streaming
              </span>
            </div>
            {channel.description && (
              <p className="text-sm text-muted-foreground mb-3">{channel.description}</p>
            )}
            
            {/* Stream Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Stream Key:</span>
                <code className="ml-2 px-2 py-1 bg-muted rounded text-xs">{channel.streamKey}</code>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Source:</span>
                <span className="ml-2">{stream.input?.sourceType || stream.sourceType || 'Unknown'}</span>
              </div>
              <div className="md:col-span-2">
                <span className="font-medium text-muted-foreground">RTMP URL:</span>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 px-2 py-1 bg-muted rounded text-xs">{getRtmpUrl(channel.streamKey, channel.appName)}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7"
                    onClick={() => onCopy(getRtmpUrl(channel.streamKey, channel.appName), 'RTMP URL')}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 ml-4">
            {canModify && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onStop}
                disabled={isStopping}
              >
                {isStopping ? 'Stopping...' : 'Stop Stream'}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Button>
          </div>
        </div>

        {/* Stream Details Toggle */}
        {stream && (
          <div className="mt-3 pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleStream(stream.name)}
              className="w-full justify-between"
            >
              <span>Stream Details & Output URLs</span>
              {isStreamExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        )}
      </div>

      {/* Expanded Stream Details */}
      {isStreamExpanded && stream && (
        <div className="p-4 border-t bg-muted/30">
          <StreamDetails 
            stream={stream} 
            outputs={outputs} 
            outputsLoading={outputsLoading}
            onCopy={onCopy}
          />
        </div>
      )}

      {/* Channel Output URLs */}
      {showDetails && outputs && (
        <div className="p-4 border-t bg-muted/50">
          <h4 className="text-sm font-semibold mb-3">Channel Output URLs</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {outputs.llhls && (
              <OutputUrlRow label="LLHLS" url={outputs.llhls} onCopy={onCopy} small />
            )}
            {outputs.hls && (
              <OutputUrlRow label="HLS" url={outputs.hls} onCopy={onCopy} small />
            )}
            {outputs.dash && (
              <OutputUrlRow label="DASH" url={outputs.dash} onCopy={onCopy} small />
            )}
            {outputs.webrtc && (
              <OutputUrlRow label="WebRTC" url={outputs.webrtc} onCopy={onCopy} small />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StreamDetails({ stream, outputs, outputsLoading, onCopy }: {
  stream: any;
  outputs: any;
  outputsLoading: boolean;
  onCopy: (text: string, label: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted-foreground mb-2">
          <strong>Created:</strong> {new Date(stream.createdTime || stream.input?.createdTime || Date.now()).toLocaleString()}
        </p>
      </div>

      {outputsLoading ? (
        <p className="text-sm text-muted-foreground">Loading output URLs...</p>
      ) : outputs ? (
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-semibold mb-2">Output URLs</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <OutputUrlRow label="LLHLS" url={outputs.llhls} onCopy={onCopy} small />
              <OutputUrlRow label="HLS" url={outputs.hls} onCopy={onCopy} small />
              <OutputUrlRow label="DASH" url={outputs.dash} onCopy={onCopy} small />
              <OutputUrlRow label="WebRTC" url={outputs.webrtc} onCopy={onCopy} small />
              {outputs.thumbnail && (
                <OutputUrlRow label="Thumbnail" url={outputs.thumbnail} onCopy={onCopy} isImage small />
              )}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Output URLs not available</p>
      )}
    </div>
  );
}

function StreamCard({ 
  stream, 
  isExpanded, 
  onToggleExpand, 
  onCopy 
}: {
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


