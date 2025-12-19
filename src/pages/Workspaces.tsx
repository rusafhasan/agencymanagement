import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectManagement } from '@/contexts/ProjectManagementContext';
import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, FolderKanban, Trash2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Workspaces() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getWorkspacesForUser, createWorkspace, deleteWorkspace, getClients, getProjectsForWorkspace } = useProjectManagement();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');

  const workspaces = getWorkspacesForUser();
  const clients = getClients();
  const isAdmin = user?.role === 'admin';

  const handleCreate = () => {
    if (!newName.trim() || !selectedClientId) {
      toast({ title: 'Please fill all fields', variant: 'destructive' });
      return;
    }
    createWorkspace(newName.trim(), selectedClientId);
    setNewName('');
    setSelectedClientId('');
    setIsCreateOpen(false);
    toast({ title: 'Workspace created successfully' });
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete workspace "${name}" and all its projects?`)) {
      deleteWorkspace(id);
      toast({ title: 'Workspace deleted' });
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown';
  };

  return (
    <div className="page-container">
      <AppHeader title="Workspaces" subtitle="Project Management" icon={<FolderKanban className="h-5 w-5 text-primary-foreground" />} />

      <main className="content-container">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h2 className="section-heading">Your Workspaces</h2>
            <p className="section-subheading">{isAdmin ? 'Manage all client workspaces' : 'Access your assigned workspaces'}</p>
          </div>

          {isAdmin && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 shadow-premium-sm hover:shadow-premium-md transition-shadow">
                  <Plus className="h-4 w-4" />
                  New Workspace
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display">Create New Workspace</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Workspace Name</Label>
                    <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., Acme Corp" />
                  </div>
                  <div className="space-y-2">
                    <Label>Assign to Client</Label>
                    <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                      <SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger>
                      <SelectContent>
                        {clients.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">No clients available</div>
                        ) : (
                          clients.map(client => (
                            <SelectItem key={client.id} value={client.id}>{client.name} ({client.email})</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreate} className="w-full" disabled={clients.length === 0}>Create Workspace</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {workspaces.length === 0 ? (
          <Card className="card-premium animate-fade-in">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FolderKanban className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">{isAdmin ? 'No workspaces yet. Create one to get started!' : 'No workspaces assigned to you yet.'}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((workspace, i) => {
              const projectCount = getProjectsForWorkspace(workspace.id).length;
              return (
                <Card 
                  key={workspace.id} 
                  className="card-premium hover-lift cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${0.1 + i * 0.05}s` }}
                  onClick={() => navigate(`/workspaces/${workspace.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg font-display">{workspace.name}</CardTitle>
                      {isAdmin && (
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-8 w-8" onClick={(e) => { e.stopPropagation(); handleDelete(workspace.id, workspace.name); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      Client: {getClientName(workspace.clientId)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary">{projectCount} project{projectCount !== 1 ? 's' : ''}</Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
