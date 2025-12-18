import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { omeApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { Shield, Plus, Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';

export function AccessControlPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedVhost] = useState<string>('default');
  const [activeTab, setActiveTab] = useState<'webhooks' | 'policies'>('webhooks');
  const [showCreateWebhook, setShowCreateWebhook] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<string | null>(null);

  // Admission Webhooks
  const { data: webhooksData, isLoading: webhooksLoading } = useQuery({
    queryKey: ['admission-webhooks', selectedVhost],
    queryFn: async () => {
      const response = await omeApi.getAdmissionWebhooks(selectedVhost);
      return response.data;
    },
  });

  const canModify = user?.role === 'ADMIN' || user?.role === 'OPERATOR';

  const createWebhookMutation = useMutation({
    mutationFn: (data: any) => omeApi.createAdmissionWebhook(selectedVhost, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admission-webhooks'] });
      toast.success('Admission webhook created successfully');
      setShowCreateWebhook(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create webhook');
    },
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: (webhookId: string) => omeApi.deleteAdmissionWebhook(selectedVhost, webhookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admission-webhooks'] });
      toast.success('Webhook deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to delete webhook');
    },
  });

  const webhooks = webhooksData?.admissionWebhooks || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Access Control</h1>
        <p className="text-muted-foreground mt-1">Manage admission webhooks and signed policies for stream access control</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b pb-2">
        <button
          onClick={() => setActiveTab('webhooks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'webhooks'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          <Shield className="w-4 h-4" />
          Admission Webhooks
        </button>
        <button
          onClick={() => setActiveTab('policies')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'policies'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          <Shield className="w-4 h-4" />
          Signed Policies
        </button>
      </div>

      {/* Admission Webhooks Tab */}
      {activeTab === 'webhooks' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Admission Webhooks</h2>
            {canModify && (
              <Button onClick={() => setShowCreateWebhook(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Webhook
              </Button>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              {webhooksLoading ? (
                <div className="text-center py-8">Loading webhooks...</div>
              ) : webhooks.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Enabled</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webhooks.map((webhook: any) => (
                      <TableRow key={webhook.id || webhook.name}>
                        <TableCell className="font-medium">{webhook.name || webhook.id}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">{webhook.url}</code>
                        </TableCell>
                        <TableCell>
                          {webhook.enabled !== false ? (
                            <span className="text-green-600">Enabled</span>
                          ) : (
                            <span className="text-muted-foreground">Disabled</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {canModify && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingWebhook(webhook.id || webhook.name);
                                  setShowCreateWebhook(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this webhook?')) {
                                    deleteWebhookMutation.mutate(webhook.id || webhook.name);
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No admission webhooks configured. Create one to add custom access control.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Signed Policies Tab */}
      {activeTab === 'policies' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Signed Policies</h2>
          </div>
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Signed policies are created per-stream in the Stream Details modal.</p>
              <p className="text-sm mt-2">Go to Streams page and click "View Details" on any stream to create signed policies.</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create/Edit Webhook Dialog */}
      <Dialog open={showCreateWebhook} onOpenChange={setShowCreateWebhook}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingWebhook ? 'Edit' : 'Create'} Admission Webhook</DialogTitle>
            <DialogDescription>
              Configure a webhook endpoint for custom stream access control
            </DialogDescription>
          </DialogHeader>
          <WebhookForm
            webhook={editingWebhook ? webhooks.find((w: any) => (w.id || w.name) === editingWebhook) : null}
            onSubmit={(data) => {
              createWebhookMutation.mutate(data, {
                onSuccess: () => {
                  setEditingWebhook(null);
                }
              });
            }}
            onCancel={() => {
              setShowCreateWebhook(false);
              setEditingWebhook(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WebhookForm({ webhook, onSubmit, onCancel }: {
  webhook: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: webhook?.name || '',
    url: webhook?.url || '',
    enabled: webhook?.enabled !== false,
    timeout: webhook?.timeout || 3000,
    secretKey: webhook?.secretKey || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.url.trim()) {
      toast.error('Webhook URL is required');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Name</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Webhook name (optional)"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Webhook URL *</label>
        <Input
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          placeholder="https://your-server.com/webhook"
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          OME will POST stream access requests to this URL
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Timeout (ms)</label>
        <Input
          type="number"
          value={formData.timeout}
          onChange={(e) => setFormData({ ...formData, timeout: parseInt(e.target.value) || 3000 })}
          min={1000}
          max={30000}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Secret Key (optional)</label>
        <Input
          type="password"
          value={formData.secretKey}
          onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
          placeholder="Shared secret for webhook authentication"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="enabled"
          checked={formData.enabled}
          onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
          className="rounded"
        />
        <label htmlFor="enabled" className="text-sm">Enabled</label>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {webhook ? 'Update' : 'Create'} Webhook
        </Button>
      </div>
    </form>
  );
}

