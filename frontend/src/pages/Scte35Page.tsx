import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scte35Api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { formatDate } from '../lib/utils';

export function Scte35Page() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['scte35'],
    queryFn: async () => {
      const response = await scte35Api.getAll();
      return response.data;
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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const canModify = user?.role === 'ADMIN' || user?.role === 'OPERATOR';

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">SCTE-35 Markers</h1>
        {canModify && (
          <Button>Create Marker</Button>
        )}
      </div>
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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.markers?.map((marker: any) => (
                <TableRow key={marker.id}>
                  <TableCell className="font-medium">{marker.name}</TableCell>
                  <TableCell>{marker.type}</TableCell>
                  <TableCell>{marker.cueOut ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{marker.cueIn ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{marker.duration ? `${marker.duration}s` : '-'}</TableCell>
                  <TableCell>{formatDate(marker.createdAt)}</TableCell>
                  <TableCell>
                    {canModify && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteMutation.mutate(marker.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


