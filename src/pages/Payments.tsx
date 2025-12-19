import { useState, useEffect } from 'react';
import { useAuth, User } from '@/contexts/AuthContext';
import { useProjectManagement, Currency, PaymentStatus } from '@/contexts/ProjectManagementContext';
import AppHeader from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, DollarSign, Trash2, CreditCard, CheckCircle2, Clock } from 'lucide-react';
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
  const { 
    getPaymentsForUser, 
    createPayment, 
    updatePayment, 
    deletePayment,
    getEmployees, 
    projects 
  } = useProjectManagement();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [employees, setEmployees] = useState<User[]>([]);
  const [newPayment, setNewPayment] = useState({
    employeeId: '',
    projectId: '',
    amount: '',
    currency: 'USD' as Currency,
    date: new Date().toISOString().split('T')[0],
  });

  const payments = getPaymentsForUser();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const loadEmployees = async () => {
      const fetchedEmployees = await getEmployees();
      setEmployees(fetchedEmployees);
    };
    loadEmployees();
  }, [getEmployees]);

  const handleCreatePayment = async () => {
    if (newPayment.employeeId && newPayment.projectId && newPayment.amount) {
      await createPayment(
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

  const handleToggleStatus = async (paymentId: string, currentStatus: PaymentStatus) => {
    await updatePayment(paymentId, { 
      status: currentStatus === 'paid' ? 'unpaid' : 'paid' 
    });
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (confirm('Are you sure you want to delete this payment?')) {
      await deletePayment(paymentId);
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
    <div className="page-container">
      <AppHeader 
        title="Payments" 
        subtitle={isAdmin ? 'Manage employee payments' : 'View your payments'}
        icon={<DollarSign className="h-5 w-5 text-primary-foreground" />}
      />

      <main className="content-container">
        {/* Stats */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-3 mb-8">
          <Card className="card-premium hover-lift animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Total Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display">{payments.length}</div>
            </CardContent>
          </Card>
          <Card className="card-premium hover-lift animate-fade-in border-l-4 border-l-success" style={{ animationDelay: '0.15s' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Total Paid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display text-success">${totalPaid.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="card-premium hover-lift animate-fade-in border-l-4 border-l-warning" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" />
                Total Unpaid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display text-warning">${totalUnpaid.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Create Payment Button (Admin only) */}
        {isAdmin && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="mb-6 gap-2 shadow-premium-sm hover:shadow-premium-md transition-shadow animate-fade-in" style={{ animationDelay: '0.25s' }}>
                <Plus className="h-4 w-4" />
                Create Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display">Create New Payment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
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
        <Card className="card-premium animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <CardHeader>
            <CardTitle className="font-display">Payment Records</CardTitle>
            <CardDescription>
              {isAdmin 
                ? 'All employee payment records' 
                : 'Your payment history'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No payments found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      {isAdmin && <TableHead className="font-semibold">Employee</TableHead>}
                      <TableHead className="font-semibold">Project</TableHead>
                      <TableHead className="font-semibold">Amount</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      {isAdmin && <TableHead className="font-semibold">Actions</TableHead>}
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
                        <TableCell className="text-muted-foreground">{getProjectName(payment.projectId)}</TableCell>
                        <TableCell className="font-semibold">
                          {CURRENCY_SYMBOLS[payment.currency]}{payment.amount.toFixed(2)} {payment.currency}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(payment.date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={payment.status === 'paid' ? 'default' : 'secondary'}
                            className={payment.status === 'paid' ? 'bg-success hover:bg-success/90' : 'bg-warning hover:bg-warning/90 text-warning-foreground'}
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
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
