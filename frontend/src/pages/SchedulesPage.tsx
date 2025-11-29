import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schedulesApi, channelsApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { formatDate } from '../lib/utils';

export function SchedulesPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [scheduleName, setScheduleName] = useState('');
  const [scheduleDescription, setScheduleDescription] = useState('');
  const [channelId, setChannelId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
      const response = await schedulesApi.getAll();
      return response.data;
    },
  });

  const { data: channelsData } = useQuery({
    queryKey: ['channels'],
    queryFn: async () => {
      const response = await channelsApi.getAll();
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => schedulesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Schedule created successfully');
      setShowCreateForm(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create schedule');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => schedulesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Schedule updated successfully');
      setEditingScheduleId(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update schedule');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => schedulesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Schedule deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to delete schedule');
    },
  });

  const resetForm = () => {
    setScheduleName('');
    setScheduleDescription('');
    setChannelId('');
    setStartTime('');
    setEndTime('');
    setIsRecurring(false);
    setRecurrenceRule('');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleName.trim() || !channelId || !startTime || !endTime) {
      toast.error('Name, channel, start time, and end time are required');
      return;
    }
    createMutation.mutate({
      name: scheduleName.trim(),
      description: scheduleDescription.trim() || undefined,
      channelId,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      isRecurring,
      recurrenceRule: isRecurring ? recurrenceRule : undefined,
    });
  };

  const handleEdit = (schedule: any) => {
    setEditingScheduleId(schedule.id);
    setScheduleName(schedule.name);
    setScheduleDescription(schedule.description || '');
    setChannelId(schedule.channelId);
    setStartTime(new Date(schedule.startTime).toISOString().slice(0, 16));
    setEndTime(new Date(schedule.endTime).toISOString().slice(0, 16));
    setIsRecurring(schedule.isRecurring || false);
    setRecurrenceRule(schedule.recurrenceRule || '');
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScheduleId || !scheduleName.trim()) {
      toast.error('Schedule name is required');
      return;
    }
    updateMutation.mutate({
      id: editingScheduleId,
      data: {
        name: scheduleName.trim(),
        description: scheduleDescription.trim() || undefined,
        channelId,
        startTime: startTime ? new Date(startTime).toISOString() : undefined,
        endTime: endTime ? new Date(endTime).toISOString() : undefined,
        isRecurring,
        recurrenceRule: isRecurring ? recurrenceRule : undefined,
      },
    });
  };

  const handleCancelEdit = () => {
    setEditingScheduleId(null);
    resetForm();
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const canModify = user?.role === 'ADMIN' || user?.role === 'OPERATOR';
  const channels = channelsData?.channels || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Schedules</h1>
        {canModify && (
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? 'Cancel' : 'Create Schedule'}
          </Button>
        )}
      </div>

      {showCreateForm && canModify && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label htmlFor="scheduleName" className="block text-sm font-medium mb-2">
                  Schedule Name *
                </label>
                <Input
                  id="scheduleName"
                  type="text"
                  value={scheduleName}
                  onChange={(e) => setScheduleName(e.target.value)}
                  placeholder="Enter schedule name"
                  required
                />
              </div>
              <div>
                <label htmlFor="scheduleDescription" className="block text-sm font-medium mb-2">
                  Description
                </label>
                <Input
                  id="scheduleDescription"
                  type="text"
                  value={scheduleDescription}
                  onChange={(e) => setScheduleDescription(e.target.value)}
                  placeholder="Enter schedule description (optional)"
                />
              </div>
              <div>
                <label htmlFor="channelId" className="block text-sm font-medium mb-2">
                  Channel *
                </label>
                <select
                  id="channelId"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">Select a channel</option>
                  {channels.map((channel: any) => (
                    <option key={channel.id} value={channel.id}>
                      {channel.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium mb-2">
                    Start Time *
                  </label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium mb-2">
                    End Time *
                  </label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="isRecurring" className="text-sm font-medium">
                  Recurring Schedule
                </label>
              </div>
              {isRecurring && (
                <div>
                  <label htmlFor="recurrenceRule" className="block text-sm font-medium mb-2">
                    Recurrence Rule (Cron format)
                  </label>
                  <Input
                    id="recurrenceRule"
                    type="text"
                    value={recurrenceRule}
                    onChange={(e) => setRecurrenceRule(e.target.value)}
                    placeholder="0 0 * * * (daily at midnight)"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Schedule'}
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

      <Card>
        <CardHeader>
          <CardTitle>All Schedules</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Recurring</TableHead>
                <TableHead>Status</TableHead>
                {canModify && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.schedules?.map((schedule: any) => (
                <TableRow key={schedule.id}>
                  {editingScheduleId === schedule.id ? (
                    <>
                      <TableCell colSpan={6}>
                        <form onSubmit={handleUpdate} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Name *</label>
                              <Input
                                value={scheduleName}
                                onChange={(e) => setScheduleName(e.target.value)}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Channel *</label>
                              <select
                                value={channelId}
                                onChange={(e) => setChannelId(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md"
                                required
                              >
                                {channels.map((channel: any) => (
                                  <option key={channel.id} value={channel.id}>
                                    {channel.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Start Time *</label>
                              <Input
                                type="datetime-local"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">End Time *</label>
                              <Input
                                type="datetime-local"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                required
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isRecurring}
                              onChange={(e) => setIsRecurring(e.target.checked)}
                              className="w-4 h-4"
                            />
                            <label className="text-sm">Recurring</label>
                          </div>
                          {isRecurring && (
                            <div>
                              <label className="block text-sm font-medium mb-1">Recurrence Rule</label>
                              <Input
                                value={recurrenceRule}
                                onChange={(e) => setRecurrenceRule(e.target.value)}
                                placeholder="Cron format"
                              />
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button type="submit" size="sm" disabled={updateMutation.isPending}>
                              {updateMutation.isPending ? 'Saving...' : 'Save'}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleCancelEdit}
                              disabled={updateMutation.isPending}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </TableCell>
                      {canModify && <TableCell></TableCell>}
                    </>
                  ) : (
                    <>
                      <TableCell className="font-medium">{schedule.name}</TableCell>
                      <TableCell>{schedule.channel?.name || '-'}</TableCell>
                      <TableCell>{formatDate(schedule.startTime)}</TableCell>
                      <TableCell>{formatDate(schedule.endTime)}</TableCell>
                      <TableCell>{schedule.isRecurring ? 'Yes' : 'No'}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            schedule.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {schedule.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      {canModify && (
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(schedule)}
                              disabled={editingScheduleId !== null}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteMutation.mutate(schedule.id)}
                              disabled={editingScheduleId !== null}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

