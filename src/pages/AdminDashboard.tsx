import { useState, useEffect } from 'react';
import { useAuth, User, UserRole } from '@/contexts/AuthContext';
import AppHeader from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Briefcase, UserCheck, UserX, FolderKanban, DollarSign, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const { user, getAllUsers, updateUserRole, toggleUserStatus } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      const fetchedUsers = await getAllUsers();
      setUsers(fetchedUsers);
    };
    loadUsers();
  }, [getAllUsers]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const success = await updateUserRole(userId, newRole);
    if (success) {
      const updatedUsers = await getAllUsers();
      setUsers(updatedUsers);
      toast({
        title: 'Role updated',
        description: 'User role has been changed successfully.',
      });
    }
  };

  const handleToggleStatus = async (userId: string, currentlyDisabled: boolean) => {
    const success = await toggleUserStatus(userId);
    if (success) {
      const updatedUsers = await getAllUsers();
      setUsers(updatedUsers);
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
    <div className="page-container">
      <AppHeader 
        title="Admin Dashboard" 
        subtitle="Agency Management"
        icon={<Shield className="h-5 w-5 text-primary-foreground" />}
      />

      <main className="content-container">
        <div className="mb-8 animate-fade-in">
          <h2 className="section-heading">Dashboard Overview</h2>
          <p className="section-subheading">
            Manage your agency, employees, and clients from here.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-3 mb-8">
          <Card className="card-premium hover-lift animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display">{stats.admins}</div>
            </CardContent>
          </Card>

          <Card className="card-premium hover-lift animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Employees</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
                <Users className="h-4 w-4 text-accent-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display">{stats.employees}</div>
            </CardContent>
          </Card>

          <Card className="card-premium hover-lift animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Clients</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-secondary-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display">{stats.clients}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="card-premium mb-8 animate-fade-in" style={{ animationDelay: '0.25s' }}>
          <CardHeader>
            <CardTitle className="font-display">Quick Actions</CardTitle>
            <CardDescription>Access key areas of your agency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate('/workspaces')} className="gap-2 shadow-premium-sm hover:shadow-premium-md transition-shadow">
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
            </div>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card className="card-premium animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <Users className="h-5 w-5 text-primary" />
              User Management
            </CardTitle>
            <CardDescription>
              View all users, change their roles, and enable or disable accounts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Role</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Change Role</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id} className={u.disabled ? 'opacity-50' : ''}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(u.role)} className="capitalize">
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={u.disabled ? 'destructive' : 'default'}
                          className={!u.disabled ? 'bg-success hover:bg-success/90' : ''}
                        >
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
                          className="gap-1"
                        >
                          {u.disabled ? (
                            <>
                              <UserCheck className="h-4 w-4" />
                              Enable
                            </>
                          ) : (
                            <>
                              <UserX className="h-4 w-4" />
                              Disable
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
