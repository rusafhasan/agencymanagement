import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth, User } from './AuthContext';

// Types
export interface Workspace {
  id: string;
  name: string;
  clientId: string; // The client user who owns this workspace
  createdAt: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  assignedEmployeeIds: string[];
  createdAt: string;
}

export type TaskStatus = 'not-started' | 'in-progress' | 'needs-review' | 'completed';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignedTo: string | null; // employee id
  dueDate: string | null; // ISO date string
  createdAt: string;
  order: number;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

interface ProjectManagementContextType {
  // Workspaces
  workspaces: Workspace[];
  createWorkspace: (name: string, clientId: string) => Workspace;
  updateWorkspace: (id: string, name: string) => void;
  deleteWorkspace: (id: string) => void;
  getWorkspacesForUser: () => Workspace[];

  // Projects
  projects: Project[];
  createProject: (workspaceId: string, name: string, description: string) => Project;
  updateProject: (id: string, updates: Partial<Pick<Project, 'name' | 'description' | 'assignedEmployeeIds'>>) => void;
  deleteProject: (id: string) => void;
  getProjectsForWorkspace: (workspaceId: string) => Project[];
  canAccessProject: (projectId: string) => boolean;

  // Tasks
  tasks: Task[];
  createTask: (projectId: string, title: string, description: string) => Task;
  updateTask: (id: string, updates: Partial<Pick<Task, 'title' | 'description' | 'status' | 'assignedTo' | 'dueDate' | 'order'>>) => void;
  deleteTask: (id: string) => void;
  getTasksForProject: (projectId: string) => Task[];
  moveTask: (taskId: string, newStatus: TaskStatus, newOrder: number) => void;

  // Comments
  comments: Comment[];
  createComment: (taskId: string, content: string) => Comment | null;
  getCommentsForTask: (taskId: string) => Comment[];

  // Helpers
  getUsers: () => User[];
  getClients: () => User[];
  getEmployees: () => User[];
}

const ProjectManagementContext = createContext<ProjectManagementContextType | undefined>(undefined);

const STORAGE_KEYS = {
  workspaces: 'pm_workspaces',
  projects: 'pm_projects',
  tasks: 'pm_tasks',
  comments: 'pm_comments',
};

export function ProjectManagementProvider({ children }: { children: ReactNode }) {
  const { user, getAllUsers } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = {
      workspaces: localStorage.getItem(STORAGE_KEYS.workspaces),
      projects: localStorage.getItem(STORAGE_KEYS.projects),
      tasks: localStorage.getItem(STORAGE_KEYS.tasks),
      comments: localStorage.getItem(STORAGE_KEYS.comments),
    };
    if (stored.workspaces) setWorkspaces(JSON.parse(stored.workspaces));
    if (stored.projects) setProjects(JSON.parse(stored.projects));
    if (stored.tasks) setTasks(JSON.parse(stored.tasks));
    if (stored.comments) setComments(JSON.parse(stored.comments));
  }, []);

  // Save to localStorage on changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.workspaces, JSON.stringify(workspaces));
  }, [workspaces]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(projects));
  }, [projects]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
  }, [tasks]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.comments, JSON.stringify(comments));
  }, [comments]);

  // Helper functions
  const getUsers = () => getAllUsers();
  const getClients = () => getAllUsers().filter(u => u.role === 'client');
  const getEmployees = () => getAllUsers().filter(u => u.role === 'employee');

  // Workspace functions
  const createWorkspace = (name: string, clientId: string): Workspace => {
    const workspace: Workspace = {
      id: crypto.randomUUID(),
      name,
      clientId,
      createdAt: new Date().toISOString(),
    };
    setWorkspaces(prev => [...prev, workspace]);
    return workspace;
  };

  const updateWorkspace = (id: string, name: string) => {
    setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, name } : w));
  };

  const deleteWorkspace = (id: string) => {
    // Delete workspace and all its projects, tasks, comments
    const projectIds = projects.filter(p => p.workspaceId === id).map(p => p.id);
    const taskIds = tasks.filter(t => projectIds.includes(t.projectId)).map(t => t.id);
    
    setComments(prev => prev.filter(c => !taskIds.includes(c.taskId)));
    setTasks(prev => prev.filter(t => !projectIds.includes(t.projectId)));
    setProjects(prev => prev.filter(p => p.workspaceId !== id));
    setWorkspaces(prev => prev.filter(w => w.id !== id));
  };

  const getWorkspacesForUser = (): Workspace[] => {
    if (!user) return [];
    if (user.role === 'admin') return workspaces;
    if (user.role === 'client') return workspaces.filter(w => w.clientId === user.id);
    if (user.role === 'employee') {
      // Employees see workspaces where they're assigned to at least one project
      const assignedProjectWorkspaceIds = projects
        .filter(p => p.assignedEmployeeIds.includes(user.id))
        .map(p => p.workspaceId);
      return workspaces.filter(w => assignedProjectWorkspaceIds.includes(w.id));
    }
    return [];
  };

  // Project functions
  const createProject = (workspaceId: string, name: string, description: string): Project => {
    const workspace = workspaces.find(w => w.id === workspaceId);
    const project: Project = {
      id: crypto.randomUUID(),
      workspaceId,
      name,
      description,
      assignedEmployeeIds: [],
      createdAt: new Date().toISOString(),
    };
    setProjects(prev => [...prev, project]);
    return project;
  };

  const updateProject = (id: string, updates: Partial<Pick<Project, 'name' | 'description' | 'assignedEmployeeIds'>>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProject = (id: string) => {
    const taskIds = tasks.filter(t => t.projectId === id).map(t => t.id);
    setComments(prev => prev.filter(c => !taskIds.includes(c.taskId)));
    setTasks(prev => prev.filter(t => t.projectId !== id));
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const getProjectsForWorkspace = (workspaceId: string): Project[] => {
    const allProjects = projects.filter(p => p.workspaceId === workspaceId);
    if (!user) return [];
    if (user.role === 'admin' || user.role === 'client') return allProjects;
    if (user.role === 'employee') {
      return allProjects.filter(p => p.assignedEmployeeIds.includes(user.id));
    }
    return [];
  };

  const canAccessProject = (projectId: string): boolean => {
    if (!user) return false;
    const project = projects.find(p => p.id === projectId);
    if (!project) return false;
    const workspace = workspaces.find(w => w.id === project.workspaceId);
    if (!workspace) return false;

    if (user.role === 'admin') return true;
    if (user.role === 'client') return workspace.clientId === user.id;
    if (user.role === 'employee') return project.assignedEmployeeIds.includes(user.id);
    return false;
  };

  // Task functions
  const createTask = (projectId: string, title: string, description: string): Task => {
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    const maxOrder = projectTasks.length > 0 ? Math.max(...projectTasks.map(t => t.order)) : 0;
    
    const task: Task = {
      id: crypto.randomUUID(),
      projectId,
      title,
      description,
      status: 'not-started',
      assignedTo: null,
      dueDate: null,
      createdAt: new Date().toISOString(),
      order: maxOrder + 1,
    };
    setTasks(prev => [...prev, task]);
    return task;
  };

  const updateTask = (id: string, updates: Partial<Pick<Task, 'title' | 'description' | 'status' | 'assignedTo' | 'dueDate' | 'order'>>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTask = (id: string) => {
    setComments(prev => prev.filter(c => c.taskId !== id));
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const getTasksForProject = (projectId: string): Task[] => {
    return tasks.filter(t => t.projectId === projectId).sort((a, b) => a.order - b.order);
  };

  const moveTask = (taskId: string, newStatus: TaskStatus, newOrder: number) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: newStatus, order: newOrder } : t
    ));
  };

  // Comment functions
  const createComment = (taskId: string, content: string): Comment | null => {
    if (!user) return null;
    // Only admin and employees can comment
    if (user.role === 'client') return null;
    
    const comment: Comment = {
      id: crypto.randomUUID(),
      taskId,
      authorId: user.id,
      authorName: user.name,
      content,
      createdAt: new Date().toISOString(),
    };
    setComments(prev => [...prev, comment]);
    return comment;
  };

  const getCommentsForTask = (taskId: string): Comment[] => {
    return comments.filter(c => c.taskId === taskId).sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  };

  return (
    <ProjectManagementContext.Provider value={{
      workspaces,
      createWorkspace,
      updateWorkspace,
      deleteWorkspace,
      getWorkspacesForUser,
      projects,
      createProject,
      updateProject,
      deleteProject,
      getProjectsForWorkspace,
      canAccessProject,
      tasks,
      createTask,
      updateTask,
      deleteTask,
      getTasksForProject,
      moveTask,
      comments,
      createComment,
      getCommentsForTask,
      getUsers,
      getClients,
      getEmployees,
    }}>
      {children}
    </ProjectManagementContext.Provider>
  );
}

export function useProjectManagement() {
  const context = useContext(ProjectManagementContext);
  if (context === undefined) {
    throw new Error('useProjectManagement must be used within a ProjectManagementProvider');
  }
  return context;
}
