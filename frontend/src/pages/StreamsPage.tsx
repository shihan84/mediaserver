import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { streamsApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Copy, Eye, Activity, Plus, Info, Play, RefreshCw, AlertCircle } from 'lucide-react';
import { StreamDetailModal } from '../components/streaming/StreamDetailModal';
import { InlineStreamPlayer } from '../components/streaming/InlineStreamPlayer';
import toast from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';

// Simple Badge component
const Badge = ({ children, variant = 'default', className = '' }: { children: React.ReactNode; variant?: 'default' | 'secondary'; className?: string }) => {
  const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold';
  const variantStyles = variant === 'default' 
    ? 'bg-primary text-primary-foreground' 
    : 'bg-secondary text-secondary-foreground';
  return <span className={`${baseStyles} ${variantStyles} ${className}`}>{children}</span>;
};

// Simple bitrate formatter
const formatBitrate = (bps: number): string => {
  if (bps === 0) return '0 bps';
  const k = 1000;
  const sizes = ['bps', 'Kbps', 'Mbps', 'Gbps'];
  const i = Math.floor(Math.log(bps) / Math.log(k));
  return Math.round(bps / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const OME_HOST = (import.meta.env.VITE_OME_HOST as string) || 'ome.imagetv.in';

const getOmePublicBase = (): string => {
  // If the dashboard is served over HTTPS, avoid mixed content by using a same-origin proxy path.
  // Nginx should proxy `/ome/` to OME origin (typically http://127.0.0.1:3333/).
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return `${window.location.origin}/ome`;
  }
  return `http://${OME_HOST}:3333`;
};

// Thumbnails are optional in OME and commonly return 404 unless explicitly enabled.
// To avoid noisy browser console errors, we don't request thumbnails by default.
function StreamThumbnailPlaceholder() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-black" />
  );
}

export function StreamsPage() {
  const [selectedStream, setSelectedStream] = useState<{ streamName: string; channel?: any } | null>(null);
  const [playingStream, setPlayingStream] = useState<{ streamName: string; appName?: string; channel?: any } | null>(null);
  const [showCreateGuide, setShowCreateGuide] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Simple query - no complex select or memoization
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['streams'],
    queryFn: async () => {
      try {
        const response = await streamsApi.getAll();
        const responseData = response.data;
        
        // Store debug info
        setDebugInfo({
          timestamp: new Date().toISOString(),
          streamsCount: responseData?.streams?.length || 0,
          channelsCount: responseData?.channels?.length || 0,
          rawResponse: responseData
        });
        
        return responseData;
      } catch (err: any) {
        console.error('Error fetching streams:', err);
        setDebugInfo({
          timestamp: new Date().toISOString(),
          error: err.message,
          response: err.response?.data
        });
        throw err;
      }
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const streams = data?.streams || [];
  const channels = data?.channels || [];

  // Auto-select first active stream for live player
  useEffect(() => {
    if (streams.length > 0 && !playingStream) {
      const firstStream = streams[0];
      setPlayingStream({
        streamName: firstStream.name,
        appName: firstStream.appName,
        channel: firstStream.matchedChannel
      });
    }
  }, [streams.length]); // Only depend on length to avoid infinite loops

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  // (Intentionally no console logging in production UI)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading streams...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="m-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Error Loading Streams
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-red-600">{(error as any).message || 'Unknown error'}</p>
          {debugInfo?.error && (
            <div className="bg-muted p-3 rounded text-sm">
              <p className="font-semibold mb-1">Debug Info:</p>
              <pre className="text-xs overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Streams</h1>
          <p className="text-muted-foreground mt-1">
            Active streams from OvenMediaEngine ({streams.length} active)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} title="Refresh streams">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => setShowCreateGuide(true)}>
            <Info className="h-4 w-4 mr-2" />
            How to Create Stream
          </Button>
          <Button onClick={() => window.location.href = '/channels'}>
            <Plus className="h-4 w-4 mr-2" />
            Create Channel
          </Button>
        </div>
      </div>

      {/* Debug Info Banner (if no streams but channels exist) */}
      {streams.length === 0 && channels.length > 0 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-yellow-800 dark:text-yellow-200">No Active Streams Detected</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  You have {channels.length} channel(s) configured, but no active streams found.
                </p>
                <div className="mt-3 space-y-2 text-sm">
                  <p className="font-semibold">Troubleshooting:</p>
                  <ul className="list-disc list-inside space-y-1 text-yellow-700 dark:text-yellow-300 ml-2">
                    <li>Ensure you're streaming to: <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">rtmp://{OME_HOST}:1935/[APP_NAME]/[STREAM_KEY]</code></li>
                    <li>Verify your channel's <strong>App Name</strong> matches your RTMP application</li>
                    <li>Check that your <strong>Stream Key</strong> matches exactly</li>
                    <li>Wait a few seconds after starting the stream</li>
                    <li>Click <strong>Refresh</strong> to check again</li>
                  </ul>
                  {channels.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-yellow-300 dark:border-yellow-700">
                      <p className="font-semibold mb-2">Your Channels:</p>
                      <div className="space-y-1">
                        {channels.slice(0, 3).map((ch: any) => (
                          <div key={ch.id} className="text-xs bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">
                            <strong>{ch.name}</strong> → RTMP: <code>rtmp://{OME_HOST}:1935/{ch.appName || 'app'}/{ch.streamKey}</code>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Player Section - Like Wowza/Flussonic */}
      {streams.length > 0 && playingStream && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                Live Preview
              </CardTitle>
              <div className="flex gap-2">
                <select
                  value={playingStream.streamName}
                  onChange={(e) => {
                    const stream = streams.find((s: any) => s.name === e.target.value);
                    if (stream) {
                      setPlayingStream({
                        streamName: stream.name,
                        appName: stream.appName,
                        channel: stream.matchedChannel
                      });
                    }
                  }}
                  className="px-3 py-1.5 text-sm border rounded-md bg-background"
                >
                  {streams.map((stream: any) => (
                    <option key={`${stream.appName || 'app'}-${stream.name}`} value={stream.name}>
                      {stream.name} ({stream.appName || 'app'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <InlineStreamPlayer
              streamName={playingStream.streamName}
              appName={playingStream.appName}
              channel={playingStream.channel}
              onStreamChange={(streamName) => {
                if (!streamName) {
                  setPlayingStream(null);
                }
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Streams Grid */}
      {streams.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Activity className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg font-semibold">No active streams found</p>
            <p className="text-sm text-muted-foreground mt-2 mb-4">
              Create a channel and start streaming to see live streams here
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => refetch()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => setShowCreateGuide(true)} variant="outline">
                <Info className="h-4 w-4 mr-2" />
                How to Create Stream
              </Button>
              <Button onClick={() => window.location.href = '/channels'}>
                <Plus className="h-4 w-4 mr-2" />
                Create Channel
              </Button>
            </div>
            {debugInfo && (
              <div className="mt-6 text-left bg-muted p-4 rounded text-xs max-w-2xl mx-auto">
                <p className="font-semibold mb-2">Last Check: {new Date(debugInfo.timestamp).toLocaleTimeString()}</p>
                <pre className="overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div>
          <h2 className="text-xl font-semibold mb-4">All Streams</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {streams.map((stream: any) => {
              const inputSource = stream.input || stream.sources?.[0];
              const inputUrl = inputSource 
                ? `rtmp://${OME_HOST}:1935/${stream.appName || 'app'}/${stream.name}`
                : 'N/A';
              const omeBase = getOmePublicBase();
              const thumbnailUrl = `${omeBase}/${stream.appName || 'app'}/${stream.name}/thumbnail`;
              const isPlaying = playingStream?.streamName === stream.name;

              return (
                <Card 
                  key={`${stream.appName || 'app'}-${stream.name}`} 
                  className={`overflow-hidden ${isPlaying ? 'ring-2 ring-primary' : ''}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold">{stream.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          App: {stream.appName || 'app'}
                        </p>
                      </div>
                      <Badge variant={stream.state === 'started' ? 'default' : 'secondary'}>
                        {stream.state === 'started' ? 'Active' : stream.state || 'Unknown'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Stream Thumbnail */}
                    <div className="relative bg-black rounded-md overflow-hidden aspect-video cursor-pointer group"
                      onClick={() => setPlayingStream({ streamName: stream.name, appName: stream.appName, channel: stream.matchedChannel })}
                    >
                      <StreamThumbnailPlaceholder />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 group-hover:bg-black/30 transition-colors">
                        <div className="text-white text-center">
                          <Play className="w-8 h-8 mx-auto mb-2 opacity-75 group-hover:opacity-100 transition-opacity" />
                          <p className="text-sm">{isPlaying ? 'Playing' : 'Click to Preview'}</p>
                        </div>
                      </div>
                      {isPlaying && (
                        <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-semibold">
                          LIVE
                        </div>
                      )}
                    </div>

                    {/* Stream Info */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Source:</span>
                        <span>{inputSource?.sourceType || 'Unknown'}</span>
                      </div>
                      {stream.uptime && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Uptime:</span>
                          <span>{Math.floor(stream.uptime / 60)}m {stream.uptime % 60}s</span>
                        </div>
                      )}
                      {stream.currentBandwidth && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Bandwidth:</span>
                          <span>{formatBitrate(stream.currentBandwidth)}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant={isPlaying ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1"
                        onClick={() => setPlayingStream({ streamName: stream.name, appName: stream.appName, channel: stream.matchedChannel })}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {isPlaying ? 'Playing' : 'Preview'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedStream({ streamName: stream.name, channel: stream.matchedChannel })}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Quick Info */}
                    {inputUrl !== 'N/A' && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Input URL:</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-xs bg-muted p-2 rounded truncate">
                            {inputUrl}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => copyToClipboard(inputUrl, 'Input URL')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Stream Detail Modal */}
      {selectedStream && (
        <StreamDetailModal
          streamName={selectedStream.streamName}
          channel={selectedStream.channel}
          open={!!selectedStream}
          onOpenChange={(open) => {
            if (!open) setSelectedStream(null);
          }}
        />
      )}

      {/* Create Stream Guide Dialog */}
      <Dialog open={showCreateGuide} onOpenChange={setShowCreateGuide}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>How to Create a New Stream</DialogTitle>
            <DialogDescription>
              Learn how to set up streaming in OvenMediaEngine
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Understanding Streams vs Channels</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                <li><strong>Channel:</strong> A configuration that defines where streams will be received</li>
                <li><strong>Stream:</strong> An active live connection (appears when someone is broadcasting)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Step 1: Create a Channel</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-2">
                <li>Go to <strong>Channels</strong> page</li>
                <li>Click <strong>"Create Channel"</strong></li>
                <li>Enter:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li><strong>Channel Name:</strong> e.g., "My Live Stream"</li>
                    <li><strong>Stream Key:</strong> e.g., "my-stream-key" (must be unique)</li>
                    <li><strong>App Name:</strong> Usually "app" or "live"</li>
                  </ul>
                </li>
                <li>Click <strong>"Create"</strong></li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Step 2: Start Streaming</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Use your streaming software (OBS, FFmpeg, etc.) to connect:
              </p>
              <div className="bg-muted p-3 rounded-md space-y-2">
                <div>
                  <p className="text-xs font-semibold mb-1">RTMP URL Format:</p>
                  <code className="text-xs bg-background px-2 py-1 rounded block">
                    rtmp://{OME_HOST}:1935/[APP_NAME]/[STREAM_KEY]
                  </code>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-1">Example:</p>
                  <code className="text-xs bg-background px-2 py-1 rounded block">
                    rtmp://{OME_HOST}:1935/app/my-stream-key
                  </code>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Troubleshooting: Stream Not Appearing?</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                <li>Verify you're streaming to the correct RTMP URL</li>
                <li>Check that <strong>App Name</strong> in channel matches RTMP application</li>
                <li>Ensure <strong>Stream Key</strong> matches exactly (case-sensitive)</li>
                <li>Wait 5-10 seconds after starting stream</li>
                <li>Click <strong>Refresh</strong> button to check again</li>
                <li>Check browser console (F12) for any errors</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Step 3: View Your Stream</h3>
              <p className="text-sm text-muted-foreground">
                Once you start streaming, your stream will automatically appear on this page. 
                Click on any stream card to view live preview.
              </p>
            </div>

            <div className="pt-4 border-t">
              <div className="flex gap-2">
                <Button onClick={() => window.location.href = '/channels'} className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Channel Now
                </Button>
                <Button variant="outline" onClick={() => setShowCreateGuide(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
