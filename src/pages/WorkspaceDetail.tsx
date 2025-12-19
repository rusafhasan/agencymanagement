import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectManagement } from '@/contexts/ProjectManagementContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Plus, Kanban, Trash2, Settings, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function WorkspaceDetail() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    workspaces,
    getProjectsForWorkspace,
    createProject,
    updateProject,
    deleteProject,
    getEmployees,
    getTasksForProject,
  } = useProjectManagement();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

  const workspace = workspaces.find(w => w.id === workspaceId);
  const projects = workspaceId ? getProjectsForWorkspace(workspaceId) : [];
  const employees = getEmployees();
  const isAdmin = user?.role === 'admin';

  if (!workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Workspace not found</p>
      </div>
    );
  }

  const handleCreate = () => {
    if (!newName.trim() || !workspaceId) {
      toast({ title: 'Please enter a project name', variant: 'destructive' });
      return;
    }
    const project = createProject(workspaceId, newName.trim(), newDescription.trim());
    if (selectedEmployeeIds.length > 0) {
      updateProject(project.id, { assignedEmployeeIds: selectedEmployeeIds });
    }
    resetForm();
    setIsCreateOpen(false);
    toast({ title: 'Project created successfully' });
  };

  const handleEdit = () => {
    if (!editingProjectId) return;
    updateProject(editingProjectId, {
      name: newName,
      description: newDescription,
      assignedEmployeeIds: selectedEmployeeIds,
    });
    resetForm();
    setIsEditOpen(false);
    toast({ title: 'Project updated' });
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete project "${name}" and all its tasks?`)) {
      deleteProject(id);
      toast({ title: 'Project deleted' });
    }
  };

  const openEditDialog = (project: ReturnType<typeof getProjectsForWorkspace>[0]) => {
    setEditingProjectId(project.id);
    setNewName(project.name);
    setNewDescription(project.description);
    setSelectedEmployeeIds(project.assignedEmployeeIds);
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setNewName('');
    setNewDescription('');
    setSelectedEmployeeIds([]);
    setEditingProjectId(null);
  };

  const toggleEmployee = (empId: string) => {
    setSelectedEmployeeIds(prev =>
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/workspaces')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Kanban className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold">{workspace.name}</h1>
              <p className="text-xs text-muted-foreground">Workspace Projects</p>
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
            <h2 className="text-2xl font-bold">Projects</h2>
            <p className="text-muted-foreground">
              {isAdmin ? 'Create and manage projects in this workspace' : 'View projects assigned to you'}
            </p>
          </div>

          {isAdmin && (
            <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Project Name</Label>
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g., Website Redesign"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Brief project description..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Assign Employees</Label>
                    {employees.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No employees available</p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {employees.map(emp => (
                          <div key={emp.id} className="flex items-center gap-2">
                            <Checkbox
                              id={emp.id}
                              checked={selectedEmployeeIds.includes(emp.id)}
                              onCheckedChange={() => toggleEmployee(emp.id)}
                            />
                            <label htmlFor={emp.id} className="text-sm">{emp.name}</label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button onClick={handleCreate} className="w-full">
                    Create Project
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Kanban className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {isAdmin ? 'No projects yet. Create one to get started!' : 'No projects assigned to you in this workspace.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map(project => {
              const taskCount = getTasksForProject(project.id).length;
              return (
                <Card
                  key={project.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      {isAdmin && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(project);
                            }}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(project.id, project.name);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {project.description && (
                      <CardDescription className="line-clamp-2">
                        {project.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Badge variant="secondary">
                      {taskCount} task{taskCount !== 1 ? 's' : ''}
                    </Badge>
                    {project.assignedEmployeeIds.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {project.assignedEmployeeIds.length} employee{project.assignedEmployeeIds.length !== 1 ? 's' : ''} assigned
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Edit Project Dialog */}
        <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) resetForm(); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Project Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Assigned Employees</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {employees.map(emp => (
                    <div key={emp.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`edit-${emp.id}`}
                        checked={selectedEmployeeIds.includes(emp.id)}
                        onCheckedChange={() => toggleEmployee(emp.id)}
                      />
                      <label htmlFor={`edit-${emp.id}`} className="text-sm">{emp.name}</label>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={handleEdit} className="w-full">
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
