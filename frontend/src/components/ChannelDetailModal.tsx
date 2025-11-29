import { useState } from 'react';
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
import { Copy, ExternalLink, Radio, Settings, Link2 } from 'lucide-react';
import { channelsApi } from '../lib/api';
import toast from 'react-hot-toast';

interface ChannelDetailModalProps {
  channelId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChannelDetailModal({
  channelId,
  open,
  onOpenChange,
}: ChannelDetailModalProps) {
  const [selectedUrl, setSelectedUrl] = useState<string>('');

  // Fetch channel details
  const { data: channelData, isLoading: isLoadingChannel } = useQuery({
    queryKey: ['channel', channelId],
    queryFn: async () => {
      if (!channelId) return null;
      const response = await channelsApi.getById(channelId);
      return response.data;
    },
    enabled: open && !!channelId,
  });

  // Fetch input URLs
  const { data: inputData, isLoading: isLoadingInputs } = useQuery({
    queryKey: ['channel-inputs', channelId],
    queryFn: async () => {
      if (!channelId) return null;
      const response = await channelsApi.getInputs(channelId);
      return response.data;
    },
    enabled: open && !!channelId,
  });

  // Fetch output URLs
  const { data: outputData, isLoading: isLoadingOutputs } = useQuery({
    queryKey: ['channel-outputs', channelId],
    queryFn: async () => {
      if (!channelId) return null;
      const response = await channelsApi.getOutputs(channelId);
      return response.data;
    },
    enabled: open && !!channelId,
  });

  const channel = channelData?.channel;
  const inputs = inputData?.inputs;
  const outputs = outputData?.outputs;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Radio className="w-5 h-5" />
            {channel?.name || 'Channel Details'}
          </DialogTitle>
          <DialogDescription>
            Channel configuration, input URLs for streaming, and output URLs for playback
          </DialogDescription>
        </DialogHeader>

        {isLoadingChannel ? (
          <div className="py-8 text-center">Loading channel details...</div>
        ) : !channel ? (
          <div className="py-8 text-center text-red-600">Channel not found</div>
        ) : (
          <div className="space-y-6">
            {/* Channel Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Channel Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{channel.name}</span>
                </div>
                {channel.description && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Description:</span>
                    <span>{channel.description}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stream Key:</span>
                  <code className="px-2 py-0.5 bg-muted rounded text-xs">
                    {channel.streamKey}
                  </code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Application Name:</span>
                  <span className="font-mono text-xs">{channel.appName || 'app'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      channel.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {channel.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Input URLs (Ingest URLs) */}
            {isLoadingInputs ? (
              <Card>
                <CardContent className="py-8 text-center">Loading input URLs...</CardContent>
              </Card>
            ) : inputs ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Input URLs (For Streaming In)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use these URLs to stream content into OME using different protocols
                  </p>
                  
                  <div className="space-y-4">
                    {/* RTMP */}
                    {inputs.rtmp && (
                      <InputUrlRow
                        label="RTMP (Recommended)"
                        url={inputs.rtmp}
                        description="Use with OBS, FFmpeg, or any RTMP encoder"
                        onCopy={copyToClipboard}
                        protocol="RTMP"
                      />
                    )}

                    {/* WHIP */}
                    {inputs.whip && (
                      <InputUrlRow
                        label="WHIP (WebRTC HTTP Ingestion)"
                        url={inputs.whip}
                        description="Use for WebRTC-based streaming with HTTP"
                        onCopy={copyToClipboard}
                        protocol="WHIP"
                      />
                    )}

                    {/* WebRTC */}
                    {inputs.webrtc && (
                      <InputUrlRow
                        label="WebRTC"
                        url={inputs.webrtc}
                        description="WebRTC signaling URL for low-latency streaming"
                        onCopy={copyToClipboard}
                        protocol="WebRTC"
                      />
                    )}

                    {/* SRT */}
                    {inputs.srt && (
                      <InputUrlRow
                        label="SRT (Secure Reliable Transport)"
                        url={inputs.srt}
                        description="Low-latency streaming over unreliable networks"
                        onCopy={copyToClipboard}
                        protocol="SRT"
                      />
                    )}

                    {/* RTSP Pull */}
                    {inputs.rtsp && (
                      <InputUrlRow
                        label="RTSP Pull"
                        url={inputs.rtsp}
                        description="For RTSP sources (configure in OME as pull source)"
                        onCopy={copyToClipboard}
                        protocol="RTSP"
                      />
                    )}
                  </div>

                  {/* Quick Copy All */}
                  <div className="mt-6 pt-6 border-t">
                    <p className="text-sm font-medium mb-2">Quick Reference:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      {inputs.rtmp && (
                        <div>
                          <span className="font-medium">RTMP:</span>{' '}
                          <code className="bg-muted px-1 py-0.5 rounded">{inputs.rtmp}</code>
                        </div>
                      )}
                      {inputs.whip && (
                        <div>
                          <span className="font-medium">WHIP:</span>{' '}
                          <code className="bg-muted px-1 py-0.5 rounded">{inputs.whip}</code>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Output URLs (Playback URLs) */}
            {isLoadingOutputs ? (
              <Card>
                <CardContent className="py-8 text-center">Loading output URLs...</CardContent>
              </Card>
            ) : outputs ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    Output URLs (For Playback)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use these URLs to play back the stream in players or embed in websites
                  </p>
                  
                  <div className="space-y-4">
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
                    {outputs.webrtc && (
                      <OutputUrlRow
                        label="WebRTC (Low Latency)"
                        url={outputs.webrtc}
                        onCopy={copyToClipboard}
                      />
                    )}
                    {outputs.dash && (
                      <OutputUrlRow
                        label="DASH"
                        url={outputs.dash}
                        onCopy={copyToClipboard}
                      />
                    )}
                  </div>

                  {/* Output Profiles */}
                  {outputs.profiles && outputs.profiles.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <p className="text-sm font-semibold mb-4">Output Profiles (ABR):</p>
                      <div className="space-y-3">
                        {outputs.profiles.map((profile: any) => (
                          <div key={profile.name} className="border rounded-lg p-3">
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
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InputUrlRow({
  label,
  url,
  description,
  onCopy,
  protocol,
}: {
  label: string;
  url: string;
  description?: string;
  protocol: string;
  onCopy: (text: string, label: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{label}</span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
              {protocol}
            </span>
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => onCopy(url, label)}
            title="Copy URL"
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <Input
        value={url}
        readOnly
        className="font-mono text-xs bg-muted"
        onClick={(e) => {
          (e.target as HTMLInputElement).select();
        }}
      />
    </div>
  );
}

function OutputUrlRow({
  label,
  url,
  onCopy,
  small = false,
}: {
  label: string;
  url: string;
  onCopy: (text: string, label: string) => void;
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
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => window.open(url, '_blank')}
            title="Open in new tab"
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
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
    </div>
  );
}

