import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectManagement, Currency, PaymentStatus } from '@/contexts/ProjectManagementContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, DollarSign, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
};

export default function Payments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    getPaymentsForUser, 
    createPayment, 
    updatePayment, 
    deletePayment,
    getEmployees, 
    projects 
  } = useProjectManagement();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({
    employeeId: '',
    projectId: '',
    amount: '',
    currency: 'USD' as Currency,
    date: new Date().toISOString().split('T')[0],
  });

  const payments = getPaymentsForUser();
  const employees = getEmployees();
  const isAdmin = user?.role === 'admin';

  const handleCreatePayment = () => {
    if (newPayment.employeeId && newPayment.projectId && newPayment.amount) {
      createPayment(
        newPayment.employeeId,
        newPayment.projectId,
        parseFloat(newPayment.amount),
        newPayment.currency,
        newPayment.date
      );
      setNewPayment({
        employeeId: '',
        projectId: '',
        amount: '',
        currency: 'USD',
        date: new Date().toISOString().split('T')[0],
      });
      setIsCreateOpen(false);
    }
  };

  const handleToggleStatus = (paymentId: string, currentStatus: PaymentStatus) => {
    updatePayment(paymentId, { 
      status: currentStatus === 'paid' ? 'unpaid' : 'paid' 
    });
  };

  const handleDeletePayment = (paymentId: string) => {
    if (confirm('Are you sure you want to delete this payment?')) {
      deletePayment(paymentId);
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee?.name || 'Unknown';
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown';
  };

  const totalPaid = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalUnpaid = payments
    .filter(p => p.status === 'unpaid')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <DollarSign className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold">Payments</h1>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? 'Manage employee payments' : 'View your payments'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {user?.name} ({user?.role})
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payments.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Total Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-600">Total Unpaid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">${totalUnpaid.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Create Payment Button (Admin only) */}
        {isAdmin && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="mb-4">
                <Plus className="mr-2 h-4 w-4" />
                Create Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Payment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Employee</Label>
                  <Select 
                    value={newPayment.employeeId} 
                    onValueChange={(v) => setNewPayment(prev => ({ ...prev, employeeId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">No employees available</div>
                      ) : (
                        employees.map(emp => (
                          <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Project</Label>
                  <Select 
                    value={newPayment.projectId} 
                    onValueChange={(v) => setNewPayment(prev => ({ ...prev, projectId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">No projects available</div>
                      ) : (
                        projects.map(proj => (
                          <SelectItem key={proj.id} value={proj.id}>{proj.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={newPayment.amount}
                      onChange={(e) => setNewPayment(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select 
                      value={newPayment.currency} 
                      onValueChange={(v) => setNewPayment(prev => ({ ...prev, currency: v as Currency }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map(curr => (
                          <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newPayment.date}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleCreatePayment}
                  disabled={!newPayment.employeeId || !newPayment.projectId || !newPayment.amount}
                >
                  Create Payment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Records</CardTitle>
            <CardDescription>
              {isAdmin 
                ? 'All employee payment records' 
                : 'Your payment history'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No payments found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {isAdmin && <TableHead>Employee</TableHead>}
                    <TableHead>Project</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      {isAdmin && (
                        <TableCell className="font-medium">
                          {getEmployeeName(payment.employeeId)}
                        </TableCell>
                      )}
                      <TableCell>{getProjectName(payment.projectId)}</TableCell>
                      <TableCell>
                        {CURRENCY_SYMBOLS[payment.currency]}{payment.amount.toFixed(2)} {payment.currency}
                      </TableCell>
                      <TableCell>
                        {format(new Date(payment.date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={payment.status === 'paid' ? 'default' : 'secondary'}
                          className={payment.status === 'paid' ? 'bg-green-600' : 'bg-amber-500'}
                        >
                          {payment.status === 'paid' ? 'Paid' : 'Unpaid'}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStatus(payment.id, payment.status)}
                            >
                              Mark as {payment.status === 'paid' ? 'Unpaid' : 'Paid'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => handleDeletePayment(payment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}