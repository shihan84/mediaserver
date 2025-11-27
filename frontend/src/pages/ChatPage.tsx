import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { formatDate } from '../lib/utils';
import toast from 'react-hot-toast';

export function ChatPage() {
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['chat'],
    queryFn: async () => {
      const response = await chatApi.getAll();
      return response.data;
    },
  });

  const sendMutation = useMutation({
    mutationFn: (msg: string) => chatApi.create({ message: msg }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat'] });
      setMessage('');
      toast.success('Message sent');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to send message');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMutation.mutate(message);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">AI Agent Chat</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Chat History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {data?.messages?.map((msg: any) => (
                <div key={msg.id} className="border-b pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{msg.user?.username}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2">{msg.message}</p>
                  {msg.response && (
                    <div className="mt-2 p-3 bg-muted rounded">
                      <p className="text-sm">{msg.response}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button type="submit" disabled={sendMutation.isPending}>
                {sendMutation.isPending ? 'Sending...' : 'Send'}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Context</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Chat with the AI agent to get help with OvenMediaEngine operations.
              The agent has access to your system context and can assist with
              configuration, troubleshooting, and automation.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


