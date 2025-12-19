// API Client for PHP Backend
// Handles all HTTP requests and JWT token management

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Token management
const TOKEN_KEY = 'auth_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// Generic fetch wrapper with auth
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  
  return data;
}

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const data = await request<{ token: string; user: User }>('/auth.php?action=login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    return data;
  },
  
  signup: async (email: string, password: string, name: string) => {
    const data = await request<{ token: string; user: User }>('/auth.php?action=signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    setToken(data.token);
    return data;
  },
  
  me: async () => {
    return request<{ user: User }>('/auth.php?action=me');
  },
  
  changePassword: async (oldPassword: string, newPassword: string) => {
    return request<{ message: string }>('/auth.php?action=change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  },
  
  updateProfile: async (updates: ProfileUpdate) => {
    return request<{ user: User }>('/auth.php?action=update-profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
  
  logout: () => {
    removeToken();
  },
};

// Users API
export const usersApi = {
  getAll: async () => {
    return request<{ users: User[] }>('/users.php');
  },
  
  get: async (id: string) => {
    return request<{ user: User }>(`/users.php?id=${id}`);
  },
  
  update: async (id: string, updates: { role?: string; disabled?: boolean }) => {
    return request<{ message: string }>(`/users.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
};

// Workspaces API
export const workspacesApi = {
  getAll: async () => {
    return request<{ workspaces: Workspace[] }>('/workspaces.php');
  },
  
  get: async (id: string) => {
    return request<{ workspace: Workspace }>(`/workspaces.php?id=${id}`);
  },
  
  create: async (name: string, clientId: string) => {
    return request<{ workspace: Workspace }>('/workspaces.php', {
      method: 'POST',
      body: JSON.stringify({ name, clientId }),
    });
  },
  
  update: async (id: string, name: string) => {
    return request<{ message: string }>(`/workspaces.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
  },
  
  delete: async (id: string) => {
    return request<{ message: string }>(`/workspaces.php?id=${id}`, {
      method: 'DELETE',
    });
  },
};

// Projects API
export const projectsApi = {
  getAll: async (workspaceId?: string) => {
    const query = workspaceId ? `?workspace_id=${workspaceId}` : '';
    return request<{ projects: Project[] }>(`/projects.php${query}`);
  },
  
  get: async (id: string) => {
    return request<{ project: Project }>(`/projects.php?id=${id}`);
  },
  
  create: async (workspaceId: string, name: string, description: string) => {
    return request<{ project: Project }>('/projects.php', {
      method: 'POST',
      body: JSON.stringify({ workspaceId, name, description }),
    });
  },
  
  update: async (id: string, updates: Partial<{ name: string; description: string; assignedEmployeeIds: string[] }>) => {
    return request<{ project: Project }>(`/projects.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
  
  delete: async (id: string) => {
    return request<{ message: string }>(`/projects.php?id=${id}`, {
      method: 'DELETE',
    });
  },
};

// Tasks API
export const tasksApi = {
  getAll: async (projectId: string) => {
    return request<{ tasks: Task[] }>(`/tasks.php?project_id=${projectId}`);
  },
  
  get: async (id: string) => {
    return request<{ task: Task }>(`/tasks.php?id=${id}`);
  },
  
  create: async (projectId: string, title: string, description: string) => {
    return request<{ task: Task }>('/tasks.php', {
      method: 'POST',
      body: JSON.stringify({ projectId, title, description }),
    });
  },
  
  update: async (id: string, updates: Partial<{ title: string; description: string; status: string; assignedTo: string | null; dueDate: string | null; order: number }>) => {
    return request<{ task: Task }>(`/tasks.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
  
  delete: async (id: string) => {
    return request<{ message: string }>(`/tasks.php?id=${id}`, {
      method: 'DELETE',
    });
  },
};

// Comments API
export const commentsApi = {
  getAll: async (taskId: string) => {
    return request<{ comments: Comment[] }>(`/comments.php?task_id=${taskId}`);
  },
  
  create: async (taskId: string, content: string) => {
    return request<{ comment: Comment }>('/comments.php', {
      method: 'POST',
      body: JSON.stringify({ taskId, content }),
    });
  },
};

// Payments API
export const paymentsApi = {
  getAll: async () => {
    return request<{ payments: Payment[] }>('/payments.php');
  },
  
  get: async (id: string) => {
    return request<{ payment: Payment }>(`/payments.php?id=${id}`);
  },
  
  create: async (employeeId: string, projectId: string, amount: number, currency: string, date: string) => {
    return request<{ payment: Payment }>('/payments.php', {
      method: 'POST',
      body: JSON.stringify({ employeeId, projectId, amount, currency, date }),
    });
  },
  
  update: async (id: string, updates: Partial<{ status: string; amount: number; currency: string; date: string }>) => {
    return request<{ payment: Payment }>(`/payments.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
  
  delete: async (id: string) => {
    return request<{ message: string }>(`/payments.php?id=${id}`, {
      method: 'DELETE',
    });
  },
};

// Revenues API
export const revenuesApi = {
  getAll: async () => {
    return request<{ revenues: Revenue[] }>('/revenues.php');
  },
  
  get: async (id: string) => {
    return request<{ revenue: Revenue }>(`/revenues.php?id=${id}`);
  },
  
  create: async (clientId: string, projectId: string, amount: number, currency: string, dateReceived: string) => {
    return request<{ revenue: Revenue }>('/revenues.php', {
      method: 'POST',
      body: JSON.stringify({ clientId, projectId, amount, currency, dateReceived }),
    });
  },
  
  update: async (id: string, updates: Partial<{ status: string; amount: number; currency: string; dateReceived: string }>) => {
    return request<{ revenue: Revenue }>(`/revenues.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
  
  delete: async (id: string) => {
    return request<{ message: string }>(`/revenues.php?id=${id}`, {
      method: 'DELETE',
    });
  },
};

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee' | 'client';
  disabled: boolean;
  profile: {
    phone?: string;
    address?: string;
    companyName?: string;
    profilePicture?: string;
  } | null;
}

export interface ProfileUpdate {
  name?: string;
  phone?: string;
  address?: string;
  companyName?: string;
  profilePicture?: string;
}

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

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'not-started' | 'in-progress' | 'needs-review' | 'completed';
  assignedTo: string | null;
  dueDate: string | null;
  order: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  employeeId: string;
  projectId: string;
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';
  status: 'unpaid' | 'paid';
  date: string;
  createdAt: string;
}

export interface Revenue {
  id: string;
  clientId: string;
  projectId: string;
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';
  status: 'pending' | 'paid';
  dateReceived: string;
  createdAt: string;
}
