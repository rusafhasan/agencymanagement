import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, User } from '@/contexts/AuthContext';
import { useProjectManagement } from '@/contexts/ProjectManagementContext';
import AppHeader from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Kanban, Trash2, Settings, Users, FolderOpen } from 'lucide-react';
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
  const [employees, setEmployees] = useState<User[]>([]);

  const workspace = workspaces.find(w => w.id === workspaceId);
  const projects = workspaceId ? getProjectsForWorkspace(workspaceId) : [];
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const loadEmployees = async () => {
      const fetchedEmployees = await getEmployees();
      setEmployees(fetchedEmployees);
    };
    loadEmployees();
  }, [getEmployees]);

  if (!workspace) {
    return (
      <div className="page-container flex items-center justify-center">
        <p className="text-muted-foreground">Workspace not found</p>
      </div>
    );
  }

  const handleCreate = async () => {
    if (!newName.trim() || !workspaceId) {
      toast({ title: 'Please enter a project name', variant: 'destructive' });
      return;
    }
    const project = await createProject(workspaceId, newName.trim(), newDescription.trim());
    if (project && selectedEmployeeIds.length > 0) {
      await updateProject(project.id, { assignedEmployeeIds: selectedEmployeeIds });
    }
    resetForm();
    setIsCreateOpen(false);
    toast({ title: 'Project created successfully' });
  };

  const handleEdit = async () => {
    if (!editingProjectId) return;
    await updateProject(editingProjectId, {
      name: newName,
      description: newDescription,
      assignedEmployeeIds: selectedEmployeeIds,
    });
    resetForm();
    setIsEditOpen(false);
    toast({ title: 'Project updated' });
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Delete project "${name}" and all its tasks?`)) {
      await deleteProject(id);
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
    <div className="page-container">
      <AppHeader 
        title={workspace.name}
        subtitle="Workspace Projects"
        icon={<Kanban className="h-5 w-5 text-primary-foreground" />}
      />

      <main className="content-container">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h2 className="section-heading">Projects</h2>
            <p className="section-subheading">
              {isAdmin ? 'Create and manage projects in this workspace' : 'View projects assigned to you'}
            </p>
          </div>

          {isAdmin && (
            <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="gap-2 shadow-premium-sm hover:shadow-premium-md transition-shadow">
                  <Plus className="h-4 w-4" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display">Create New Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
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
                      <ScrollArea className="h-32 rounded-md border p-3">
                        <div className="space-y-3">
                          {employees.map(emp => (
                            <div key={emp.id} className="flex items-center gap-3">
                              <Checkbox
                                id={emp.id}
                                checked={selectedEmployeeIds.includes(emp.id)}
                                onCheckedChange={() => toggleEmployee(emp.id)}
                              />
                              <label htmlFor={emp.id} className="text-sm cursor-pointer">{emp.name}</label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
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
          <Card className="card-premium animate-fade-in">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FolderOpen className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                {isAdmin ? 'No projects yet. Create one to get started!' : 'No projects assigned to you in this workspace.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, i) => {
              const taskCount = getTasksForProject(project.id).length;
              const completedTasks = getTasksForProject(project.id).filter(t => t.status === 'completed').length;
              const progress = taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0;
              
              return (
                <Card
                  key={project.id}
                  className="card-premium hover-lift cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${0.1 + i * 0.05}s` }}
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg font-display">{project.name}</CardTitle>
                      {isAdmin && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
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
                            className="text-destructive hover:bg-destructive/10 h-8 w-8"
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
                      <CardDescription className="line-clamp-2 mt-1">
                        {project.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">
                        {taskCount} task{taskCount !== 1 ? 's' : ''}
                      </Badge>
                      {taskCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {progress}% complete
                        </Badge>
                      )}
                    </div>
                    {project.assignedEmployeeIds.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
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
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Edit Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Project Name</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Assigned Employees</Label>
                <ScrollArea className="h-32 rounded-md border p-3">
                  <div className="space-y-3">
                    {employees.map(emp => (
                      <div key={emp.id} className="flex items-center gap-3">
                        <Checkbox
                          id={`edit-${emp.id}`}
                          checked={selectedEmployeeIds.includes(emp.id)}
                          onCheckedChange={() => toggleEmployee(emp.id)}
                        />
                        <label htmlFor={`edit-${emp.id}`} className="text-sm cursor-pointer">{emp.name}</label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <Button onClick={handleEdit} className="w-full">Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
