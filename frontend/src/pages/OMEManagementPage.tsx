import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { omeApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
export function OMEManagementPage() {
  const [activeTab, setActiveTab] = useState<'stats' | 'vhosts' | 'apps' | 'profiles'>('stats');
  const [selectedVhost, setSelectedVhost] = useState<string>('default');
  const [selectedApp, setSelectedApp] = useState<string>('app');

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['ome-stats'],
    queryFn: async () => {
      const response = await omeApi.getStats();
      return response.data;
    },
  });

  const { data: vhostsData, isLoading: vhostsLoading } = useQuery({
    queryKey: ['ome-vhosts'],
    queryFn: async () => {
      const response = await omeApi.getVirtualHosts();
      return response.data;
    },
  });

  const { data: appsData, isLoading: appsLoading } = useQuery({
    queryKey: ['ome-apps', selectedVhost],
    queryFn: async () => {
      const response = await omeApi.getApplications(selectedVhost);
      return response.data;
    },
    enabled: !!selectedVhost,
  });

  const { data: outputProfilesData, isLoading: profilesLoading } = useQuery({
    queryKey: ['ome-output-profiles', selectedVhost, selectedApp],
    queryFn: async () => {
      const response = await omeApi.getOutputProfiles(selectedVhost, selectedApp);
      return response.data;
    },
    enabled: !!selectedVhost && !!selectedApp,
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">OME Management</h1>

      <div className="mb-6">
        <div className="flex gap-2 border-b">
          <Button
            variant={activeTab === 'stats' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('stats')}
          >
            Server Stats
          </Button>
          <Button
            variant={activeTab === 'vhosts' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('vhosts')}
          >
            Virtual Hosts
          </Button>
          <Button
            variant={activeTab === 'apps' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('apps')}
          >
            Applications
          </Button>
          <Button
            variant={activeTab === 'profiles' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('profiles')}
          >
            Output Profiles
          </Button>
        </div>
      </div>

      {activeTab === 'stats' && (
          <Card>
            <CardHeader>
              <CardTitle>Server Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div>Loading...</div>
              ) : (
                <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
                  {JSON.stringify(statsData?.stats || {}, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
      )}

      {activeTab === 'vhosts' && (
          <Card>
            <CardHeader>
              <CardTitle>Virtual Hosts</CardTitle>
            </CardHeader>
            <CardContent>
              {vhostsLoading ? (
                <div>Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vhostsData?.virtualHosts?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">
                          No virtual hosts
                        </TableCell>
                      </TableRow>
                    ) : (
                      vhostsData?.virtualHosts?.map((vhost: any) => (
                        <TableRow key={vhost.name}>
                          <TableCell className="font-medium">{vhost.name}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedVhost(vhost.name)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
      )}

      {activeTab === 'apps' && (
          <Card>
            <CardHeader>
              <CardTitle>Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Virtual Host</label>
                <select
                  value={selectedVhost}
                  onChange={(e) => {
                    setSelectedVhost(e.target.value);
                    setSelectedApp('app');
                  }}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {vhostsData?.virtualHosts?.map((vhost: any) => (
                    <option key={vhost.name} value={vhost.name}>
                      {vhost.name}
                    </option>
                  ))}
                </select>
              </div>
              {appsLoading ? (
                <div>Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appsData?.applications?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">
                          No applications
                        </TableCell>
                      </TableRow>
                    ) : (
                      appsData?.applications?.map((app: any) => (
                        <TableRow key={app.name}>
                          <TableCell className="font-medium">{app.name}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedApp(app.name)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
      )}

      {activeTab === 'profiles' && (
          <Card>
            <CardHeader>
              <CardTitle>Output Profiles (Transcoding)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 space-y-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Virtual Host</label>
                  <select
                    value={selectedVhost}
                    onChange={(e) => {
                      setSelectedVhost(e.target.value);
                      setSelectedApp('app');
                    }}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    {vhostsData?.virtualHosts?.map((vhost: any) => (
                      <option key={vhost.name} value={vhost.name}>
                        {vhost.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Application</label>
                  <select
                    value={selectedApp}
                    onChange={(e) => setSelectedApp(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    {appsData?.applications?.map((app: any) => (
                      <option key={app.name} value={app.name}>
                        {app.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {profilesLoading ? (
                <div>Loading...</div>
              ) : (
                <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
                  {JSON.stringify(outputProfilesData?.outputProfiles || [], null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
      )}
    </div>
  );
}

