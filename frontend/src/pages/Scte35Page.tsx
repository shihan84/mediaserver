import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scte35Api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { formatDate } from '../lib/utils';

export function Scte35Page() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMarkerId, setEditingMarkerId] = useState<string | null>(null);
  const [markerName, setMarkerName] = useState('');
  const [markerType, setMarkerType] = useState<'SPLICE_INSERT' | 'TIME_SIGNAL' | 'SPLICE_NULL'>('SPLICE_INSERT');
  const [cueOut, setCueOut] = useState(false);
  const [cueIn, setCueIn] = useState(false);
  const [timeSignal, setTimeSignal] = useState(false);
  const [duration, setDuration] = useState<number | ''>('');
  const [spliceId, setSpliceId] = useState<number | ''>('');
  const [programId, setProgramId] = useState<number | ''>('');
  const [outOfNetwork, setOutOfNetwork] = useState(false);
  const [autoReturn, setAutoReturn] = useState(false);
  const [breakDuration, setBreakDuration] = useState<number | ''>('');
  const [availNum, setAvailNum] = useState<number | ''>('');
  const [availsExpected, setAvailsExpected] = useState<number | ''>('');

  const { data, isLoading } = useQuery({
    queryKey: ['scte35'],
    queryFn: async () => {
      const response = await scte35Api.getAll();
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => scte35Api.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scte35'] });
      toast.success('SCTE-35 marker created successfully');
      setShowCreateForm(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create marker');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => scte35Api.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scte35'] });
      toast.success('SCTE-35 marker updated successfully');
      setEditingMarkerId(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update marker');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => scte35Api.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scte35'] });
      toast.success('SCTE-35 marker deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to delete marker');
    },
  });

  const resetForm = () => {
    setMarkerName('');
    setMarkerType('SPLICE_INSERT');
    setCueOut(false);
    setCueIn(false);
    setTimeSignal(false);
    setDuration('');
    setSpliceId('');
    setProgramId('');
    setOutOfNetwork(false);
    setAutoReturn(false);
    setBreakDuration('');
    setAvailNum('');
    setAvailsExpected('');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!markerName.trim()) {
      toast.error('Marker name is required');
      return;
    }
    createMutation.mutate({
      name: markerName.trim(),
      type: markerType,
      cueOut,
      cueIn,
      timeSignal,
      duration: duration !== '' ? Number(duration) : undefined,
      spliceId: spliceId !== '' ? Number(spliceId) : undefined,
      programId: programId !== '' ? Number(programId) : undefined,
      outOfNetwork,
      autoReturn,
      breakDuration: breakDuration !== '' ? Number(breakDuration) : undefined,
      availNum: availNum !== '' ? Number(availNum) : undefined,
      availsExpected: availsExpected !== '' ? Number(availsExpected) : undefined,
    });
  };

  const handleEdit = (marker: any) => {
    setEditingMarkerId(marker.id);
    setMarkerName(marker.name);
    setMarkerType(marker.type);
    setCueOut(marker.cueOut || false);
    setCueIn(marker.cueIn || false);
    setTimeSignal(marker.timeSignal || false);
    setDuration(marker.duration || '');
    setSpliceId(marker.spliceId || '');
    setProgramId(marker.programId || '');
    setOutOfNetwork(marker.outOfNetwork || false);
    setAutoReturn(marker.autoReturn || false);
    setBreakDuration(marker.breakDuration || '');
    setAvailNum(marker.availNum || '');
    setAvailsExpected(marker.availsExpected || '');
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMarkerId || !markerName.trim()) {
      toast.error('Marker name is required');
      return;
    }
    updateMutation.mutate({
      id: editingMarkerId,
      data: {
        name: markerName.trim(),
        type: markerType,
        cueOut,
        cueIn,
        timeSignal,
        duration: duration !== '' ? Number(duration) : undefined,
        spliceId: spliceId !== '' ? Number(spliceId) : undefined,
        programId: programId !== '' ? Number(programId) : undefined,
        outOfNetwork,
        autoReturn,
        breakDuration: breakDuration !== '' ? Number(breakDuration) : undefined,
        availNum: availNum !== '' ? Number(availNum) : undefined,
        availsExpected: availsExpected !== '' ? Number(availsExpected) : undefined,
      },
    });
  };

  const handleCancelEdit = () => {
    setEditingMarkerId(null);
    resetForm();
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const canModify = user?.role === 'ADMIN' || user?.role === 'OPERATOR';

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">SCTE-35 Markers</h1>
        {canModify && (
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? 'Cancel' : 'Create Marker'}
          </Button>
        )}
      </div>

      {showCreateForm && canModify && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New SCTE-35 Marker</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label htmlFor="markerName" className="block text-sm font-medium mb-2">
                  Marker Name *
                </label>
                <Input
                  id="markerName"
                  type="text"
                  value={markerName}
                  onChange={(e) => setMarkerName(e.target.value)}
                  placeholder="Enter marker name"
                  required
                />
              </div>
              <div>
                <label htmlFor="markerType" className="block text-sm font-medium mb-2">
                  Type *
                </label>
                <select
                  id="markerType"
                  value={markerType}
                  onChange={(e) => setMarkerType(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="SPLICE_INSERT">SPLICE_INSERT</option>
                  <option value="TIME_SIGNAL">TIME_SIGNAL</option>
                  <option value="SPLICE_NULL">SPLICE_NULL</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="cueOut"
                    checked={cueOut}
                    onChange={(e) => setCueOut(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="cueOut" className="text-sm font-medium">
                    Cue Out
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="cueIn"
                    checked={cueIn}
                    onChange={(e) => setCueIn(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="cueIn" className="text-sm font-medium">
                    Cue In
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="timeSignal"
                    checked={timeSignal}
                    onChange={(e) => setTimeSignal(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="timeSignal" className="text-sm font-medium">
                    Time Signal
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="outOfNetwork"
                    checked={outOfNetwork}
                    onChange={(e) => setOutOfNetwork(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="outOfNetwork" className="text-sm font-medium">
                    Out of Network
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoReturn"
                    checked={autoReturn}
                    onChange={(e) => setAutoReturn(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="autoReturn" className="text-sm font-medium">
                    Auto Return
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="duration" className="block text-sm font-medium mb-2">
                    Duration (seconds)
                  </label>
                  <Input
                    id="duration"
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="Duration in seconds"
                  />
                </div>
                <div>
                  <label htmlFor="spliceId" className="block text-sm font-medium mb-2">
                    Splice ID
                  </label>
                  <Input
                    id="spliceId"
                    type="number"
                    value={spliceId}
                    onChange={(e) => setSpliceId(e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="Splice ID"
                  />
                </div>
                <div>
                  <label htmlFor="programId" className="block text-sm font-medium mb-2">
                    Program ID
                  </label>
                  <Input
                    id="programId"
                    type="number"
                    value={programId}
                    onChange={(e) => setProgramId(e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="Program ID"
                  />
                </div>
                <div>
                  <label htmlFor="breakDuration" className="block text-sm font-medium mb-2">
                    Break Duration (seconds)
                  </label>
                  <Input
                    id="breakDuration"
                    type="number"
                    value={breakDuration}
                    onChange={(e) => setBreakDuration(e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="Break duration"
                  />
                </div>
                <div>
                  <label htmlFor="availNum" className="block text-sm font-medium mb-2">
                    Avail Number
                  </label>
                  <Input
                    id="availNum"
                    type="number"
                    value={availNum}
                    onChange={(e) => setAvailNum(e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="Avail number"
                  />
                </div>
                <div>
                  <label htmlFor="availsExpected" className="block text-sm font-medium mb-2">
                    Avails Expected
                  </label>
                  <Input
                    id="availsExpected"
                    type="number"
                    value={availsExpected}
                    onChange={(e) => setAvailsExpected(e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="Avails expected"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Marker'}
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
          <CardTitle>All SCTE-35 Markers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Cue Out</TableHead>
                <TableHead>Cue In</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Created</TableHead>
                {canModify && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.markers?.map((marker: any) => (
                <TableRow key={marker.id}>
                  {editingMarkerId === marker.id ? (
                    <>
                      <TableCell colSpan={6}>
                        <form onSubmit={handleUpdate} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Name *</label>
                              <Input
                                value={markerName}
                                onChange={(e) => setMarkerName(e.target.value)}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Type *</label>
                              <select
                                value={markerType}
                                onChange={(e) => setMarkerType(e.target.value as any)}
                                className="w-full px-3 py-2 border rounded-md"
                                required
                              >
                                <option value="SPLICE_INSERT">SPLICE_INSERT</option>
                                <option value="TIME_SIGNAL">TIME_SIGNAL</option>
                                <option value="SPLICE_NULL">SPLICE_NULL</option>
                              </select>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={cueOut}
                                onChange={(e) => setCueOut(e.target.checked)}
                                className="w-4 h-4"
                              />
                              <label className="text-sm">Cue Out</label>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={cueIn}
                                onChange={(e) => setCueIn(e.target.checked)}
                                className="w-4 h-4"
                              />
                              <label className="text-sm">Cue In</label>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Duration</label>
                              <Input
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value ? parseInt(e.target.value) : '')}
                              />
                            </div>
                          </div>
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
                      <TableCell className="font-medium">{marker.name}</TableCell>
                      <TableCell>{marker.type}</TableCell>
                      <TableCell>{marker.cueOut ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{marker.cueIn ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{marker.duration ? `${marker.duration}s` : '-'}</TableCell>
                      <TableCell>{formatDate(marker.createdAt)}</TableCell>
                      {canModify && (
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(marker)}
                              disabled={editingMarkerId !== null}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteMutation.mutate(marker.id)}
                              disabled={editingMarkerId !== null}
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


