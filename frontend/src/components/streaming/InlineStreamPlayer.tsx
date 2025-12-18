import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { streamsApi } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { HlsVideoPlayer } from './HlsVideoPlayer';
import { Copy, Monitor, Users, Activity, Radio, CheckCircle, XCircle, Video, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface InlineStreamPlayerProps {
  streamName: string | null;
  appName?: string | null;
  channel?: any;
  onStreamChange?: (streamName: string | null) => void;
}

export function InlineStreamPlayer({ streamName, appName, channel, onStreamChange }: InlineStreamPlayerProps) {
  const [selectedQuality, setSelectedQuality] = useState<string>('auto');

  // Fetch stream details
  const { data: streamData, isLoading } = useQuery({
    queryKey: ['stream-details', streamName, appName],
    queryFn: async () => {
      if (!streamName) return null;
      const response = await streamsApi.getById(streamName, appName || undefined);
      return response.data;
    },
    enabled: !!streamName,
    refetchInterval: 5000, // Update every 5 seconds for live metrics
  });

  const stream = streamData?.stream;
  const outputs = streamData?.outputs;
  const streamHealth = streamData?.streamHealth;
  const streamTracks = streamData?.streamTracks;
  const viewerCount = streamData?.viewerCount;
  const recordingStatus = streamData?.recordingStatus;

  // Prepare OvenPlayer sources
  const getSourceUrl = (protocol: 'webrtc' | 'llhls' | 'hls') => {
    if (selectedQuality !== 'auto' && outputs?.profiles) {
      const profile = outputs.profiles.find((p: any) => p.name === selectedQuality);
      if (profile) {
        if (protocol === 'llhls' && profile.llhls) return profile.llhls;
        if (protocol === 'hls' && profile.hls) return profile.hls;
      }
    }
    
    if (protocol === 'webrtc') return outputs?.webrtc;
    if (protocol === 'llhls') return outputs?.llhls;
    if (protocol === 'hls') return outputs?.hls;
    return null;
  };

  // Player source ordering is used for labels/URL display only. Playback uses HlsVideoPlayer.
  const playerSources = useMemo(() => {
    if (!outputs) return [];
    const llhls = getSourceUrl('llhls');
    const webrtc = outputs.webrtc;
    return [
      ...(llhls ? [{
        type: 'llhls' as const,
        file: llhls,
        label: selectedQuality !== 'auto' ? `LLHLS - ${selectedQuality}` : 'LLHLS (Low Latency HLS)'
      }] : []),
      ...(webrtc ? [{
        type: 'webrtc' as const,
        file: webrtc,
        label: 'WebRTC (Low Latency)'
      }] : []),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outputs?.webrtc, outputs?.llhls, outputs?.profiles, selectedQuality]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  if (!streamName) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Monitor className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Select a stream to view live preview</p>
          <p className="text-sm text-muted-foreground mt-2">
            Click on any active stream below to start monitoring
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading stream...</p>
        </CardContent>
      </Card>
    );
  }

  if (!stream) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <XCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <p className="text-red-600">Stream not found</p>
          <p className="text-sm text-muted-foreground mt-2">Stream may have ended or doesn't exist</p>
        </CardContent>
      </Card>
    );
  }

  // Backend returns streamHealth as { state, connected, quality, ... }
  const isHealthy = !!streamHealth?.connected;
  const uptime = stream.createdTime 
    ? formatDistanceToNow(new Date(stream.createdTime), { addSuffix: false })
    : 'Unknown';

  return (
    <div className="space-y-4">
      {/* Stream Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
          <div>
            <h3 className="font-semibold text-lg">{streamName}</h3>
            {channel?.name && (
              <p className="text-sm text-muted-foreground">Channel: {channel.name}</p>
            )}
          </div>
        </div>
        {onStreamChange && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStreamChange(null)}
          >
            Close Player
          </Button>
        )}
      </div>

      {/* Main Player Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Player Section - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                Live Preview
                {viewerCount && (
                  <span className="ml-auto flex items-center gap-1 text-sm font-normal text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {viewerCount.total || 0} viewers
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {playerSources.length > 0 ? (
                <div className="space-y-3">
                  <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                    {/* Single-player approach: always use <video> + hls.js for playback.
                        WebRTC is exposed as a URL (copy) rather than embedding OvenPlayer, since OvenPlayer has
                        proven unstable in this environment (null deref on click/hover). */}
                    {(getSourceUrl('hls') || getSourceUrl('llhls')) ? (
                      <HlsVideoPlayer
                        src={(getSourceUrl('hls') || getSourceUrl('llhls'))!}
                        className="w-full h-full"
                        muted
                        autoPlay
                        onFatalError={() => {
                          toast.error('HLS playback failed. Try again or use WebRTC output URL.');
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-white/80">
                        No HLS output available
                      </div>
                    )}
                  </div>

                  {/* Quality Selection */}
                  {outputs?.profiles && outputs.profiles.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-muted-foreground">Quality:</span>
                      <Button
                        variant={selectedQuality === 'auto' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedQuality('auto')}
                      >
                        Auto
                      </Button>
                      {outputs.profiles.map((profile: any) => (
                        <Button
                          key={profile.name}
                          variant={selectedQuality === profile.name ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedQuality(profile.name)}
                        >
                          {profile.name}
                          {profile.resolution && ` (${profile.resolution})`}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
                  <div className="text-center">
                    <Video className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No output URLs available</p>
                    <p className="text-sm text-muted-foreground mt-1">Stream may not be ready yet</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Metrics & Info Section - Takes 1 column on large screens */}
        <div className="lg:col-span-1 space-y-4">
          {/* Stream Health & Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Stream Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Health</span>
                <span className={`flex items-center gap-1 text-sm font-medium ${
                  isHealthy ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isHealthy ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Healthy
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      {streamHealth?.state || 'Unknown'}
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Uptime</span>
                <span className="text-sm font-medium flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {uptime}
                </span>
              </div>

              {viewerCount && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Viewers</span>
                  <span className="text-sm font-medium flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {viewerCount.total || 0}
                  </span>
                </div>
              )}

              {recordingStatus?.recording && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Recording</span>
                  <span className="text-sm font-medium text-red-600 flex items-center gap-1">
                    <Radio className="w-4 h-4 animate-pulse" />
                    Active
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stream Tracks */}
          {streamTracks && (streamTracks.video || streamTracks.audio) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Stream Tracks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {streamTracks.video && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Video</span>
                      <span className="font-medium">{streamTracks.video.codec || 'N/A'}</span>
                    </div>
                    {streamTracks.video.resolution && (
                      <div className="text-xs text-muted-foreground pl-4">
                        {streamTracks.video.resolution}
                        {streamTracks.video.bitrate && ` @ ${Math.round(streamTracks.video.bitrate / 1000)}kbps`}
                      </div>
                    )}
                  </div>
                )}
                {streamTracks.audio && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Audio</span>
                      <span className="font-medium">{streamTracks.audio.codec || 'N/A'}</span>
                    </div>
                    {streamTracks.audio.sampleRate && (
                      <div className="text-xs text-muted-foreground pl-4">
                        {streamTracks.audio.sampleRate}Hz
                        {streamTracks.audio.bitrate && ` @ ${Math.round(streamTracks.audio.bitrate / 1000)}kbps`}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Output URLs */}
          {outputs && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Output URLs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {outputs.llhls && (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-muted px-2 py-1 rounded truncate">
                      {outputs.llhls}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => copyToClipboard(outputs.llhls, 'LLHLS URL')}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                {outputs.webrtc && (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-muted px-2 py-1 rounded truncate">
                      WebRTC
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => copyToClipboard(outputs.webrtc, 'WebRTC URL')}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

