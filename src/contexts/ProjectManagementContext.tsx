import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth, User } from './AuthContext';
import { 
  workspacesApi, 
  projectsApi, 
  tasksApi, 
  commentsApi, 
  paymentsApi, 
  revenuesApi,
  usersApi,
  Workspace as ApiWorkspace,
  Project as ApiProject,
  Task as ApiTask,
  Comment as ApiComment,
  Payment as ApiPayment,
  Revenue as ApiRevenue,
} from '@/lib/api';

// Types
export interface Workspace {
  id: string;
  name: string;
  clientId: string;
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
  assignedTo: string | null;
  dueDate: string | null;
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

export type PaymentStatus = 'unpaid' | 'paid';
export type RevenueStatus = 'pending' | 'paid';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';

export interface Payment {
  id: string;
  employeeId: string;
  projectId: string;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  date: string;
  createdAt: string;
}

export interface Revenue {
  id: string;
  clientId: string;
  projectId: string;
  amount: number;
  currency: Currency;
  status: RevenueStatus;
  dateReceived: string;
  createdAt: string;
}

interface ProjectManagementContextType {
  // Loading state
  isLoading: boolean;
  
  // Workspaces
  workspaces: Workspace[];
  createWorkspace: (name: string, clientId: string) => Promise<Workspace | null>;
  updateWorkspace: (id: string, name: string) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  getWorkspacesForUser: () => Workspace[];
  refreshWorkspaces: () => Promise<void>;

  // Projects
  projects: Project[];
  createProject: (workspaceId: string, name: string, description: string) => Promise<Project | null>;
  updateProject: (id: string, updates: Partial<Pick<Project, 'name' | 'description' | 'assignedEmployeeIds'>>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  getProjectsForWorkspace: (workspaceId: string) => Project[];
  canAccessProject: (projectId: string) => boolean;
  refreshProjects: () => Promise<void>;

  // Tasks
  tasks: Task[];
  createTask: (projectId: string, title: string, description: string) => Promise<Task | null>;
  updateTask: (id: string, updates: Partial<Pick<Task, 'title' | 'description' | 'status' | 'assignedTo' | 'dueDate' | 'order'>>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  getTasksForProject: (projectId: string) => Task[];
  moveTask: (taskId: string, newStatus: TaskStatus, newOrder: number) => Promise<void>;
  refreshTasks: (projectId: string) => Promise<void>;

  // Comments
  comments: Comment[];
  createComment: (taskId: string, content: string) => Promise<Comment | null>;
  getCommentsForTask: (taskId: string) => Comment[];
  refreshComments: (taskId: string) => Promise<void>;

  // Payments
  payments: Payment[];
  createPayment: (employeeId: string, projectId: string, amount: number, currency: Currency, date: string) => Promise<Payment | null>;
  updatePayment: (id: string, updates: Partial<Pick<Payment, 'status' | 'amount' | 'currency' | 'date'>>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  getPaymentsForUser: () => Payment[];
  refreshPayments: () => Promise<void>;

  // Revenue
  revenues: Revenue[];
  createRevenue: (clientId: string, projectId: string, amount: number, currency: Currency, dateReceived: string) => Promise<Revenue | null>;
  updateRevenue: (id: string, updates: Partial<Pick<Revenue, 'status' | 'amount' | 'currency' | 'dateReceived'>>) => Promise<void>;
  deleteRevenue: (id: string) => Promise<void>;
  getAllRevenues: () => Revenue[];
  refreshRevenues: () => Promise<void>;

  // Helpers
  getUsers: () => Promise<User[]>;
  getClients: () => Promise<User[]>;
  getEmployees: () => Promise<User[]>;
}

const ProjectManagementContext = createContext<ProjectManagementContextType | undefined>(undefined);

// Map API types to local types
function mapWorkspace(w: ApiWorkspace): Workspace {
  return { id: w.id, name: w.name, clientId: w.clientId, createdAt: w.createdAt };
}

function mapProject(p: ApiProject): Project {
  return {
    id: p.id,
    workspaceId: p.workspaceId,
    name: p.name,
    description: p.description,
    assignedEmployeeIds: p.assignedEmployeeIds,
    createdAt: p.createdAt,
  };
}

function mapTask(t: ApiTask): Task {
  return {
    id: t.id,
    projectId: t.projectId,
    title: t.title,
    description: t.description,
    status: t.status,
    assignedTo: t.assignedTo,
    dueDate: t.dueDate,
    order: t.order,
    createdAt: t.createdAt,
  };
}

function mapComment(c: ApiComment): Comment {
  return {
    id: c.id,
    taskId: c.taskId,
    authorId: c.authorId,
    authorName: c.authorName,
    content: c.content,
    createdAt: c.createdAt,
  };
}

function mapPayment(p: ApiPayment): Payment {
  return {
    id: p.id,
    employeeId: p.employeeId,
    projectId: p.projectId,
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    date: p.date,
    createdAt: p.createdAt,
  };
}

function mapRevenue(r: ApiRevenue): Revenue {
  return {
    id: r.id,
    clientId: r.clientId,
    projectId: r.projectId,
    amount: r.amount,
    currency: r.currency,
    status: r.status,
    dateReceived: r.dateReceived,
    createdAt: r.createdAt,
  };
}

export function ProjectManagementProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [cachedUsers, setCachedUsers] = useState<User[]>([]);

  // Fetch initial data when user logs in
  useEffect(() => {
    if (user) {
      const loadData = async () => {
        setIsLoading(true);
        try {
          await Promise.all([
            refreshWorkspaces(),
            refreshProjects(),
            refreshPayments(),
            refreshRevenues(),
          ]);
        } catch (error) {
          console.error('Error loading data:', error);
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    } else {
      // Clear data on logout
      setWorkspaces([]);
      setProjects([]);
      setTasks([]);
      setComments([]);
      setPayments([]);
      setRevenues([]);
      setIsLoading(false);
    }
  }, [user?.id]);

  // Refresh functions
  const refreshWorkspaces = useCallback(async () => {
    try {
      const { workspaces: data } = await workspacesApi.getAll();
      setWorkspaces(data.map(mapWorkspace));
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    }
  }, []);

  const refreshProjects = useCallback(async () => {
    try {
      const { projects: data } = await projectsApi.getAll();
      setProjects(data.map(mapProject));
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  }, []);

  const refreshTasks = useCallback(async (projectId: string) => {
    try {
      const { tasks: data } = await tasksApi.getAll(projectId);
      setTasks(prev => {
        // Remove old tasks for this project and add new ones
        const otherTasks = prev.filter(t => t.projectId !== projectId);
        return [...otherTasks, ...data.map(mapTask)];
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  }, []);

  const refreshComments = useCallback(async (taskId: string) => {
    try {
      const { comments: data } = await commentsApi.getAll(taskId);
      setComments(prev => {
        const otherComments = prev.filter(c => c.taskId !== taskId);
        return [...otherComments, ...data.map(mapComment)];
      });
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }, []);

  const refreshPayments = useCallback(async () => {
    try {
      const { payments: data } = await paymentsApi.getAll();
      setPayments(data.map(mapPayment));
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  }, []);

  const refreshRevenues = useCallback(async () => {
    try {
      const { revenues: data } = await revenuesApi.getAll();
      setRevenues(data.map(mapRevenue));
    } catch (error) {
      console.error('Error fetching revenues:', error);
    }
  }, []);

  // User helpers
  const getUsers = useCallback(async (): Promise<User[]> => {
    if (cachedUsers.length > 0) return cachedUsers;
    try {
      const { users } = await usersApi.getAll();
      const mapped = users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        disabled: u.disabled,
        profile: u.profile ? {
          phone: u.profile.phone ?? undefined,
          address: u.profile.address ?? undefined,
          companyName: u.profile.companyName ?? undefined,
          profilePicture: u.profile.profilePicture ?? undefined,
        } : undefined,
      }));
      setCachedUsers(mapped);
      return mapped;
    } catch {
      return cachedUsers;
    }
  }, [cachedUsers]);

  const getClients = useCallback(async (): Promise<User[]> => {
    const users = await getUsers();
    return users.filter(u => u.role === 'client');
  }, [getUsers]);

  const getEmployees = useCallback(async (): Promise<User[]> => {
    const users = await getUsers();
    return users.filter(u => u.role === 'employee');
  }, [getUsers]);

  // Workspace functions
  const createWorkspace = async (name: string, clientId: string): Promise<Workspace | null> => {
    try {
      const { workspace } = await workspacesApi.create(name, clientId);
      const mapped = mapWorkspace(workspace);
      setWorkspaces(prev => [...prev, mapped]);
      return mapped;
    } catch (error) {
      console.error('Error creating workspace:', error);
      return null;
    }
  };

  const updateWorkspace = async (id: string, name: string) => {
    try {
      await workspacesApi.update(id, name);
      setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, name } : w));
    } catch (error) {
      console.error('Error updating workspace:', error);
    }
  };

  const deleteWorkspace = async (id: string) => {
    try {
      await workspacesApi.delete(id);
      setWorkspaces(prev => prev.filter(w => w.id !== id));
      setProjects(prev => prev.filter(p => p.workspaceId !== id));
    } catch (error) {
      console.error('Error deleting workspace:', error);
    }
  };

  const getWorkspacesForUser = (): Workspace[] => {
    return workspaces;
  };

  // Project functions
  const createProject = async (workspaceId: string, name: string, description: string): Promise<Project | null> => {
    try {
      const { project } = await projectsApi.create(workspaceId, name, description);
      const mapped = mapProject(project);
      setProjects(prev => [...prev, mapped]);
      return mapped;
    } catch (error) {
      console.error('Error creating project:', error);
      return null;
    }
  };

  const updateProject = async (id: string, updates: Partial<Pick<Project, 'name' | 'description' | 'assignedEmployeeIds'>>) => {
    try {
      const { project } = await projectsApi.update(id, updates);
      setProjects(prev => prev.map(p => p.id === id ? mapProject(project) : p));
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const deleteProject = async (id: string) => {
    try {
      await projectsApi.delete(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      setTasks(prev => prev.filter(t => t.projectId !== id));
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const getProjectsForWorkspace = (workspaceId: string): Project[] => {
    return projects.filter(p => p.workspaceId === workspaceId);
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
  const createTask = async (projectId: string, title: string, description: string): Promise<Task | null> => {
    try {
      const { task } = await tasksApi.create(projectId, title, description);
      const mapped = mapTask(task);
      setTasks(prev => [...prev, mapped]);
      return mapped;
    } catch (error) {
      console.error('Error creating task:', error);
      return null;
    }
  };

  const updateTask = async (id: string, updates: Partial<Pick<Task, 'title' | 'description' | 'status' | 'assignedTo' | 'dueDate' | 'order'>>) => {
    try {
      const { task } = await tasksApi.update(id, updates);
      setTasks(prev => prev.map(t => t.id === id ? mapTask(task) : t));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await tasksApi.delete(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      setComments(prev => prev.filter(c => c.taskId !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getTasksForProject = (projectId: string): Task[] => {
    return tasks.filter(t => t.projectId === projectId).sort((a, b) => a.order - b.order);
  };

  const moveTask = async (taskId: string, newStatus: TaskStatus, newOrder: number) => {
    try {
      const { task } = await tasksApi.update(taskId, { status: newStatus, order: newOrder });
      setTasks(prev => prev.map(t => t.id === taskId ? mapTask(task) : t));
    } catch (error) {
      console.error('Error moving task:', error);
    }
  };

  // Comment functions
  const createComment = async (taskId: string, content: string): Promise<Comment | null> => {
    try {
      const { comment } = await commentsApi.create(taskId, content);
      const mapped = mapComment(comment);
      setComments(prev => [...prev, mapped]);
      return mapped;
    } catch (error) {
      console.error('Error creating comment:', error);
      return null;
    }
  };

  const getCommentsForTask = (taskId: string): Comment[] => {
    return comments.filter(c => c.taskId === taskId).sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  };

  // Payment functions
  const createPayment = async (employeeId: string, projectId: string, amount: number, currency: Currency, date: string): Promise<Payment | null> => {
    try {
      const { payment } = await paymentsApi.create(employeeId, projectId, amount, currency, date);
      const mapped = mapPayment(payment);
      setPayments(prev => [...prev, mapped]);
      return mapped;
    } catch (error) {
      console.error('Error creating payment:', error);
      return null;
    }
  };

  const updatePayment = async (id: string, updates: Partial<Pick<Payment, 'status' | 'amount' | 'currency' | 'date'>>) => {
    try {
      const { payment } = await paymentsApi.update(id, updates);
      setPayments(prev => prev.map(p => p.id === id ? mapPayment(payment) : p));
    } catch (error) {
      console.error('Error updating payment:', error);
    }
  };

  const deletePayment = async (id: string) => {
    try {
      await paymentsApi.delete(id);
      setPayments(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting payment:', error);
    }
  };

  const getPaymentsForUser = (): Payment[] => {
    return payments;
  };

  // Revenue functions
  const createRevenue = async (clientId: string, projectId: string, amount: number, currency: Currency, dateReceived: string): Promise<Revenue | null> => {
    try {
      const { revenue } = await revenuesApi.create(clientId, projectId, amount, currency, dateReceived);
      const mapped = mapRevenue(revenue);
      setRevenues(prev => [...prev, mapped]);
      return mapped;
    } catch (error) {
      console.error('Error creating revenue:', error);
      return null;
    }
  };

  const updateRevenue = async (id: string, updates: Partial<Pick<Revenue, 'status' | 'amount' | 'currency' | 'dateReceived'>>) => {
    try {
      const { revenue } = await revenuesApi.update(id, updates);
      setRevenues(prev => prev.map(r => r.id === id ? mapRevenue(revenue) : r));
    } catch (error) {
      console.error('Error updating revenue:', error);
    }
  };

  const deleteRevenue = async (id: string) => {
    try {
      await revenuesApi.delete(id);
      setRevenues(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting revenue:', error);
    }
  };

  const getAllRevenues = (): Revenue[] => {
    return revenues;
  };

  return (
    <ProjectManagementContext.Provider value={{
      isLoading,
      workspaces,
      createWorkspace,
      updateWorkspace,
      deleteWorkspace,
      getWorkspacesForUser,
      refreshWorkspaces,
      projects,
      createProject,
      updateProject,
      deleteProject,
      getProjectsForWorkspace,
      canAccessProject,
      refreshProjects,
      tasks,
      createTask,
      updateTask,
      deleteTask,
      getTasksForProject,
      moveTask,
      refreshTasks,
      comments,
      createComment,
      getCommentsForTask,
      refreshComments,
      payments,
      createPayment,
      updatePayment,
      deletePayment,
      getPaymentsForUser,
      refreshPayments,
      revenues,
      createRevenue,
      updateRevenue,
      deleteRevenue,
      getAllRevenues,
      refreshRevenues,
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
