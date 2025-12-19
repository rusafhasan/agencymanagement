import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectManagement, Currency, RevenueStatus } from '@/contexts/ProjectManagementContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, TrendingUp, Trash2, DollarSign, Wallet, PiggyBank, Clock } from 'lucide-react';
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

export default function Revenue() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    getAllRevenues, 
    createRevenue, 
    updateRevenue,
    deleteRevenue,
    getClients, 
    projects,
    payments 
  } = useProjectManagement();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRevenue, setNewRevenue] = useState({
    clientId: '',
    projectId: '',
    amount: '',
    currency: 'USD' as Currency,
    dateReceived: new Date().toISOString().split('T')[0],
  });

  const revenues = getAllRevenues();
  const clients = getClients();

  // Calculate totals - ONLY include PAID revenue
  const paidRevenues = revenues.filter(r => r.status === 'paid');
  const pendingRevenues = revenues.filter(r => r.status === 'pending');
  
  const totalPaidRevenue = paidRevenues.reduce((sum, r) => sum + r.amount, 0);
  const totalPendingRevenue = pendingRevenues.reduce((sum, r) => sum + r.amount, 0);
  const totalPayments = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);
  const profit = totalPaidRevenue - totalPayments;

  const handleCreateRevenue = () => {
    if (newRevenue.clientId && newRevenue.projectId && newRevenue.amount) {
      createRevenue(
        newRevenue.clientId,
        newRevenue.projectId,
        parseFloat(newRevenue.amount),
        newRevenue.currency,
        newRevenue.dateReceived
      );
      setNewRevenue({
        clientId: '',
        projectId: '',
        amount: '',
        currency: 'USD',
        dateReceived: new Date().toISOString().split('T')[0],
      });
      setIsCreateOpen(false);
    }
  };

  const handleToggleStatus = (revenueId: string, currentStatus: RevenueStatus) => {
    updateRevenue(revenueId, { 
      status: currentStatus === 'paid' ? 'pending' : 'paid' 
    });
  };

  const handleDeleteRevenue = (revenueId: string) => {
    if (confirm('Are you sure you want to delete this revenue record?')) {
      deleteRevenue(revenueId);
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown';
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-600">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold">Revenue & Profit</h1>
              <p className="text-xs text-muted-foreground">Track income and calculate profit</p>
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
        {/* Financial Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                Paid Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${totalPaidRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Confirmed payments received</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                Pending Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">${totalPendingRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Wallet className="h-4 w-4 text-amber-600" />
                Employee Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">${totalPayments.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Paid to employees</p>
            </CardContent>
          </Card>

          <Card className={`border-2 ${profit >= 0 ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20' : 'border-red-400 bg-red-50 dark:bg-red-950/20'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <PiggyBank className={`h-4 w-4 ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
                Profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {profit >= 0 ? '+' : '-'}${Math.abs(profit).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Paid revenue minus payments</p>
            </CardContent>
          </Card>
        </div>

        {/* Profit Explanation */}
        <Card className="mb-6 bg-muted/50">
          <CardContent className="pt-4">
            <h3 className="font-medium mb-2">How Profit is Calculated</h3>
            <p className="text-sm text-muted-foreground">
              <strong>Profit = Paid Revenue - Paid Employee Payments</strong>
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• <strong>Paid Revenue:</strong> Only revenue marked as "Paid" counts toward totals</li>
              <li>• <strong>Pending Revenue:</strong> Visible in the table but NOT included in profit calculation</li>
              <li>• <strong>Employee Payments:</strong> Only payments marked as "Paid" are subtracted</li>
              <li>• <strong>Assumption:</strong> All amounts are treated as USD (no currency conversion)</li>
            </ul>
          </CardContent>
        </Card>

        {/* Create Revenue Button */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="mb-4">
              <Plus className="mr-2 h-4 w-4" />
              Record Revenue
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record New Revenue</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Client</Label>
                <Select 
                  value={newRevenue.clientId} 
                  onValueChange={(v) => setNewRevenue(prev => ({ ...prev, clientId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">No clients available</div>
                    ) : (
                      clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Project</Label>
                <Select 
                  value={newRevenue.projectId} 
                  onValueChange={(v) => setNewRevenue(prev => ({ ...prev, projectId: v }))}
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
                    value={newRevenue.amount}
                    onChange={(e) => setNewRevenue(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select 
                    value={newRevenue.currency} 
                    onValueChange={(v) => setNewRevenue(prev => ({ ...prev, currency: v as Currency }))}
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
                <Label>Date Received</Label>
                <Input
                  type="date"
                  value={newRevenue.dateReceived}
                  onChange={(e) => setNewRevenue(prev => ({ ...prev, dateReceived: e.target.value }))}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                New revenue is created as "Pending". Mark it as "Paid" once payment is confirmed.
              </p>

              <Button 
                className="w-full" 
                onClick={handleCreateRevenue}
                disabled={!newRevenue.clientId || !newRevenue.projectId || !newRevenue.amount}
              >
                Record Revenue
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Revenue Table */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Records</CardTitle>
            <CardDescription>All income from clients (only "Paid" counts toward profit)</CardDescription>
          </CardHeader>
          <CardContent>
            {revenues.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No revenue recorded yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenues.map((revenue) => (
                    <TableRow key={revenue.id} className={revenue.status === 'pending' ? 'opacity-70' : ''}>
                      <TableCell className="font-medium">
                        {getClientName(revenue.clientId)}
                      </TableCell>
                      <TableCell>{getProjectName(revenue.projectId)}</TableCell>
                      <TableCell className={`font-medium ${revenue.status === 'paid' ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {CURRENCY_SYMBOLS[revenue.currency]}{revenue.amount.toFixed(2)} {revenue.currency}
                      </TableCell>
                      <TableCell>
                        {format(new Date(revenue.dateReceived), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={revenue.status === 'paid' ? 'default' : 'secondary'}
                          className={revenue.status === 'paid' ? 'bg-green-600' : 'bg-blue-500'}
                        >
                          {revenue.status === 'paid' ? 'Paid' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(revenue.id, revenue.status)}
                          >
                            Mark as {revenue.status === 'paid' ? 'Pending' : 'Paid'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDeleteRevenue(revenue.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
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