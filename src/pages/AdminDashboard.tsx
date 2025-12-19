import { useState, useEffect } from 'react';
import { useAuth, User, UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LogOut, Shield, Users, Briefcase, UserCheck, UserX, FolderKanban, DollarSign, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const { user, logout, getAllUsers, updateUserRole, toggleUserStatus } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    setUsers(getAllUsers());
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    const success = updateUserRole(userId, newRole);
    if (success) {
      setUsers(getAllUsers());
      toast({
        title: 'Role updated',
        description: 'User role has been changed successfully.',
      });
    }
  };

  const handleToggleStatus = (userId: string, currentlyDisabled: boolean) => {
    const success = toggleUserStatus(userId);
    if (success) {
      setUsers(getAllUsers());
      toast({
        title: currentlyDisabled ? 'Account enabled' : 'Account disabled',
        description: currentlyDisabled 
          ? 'User can now log in.' 
          : 'User will not be able to log in.',
      });
    } else {
      toast({
        title: 'Cannot disable',
        description: 'You cannot disable your own account.',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'employee':
        return 'secondary';
      case 'client':
        return 'outline';
    }
  };

  const stats = {
    admins: users.filter(u => u.role === 'admin').length,
    employees: users.filter(u => u.role === 'employee').length,
    clients: users.filter(u => u.role === 'client').length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold">Admin Dashboard</h1>
              <p className="text-xs text-muted-foreground">Agency Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.name}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
          <p className="text-muted-foreground">
            Manage your agency, employees, and clients from here.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.admins}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.employees}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Clients</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.clients}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/workspaces')} className="gap-2">
              <FolderKanban className="h-4 w-4" />
              Open Project Management
            </Button>
            <Button onClick={() => navigate('/payments')} variant="outline" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Manage Payments
            </Button>
            <Button onClick={() => navigate('/revenue')} variant="outline" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Revenue & Profit
            </Button>
          </CardContent>
        </Card>
        {/* User Management */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              View all users, change their roles, and enable or disable accounts. Only admins can access this section.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Change Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} className={u.disabled ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(u.role)}>
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.disabled ? 'destructive' : 'default'}>
                        {u.disabled ? 'Disabled' : 'Active'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={u.role}
                        onValueChange={(value) => handleRoleChange(u.id, value as UserRole)}
                        disabled={u.disabled}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="client">Client</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={u.disabled ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleToggleStatus(u.id, !!u.disabled)}
                        disabled={u.id === user?.id}
                      >
                        {u.disabled ? (
                          <>
                            <UserCheck className="mr-1 h-4 w-4" />
                            Enable
                          </>
                        ) : (
                          <>
                            <UserX className="mr-1 h-4 w-4" />
                            Disable
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
