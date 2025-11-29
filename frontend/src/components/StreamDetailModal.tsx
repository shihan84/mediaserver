import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Copy, ExternalLink, Monitor, Activity, Link2, Heart, Users, Radio, AlertCircle, CheckCircle, XCircle, Video, Headphones, Settings, Clock, Rewind, Shield } from 'lucide-react';
import { streamsApi, scte35Api, securityApi } from '../lib/api';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatBytes } from '../lib/utils';
import { OvenPlayer } from './OvenPlayer';

interface StreamDetailModalProps {
  streamName: string | null;
  channel?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StreamDetailModal({
  streamName,
  channel,
  open,
  onOpenChange,
}: StreamDetailModalProps) {
  const [selectedOutputUrl, setSelectedOutputUrl] = useState<string>('');
  const [selectedProtocol, setSelectedProtocol] = useState<'webrtc' | 'llhls' | 'hls'>('llhls');
  const [selectedQuality, setSelectedQuality] = useState<string>('auto');
  const [playerError, setPlayerError] = useState<string>('');

  // Fetch stream details
  const { data: streamData, isLoading, error } = useQuery({
    queryKey: ['stream-details', streamName],
    queryFn: async () => {
      if (!streamName) return null;
      const response = await streamsApi.getById(streamName);
      return response.data;
    },
    enabled: open && !!streamName,
    refetchInterval: 5000, // Refetch every 5 seconds for live data
  });

  const stream = streamData?.stream;
  const streamChannel = streamData?.channel || channel;
  const metrics = streamData?.metrics || [];
  const omeMetrics = streamData?.omeMetrics;
  const outputs = streamData?.outputs;
  const streamHealth = streamData?.streamHealth;
  const streamStats = streamData?.streamStats;
  const streamTracks = streamData?.streamTracks;
  const streamStatistics = streamData?.streamStatistics;
  const viewerCount = streamData?.viewerCount;
  const recordingStatus = streamData?.recordingStatus;
  const pushPublishingStatus = streamData?.pushPublishingStatus;

  // Fetch DVR status
  const { data: dvrData } = useQuery({
    queryKey: ['stream-dvr', streamName],
    queryFn: async () => {
      if (!streamName) return null;
      const response = await streamsApi.getDvr(streamName);
      return response.data;
    },
    enabled: open && !!streamName,
    refetchInterval: 5000,
  });

  const dvrStatus = dvrData?.dvr;

  // Fetch SCTE-35 markers for this channel/stream
  const { data: scte35Data } = useQuery({
    queryKey: ['scte35-markers', streamChannel?.id],
    queryFn: async () => {
      if (!streamChannel?.id) return { markers: [] };
      const response = await scte35Api.getAll();
      return response.data;
    },
    enabled: open && !!streamChannel?.id,
  });

  const scte35Markers = scte35Data?.markers || [];

  // Prepare OvenPlayer sources with automatic fallback
  // If a specific quality is selected, use that rendition URL
  const getSourceUrl = (protocol: 'webrtc' | 'llhls' | 'hls') => {
    if (selectedQuality !== 'auto' && outputs?.profiles) {
      const profile = outputs.profiles.find((p: any) => p.name === selectedQuality);
      if (profile) {
        if (protocol === 'llhls' && profile.llhls) return profile.llhls;
        if (protocol === 'hls' && profile.hls) return profile.hls;
      }
    }
    
    // Default URLs
    if (protocol === 'webrtc') return outputs?.webrtc;
    if (protocol === 'llhls') return outputs?.llhls;
    if (protocol === 'hls') return outputs?.hls;
    return null;
  };

  const playerSources = outputs ? [
    ...(outputs.webrtc ? [{
      type: 'webrtc' as const,
      file: outputs.webrtc,
      label: 'WebRTC (Low Latency)'
    }] : []),
    ...(getSourceUrl('llhls') ? [{
      type: 'llhls' as const,
      file: getSourceUrl('llhls')!,
      label: selectedQuality !== 'auto' ? `LLHLS - ${selectedQuality}` : 'LLHLS (Low Latency HLS)'
    }] : []),
    ...(getSourceUrl('hls') ? [{
      type: 'hls' as const,
      file: getSourceUrl('hls')!,
      label: selectedQuality !== 'auto' ? `HLS - ${selectedQuality}` : 'HLS (Standard)'
    }] : [])
  ].filter(Boolean) : [];

  // Set default output URL to LLHLS when available
  useEffect(() => {
    if (outputs?.llhls) {
      setSelectedOutputUrl(outputs.llhls);
    } else if (outputs?.hls) {
      setSelectedOutputUrl(outputs.hls);
    } else if (outputs?.webrtc) {
      setSelectedOutputUrl(outputs.webrtc);
    }
  }, [outputs]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  // Prepare metrics data for chart
  const chartData = metrics
    .slice()
    .reverse()
    .map((m: any) => ({
      time: new Date(m.timestamp).toLocaleTimeString(),
      bitrate: m.bitrate ? (m.bitrate / 1000).toFixed(0) : 0, // Convert to kbps
      fps: m.fps || 0,
      viewers: m.viewers || 0,
    }));

  // Format metrics display
  const latestMetrics = metrics[0];
  const uptime = latestMetrics?.uptime 
    ? `${Math.floor(latestMetrics.uptime / 3600)}h ${Math.floor((latestMetrics.uptime % 3600) / 60)}m`
    : '-';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            {stream?.name || streamName || 'Stream Details'}
          </DialogTitle>
          <DialogDescription>
            Live stream information, metrics, and playback
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center">Loading stream details...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-600">
            Error loading stream details. Please try again.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stream Health Status Badge */}
            {streamHealth && (
              <div className="flex items-center gap-2">
                {streamHealth.connected ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-md">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Stream Healthy</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-800 rounded-md">
                    <XCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Stream Disconnected</span>
                  </div>
                )}
                {streamHealth.state && (
                  <span className="text-xs text-muted-foreground">
                    State: {streamHealth.state}
                  </span>
                )}
              </div>
            )}

            {/* Video Player Section with OvenPlayer */}
            {playerSources.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    Stream Player
                    {viewerCount && (
                      <span className="ml-auto flex items-center gap-1 text-sm font-normal text-muted-foreground">
                        <Users className="w-4 h-4" />
                        {viewerCount.total} viewers
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <OvenPlayer
                    sources={playerSources}
                    renditions={outputs?.profiles || []}
                    enableQualitySelection={!!outputs?.profiles && outputs.profiles.length > 0}
                    onError={(err) => {
                      setPlayerError(err.message || 'Player error occurred');
                      toast.error('Failed to load stream in player');
                    }}
                    onReady={() => {
                      setPlayerError('');
                    }}
                    onQualityChange={(quality) => {
                      setSelectedQuality(quality);
                    }}
                  />

                  {/* Quality Selection */}
                  {outputs?.profiles && outputs.profiles.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Quality Selection:</label>
                      <div className="flex gap-2">
                        <select
                          value={selectedQuality}
                          onChange={(e) => {
                            setSelectedQuality(e.target.value);
                            // Update player sources when quality changes
                            if (e.target.value === 'auto') {
                              setSelectedOutputUrl(outputs.llhls || outputs.hls || '');
                            } else {
                              const profile = outputs.profiles.find((p: any) => p.name === e.target.value);
                              if (profile) {
                                setSelectedOutputUrl(profile.llhls || profile.hls || '');
                              }
                            }
                          }}
                          className="flex-1 px-3 py-2 border rounded-md text-sm"
                        >
                          <option value="auto">Auto (Adaptive)</option>
                          {outputs.profiles.map((profile: any) => (
                            <option key={profile.name} value={profile.name}>
                              {profile.name}
                            </option>
                          ))}
                        </select>
                        <span className="text-xs text-muted-foreground flex items-center px-2">
                          <Settings className="w-4 h-4 mr-1" />
                          ABR Enabled
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Output URL Selector */}
                  {outputs && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Playback URL:</label>
                      <div className="flex gap-2">
                        <select
                          value={selectedOutputUrl}
                          onChange={(e) => {
                            setSelectedOutputUrl(e.target.value);
                            setPlayerError('');
                          }}
                          className="flex-1 px-3 py-2 border rounded-md text-sm"
                        >
                          {outputs.llhls && (
                            <option value={outputs.llhls}>LLHLS (Low Latency HLS)</option>
                          )}
                          {outputs.hls && (
                            <option value={outputs.hls}>HLS (Standard)</option>
                          )}
                          {outputs.dash && (
                            <option value={outputs.dash}>DASH (MPD)</option>
                          )}
                          {outputs.webrtc && (
                            <option value={outputs.webrtc}>WebRTC (WebSocket)</option>
                          )}
                        </select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(selectedOutputUrl, 'Playback URL')}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(selectedOutputUrl, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Stream Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Stream Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stream Name:</span>
                    <span className="font-mono">{stream?.name || streamName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Source Type:</span>
                    <span>{stream?.input?.sourceType || stream?.sourceType || 'Unknown'}</span>
                  </div>
                  {stream?.input?.createdTime && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{new Date(stream.input.createdTime).toLocaleString()}</span>
                    </div>
                  )}
                  {streamChannel && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Channel:</span>
                        <span>{streamChannel.name}</span>
                      </div>
                      {streamChannel.appName && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Application:</span>
                          <span>{streamChannel.appName}</span>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Live Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Live Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {latestMetrics ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bitrate:</span>
                        <span>
                          {latestMetrics.bitrate
                            ? `${(latestMetrics.bitrate / 1000).toFixed(0)} kbps`
                            : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Frame Rate:</span>
                        <span>{latestMetrics.fps ? `${latestMetrics.fps.toFixed(1)} fps` : '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Resolution:</span>
                        <span>{latestMetrics.resolution || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Viewers:</span>
                        <span>{latestMetrics.viewers || viewerCount?.total || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Uptime:</span>
                        <span>{uptime}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">No metrics available yet</p>
                  )}

                  {/* Stream Tracks Information */}
                  {streamTracks && (
                    <div className="mt-4 pt-4 border-t space-y-2">
                      <p className="text-xs font-semibold mb-2">Stream Tracks:</p>
                      {streamTracks.video && streamTracks.video.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Video:</p>
                          {streamTracks.video.map((track: any, idx: number) => (
                            <div key={idx} className="text-xs pl-2">
                              {track.codec} - {track.bitrate ? `${(track.bitrate / 1000).toFixed(0)}kbps` : ''} - {track.resolution || ''} - {track.framerate ? `${track.framerate}fps` : ''}
                            </div>
                          ))}
                        </div>
                      )}
                      {streamTracks.audio && streamTracks.audio.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Audio:</p>
                          {streamTracks.audio.map((track: any, idx: number) => (
                            <div key={idx} className="text-xs pl-2">
                              {track.codec} - {track.bitrate ? `${(track.bitrate / 1000).toFixed(0)}kbps` : ''} - {track.samplerate || ''}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Network Quality Metrics */}
                  {streamHealth?.quality && (
                    <div className="mt-4 pt-4 border-t space-y-2">
                      <p className="text-xs font-semibold mb-2">Network Quality:</p>
                      {streamHealth.quality.packetLoss !== null && (
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Packet Loss:</span>
                          <span className={`text-xs ${streamHealth.quality.packetLoss > 5 ? 'text-red-600' : streamHealth.quality.packetLoss > 1 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {streamHealth.quality.packetLoss.toFixed(2)}%
                          </span>
                        </div>
                      )}
                      {streamHealth.quality.latency !== null && (
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Latency (RTT):</span>
                          <span className="text-xs">{streamHealth.quality.latency}ms</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Viewer Count Per Protocol */}
                  {viewerCount && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs font-semibold mb-2">Viewers by Protocol:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">WebRTC:</span>
                          <span>{viewerCount.webrtc || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">LLHLS:</span>
                          <span>{viewerCount.llhls || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">HLS:</span>
                          <span>{viewerCount.hls || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">DASH:</span>
                          <span>{viewerCount.dash || 0}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Metrics Chart */}
            {chartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Metrics Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="bitrate"
                        stroke="#8884d8"
                        name="Bitrate (kbps)"
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="fps"
                        stroke="#82ca9d"
                        name="FPS"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="viewers"
                        stroke="#ffc658"
                        name="Viewers"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Recording & Push Publishing Status */}
            {(recordingStatus || pushPublishingStatus) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recordingStatus && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        Recording Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        {recordingStatus.state === 'recording' ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <Radio className="w-4 h-4 animate-pulse" />
                            <span className="font-medium">Recording Active</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not Recording</span>
                        )}
                      </div>
                      {recordingStatus.filePath && (
                        <div>
                          <span className="text-muted-foreground">File:</span>
                          <code className="ml-2 text-xs bg-muted px-1 py-0.5 rounded">
                            {recordingStatus.filePath}
                          </code>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {pushPublishingStatus && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Radio className="w-4 h-4" />
                        Push Publishing
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {pushPublishingStatus.items && pushPublishingStatus.items.length > 0 ? (
                        <div className="space-y-2">
                          {pushPublishingStatus.items.map((push: any, idx: number) => (
                            <div key={idx} className="p-2 bg-muted rounded">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-xs">{push.protocol?.toUpperCase() || 'Unknown'}</p>
                                  <code className="text-xs text-muted-foreground">{push.url || '-'}</code>
                                </div>
                                <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                                  Active
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-xs">No active push publishing</p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* DVR Status */}
            {dvrStatus && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Rewind className="w-4 h-4" />
                    DVR (Digital Video Recorder) Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    {dvrStatus.enabled ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-medium">DVR Enabled</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <XCircle className="w-4 h-4" />
                        <span>DVR Not Enabled</span>
                      </div>
                    )}
                  </div>
                  {dvrStatus.enabled && dvrStatus.window && (
                    <div>
                      <span className="text-muted-foreground">Rewind Window:</span>
                      <span className="ml-2 font-medium">{Math.floor((dvrStatus.window || 0) / 60)} minutes</span>
                    </div>
                  )}
                  {dvrStatus.enabled && (
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                        dvrStatus.available
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {dvrStatus.available ? 'Available' : 'Not Available'}
                      </span>
                    </div>
                  )}
                  {!dvrStatus.enabled && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Enable DVR in OME application configuration to allow live rewind and time-shifted playback.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Security Features */}
            {streamChannel && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Security & Access Control
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Generate signed policies for time-limited stream access
                    </p>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Generate Signed Policy:</label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Expires in seconds (default: 3600)"
                          className="max-w-xs"
                          id="policy-expires"
                          defaultValue={3600}
                        />
                        <Button
                          size="sm"
                          onClick={async () => {
                            try {
                              const expiresInput = document.getElementById('policy-expires') as HTMLInputElement;
                              const expiresIn = parseInt(expiresInput.value) || 3600;
                              await streamsApi.createSignedPolicy(streamName!, expiresIn);
                              toast.success('Signed policy created successfully');
                            } catch (error: any) {
                              toast.error(error.response?.data?.error?.message || 'Failed to create signed policy');
                            }
                          }}
                        >
                          Create Policy
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Creates a time-limited access token for this stream
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* SCTE-35 Markers Timeline */}
            {streamChannel && scte35Markers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    SCTE-35 Markers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground mb-4">
                      Available markers for this stream. Click to insert into stream.
                    </p>
                    <div className="space-y-2">
                      {scte35Markers.map((marker: any) => (
                        <div
                          key={marker.id}
                          className="p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{marker.name}</span>
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                                  {marker.type}
                                </span>
                                {marker.cueOut && (
                                  <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-xs">
                                    Cue Out
                                  </span>
                                )}
                                {marker.cueIn && (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">
                                    Cue In
                                  </span>
                                )}
                              </div>
                              {marker.duration && (
                                <p className="text-xs text-muted-foreground">
                                  Duration: {marker.duration}s
                                </p>
                              )}
                            </div>
                            {streamChannel && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    await streamsApi.insertScte35(streamChannel.id, marker.id);
                                    toast.success('SCTE-35 marker inserted into stream');
                                  } catch (error: any) {
                                    toast.error(error.response?.data?.error?.message || 'Failed to insert marker');
                                  }
                                }}
                              >
                                Insert
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Output URLs */}
            {outputs && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    Output URLs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    {outputs.llhls && (
                      <OutputUrlRow
                        label="LLHLS (Low Latency HLS)"
                        url={outputs.llhls}
                        onCopy={copyToClipboard}
                      />
                    )}
                    {outputs.hls && (
                      <OutputUrlRow
                        label="HLS (Standard)"
                        url={outputs.hls}
                        onCopy={copyToClipboard}
                      />
                    )}
                    {outputs.dash && (
                      <OutputUrlRow
                        label="DASH (MPD)"
                        url={outputs.dash}
                        onCopy={copyToClipboard}
                      />
                    )}
                    {outputs.webrtc && (
                      <OutputUrlRow
                        label="WebRTC"
                        url={outputs.webrtc}
                        onCopy={copyToClipboard}
                      />
                    )}
                    {outputs.srt && (
                      <OutputUrlRow
                        label="SRT"
                        url={outputs.srt}
                        onCopy={copyToClipboard}
                      />
                    )}
                    {outputs.thumbnail && (
                      <div className="space-y-2">
                        <OutputUrlRow
                          label="Thumbnail"
                          url={outputs.thumbnail}
                          onCopy={copyToClipboard}
                          isImage
                        />
                      </div>
                    )}
                  </div>

                  {/* Output Profiles */}
                  {outputs.profiles && outputs.profiles.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="text-sm font-semibold mb-4">Output Profiles</h4>
                      <div className="space-y-4">
                        {outputs.profiles.map((profile: any) => (
                          <div key={profile.name} className="pl-4 border-l-2">
                            <p className="text-sm font-medium mb-2">{profile.name}</p>
                            <div className="space-y-2">
                              {profile.llhls && (
                                <OutputUrlRow
                                  label="LLHLS"
                                  url={profile.llhls}
                                  onCopy={copyToClipboard}
                                  small
                                />
                              )}
                              {profile.hls && (
                                <OutputUrlRow
                                  label="HLS"
                                  url={profile.hls}
                                  onCopy={copyToClipboard}
                                  small
                                />
                              )}
                              {profile.dash && (
                                <OutputUrlRow
                                  label="DASH"
                                  url={profile.dash}
                                  onCopy={copyToClipboard}
                                  small
                                />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function OutputUrlRow({
  label,
  url,
  onCopy,
  isImage = false,
  small = false,
}: {
  label: string;
  url: string;
  onCopy: (text: string, label: string) => void;
  isImage?: boolean;
  small?: boolean;
}) {
  const textSize = small ? 'text-xs' : 'text-sm';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className={`${textSize} font-medium`}>{label}:</span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => onCopy(url, label)}
            title="Copy URL"
          >
            <Copy className="w-3 h-3" />
          </Button>
          {!isImage && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => window.open(url, '_blank')}
              title="Open in new tab"
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
      <Input
        value={url}
        readOnly
        className={`font-mono ${textSize} bg-muted`}
        onClick={(e) => {
          (e.target as HTMLInputElement).select();
        }}
      />
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

