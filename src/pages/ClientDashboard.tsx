import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectManagement, Task, TaskStatus } from '@/contexts/ProjectManagementContext';
import AppHeader from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  FolderKanban, 
  User, 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  MessageSquare,
  Calendar,
  TrendingUp,
  ArrowRight,
  ListTodo
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, isPast, isToday, isThisMonth, formatDistanceToNow } from 'date-fns';

export default function ClientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    getWorkspacesForUser, 
    getProjectsForWorkspace, 
    getTasksForProject,
    comments,
    projects,
    tasks
  } = useProjectManagement();

  const clientWorkspaces = getWorkspacesForUser();

  // Get all projects and tasks for this client
  const clientData = useMemo(() => {
    const allProjects: Array<{
      project: typeof projects[0];
      workspace: typeof clientWorkspaces[0];
      tasks: Task[];
      completedTasks: number;
      totalTasks: number;
      progress: number;
      hasOverdue: boolean;
      nextDueDate: string | null;
    }> = [];

    let allTasks: Task[] = [];
    let allTaskIds: string[] = [];

    clientWorkspaces.forEach(workspace => {
      const workspaceProjects = getProjectsForWorkspace(workspace.id);
      workspaceProjects.forEach(project => {
        const projectTasks = getTasksForProject(project.id);
        const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
        const totalTasks = projectTasks.length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        const overdueTasks = projectTasks.filter(t => 
          t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)) && t.status !== 'completed'
        );

        const upcomingDueDates = projectTasks
          .filter(t => t.dueDate && t.status !== 'completed')
          .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

        allProjects.push({
          project,
          workspace,
          tasks: projectTasks,
          completedTasks,
          totalTasks,
          progress,
          hasOverdue: overdueTasks.length > 0,
          nextDueDate: upcomingDueDates[0]?.dueDate || null,
        });

        allTasks = [...allTasks, ...projectTasks];
        allTaskIds = [...allTaskIds, ...projectTasks.map(t => t.id)];
      });
    });

    // Calculate stats
    const now = new Date();
    const completedThisMonth = allTasks.filter(t => 
      t.status === 'completed' && isThisMonth(new Date(t.createdAt))
    ).length;

    const pendingTasks = allTasks.filter(t => 
      t.status !== 'completed'
    ).length;

    const overdueTasks = allTasks.filter(t => 
      t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)) && t.status !== 'completed'
    ).length;

    // Get upcoming/active tasks (not completed)
    const activeTasks = allTasks
      .filter(t => t.status !== 'completed')
      .sort((a, b) => {
        // Sort by status priority, then by due date
        const statusOrder: Record<TaskStatus, number> = { 'needs-review': 0, 'in-progress': 1, 'not-started': 2, 'completed': 3 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        return a.dueDate ? -1 : 1;
      })
      .slice(0, 6);

    // Get recent comments for client's tasks
    const recentComments = comments
      .filter(c => allTaskIds.includes(c.taskId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      projects: allProjects,
      stats: {
        completedThisMonth,
        pendingTasks,
        overdueTasks,
        totalProjects: allProjects.length,
      },
      activeTasks,
      recentComments,
    };
  }, [clientWorkspaces, getProjectsForWorkspace, getTasksForProject, comments]);

  const getStatusBadge = (status: TaskStatus) => {
    const config = {
      'not-started': { label: 'Not Started', className: 'bg-muted text-muted-foreground' },
      'in-progress': { label: 'In Progress', className: 'bg-primary/10 text-primary' },
      'needs-review': { label: 'Needs Review', className: 'bg-warning/10 text-warning' },
      'completed': { label: 'Completed', className: 'bg-success/10 text-success' },
    };
    return config[status];
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getProjectForTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return null;
    return projects.find(p => p.id === task.projectId);
  };

  return (
    <div className="page-container">
      <AppHeader 
        title="Client Portal" 
        subtitle="Your project hub"
        icon={<User className="h-5 w-5 text-primary-foreground" />}
      />

      <main className="content-container">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h2 className="section-heading">Welcome back, {user?.name}</h2>
          <p className="section-subheading">
            Here's an overview of your projects and their progress.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="card-premium hover-lift animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-primary" />
                Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display">{clientData.stats.totalProjects}</div>
              <p className="text-xs text-muted-foreground mt-1">Active workspaces</p>
            </CardContent>
          </Card>

          <Card className="card-premium hover-lift animate-fade-in border-l-4 border-l-success" style={{ animationDelay: '0.15s' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display text-success">{clientData.stats.completedThisMonth}</div>
              <p className="text-xs text-muted-foreground mt-1">Tasks this month</p>
            </CardContent>
          </Card>

          <Card className="card-premium hover-lift animate-fade-in border-l-4 border-l-primary" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display text-primary">{clientData.stats.pendingTasks}</div>
              <p className="text-xs text-muted-foreground mt-1">Tasks in progress</p>
            </CardContent>
          </Card>

          <Card className={`card-premium hover-lift animate-fade-in border-l-4 ${clientData.stats.overdueTasks > 0 ? 'border-l-destructive' : 'border-l-muted'}`} style={{ animationDelay: '0.25s' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className={`h-4 w-4 ${clientData.stats.overdueTasks > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold font-display ${clientData.stats.overdueTasks > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {clientData.stats.overdueTasks}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Need attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Workspace Overview */}
        {clientWorkspaces.length > 0 && (
          <Card className="card-premium mb-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Your Workspace
              </CardTitle>
              <CardDescription>
                {clientWorkspaces[0]?.name} • {user?.profile?.companyName || 'Your Company'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/workspaces')} className="gap-2 shadow-premium-sm hover:shadow-premium-md transition-shadow">
                <FolderKanban className="h-4 w-4" />
                View All Projects
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Project Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-lg">Project Progress</h3>
              <Badge variant="outline" className="text-xs">{clientData.projects.length} projects</Badge>
            </div>
            
            {clientData.projects.length === 0 ? (
              <Card className="card-premium animate-fade-in">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FolderKanban className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">No projects yet.</p>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {clientData.projects.map((item, i) => (
                    <Card 
                      key={item.project.id} 
                      className={`card-premium hover-lift cursor-pointer animate-fade-in ${item.hasOverdue ? 'border-destructive/50' : ''}`}
                      style={{ animationDelay: `${0.35 + i * 0.05}s` }}
                      onClick={() => navigate(`/projects/${item.project.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">{item.project.name}</h4>
                            <p className="text-xs text-muted-foreground truncate">{item.workspace.name}</p>
                          </div>
                          {item.hasOverdue && (
                            <Badge variant="destructive" className="ml-2 shrink-0">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Overdue
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{item.progress}%</span>
                          </div>
                          <Progress value={item.progress} className="h-2" />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{item.completedTasks} of {item.totalTasks} tasks</span>
                            {item.nextDueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Due {format(new Date(item.nextDueDate), 'MMM d')}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Active Tasks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-lg">Task Highlights</h3>
              <Badge variant="outline" className="text-xs">{clientData.activeTasks.length} active</Badge>
            </div>
            
            {clientData.activeTasks.length === 0 ? (
              <Card className="card-premium animate-fade-in">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ListTodo className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">No active tasks.</p>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {clientData.activeTasks.map((task, i) => {
                    const project = getProjectForTask(task.id);
                    const statusConfig = getStatusBadge(task.status);
                    const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
                    
                    return (
                      <Card 
                        key={task.id} 
                        className={`card-premium hover-lift cursor-pointer animate-fade-in ${isOverdue ? 'border-destructive/50 bg-destructive/5' : ''}`}
                        style={{ animationDelay: `${0.35 + i * 0.05}s` }}
                        onClick={() => project && navigate(`/projects/${project.id}`)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{task.title}</p>
                              <p className="text-xs text-muted-foreground truncate">{project?.name}</p>
                            </div>
                            <Badge className={`shrink-0 text-xs ${statusConfig.className}`}>
                              {statusConfig.label}
                            </Badge>
                          </div>
                          {task.dueDate && (
                            <div className={`flex items-center gap-1 mt-2 text-xs ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                              <Calendar className="h-3 w-3" />
                              {isOverdue ? 'Overdue: ' : 'Due: '}{format(new Date(task.dueDate), 'MMM d, yyyy')}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        {/* Recent Comments Feed */}
        <Card className="card-premium animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Recent Comments
            </CardTitle>
            <CardDescription>Latest updates from your project tasks</CardDescription>
          </CardHeader>
          <CardContent>
            {clientData.recentComments.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No comments yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {clientData.recentComments.map((comment, i) => {
                  const task = tasks.find(t => t.id === comment.taskId);
                  const project = task ? projects.find(p => p.id === task.projectId) : null;
                  
                  return (
                    <div key={comment.id} className="animate-fade-in" style={{ animationDelay: `${0.55 + i * 0.05}s` }}>
                      <div className="flex gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getInitials(comment.authorName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{comment.authorName}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{comment.content}</p>
                          {task && project && (
                            <p className="text-xs text-muted-foreground mt-1">
                              on <span className="font-medium text-foreground">{task.title}</span> • {project.name}
                            </p>
                          )}
                        </div>
                      </div>
                      {i < clientData.recentComments.length - 1 && <Separator className="mt-4" />}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Footer */}
        <Card className="card-premium mt-8 bg-muted/30 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Your Portal is Read-Only</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  You can view all project progress, tasks, and comments, but you cannot modify them. 
                  If you need changes, please contact your project manager.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
