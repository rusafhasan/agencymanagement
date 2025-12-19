import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectManagement } from '@/contexts/ProjectManagementContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, FolderKanban, Trash2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Workspaces() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    getWorkspacesForUser, 
    createWorkspace, 
    deleteWorkspace,
    getClients,
    getProjectsForWorkspace 
  } = useProjectManagement();

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

  const getDashboardPath = () => {
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'employee') return '/employee';
    return '/client';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(getDashboardPath())}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <FolderKanban className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold">Workspaces</h1>
              <p className="text-xs text-muted-foreground">Project Management</p>
            </div>
          </div>
          <span className="text-sm text-muted-foreground">
            {user?.name} ({user?.role})
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Your Workspaces</h2>
            <p className="text-muted-foreground">
              {isAdmin ? 'Manage all client workspaces' : 'Access your assigned workspaces'}
            </p>
          </div>

          {isAdmin && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Workspace
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Workspace</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Workspace Name</Label>
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g., Acme Corp"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Assign to Client</Label>
                    <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">No clients available</div>
                        ) : (
                          clients.map(client => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name} ({client.email})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {clients.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Create client accounts first in User Management
                      </p>
                    )}
                  </div>
                  <Button onClick={handleCreate} className="w-full" disabled={clients.length === 0}>
                    Create Workspace
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {workspaces.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {isAdmin ? 'No workspaces yet. Create one to get started!' : 'No workspaces assigned to you yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workspaces.map(workspace => {
              const projectCount = getProjectsForWorkspace(workspace.id).length;
              return (
                <Card 
                  key={workspace.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/workspaces/${workspace.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{workspace.name}</CardTitle>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(workspace.id, workspace.name);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Client: {getClientName(workspace.clientId)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary">
                      {projectCount} project{projectCount !== 1 ? 's' : ''}
                    </Badge>
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
