import { useQuery } from '@tanstack/react-query';
import { streamsApi } from '../../lib/api';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Users, Activity, TrendingUp, Wifi, CheckCircle, XCircle, Eye, Settings } from 'lucide-react';
import { ChannelDetailModal } from './ChannelDetailModal';
import { StreamDetailModal } from './StreamDetailModal';
import { useState } from 'react';

interface ChannelMetricsCardProps {
  channel: any;
  stream: any;
  canModify: boolean;
  onEdit?: (channel: any) => void;
  onDelete?: (channelId: string) => void;
}

export function ChannelMetricsCard({ channel, stream, canModify, onEdit, onDelete }: ChannelMetricsCardProps) {
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [showStreamModal, setShowStreamModal] = useState(false);

  // Fetch live metrics for this stream
  const { data: metricsData } = useQuery({
    queryKey: ['stream-metrics', channel.streamKey],
    queryFn: async () => {
      try {
        const [statsRes, healthRes, viewersRes] = await Promise.all([
          streamsApi.getStats(channel.streamKey).catch(() => null),
          streamsApi.getHealth(channel.streamKey).catch(() => null),
          streamsApi.getViewers(channel.streamKey).catch(() => null),
        ]);
        
        return {
          stats: statsRes?.data?.stats || null,
          health: healthRes?.data?.health || null,
          viewers: viewersRes?.data?.viewers || { total: 0, webrtc: 0, hls: 0, llhls: 0, dash: 0, srt: 0 },
        };
      } catch (err) {
        return { stats: null, health: null, viewers: { total: 0 } };
      }
    },
    enabled: !!stream && !!channel.streamKey,
    refetchInterval: 15000, // Refresh every 15 seconds to reduce load
  });

  const metrics = metricsData || { stats: null, health: null, viewers: { total: 0 } };
  const isHealthy = metrics.health?.connected || false;
  const viewerCount = metrics.viewers?.total || 0;
  const bitrate = metrics.stats?.bitrate ? (metrics.stats.bitrate / 1000).toFixed(0) : '-';
  const fps = metrics.stats?.fps || '-';

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold">{channel.name}</h3>
                {isHealthy ? (
                  <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    <CheckCircle className="w-3 h-3" />
                    Live
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                    <XCircle className="w-3 h-3" />
                    Offline
                  </span>
                )}
              </div>
              {channel.description && (
                <p className="text-sm text-muted-foreground mb-2">{channel.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="font-mono">{channel.appName}</span>
                <span>•</span>
                <span className="font-mono">{channel.streamKey}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChannelModal(true)}
                title="View channel URLs"
              >
                <Settings className="w-4 h-4" />
              </Button>
              {stream && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStreamModal(true)}
                  title="View stream details"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Live Metrics */}
          {stream && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Viewers</p>
                  <p className="text-lg font-semibold">{viewerCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Bitrate</p>
                  <p className="text-lg font-semibold">{bitrate} {bitrate !== '-' && 'kbps'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="text-xs text-muted-foreground">FPS</p>
                  <p className="text-lg font-semibold">{fps}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Wifi className={`w-4 h-4 ${isHealthy ? 'text-green-500' : 'text-red-500'}`} />
                <div>
                  <p className="text-xs text-muted-foreground">Health</p>
                  <p className={`text-lg font-semibold ${isHealthy ? 'text-green-600' : 'text-red-600'}`}>
                    {isHealthy ? 'Good' : 'Poor'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          {canModify && (
            <div className="flex gap-2 mt-4 pt-4 border-t">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={() => onEdit(channel)}>
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button variant="destructive" size="sm" onClick={() => onDelete(channel.id)}>
                  Delete
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <ChannelDetailModal
        channelId={showChannelModal ? channel.id : null}
        open={showChannelModal}
        onOpenChange={setShowChannelModal}
      />
      <StreamDetailModal
        streamName={showStreamModal ? channel.streamKey : null}
        channel={channel}
        open={showStreamModal}
        onOpenChange={setShowStreamModal}
      />
    </>
  );
}

